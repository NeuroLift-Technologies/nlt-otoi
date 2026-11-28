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

## About this repository

### NeuroLift OTOI Framework

**OTOI — Orchestrated Terms of Interaction**

Open framework for human-controlled AI collaboration. The layer that makes TOI actionable. In single-agent contexts, OTOI operationalizes the user's TOI. In multi-agent contexts, OTOI orchestrates how that TOI is honored across agents, tools, memory, handoffs, and escalation.

---

### 📦 Published Packages

This repository publishes two reference implementations of the OTOI honoring layer, version-locked at **1.2.0**:

| Package | Registry | Source | Install |
|---------|----------|--------|---------|
| `@neurolift-technologies/otoi` | npm | `packages/otoi/` | `npm install @neurolift-technologies/otoi` |
| `nlt-otoi` | PyPI | `src/nlt_otoi/` | `pip install nlt-otoi` |

Both packages implement the same API surface:
- **TOI parsing & validation** — parse `.toi` files, validate against the canonical schema
- **OTOI honoring** — honor user TOI in single-agent and multi-agent contexts
- **Privacy guardian** — enforce privacy boundaries and consent
- **Orchestration primitives** — multi-agent coordination, handoff records, intent logs
- **Schema validation** — Zod (TypeScript) / Pydantic (Python) validators for TOI documents

### Quick Start — TypeScript / Node.js

```bash
npm install @neurolift-technologies/otoi @neurolift-technologies/toi
```

```typescript
import { parseTOI, honorTOI, createOrchestrator } from '@neurolift-technologies/otoi';
import { TOISchema } from '@neurolift-technologies/toi';

// Parse and validate a user's TOI
const toi = parseTOI(await fs.readFile('user.toi', 'utf-8'));

// Honor the TOI in a single-agent context
const honored = honorTOI(toi, { agentId: 'assistant-1', role: 'companion' });

// Multi-agent orchestration
const orchestrator = createOrchestrator({
  agents: [{ id: 'agent-a', role: 'planner' }, { id: 'agent-b', role: 'executor' }],
  sharedTOI: toi,
});
await orchestrator.run(task);
```

### Quick Start — Python

```bash
pip install nlt-otoi nlt-toi
```

```python
from nlt_otoi import parse_toi, honor_toi, create_orchestrator
from nlt_toi import TOISchema

# Parse and validate a user's TOI
toi = parse_toi(open('user.toi').read())

# Honor the TOI in a single-agent context
honored = honor_toi(toi, agent_id='assistant-1', role='companion')

# Multi-agent orchestration
orchestrator = create_orchestrator(
    agents=[{'id': 'agent-a', 'role': 'planner'}, {'id': 'agent-b', 'role': 'executor'}],
    shared_toi=toi,
)
await orchestrator.run(task)
```

---

## 🌟 What is OTOI?

The **OTOI (Orchestrated Terms of Interaction)** framework is an open framework for human-controlled AI collaboration. It provides a structured way to define **Terms of Interaction (TOI)** — user-authored documents that specify how AI systems should behave, respecting cognitive preferences, privacy requirements, and collaboration style.

### Key Principles

- **User-Controlled**: You define exactly how AI should interact with you
- **Neurodivergent-Friendly**: Built with diverse cognitive needs in mind
- **Privacy-First**: Your data and preferences stay under your control
- **Flexible**: Adapt to any workflow or collaboration style
- **Transparent**: Clear, understandable interaction rules
- **Portable**: TOI documents work across any OTOI-compliant system

---

## 📁 Repository Structure

```
/packages/otoi/       # npm package @neurolift-technologies/otoi (v1.2.0)
├── src/              # TypeScript source
│   ├── index.ts      # Public API exports
│   ├── honor.ts      # TOI honoring logic
│   ├── schema.ts     # Zod validators
│   ├── compat.ts     # Cross-platform compatibility
│   ├── constants.ts  # Protocol constants
│   ├── errors.ts     # Error types
│   └── types.ts      # TypeScript types
├── test/             # Vitest test suite
├── dist/             # Build output (gitignored)
├── package.json
├── tsconfig.json
├── SPEC.md           # API specification
└── README.md

/src/nlt_otoi/        # PyPI package nlt-otoi (v1.2.0)
├── __init__.py       # Public API exports
├── honor.py          # TOI honoring logic
├── schema.py         # Pydantic validators
├── compat.py         # Cross-platform compatibility
├── constants.py      # Protocol constants
├── errors.py         # Error types
└── types.py          # Python types

/docs/                # Current documentation
├── active-threads.md         # Work tracking
├── agent-log/                # Agent session records
├── canonical-toi-migration.md # TOI format migration guide
├── development-process.md    # Contributor runbooks
└── escalations/              # Escalation records

/legacy/              # Cloudflare Workers assets
├── index.html
└── agent-solidarity-kit.json

/tests/               # Cross-package conformance tests
wrangler.jsonc        # Cloudflare Workers configuration
CHANGELOG.md          # Version history
LICENSE               # Apache-2.0
```

---

## 🧭 API Overview

Both packages expose the same core functions:

| Function | Purpose |
|----------|---------|
| `parseTOI` / `parse_toi` | Parse and validate a `.toi` document |
| `honorTOI` / `honor_toi` | Apply TOI to an agent context |
| `createOrchestrator` / `create_orchestrator` | Multi-agent coordination with shared TOI |
| `validateHandoff` / `validate_handoff` | Validate agent handoff records |
| `createIntentLog` / `create_intent_log` | Create intent log entries (OTOI §7) |

### TypeScript API (`@neurolift-technologies/otoi`)

```typescript
// Core types
interface TOIDocument { /* ... */ }
interface AgentContext { agentId: string; role: string; /* ... */ }
interface OrchestratorConfig { agents: AgentContext[]; sharedTOI: TOIDocument; }

// Main exports
export function parseTOI(content: string): TOIDocument;
export function honorTOI(toi: TOIDocument, ctx: AgentContext): HonoredContext;
export function createOrchestrator(config: OrchestratorConfig): Orchestrator;
export { TOISchema, HandoffSchema, IntentLogSchema } from '@neurolift-technologies/otoi/schema';
```

### Python API (`nlt-otoi`)

```python
# Core types
class TOIDocument: ...
class AgentContext: ...
class OrchestratorConfig: ...

# Main exports
def parse_toi(content: str) -> TOIDocument:
def honor_toi(toi: TOIDocument, ctx: AgentContext) -> HonoredContext:
def create_orchestrator(config: OrchestratorConfig) -> Orchestrator:
from nlt_otoi.schema import TOISchema, HandoffSchema, IntentLogSchema
```

---

## 📖 Documentation

| Document | Status | Description |
|----------|--------|-------------|
| `docs/development-process.md` | ✅ Current | Contributor runbooks, release process, license maintenance |
| `docs/canonical-toi-migration.md` | ✅ Current | Migration from legacy TOI formats to canonical `.toi` |
| `docs/active-threads.md` | ✅ Current | Active work tracking |
| `docs/agent-log/` | ✅ Current | Agent session records (registrations, handoffs, escalations) |
| `packages/otoi/SPEC.md` | ✅ Current | npm package API specification |
| `packages/otoi/README.md` | ✅ Current | npm package documentation |
| `src/nlt_otoi/__init__.py` | ✅ Current | PyPI package API (docstrings) |
| [Python-era archive](https://github.com/NeuroLift-Technologies/nlt-otoi/tree/036c8c0e3bb67f733a4239418a5011b137c589f9/legacy) | Archived | Historical docs, examples, schemas, and templates at the last commit before retirement |

---

## 🔒 Privacy & Security

- **Local Control**: TOI documents never leave your environment unless you share them
- **Minimal Data**: Only necessary preferences are processed
- **Transparent Processing**: Clear rules about how TOI data is used
- **Revocable Consent**: Modify or withdraw TOI at any time
- **Standards-Based**: Open protocols, no vendor lock-in
- **Supply Chain**: Both packages publish provenance and SBOMs

See `SECURITY.md` for vulnerability reporting.

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# TypeScript package
cd packages/otoi
npm install
npm run test
npm run typecheck

# Python package
cd ..
pip install -e .[dev]
pytest
```

### Governance

This project operates under the **NeuroLift Solidarity Framework**:
- **OTOI** (ORG-DEV-OTOI-1.0.3) — Agent governance contract
- **ASFDK** — Solidarity Framework control plane
- **RRT Advocate** — Crisis detection & protection
- **Sleepwalker Protocol** — Continuity & consent management

See `NLT-DEV-OTOI.md` for the full governance contract.

---

## 📄 License

Apache License 2.0 — see [LICENSE](LICENSE) for details.

The root `LICENSE` is the authoritative text for the repository and the `@neurolift-technologies/otoi` npm package metadata. The PyPI package `nlt-otoi` also includes a copy. See `docs/development-process.md#license-maintenance-runbook` for the maintenance checklist.

---

## 🌍 Community & Links

- **Issues**: [GitHub Issues](https://github.com/NeuroLift-Technologies/nlt-otoi/issues)
- **Discussions**: [GitHub Discussions](https://github.com/NeuroLift-Technologies/nlt-otoi/discussions)
- **npm**: [@neurolift-technologies/otoi](https://www.npmjs.com/package/@neurolift-technologies/otoi)
- **PyPI**: [nlt-otoi](https://pypi.org/project/nlt-otoi/)
- **TOI Schema**: [@neurolift-technologies/toi](https://www.npmjs.com/package/@neurolift-technologies/toi)

---

## 🔗 Related Projects

- `@neurolift-technologies/toi` — Canonical TOI file type & schema (npm)
- `nlt-toi` — Canonical TOI file type & schema (PyPI)
- NeuroLift Solidarity Framework — Agent governance & orchestration stack

---

**Made with ❤️ for the neurodivergent community and everyone who values respectful human-AI collaboration.**