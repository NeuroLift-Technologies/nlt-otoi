# Active Threads

Current work threads and their status for the nlt-otoi repository.

> Updated by agents and contributors to track parallel work streams and prevent conflicts.

---

## Active

| Thread | Owner | Status | Branch | Description |
|--------|-------|--------|--------|-------------|
| otoi consumes the toi APIs | claude | pending review | `ccr-7a1dfdaf-cxo6zh` | npm and Python ports use toi `canonicalize`, `parseToi`, `verifyToi`, `compareTier`, and `TOI_RESERVED_PREFIX` instead of local copies; fixes two leaf-equality bugs. Next action: review [PR #53](https://github.com/NeuroLift-Technologies/nlt-otoi/pull/53) and decide the open escalations listed there (same-tier override, privacy floor). |

## Completed

| Thread | Owner | Merged | PR | Description |
|--------|-------|--------|-----|-------------|
| OTOI archive retirement | codex | ✅ | [#52](https://github.com/NeuroLift-Technologies/nlt-otoi/pull/52) | Retired superseded files under `legacy/`, preserving the live landing page and Solidarity Kit manifest. |
| Repo cleanup: archive legacy Python, rewrite docs | swe | ✅ | [#49](https://github.com/NeuroLift-Technologies/nlt-otoi/pull/49) | Archived Python-era files and updated README for npm and PyPI APIs. |
| License maintenance docs follow-up | cursor | ✅ | [#39](https://github.com/NeuroLift-Technologies/nlt-otoi/pull/39) | Extended license maintenance guidance for changelog, metadata, nested docs, and PRs. |
| PR #40 license/package docs follow-up | cursor | ✅ | #41 | Aligned developer runbooks with merged Apache-2.0 relicense, the new `packages/otoi/LICENSE`, and `@neurolift-technologies/otoi` 1.1.0 package metadata/release checks |
| Relicense to Apache-2.0 | claude | ✅ | #40 | Relicensed OTOI from MIT to Apache-2.0 across root, nested `nlt-otoi/`, and the new `packages/otoi/LICENSE`; bumped `@neurolift-technologies/otoi` to 1.1.0. npm publish deferred to post-merge |
| License maintenance runbook follow-up | cursor | ✅ | #38 | Added source-verified operational runbook details for auditing license-bearing docs, package metadata, nested license copy, and integration metadata |
| License documentation alignment | cursor | ✅ | #37 | Documented the PR #36 LICENSE update and related package/contributor license maintenance paths |
| Runbook alignment follow-up | cursor | ✅ | #18 | Updated maintenance runbooks and repository docs for GitHub Pages + Solidarity Kit interfaces |
| GitHub Pages & Solidarity Kit | copilot | ✅ | #17 | Added `index.html`, `agent-solidarity-kit.json`, and initial agent-log scaffolding |
| CLAUDE.md | claude | ✅ | #7 | Comprehensive AI assistant guide |
| Multi-agent architecture | codex | ✅ | #4 | NeuroLift agent architecture and prototypes |
| TOI-OTOI governance | copilot | ✅ | #8 | Core library: toi_parser, otoi_orchestrator, privacy_guardian |
| Framework overview | copilot | ✅ | #5 | Extracted framework deep dive to docs/ |
| Initial OTOI framework | copilot | ✅ | #1 | Comprehensive setup of nlt-otoi/ subdirectory |
| Repository structure | cursor | ✅ | #3 | GitHub issue templates and workflows |
| README & topography | cursor | ✅ | #2 | Detailed framework description, GEMINI_TOPOGRAPHY.py |

## Parking Lot

_Items noted for future work but not yet started._

- [ ] Create `AGENTS.md` coordination gateway (pending solidarity-framework repo availability)
- [ ] Add `SOP-NLT-001` onboarding document
- [ ] Create JSON schemas for agent registration and handoff records
- [ ] Reconcile commit format between CLAUDE.md and OTOI standard
