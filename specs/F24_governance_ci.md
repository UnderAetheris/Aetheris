# F24: Governance: architecture integrity & CI gates

**Status:** `built`
**Docs:** `architecture/ARCHITECTURE_BASELINE.md`, `architecture/capabilities.json`, `architecture/authority.json`

## 1. Purpose
Make current truth executable: every capability, authority, boundary, and default is declared and checked in CI.

## 2. Current state
`scripts/check_architecture_integrity.py --check` validates ledgers, README sync, AST side-effect tripwire, hidden authority, tracked artifacts, evidence truthfulness, CI topology. Specialized gates run independently.

## 3. Requirements for every new spec in this folder
1. Add capability to `capabilities.json` as `implementation: absent` when the spec is accepted
2. Register any new boundary in `authority.json` (e.g. `persistence.task_queue`, `persistence.approvals`, `persistence.profile`, `persistence.guardian_baseline`, `persistence.vault`)
3. Add its gate as an independent CI job
4. Evidence record under `architecture/evidence/` before any default flip
5. `--render-readme` to sync the table

## 4. Repo hygiene notes (observed)
- Done 2026-10-05: stray outputs deleted (session 2); reports moved to `docs/reports/`, living spec to `docs/architecture/LIVING_SPEC.md` (session 3).
- `.idea/` removed (session 2); `.kilo/` still tracked, consider gitignoring

## 5. Tests to add
`test_specs_index_matches_capabilities_ledger` (every spec ID with status built appears in the ledger).
