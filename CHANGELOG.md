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
- Living spec moved to `docs/architecture/LIVING_SPEC.md`; milestone reports moved to `docs/reports/` (history preserved).
- Lint: ruff is pinned (`0.16.10`) and the rule set is explicit (`E4,E7,E9,F,B`). The previous 476 findings came entirely from an unpinned ruff upgrade changing default rules.
- Clean-work-tree contract test runs only in CI; artifact check only flags untracked paths.

### Added
- Design v0.9 (`docs/design/DESIGN_V0.9.md`, `docs/design/prototype-v0.9/`): Settings page with ten sections (Permissions, Models, Folders, Schedule, Notifications, Reasons, Privacy and data, Appearance, Hard limits, Shortcuts) and search (`/`). Permissions per action and per folder, Check an action (shows which setting decides an action), model order by drag with usage and keys, Never open list, routines and quiet hours, test notification, redaction preview, Export and Delete History. Every change shows Undo, is saved in History (Settings filter), and changed rows have Default.
- Design v0.8 (`docs/design/DESIGN_V0.8.md`, `docs/design/prototype-v0.8/`): Approvals page with Waiting (list and detail, what it changes, similar past decisions, `Y` / `N` / `D`), History (every decision with its reason, the log and files at that moment, filters, search, reasons summary, mark lines, edit a reason later) and Rules (where each rule came from, suggested rules, No approval needed / Ask first / Never, built-in rules locked). Every stop, undo, decline, retry and queue removal shows an optional reason card: pick a reason, point at the log line or file, add a note; it says what the reason will do before saving (nothing, Memory note, rule, or instruction to the task). Flag a line in the task view (Changes or Terminal) and send it to the task as an instruction.
- Design v0.7 (`docs/design/DESIGN_V0.7.md`, `docs/design/prototype-v0.7/`): states beyond the good path. Problems section on Home for failed tasks (Retry, Undo its changes, Details) and stuck tasks (Stop, Keep waiting); While you were away card; first day with empty states, a Getting started checklist and example tasks; offline bar with Retry and Use local model; quota meter shown only above 80 % with a forecast; Undo since a time with a confirm dialog; activity bars show what happened on hover and click. Overnight practice moved from the sidebar to `Ctrl K`. Checked at 1366 × 768 and 1536 × 864. Pick a state with `?state=problems|away|first|offline`.
- Design v0.6.1 (cleanup after owner review): plain wording everywhere (Approvals, Queue, Permissions: Read only / Ask first / Edit files, Progress, Memory, Overnight practice, Pause all; no chatty agent voice); Home reduced to status line, task box, Approvals and Changes today; fixed: send button did nothing, completed task stayed under Running, Running count was wrong, move-to-top shown on the first queue item, "Open on GitHub" did nothing, phone layout scrolled sideways, Windows path `D:\\Users` → `C:\\Users`; demo speed control removed from the task header.
- `docs/design/prototype-v0.6/` and `docs/design/DESIGN_V0.6.md`: dark by default, softer surfaces; sidebar turned into a control panel (state, activity, Now, reorderable Up next, what it may do on its own, free requests, learn while away, Pause everything); pages moved to top tabs; Do it / Plan first / Just ask with an editable plan and a "Before it starts" panel; working folder, permission and model menus; Needs you as a keyboard decision stack; Changed today with Undo per line. Every drawn control works.
- `docs/design/prototype-v0.5/` and `docs/design/DESIGN_V0.5.md`: redesigned Home, live task view (follow-along Files / Browser / Changes / Terminal), command menu; layered dark-first surfaces, Geist type, two signal colours; one question mirrored in thread, Home and sidebar; single-file build with fonts as base64 text.
- `docs/design/prototype/`: clickable UI prototype v0.4 (live run view, all sections, keyboard and command menu) with a single-file build and screenshots.
- `docs/design/BRAND_DIRECTION.md` (design v0.3 proposal: built from what the app does, plain writing rules) with HTML mockups and rendered light/dark screens; `docs/product/MONETIZATION.md` (proposal); `handoff/QUALITY_PASS_2026-10-05.md`.
- `.github/workflows/windows-canary.yml` (weekly + manual Windows run, not a required check).
- `specs/`: per-feature specs F00-F26, template, and full inventory of abilities, manners, hard rules, and open decisions.
- `AGENTS.md`: operating manual for AI coding agents.
- `handoff/`: session continuity package (handoff report, conversation log, decisions, current state, roadmap, open questions, mindset).
- `docs/`: product brief and competitive landscape, design system, screens, UX principles, quality bar, testing strategy, threat model, Windows dev setup, architecture overview.
- `CONTRIBUTING.md`, `SECURITY.md`, PR and issue templates, `.editorconfig`.

### Removed
- Tracked build/editor artifacts: `.idea/`, `shell/*.tsbuildinfo`, `shell/vite.config.js`, `shell/vite.config.d.ts` (compiled duplicates of `vite.config.ts`).
- Stray outputs and one-off scripts at repo root: `test_output.txt`, `test_output3.txt`, `fix_phase0_blockers.py` (its fixes are already applied; recoverable from git history).

## Phase 0 history (pre-changelog)

Foundation milestones, see `docs/architecture/LIVING_SPEC.md` and `docs/reports/`: controller, safety layer, tools, planner, evaluation, memory, learning v0, reasoning (default-on), hierarchy (default-off), research engine + perimeter (default-on), reliability learning, unattended supervisor (default-off), correctness hardening, architecture integrity baseline, trace replay, changeset rollback receipts, recovery drill harness.
