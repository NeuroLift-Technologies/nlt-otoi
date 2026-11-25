import { describe, expect, it } from "vitest";
import { generateKeyPair, signToi, ToiValidationError } from "@neurolift-technologies/toi";
import { detectConflicts, honor, parseCharter, propagate } from "../src/index.js";
import type { ToiDocument } from "../src/index.js";

const personal: ToiDocument = {
  $toi: "1.0.0",
  $tier: "personal",
  identity: { author: "josh" },
  communication: { tone: "direct" },
} as ToiDocument;

const project: ToiDocument = {
  $toi: "1.0.0",
  $tier: "project",
  identity: { author: "nlt-redteam" },
  communication: { tone: "professional", verbosity: "concise" },
} as ToiDocument;

const charter = {
  $otoi: "1.0.0",
  agents: [{ id: "research-agent" }],
};

describe("honor", () => {
  it("resolves a stack with terminal personal precedence and project gap-fill", async () => {
    const policy = await honor(charter, { documents: [project, personal] });
    // personal is terminal for tone; project only fills the gap (verbosity).
    expect(policy.effective.communication?.tone).toBe("direct");
    expect(policy.effective.communication?.verbosity).toBe("concise");
    expect(policy.tiers).toEqual(["personal", "project"]);
    expect(policy.conflicts).toEqual([]);
  });

  it("requires at least one document", async () => {
    await expect(honor(charter, {})).rejects.toThrow(/at least one .toi document/);
  });

  it("loads uri-backed sources via loadSource", async () => {
    const withSource = {
      $otoi: "1.0.0",
      toi_sources: [{ tier: "personal", uri: "me.toi" }],
    };
    const policy = await honor(withSource, {
      loadSource: () => JSON.stringify(personal),
    });
    expect(policy.effective.identity.author).toBe("josh");
  });

  it("rejects a uri source when no loader is supplied", async () => {
    const withSource = { $otoi: "1.0.0", toi_sources: [{ tier: "personal", uri: "me.toi" }] };
    await expect(honor(withSource, {})).rejects.toThrow(/no loadSource/);
  });

  it("rejects a source whose declared tier disagrees with the document's $tier", async () => {
    const mismatched = {
      $otoi: "1.0.0",
      toi_sources: [
        { tier: "personal", inline: { $toi: "1.0.0", $tier: "project", identity: { author: "x" } } },
      ],
    };
    await expect(honor(mismatched, {})).rejects.toThrow(/declares tier "personal" but/);
  });

  it("rejects a source that provides both uri and inline", () => {
    const both = {
      $otoi: "1.0.0",
      toi_sources: [
        {
          tier: "personal",
          uri: "me.toi",
          inline: { $toi: "1.0.0", $tier: "personal", identity: { author: "x" } },
        },
      ],
    };
    expect(() => parseCharter(both)).toThrow(/exactly one of/);
  });
});

describe("detectConflicts", () => {
  it("finds same-tier leaf disagreements", () => {
    // Same author (no conflict there); only `communication.tone` disagrees.
    const a: ToiDocument = { $toi: "1.0.0", $tier: "project", identity: { author: "team" }, communication: { tone: "formal" } } as ToiDocument;
    const b: ToiDocument = { $toi: "1.0.0", $tier: "project", identity: { author: "team" }, communication: { tone: "casual" } } as ToiDocument;
    const conflicts = detectConflicts([a, b]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.path).toBe("communication.tone");
  });

  it("does not treat cross-tier differences as conflicts", () => {
    expect(detectConflicts([personal, project])).toEqual([]);
  });

  it("on_conflict=reject turns a same-tier conflict into a thrown error", async () => {
    const a: ToiDocument = { $toi: "1.0.0", $tier: "project", identity: { author: "a" }, communication: { tone: "formal" } } as ToiDocument;
    const b: ToiDocument = { $toi: "1.0.0", $tier: "project", identity: { author: "b" }, communication: { tone: "casual" } } as ToiDocument;
    const strictCharter = { $otoi: "1.0.0", enforcement: { on_conflict: "reject" } };
    await expect(honor(strictCharter, { documents: [a, b] })).rejects.toThrow(/conflict/i);
  });
});

describe("propagate", () => {
  it("returns the effective policy for a declared agent", async () => {
    const policy = await honor(charter, { documents: [personal] });
    expect(propagate(policy, "research-agent")).toBe(policy.effective);
  });

  it("refuses an unknown agent under strict enforcement", async () => {
    const strict = { $otoi: "1.0.0", agents: [{ id: "known" }], enforcement: { mode: "strict" } };
    const policy = await honor(strict, { documents: [personal] });
    expect(() => propagate(policy, "stranger")).toThrow(/strict enforcement/);
  });
});

describe("parseCharter", () => {
  it("rejects a non-object root", () => {
    expect(() => parseCharter("[]")).toThrow(/must be a JSON object/);
  });

  it("rejects a charter missing $otoi", () => {
    expect(() => parseCharter({ agents: [] })).toThrow(/Invalid .otoi charter/);
  });
});

// `.otoi` consumes `@neurolift-technologies/toi`: `.toi` validation, equality,
// and signature checks come from that package, not from a local copy.
describe("consumes the @neurolift-technologies/toi APIs", () => {
  const withRules = (rules: unknown): ToiDocument =>
    ({ $toi: "1.0.0", $tier: "project", identity: { author: "team" }, custom: { rules } }) as ToiDocument;

  it("compares leaves canonically, so key order alone is not a conflict", () => {
    const a = withRules([{ id: 1, mode: "strict" }]);
    const b = withRules([{ mode: "strict", id: 1 }]);
    expect(detectConflicts([a, b])).toEqual([]);
  });

  it("treats a boolean and a number as different values", () => {
    expect(detectConflicts([withRules(true), withRules(1)])).toHaveLength(1);
  });

  it("treats an undefined leaf as not stated, as resolveToi does", () => {
    expect(detectConflicts([withRules(undefined), withRules(["a"])])).toEqual([]);
  });

  it("validates host-supplied documents with parseToi", async () => {
    const invalid = { $toi: "not-semver", $tier: "personal", identity: { author: "x" } } as unknown as ToiDocument;
    await expect(honor(charter, { documents: [invalid] })).rejects.toThrow(ToiValidationError);
  });

  it("rejects a host-supplied document whose signature does not verify", async () => {
    const signed = signToi(personal, generateKeyPair().privateKey);
    const tampered = { ...signed, communication: { tone: "friendly" } } as ToiDocument;
    await expect(honor(charter, { documents: [tampered] })).rejects.toThrow(/signature/);
  });

  it("rejects a charter source whose signature does not verify", async () => {
    const signed = signToi(personal, generateKeyPair().privateKey);
    const tampered = { ...signed, communication: { tone: "friendly" } };
    const withSource = { $otoi: "1.0.0", toi_sources: [{ tier: "personal", inline: tampered }] };
    await expect(honor(withSource, {})).rejects.toThrow(/signature/);
  });

  it("honors correctly signed documents from both the charter and the host", async () => {
    const { privateKey } = generateKeyPair();
    const withSource = { $otoi: "1.0.0", toi_sources: [{ tier: "personal", inline: signToi(personal, privateKey) }] };
    const policy = await honor(withSource, { documents: [signToi(project, privateKey)] });
    expect(policy.effective.communication?.tone).toBe("direct");
    expect(policy.effective.communication?.verbosity).toBe("concise");
  });
});
