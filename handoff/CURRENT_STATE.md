# Current state

_As of 2026-10-05 (end of session 3)._

## Built (backend, Phase 0)

Per the README capability table and living spec: config, tools, safety, controller, planner, executive, memory (event/knowledge/experience), evaluation, skills, skill promotion (off), plan review, reflection, autonomous loop (**partial**), self repair, model providers (off), model patch (off), understanding (off), reasoning (on), experience recording (on) / consumption (hold, off), hierarchy (off), research (on), research reliability (on), API bridge (off), unattended supervisor (off), unattended outcome learning (hold, off), frontend shell (unmeasured), trace replay. Plus changeset rollback receipts and recovery drill harness.

Note: "production readiness" is `unknown` for every capability in the ledger. Nothing is production-ready yet.

## Built (UI)

Thin React shell: Composer, QueueList, TaskDetail, Indicators, ActivityLog, ConnectionBanner, Skeletons; API client with tests; polls the bridge every 1s. Not the product UI yet (see F26).

## Docs and process

Specs F00-F26, INVENTORY, AGENTS.md, CONTRIBUTING, SECURITY, CHANGELOG, templates, docs/ (product, design, architecture, engineering), handoff/.

## Not built (specified)

Free-tier model router (F13), task queue v1 completion (F02), durable learned keywords + `revert_last` (F08), permission tiers + approvals inbox (F04), user profile memory (F06), reports/Level (F21), chat endpoint (F22), curiosity (F16), AFK mode (F17), Guardian (F19), vault (F20), self-code evolution (F14), product UI (F26), `coding_tasks_v1` benchmark (F07).

## Known issues (P0 first)

| ID | Issue | Notes |
| --- | --- | --- |
| ~~P0-1~~ | ~~CI red on `main`~~ | **Resolved** 2026-10-05 by PR #3. Root causes: ruff unpinned with default rules, recursive tests that spawned the whole suite, Python 3.11 `str in Enum`, integrity findings. All 11 jobs green. |
| P1-1 | `test_output.txt` was tracked as a symlink | Removed in session 2 |
| ~~P1-2~~ | ~~Living spec filename at root~~ | Done: `docs/architecture/LIVING_SPEC.md` (git mv, history kept) |
| ~~P1-3~~ | ~~Reports at root~~ | Done: `docs/reports/` |
| P1-4 | UI tests not in CI | Blocked on lockfile policy (Q8) |
| R-1 | Raw `shell` tool still model-facing. Metacharacters now blocked and `shell=False`, but any allowed argv binary runs | Q12; F04 tiers should make it T2 ask-first |
| R-2 | Windows path not exercised in required CI | `windows-canary.yml` runs weekly/manual; promote to required once green twice |
| R-3 | Recovery drills S-04..S-07 still report `unknown` (not measured) | Honest now; implement measured runners |
| R-4 | Coverage gate threshold is modest; several modules untested on error paths | Raise gradually, never lower |
| R-5 | UI tests not in CI (see P1-4) | Q8 |
| R-6 | No lockfile for Python deps | Add `uv.lock` or pinned `requirements*.txt` in Phase 1 |
| R-7 | Brand/design tokens not yet in code | Blocked on Q11 |
| P2-1 | ClickUp doc "Self-Improving AI Assistant: Master Spec" still exists | Owner deletes manually; GitHub is the source of truth |

## Verification status of this session

Session 3 ran everything locally in a Linux sandbox (Python 3.13 and 3.11): `ruff check src/ tests/ scripts/` clean, `pytest` 1015 passed / 1 skipped, `scripts/check_architecture_integrity.py --check` clean. GitHub Actions confirmed green on PR #3 and on `main` after merge. Not verified: the Windows canary on a real Windows runner, and the owner's own laptop.