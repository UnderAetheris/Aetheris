# Quality pass: 2026-10-05 (session 3)

Full audit of the repository behind the CI gates. Every item below was **reproduced, fixed test-first where possible, and verified** on Python 3.11 and 3.13 plus GitHub CI (11/11 jobs green on PR #3).

## 1. Security findings (fixed)

| ID | Severity | Finding | Fix | Regression test |
| --- | --- | --- | --- | --- |
| SEC-1 | **High** (Windows) | `shell_allowlist` checked only the first token; `_shell` used `shell=True` on Windows. `echo hi & del /s /q C:\Users` was approved. | Refuse shell metacharacters `& \| ; < > \` $ % ^ ( ) { } \n \r`; confine `cwd` to the workspace; never `shell=True`; argv via `shlex` | `tests/test_safety_hardening.py` (9 exploit strings) |
| SEC-2 | **High** | `edit_file` and `search_content` were not path-scoped. `search_content` is marked safe, so it read any file on disk **even in safe mode**. | Added to `FILESYSTEM_TOOLS`; default `path="."` handled | same file |
| SEC-3 | **High** (process) | Integrity checker keyed side-effect exemptions by bare symbol name. Registering `SafetyLayer.run` silently exempted every `*.run(...)` repo-wide, including `subprocess.run`. | Exemptions keyed by fully qualified enclosing function; 14 hidden calls surfaced and explicitly registered with reasons | `test_side_effect_exemption_is_scoped_to_enclosing_entrypoint` |

## 2. Honesty and correctness findings (fixed)

| ID | Finding | Why it mattered |
| --- | --- | --- |
| HON-1 | `SelfRepair.detect()` counted the **last** failure reason N times | Unrelated one-off failures became a fabricated "recurring problem" and a repair proposal. Violates "never invent knowledge". |
| HON-2 | Recovery drill runners hardcoded safety checks to `True`; S-08 created the parent file *after* discard and claimed it unchanged; S-03 reused S-01's experiment; CLI never supplied expected identities and hardcoded `evidence_preserved=True` | The drill reported confidence it had not measured. Now: digests captured before and after, `verify_scenario` used, `--verify-report` recomputes metrics and verdict and rejects tampering. |
| BUG-1 | Git-revert drill reverted `HEAD~1` (baseline) not `HEAD` | Scenario could never pass honestly |
| BUG-2 | `str in Enum` in `validate.py` raises on Python 3.11 | Latent; hidden because tests never collected on `main` |
| BUG-3 | `capability_id=None` leaked into a `str` field | Untyped unknown; now `<unknown>` plus typed `TraceUnknown` |
| BUG-4 | Canonical factories crashed with `AttributeError` on bad enums | Now explicit `ValueError` |
| TEST-1 | `test_existing_test_suite_still_passes` spawned the full suite, which re-ran itself without bound | Suite "hangs"; 15-minute timeouts nested |
| TEST-2 | Several tests passed for the wrong reason (missing-argument `TypeError` instead of the asserted enum error) or used stale hand-written content-addressed IDs | False confidence |
| TEST-3 | Clean-tree test failed for any local uncommitted work; artifact check flagged edited tracked files | Now CI-only and untracked-only |

## 3. Tooling findings (fixed)

- **Lint:** 476 of 490 findings came from CI installing **unpinned** ruff whose default rule set changed. Pinned `ruff==0.16.10`, explicit `select = ["E4","E7","E9","F","B"]`. Bugbear found HON-1.
- **CI:** Python 3.11 + 3.13 matrix; actions bumped to Node-24 versions; weekly Windows canary workflow (`windows-canary.yml`), because `ci.yml` rightly forbids `continue-on-error`.

## 4. Known remaining risks (not fixed yet; tracked)

| ID | Risk | Plan |
| --- | --- | --- |
| R-1 | Drill runner still *assumes* receipt linkage (`receipt_valid=True` when IDs are passed as kwargs) | Wire real ChangeSet + RollbackReceipt per scenario (F23 follow-up) |
| R-2 | S-06/S-07/S-10/S-11 still return literal observations; correctly classified `unknown`/`partial`, but not measured | Make each measure real state, as S-01/02/03/08 now do |
| R-3 | Path rules resolve relative paths against the process CWD, not the workspace root | Resolve against root in both guard and tools together (one PR, with tests) |
| R-4 | `shell` allowlist defaults (`echo`, `ls`, `pwd`, `cat`) are POSIX; on Windows `echo`/`dir` are shell built-ins and now fail by design | F05: ship explicit Windows-safe tool equivalents (list_dir/read_file) and remove `shell` from the default model-facing registry |
| R-5 | No Windows CI gate yet | Promote the canary after 2 green weeks |
| R-6 | `synthesis.py` has an unreachable branch (`{"write_file","read_file"}` equals `{"read_file","write_file"}`) | Cosmetic; fix with next learning PR |
| R-7 | UI (`shell/`) has no CI and is a thin dev shell | F26 M1 + Q8 lockfile decision |

## 5. Method (repeat this every quality pass)

1. Run every CI command locally on the CI Python version, from a clean clone.
2. For each failure, find the root cause; never weaken a gate. If a test is wrong, fix the test and say why.
3. Read the gates themselves: a gate can be wrong in the permissive direction (SEC-3).
4. Grep for claims the code makes about itself (`True` literals in safety/evidence fields, "verified", "preserved").
5. Turn on one stricter lint family and read every finding by hand.
6. Write the exploit or counterexample as a failing test **before** fixing.
