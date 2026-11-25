/**
 * The `.otoi` honoring layer.
 *
 * This is what makes `.otoi` more than a second copy of `.toi`: it consumes the
 * canonical `@neurolift-technologies/toi` package to turn a charter plus a stack
 * of `.toi` documents into one **effective interaction policy** that every agent
 * in the mesh honors. Everything about the `.toi` format itself — validation
 * (`parseToi`), signatures (`isSigned`, `verifyToi`), value equality
 * (`canonicalize`), tier order (`compareTier`, `resolveToi`), and the reserved
 * key prefix — comes from that package rather than a local copy. This module
 * adds only the orchestration concerns the `.toi` standard deliberately leaves
 * out: same-tier conflict detection, enforcement modes, and per-agent
 * propagation.
 */
import {
  canonicalize,
  compareTier,
  isSigned,
  parseToi,
  resolveToi,
  TOI_RESERVED_PREFIX,
  verifyToi,
  type ToiDocument,
  type ToiTier,
} from "@neurolift-technologies/toi";
import type { z } from "zod";
import { assertToiCompatible } from "./compat.js";
import { otoiCharterSchema } from "./schema.js";
import type { OtoiAgent, OtoiCharter, OtoiEnforcement } from "./types.js";
import type { OtoiEnforcementMode, OtoiConflictStrategy, OtoiUnsupportedStrategy } from "./constants.js";
import {
  OtoiHonorError,
  OtoiParseError,
  OtoiValidationError,
  type OtoiIssue,
  type PolicyConflict,
} from "./errors.js";

/** Enforcement settings with every field resolved to a concrete value. */
export interface ResolvedEnforcement {
  mode: OtoiEnforcementMode;
  on_conflict: OtoiConflictStrategy;
  on_unsupported: OtoiUnsupportedStrategy;
  audit: boolean;
}

const DEFAULT_ENFORCEMENT: ResolvedEnforcement = {
  mode: "enforced",
  on_conflict: "highest-tier-wins",
  on_unsupported: "degrade",
  audit: true,
};

/** Options for {@link honor}. */
export interface HonorOptions {
  /**
   * `.toi` documents to fold in alongside the charter's sources. Each is
   * validated with `parseToi` and, if signed, checked with `verifyToi`, exactly
   * like a charter source.
   */
  documents?: readonly ToiDocument[];
  /** Lowest-precedence fallback values, applied only where nothing else set a field. */
  platformDefaults?: Record<string, unknown>;
  /** Loader used to resolve `toi_sources` that reference a `uri`. */
  loadSource?: (uri: string) => string | Promise<string>;
}

/** The synthesized result every agent in the mesh honors. */
export interface EffectivePolicy {
  /** The resolved effective `.toi` view (tier precedence applied). */
  effective: ToiDocument;
  /** Which tiers contributed, highest precedence first. */
  tiers: ToiTier[];
  /** The agents bound by the charter. */
  agents: OtoiAgent[];
  /** The enforcement policy in force. */
  enforcement: ResolvedEnforcement;
  /** Same-tier conflicts detected during resolution (empty when none). */
  conflicts: PolicyConflict[];
}

/**
 * Parse and validate an `.otoi` charter.
 *
 * @throws {OtoiParseError} if `input` is not valid JSON or its root is not an object.
 * @throws {OtoiValidationError} if the charter violates the canonical schema.
 */
export function parseCharter(input: unknown): OtoiCharter {
  const json = typeof input === "string" ? parseJson(input) : input;
  if (json === null || typeof json !== "object" || Array.isArray(json)) {
    throw new OtoiParseError("An .otoi charter must be a JSON object");
  }
  const result = otoiCharterSchema.safeParse(json);
  if (!result.success) {
    throw toValidationError(result.error);
  }
  return result.data;
}

/**
 * Detect same-tier conflicts across `.toi` documents.
 *
 * Cross-tier disagreement is not a conflict — that is what tier precedence is
 * for. But two documents at the *same* tier that assign different values to the
 * same leaf cannot both be honored, so each such leaf is reported.
 */
export function detectConflicts(documents: readonly ToiDocument[]): PolicyConflict[] {
  const seenByTier = new Map<ToiTier, Map<string, unknown>>();
  const working = new Map<string, { tier: ToiTier; path: string; values: unknown[] }>();

  for (const doc of documents) {
    const tier = doc.$tier;
    let seen = seenByTier.get(tier);
    if (!seen) {
      seen = new Map<string, unknown>();
      seenByTier.set(tier, seen);
    }
    const leaves = new Map<string, unknown>();
    collectLeaves(contentOf(doc), "", leaves);

    for (const [path, value] of leaves) {
      if (!seen.has(path)) {
        seen.set(path, value);
        continue;
      }
      const existing = seen.get(path);
      if (equalLeaf(existing, value)) continue;
      const key = `${tier}\u0000${path}`;
      const entry = working.get(key);
      if (entry) {
        if (!entry.values.some((v) => equalLeaf(v, value))) entry.values.push(value);
      } else {
        working.set(key, { tier, path, values: [existing, value] });
      }
    }
  }

  return [...working.values()].map((e) => ({ tier: e.tier, path: e.path, values: e.values }));
}

/**
 * Fold a charter and its `.toi` sources into one effective policy.
 *
 * Resolution delegates tier precedence to `@neurolift-technologies/toi`'s `resolveToi`;
 * this function adds source loading, same-tier conflict detection, and
 * enforcement.
 *
 * @throws {OtoiCompatibilityError} when the installed `@neurolift-technologies/toi` declares
 *   no valid format version (a broken or pre-`1.0.1` install).
 * @throws {ToiParseError | ToiValidationError} when a charter source or a host
 *   document in `options.documents` is not a valid `.toi` document (`parseToi`).
 * @throws {OtoiHonorError} when there is nothing to resolve, when a `uri` source
 *   is present without a `loadSource`, when a signed document's `$signature`
 *   does not verify (`verifyToi`), or when a same-tier conflict is found under
 *   `on_conflict: "reject"`.
 */
export async function honor(input: OtoiCharter | unknown, options: HonorOptions = {}): Promise<EffectivePolicy> {
  // Fail closed if the installed `.toi` package declares no usable format
  // version. Any valid `.toi` version is honored — `.otoi` does not pin one.
  assertToiCompatible();
  const charter = parseCharter(input);
  const enforcement = resolveEnforcement(charter.enforcement);
  const docs = await gatherDocuments(charter, options);

  if (docs.length === 0) {
    throw new OtoiHonorError(
      "honor() requires at least one .toi document (from the charter's toi_sources or options.documents)",
    );
  }

  const conflicts = detectConflicts(docs);
  if (conflicts.length > 0 && enforcement.on_conflict === "reject") {
    const where = conflicts.map((c) => `${c.tier}:${c.path}`).join(", ");
    throw new OtoiHonorError(`Unresolved same-tier conflict(s) under on_conflict="reject": ${where}`, conflicts);
  }

  const effective = resolveToi(
    docs,
    options.platformDefaults ? { platformDefaults: options.platformDefaults } : {},
  );

  return {
    effective,
    tiers: uniqueTiersByPrecedence(docs),
    agents: charter.agents,
    enforcement,
    conflicts,
  };
}

/**
 * Return the effective preferences a specific agent must honor.
 *
 * Under `strict` enforcement, an agent that is not declared in the charter mesh
 * is refused rather than silently served the policy.
 */
export function propagate(policy: EffectivePolicy, agentId: string): ToiDocument {
  const known = policy.agents.some((a) => a.id === agentId);
  if (!known && policy.enforcement.mode === "strict") {
    throw new OtoiHonorError(
      `Agent "${agentId}" is not declared in the charter mesh; strict enforcement refuses to honor for unknown agents`,
    );
  }
  return policy.effective;
}

// --- internals ------------------------------------------------------------

async function gatherDocuments(charter: OtoiCharter, options: HonorOptions): Promise<ToiDocument[]> {
  const docs: ToiDocument[] = [];
  for (const source of charter.toi_sources) {
    let doc: ToiDocument | undefined;
    if (source.inline !== undefined) {
      doc = parseToi(source.inline);
    } else if (source.uri !== undefined) {
      if (!options.loadSource) {
        throw new OtoiHonorError(`toi_source references uri "${source.uri}" but no loadSource was provided`);
      }
      doc = parseToi(await options.loadSource(source.uri));
    }
    if (doc === undefined) continue;

    // SPEC §4: a source declares the tier it contributes at. The loaded
    // document's own `$tier` MUST agree; a mismatch means the source is
    // mislabeled or points at the wrong file, which would silently change
    // precedence (e.g. a `personal` source losing its terminal precedence to a
    // `project` document). Fail closed rather than trust either side blindly.
    if (doc.$tier !== source.tier) {
      const origin = source.uri !== undefined ? `uri "${source.uri}"` : "inline document";
      throw new OtoiHonorError(
        `toi_source declares tier "${source.tier}" but its ${origin} has $tier "${doc.$tier}"`,
      );
    }
    assertSignatureVerifies(doc, source.uri !== undefined ? `uri "${source.uri}"` : "inline toi_source");
    docs.push(doc);
  }
  // Host-supplied documents get the same `.toi` validation and signature check
  // as charter sources: there is one validator for the `.toi` shape.
  for (const [index, input] of (options.documents ?? []).entries()) {
    const doc = parseToi(input);
    assertSignatureVerifies(doc, `options.documents[${index}]`);
    docs.push(doc);
  }
  return docs;
}

/**
 * A signed document must verify. Unsigned documents are accepted, as before;
 * a `$signature` that is present but does not verify means the document was
 * altered after signing (or signed with a malformed envelope), so fail closed.
 */
function assertSignatureVerifies(doc: ToiDocument, origin: string): void {
  if (isSigned(doc) && !verifyToi(doc)) {
    throw new OtoiHonorError(`The $signature on ${origin} does not verify; the document may have been altered`);
  }
}

function resolveEnforcement(e: OtoiEnforcement | undefined): ResolvedEnforcement {
  return {
    mode: e?.mode ?? DEFAULT_ENFORCEMENT.mode,
    on_conflict: e?.on_conflict ?? DEFAULT_ENFORCEMENT.on_conflict,
    on_unsupported: e?.on_unsupported ?? DEFAULT_ENFORCEMENT.on_unsupported,
    audit: e?.audit ?? DEFAULT_ENFORCEMENT.audit,
  };
}

function uniqueTiersByPrecedence(docs: readonly ToiDocument[]): ToiTier[] {
  const set = new Set<ToiTier>();
  for (const doc of docs) set.add(doc.$tier);
  return [...set].sort(compareTier);
}

/** The content (non-reserved) keys of a document. */
function contentOf(doc: ToiDocument): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const record = doc as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!key.startsWith(TOI_RESERVED_PREFIX)) out[key] = record[key];
  }
  return out;
}

/**
 * Flatten objects to dotted leaf paths; arrays and scalars are atomic leaves.
 * An `undefined` value is "not stated" and is skipped, as `resolveToi` skips it.
 */
function collectLeaves(value: unknown, prefix: string, into: Map<string, unknown>): void {
  if (value === undefined) return;
  if (isPlainObject(value)) {
    for (const key of Object.keys(value)) {
      collectLeaves(value[key], prefix ? `${prefix}.${key}` : key, into);
    }
  } else {
    into.set(prefix, value);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Atomic-leaf equality, using the `.toi` canonical form (RFC 8785): object key
 * order does not matter, and a boolean never equals a number.
 */
function equalLeaf(a: unknown, b: unknown): boolean {
  return canonicalize(a) === canonicalize(b);
}

function parseJson(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch (err) {
    throw new OtoiParseError("Input is not valid JSON", { cause: err });
  }
}

function toValidationError(error: z.ZodError): OtoiValidationError {
  const issues: OtoiIssue[] = error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
  const summary = issues.map((i) => (i.path ? `${i.path}: ${i.message}` : i.message)).join("; ");
  return new OtoiValidationError(`Invalid .otoi charter — ${summary}`, issues);
}
