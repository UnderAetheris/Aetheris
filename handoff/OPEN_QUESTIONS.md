# Open questions for the owner

| ID | Question | Default if unanswered | Blocks |
| --- | --- | --- | --- |
| Q1 | Amend living spec §11 "no background browsing" to allow AFK sessions (objective-scoped, allowlisted, budgeted, proposals-only)? | Keep AFK off and unbuilt | F17 |
| Q2 | Guardian: confirm which actions are ask-first (cleanup, organize, disable startup item, quick scan) vs never (disable Defender/firewall/UAC, System32, registry deletes) | Use the split in F19 | F19 v1 |
| Q3 | "Locker" = secrets vault (assumed), folder locker, or app/PC lock? | Secrets vault | F20 |
| Q4 | First free providers: Gemini AI Studio, Groq, OpenRouter? Order? | Gemini -> Groq -> OpenRouter | F13 |
| Q5 | Assistant name (keep "Aetheris"?) and default tone (casual / formal) | Aetheris, concise-casual | F00 |
| Q6 | You wrote "the best song player and following app, all use cases" (session 2) and "the best AI subtitle generator for songs with all aspects" (session 3). Was that pasted from another project, or do you want music/lyrics/subtitle features inside Aetheris? | Treat as a slip: Aetheris stays a personal assistant; no music or subtitle features | Scope |
| Q7 | License: MIT, Apache-2.0, or keep private/proprietary for now? | No license file (all rights reserved) | Public release |
| Q8 | Allow committing `shell/package-lock.json` so UI tests can run in CI with `npm ci`? (Currently forbidden by hygiene tests.) | Keep forbidden; UI CI uses `npm install` | UI CI |
| Q9 | Monetization: accept the proposal in `docs/product/MONETIZATION.md` (free BYOK core, Pro for sync/mobile approvals/AFK budgets)? | Build free core; no billing code before 1.0 | 1.0 |
| Q10 | (reserved) | | |
| Q11 | v0.6.1 accepted; v0.7 and v0.8 approved. Does v0.9 Settings (`docs/design/prototype-v0.9/aetheris-prototype-v0.9.html?view=settings`) have the right sections and defaults? Which of the later ideas (import settings, per-model privacy, schedule preview, notification digest, conflict warnings) are wanted? | Continue the queue on v0.9: quick add, tray, Windows notifications next | F26 M1 |
| Q12 | Remove the raw `shell` tool from the default model-facing tool registry (keep typed tools like `run_tests`, `git_status`)? | Keep it, guarded (metachar block, `shell=False`, cwd scoping) | Security posture |
| ~~Q13~~ | ~~Re-upload the workspace screenshots~~ | Answered 2026-10-06: received (sessions 1-3 chat screenshots) | — |
