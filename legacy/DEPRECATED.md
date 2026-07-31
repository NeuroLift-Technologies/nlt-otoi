# Deprecated & Archived Files

This directory contains legacy files that have been archived as part of the
nlt-otoi repo cleanup (2026-07-31). These files are preserved for reference
but are no longer active in the repository.

## What Was Archived

| Path | Reason |
|------|--------|
| `nlt-otoi/` | Vendored copy of the OTOI framework (superseded by `packages/otoi/` npm package and `src/nlt_otoi/` PyPI package) |
| `examples/neuroLift/` | Old Python-era examples |
| `schemas/` | Deprecated JSON schemas (replaced by published package schemas) |
| `templates/` | Python-era OTOI templates (superseded by package templates) |
| `agent-solidarity-kit.json` | Governance artifact moved to legacy; see `packages/otoi/` for current contract |
| `toi-otoi-agents.md` | Old adoption agent specification |
| `index.html` | Legacy landing page (superseded by package documentation) |
| `GEMINI_TOPOGRAPHY.py` | Legacy topography documentation |
| `mcp-config.yaml` | Deprecated tooling configuration |
| `file-structure.md` | Stale architecture decision record |
| `docs/framework-overview.md` | Stale framework doc with "Revolutionary Concept" era definitions |
| `docs/implementation-guide.md` | References deprecated schemas and Python code |
| `docs/best-practices.md` | OTOI-era best practices |
| `docs/neurolift-integration.md` | Python-prototype era integration guide |
| `.github/workflows/schema-validation.yml` | Validated legacy schemas (no longer active) |
| `.github/workflows/accessibility-check.yml` | Python-era accessibility workflow |
| `.github/workflows/security-scan.yml` | Python-era security scan workflow |

## What Was Preserved

| Path | Reason |
|------|--------|
| `src/nlt_otoi/` | Active PyPI package (`nlt-otoi@1.2.0`) |
| `packages/otoi/` | Active npm package (`@neurolift-technologies/otoi@1.2.0`) |
| `docs/active-threads.md` | Current working document |
| `.github/workflows/validate-governance.yml` | Active governance validation |

## Migration Guide

- **npm package**: Use `@neurolift-technologies/otoi@1.2.0` from `packages/otoi/`
- **PyPI package**: Use `nlt-otoi@1.2.0` from `src/nlt_otoi/`
- **Schemas**: Reference schemas via the published packages, not the legacy `schemas/` directory
- **Templates**: Use templates from the published packages, not the legacy `templates/` directory
- **Governance**: The `agent-solidarity-kit.json` has been archived; see the package README for the current governance contract

## Note

These files are archived, not deleted. They remain in the repository history
and can be recovered if needed. Do not reference these files in new work; use
the published packages instead.
