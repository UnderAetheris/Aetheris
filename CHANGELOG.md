# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/). Versioning: SemVer once 1.0 ships.

## [Unreleased]

### Security
- **Shell guard bypass (Windows):** `shell_allowlist` checked only the first token while `_shell` ran with `shell=True` on Windows, so `echo hi & del ...` was approved. Commands with shell metacharacters are now refused, `cwd` must be inside the workspace, and `_shell` never uses a shell (`tests/test_safety_hardening.py`).
- **Path-scope bypass:** `edit_file` and `search_content` were not path-scoped; `search_content` (marked safe) could read any file on disk even in safe mode. Both are now confined to the workspace root.
- **Integrity-gate loophole:** side-effect exemptions were keyed by bare symbol name, so registering `SafetyLayer.run` exempted every `*.run(...)` call (including `subprocess.run`) repo-wide. Exemptions are now keyed by the fully qualified enclosing function; newly exposed calls are explicitly registered in `architecture/authority.json`.

### Fixed
- **Self-repair fabricated recurrence:** `SelfRepair.detect()` counted the last failure reason N times, so unrelated one-off failures produced a "recurring problem" repair proposal.
- **Recovery drill honesty:** runners hardcoded their own safety/evidence success; S-03 reused the file-restore experiment; the CLI never supplied an expected identity. Runners now measure digests before and after, and the CLI routes through `verify_scenario`. S-01, S-02, S-03, S-08 prove exact restoration; the rest stay `unknown`/`partial` honestly. `--verify-report` now recomputes metrics and verdict and rejects tampered reports.
- Git-revert drill reverted the baseline commit (`HEAD~1`) instead of the mutation (`HEAD`).
- Recursive test: `test_existing_test_suite_still_passes` spawned the full suite, which re-ran itself without bound.
- Projector leaked `None` into the `str` field `capability_id`; missing values are now `<unknown>` plus a typed `TraceUnknown`.
- Canonical factories now reject invalid enum values with `ValueError` instead of crashing later.
- Stale test fixtures (hand-written content-addressed ids, invalid `TraceValue`s, tests that passed for the wrong reason).

### Changed
- Lint: ruff is pinned (`0.16.10`) and the rule set is explicit (`E4,E7,E9,F,B`). The previous 476 findings came entirely from an unpinned ruff upgrade changing default rules.
- Clean-work-tree contract test runs only in CI; artifact check only flags untracked paths.

### Added
- `specs/`: per-feature specs F00-F26, template, and full inventory of abilities, manners, hard rules, and open decisions.
- `AGENTS.md`: operating manual for AI coding agents.
- `handoff/`: session continuity package (handoff report, conversation log, decisions, current state, roadmap, open questions, mindset).
- `docs/`: product brief and competitive landscape, design system, screens, UX principles, quality bar, testing strategy, threat model, Windows dev setup, architecture overview.
- `CONTRIBUTING.md`, `SECURITY.md`, PR and issue templates, `.editorconfig`.

### Removed
- Tracked build/editor artifacts: `.idea/`, `shell/*.tsbuildinfo`, `shell/vite.config.js`, `shell/vite.config.d.ts` (compiled duplicates of `vite.config.ts`).
- Stray outputs and one-off scripts at repo root: `test_output.txt`, `test_output3.txt`, `fix_phase0_blockers.py` (its fixes are already applied; recoverable from git history).

## Phase 0 history (pre-changelog)

Foundation milestones, see the living spec and `*_REPORT.md` files: controller, safety layer, tools, planner, evaluation, memory, learning v0, reasoning (default-on), hierarchy (default-off), research engine + perimeter (default-on), reliability learning, unattended supervisor (default-off), correctness hardening, architecture integrity baseline, trace replay, changeset rollback receipts, recovery drill harness.
