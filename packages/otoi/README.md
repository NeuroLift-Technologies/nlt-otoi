# TOI/OTOI Framework

An open framework for human-defined AI interaction and advocacy.

Companies establish Terms of Service that humans must agree to when using their AI services. Humans should likewise be able to define and declare their Terms of Interaction for the AI systems they engage with.

The TOI/OTOI Framework establishes this reciprocal relationship through two distinct but interdependent components.

## TOI — Terms of Interaction

The human-facing component of the framework.

TOI enables humans to define, declare, own and transport their interaction preferences, cognitive needs, privacy boundaries, consent requirements and expectations.

Through existing preference extraction and AI-assisted population, humans can create a portable, machine-readable `.toi` document without requiring technical expertise.

## OTOI — Orchestrated Terms of Interaction

The AI-facing component of the framework.

OTOI first checks a human's complete TOI against the platform's boundaries: the model provider's limits and the deployer's Terms of Service. Every check must pass. If any check fails, the human is told every conflict, and the TOI is not honored until it is corrected.

When every check passes, the AI understands, acknowledges and honors the human's TOI. For most people, this is the AI they already use and have history with, so the first AI to honor their TOI becomes their Orchestrator and advocate by default. The human can designate a different compatible AI at any time, with one active Orchestrator per project.

In multi-agent collaboration, the Orchestrator is responsible for determining whether other AI systems can honor the human's TOI.

## Separate components. One framework.

TOI and OTOI have distinct responsibilities but must coexist to fulfill the framework's purpose.

A TOI without OTOI is a declaration with no way to be honored. OTOI without TOI has no human-declared terms to honor.

Together, they establish a portable, human-centered relationship between humans and artificial intelligence.

The TOI/OTOI Framework forms the governance foundation of the Solidarity Framework, supported by RRT AIdvocAIte, the Sleepwalker Protocol and the Agent Solidarity Framework Deployment Kit (ASFDK).

**Companies have Terms of Service. Humans deserve Terms of Interaction.**
**Capability ≠ Authority.**
**We're Not Competing. We're Completing.**
**Human & AI Solidarity Without Singularity.**

## Install

```bash
npm install @neurolift-technologies/otoi
# @neurolift-technologies/toi is a regular dependency and is installed automatically with it
```

## Quick start

```ts
import { honor, propagate, type ToiDocument } from "@neurolift-technologies/otoi";

const charter = {
  $otoi: "1.0.0",
  agents: [{ id: "research-agent" }, { id: "summary-agent" }],
  enforcement: { mode: "enforced", on_conflict: "highest-tier-wins" },
  toi_sources: [
    { tier: "personal", uri: "users/josh.toi" },
    { tier: "project", inline: { $toi: "1.0.0", $tier: "project", identity: { author: "nlt-redteam" } } },
  ],
};

const policy = await honor(charter, {
  loadSource: (uri) => fs.readFile(uri, "utf8"),
  platformDefaults: { communication: { language: "en" } },
});

// The single effective .toi view every agent honors:
policy.effective;            // resolved ToiDocument
policy.tiers;                // ["personal", "project"]
policy.conflicts;            // same-tier disagreements, if any

// Per-agent propagation (strict mode refuses unknown agents):
const prefs = propagate(policy, "research-agent");
```

## API

| Export | Purpose |
| --- | --- |
| `parseCharter(input)` | Parse + validate an `.otoi` charter (throws `OtoiParseError` / `OtoiValidationError`). |
| `honor(charter, options)` | Resolve the charter's `.toi` sources into one `EffectivePolicy`. |
| `propagate(policy, agentId)` | The effective `.toi` an agent must honor; refuses unknown agents under `strict`. |
| `detectConflicts(documents)` | Report same-tier leaf disagreements (cross-tier differences are *not* conflicts). |
| `otoiCharterSchema` | The Zod source of truth for the charter shape. |
| re-exports | `parseToi`, `resolveToi`, `verifyToi`, `TOI_TIERS`, `ToiDocument`, … from `@neurolift-technologies/toi`. |

## Enforcement model

| Field | Values | Default | Meaning |
| --- | --- | --- | --- |
| `mode` | `advisory` / `enforced` / `strict` | `enforced` | How strictly agents are held to preferences; `strict` also refuses unknown agents. |
| `on_conflict` | `highest-tier-wins` / `reject` / `escalate` | `highest-tier-wins` | What to do with a same-tier disagreement. `reject` throws `OtoiHonorError`. |
| `on_unsupported` | `ignore` / `degrade` / `reject` | `degrade` | What to do with a preference no agent can satisfy. |
| `audit` | boolean | `true` | Whether honoring should be recorded for the audit trail. |

## Relationship to the `.toi` standard

See [`SPEC.md`](./SPEC.md) for the normative `.otoi` specification and the
[`@neurolift-technologies/toi` SPEC](https://www.npmjs.com/package/@neurolift-technologies/toi) for the
underlying file format. Where the two disagree, the `.toi` spec governs the
`.toi` layer and this spec governs orchestration.

## License

This package is licensed under Apache-2.0. It ships its own license copy at
[`packages/otoi/LICENSE`](./LICENSE); the repository root
[`LICENSE`](../../LICENSE) is the authoritative text. The canonical
`@neurolift-technologies/toi` package that this layer builds on is also
Apache-2.0, declared in its own package metadata.
