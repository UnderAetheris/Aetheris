# Next session: start here

_Updated 2026-10-07, session 4 (design v0.9). CI on `main` is green; keep it that way._

## Owner direction (session 4)

**Design first, approaches later.** The owner wants the UI designed page by page before backend work resumes. Phase 1 (F13 router, below) waits until the owner says go.

1. Open `docs/design/prototype-v0.9/aetheris-prototype-v0.9.html`: Home in each state (`?state=problems|away|first|offline`), stop / undo / retry and the reason card, Approvals (`?view=needs`), the task view with a flagged line (`?view=task&ff=6`), Settings (gear at the bottom of the sidebar, or `?view=settings&sec=perm|models|folders|sched|notif|reasons|privacy|look|limits|keys`), `Ctrl K`. Read `docs/design/DESIGN_V0.9.md`.
2. Done so far: v0.7 (problems, first day, away, offline, undo since), v0.8 (Approvals page, reasons), v0.9 (Settings). Next: **quick add from anywhere (`Alt Space`), tray icon, Windows notifications** with Approve / Later / Decline; then Progress and Reports; then Memory. Ask for owner feedback on v0.9 first if not given.
3. One page per review round. Show rendered screenshots (dark and light) and a short recording, not descriptions.
4. Rules: no dead buttons, and the wording rules in DESIGN_V0.6.md (plain software labels, no chatty agent voice). Every drawn control must work in the prototype, or show a toast saying what the full app does. Check each new page at 1366 × 768 too.
5. Edit sources in `prototype-v0.9/`, run `python build.py`, render with headless Chromium (Playwright `chromium.launch({executablePath})` works; video needs ffmpeg at Playwright's expected path).

---

Everything below is the backend plan, on hold until the owner says go.

## 0. Before anything

1. Read `HANDOFF_REPORT.md`, `QUALITY_PASS_2026-10-05.md`, and `OPEN_QUESTIONS.md` (check if the owner answered Q6, Q11, Q12).
2. Run locally: `ruff check src/ tests/ scripts/`, `python -m pytest -q`, `python scripts/check_architecture_integrity.py --check`. All must be clean before you change anything.

## 1. Phase 1: F13 ModelRouter (main task)

The pieces already exist in `src/aetheris/model/`:
- `interface.py`: `ModelRequest`, `ModelResponse`, `ModelProvider` protocol
- `providers.py`: `MockProvider`, `LocalProvider`, `ApiProvider`, `FallbackProvider` (injectable transport)
- `config.py`: `ModelConfig.from_env`, `build_provider`

Build `ModelRouter` on top, per `specs/F13_model_providers_router.md`:
- Roles: `plan`, `patch`, `summarize`, `classify`, each mapped to an ordered provider list.
- Budgets per provider: requests/minute, requests/day, tokens/day; persisted daily counters with an injectable clock.
- Fallback on 429 / 5xx / timeout; when everything is down or over budget, return a typed `Abstain` (never raise into the controller, never fake an answer).
- Prompt-hash cache (sha256 of role + normalized prompt + model id), size-bounded.
- Redaction before send (API keys, tokens, emails, home paths) with a test that inspects the transport payload.
- Reuse the existing boundary `network_egress.model_provider` in `architecture/authority.json`. Do not add a new boundary unless unavoidable.
- Default **off** in `Config` and `capabilities.json`; off-path byte-identical.
- Tests (hermetic, fake transport): `test_fallback_on_429`, `test_all_down_abstains`, `test_daily_budget_enforced`, `test_secrets_redacted_before_send`, `test_cache_hit_skips_network`, plus off-path identity.
- Provider order default: Gemini AI Studio -> Groq -> OpenRouter free (Q4).

Flow: short design note in the PR description, then code + tests, then ledgers (`capabilities.json`, README table via `--render-readme`), CHANGELOG, handoff.

## 2. Follow-ups from the quality pass

- R-1: if Q12 approved, remove `shell` from the default model-facing tool registry (keep it for internal callers).
- R-3: measured runners for drill scenarios S-04..S-07.
- R-6: Python lockfile.

## 3. In parallel: F26 M1 (UI target = `docs/design/prototype/`)

Open `docs/design/prototype/aetheris-prototype.html` first and click through it. The real React UI must match it, including the live run view and the writing rules.


`shell/src/styles/tokens.css` from `docs/design/BRAND_DIRECTION.md` v0.3 (if accepted; match the mockups in `docs/design/assets/v0.3-*.svg` exactly, including the writing rules) or `DESIGN_SYSTEM.md`, then primitives (Button, Card, Badge, StatusDot, Skeleton, EmptyState, ErrorState, Toast) with Vitest tests. No behavior change. Self-host fonts (OFL), no CDN.

## 4. End of session

Update `CURRENT_STATE.md`, this file, `CHANGELOG.md`, `CONVERSATION_LOG.md`, and add `snapshots/YYYY-MM-DD_session-N.md`.
