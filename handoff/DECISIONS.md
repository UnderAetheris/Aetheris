# Decision log

Format: ID, date, decision, why, status. Newest last.

| ID | Date | Decision | Why | Status |
| --- | --- | --- | --- | --- |
| D-001 | 2026-09-28 | Not AGI; an engineering system that improves through measured, reversible steps | Owner brief | Accepted |
| D-002 | 2026-09-28 | "Improves every second" means continuous find-weakness/learn/test loop, not literal | Owner clarification | Accepted |
| D-003 | 2026-09-28 | Laptop = body, free cloud tiers = brain, router with fallback; no local big models | 8 GB, no GPU, $0 budget | Accepted |
| D-004 | 2026-09-28 | Windows Defender stays the antivirus; build Guardian for visibility, health, approved cleanup | Defender is free and better; realistic scope | Accepted |
| D-005 | 2026-09-28 | Safety layer, perimeter, eval gates, benchmarks, ledgers, CI are hard-locked (no approval can unlock) | Prevent reward hacking and guard erosion | Accepted |
| D-006 | 2026-09-28 | "Faithful" = permission tiers T0-T3 + honesty manners, not a personality | Structural trust | Accepted |
| D-007 | 2026-09-28 | GitHub repo is the single source of truth; ClickUp artifacts removed | Owner instruction | Accepted |
| D-008 | 2026-09-28 | Build on the existing Phase 0 architecture; do not restart | Repo already strong | Accepted |
| D-009 | 2026-09-28 | One spec per feature in `specs/`, template-driven | Owner asked for detailed per-feature specs | Accepted |
| D-010 | 2026-10-01 | AI has authority to branch, commit, merge without asking | Owner instruction | Accepted |
| D-011 | 2026-10-01 | Docs/specs/handoff live on `main`; experiments on branches | Owner: "everything in main except testers" | Accepted |
| D-012 | 2026-10-01 | AFK learning proposed as objective-scoped, allowlisted, budgeted, proposals-only; requires amending living spec §11 | Conflicts with existing non-goal | **Pending owner** (Q1) |
| D-013 | 2026-10-01 | UI stack: React + Vite + TS (existing) + React Router + TanStack Query + SSE + Framer Motion + cmdk + Lucide; Tauri later | Light, proven, fits 8 GB | Proposed |
| D-014 | 2026-10-01 | Design language: dark-first, purple accent `#7C5CFF`, semantic color, motion only for state change | Calm, trustworthy, premium | Proposed |
| D-015 | 2026-10-01 | Positioning: "the personal AI that gets better and proves it"; wedge = proven improvement + visible safety + PC care + $0 | Competitive research | Proposed |
| D-016 | 2026-10-05 | Brand v0.2 "The Instrument": graphite/bone base, chartreuse `--signal #C8FF3D` identity, semantic pass/attend/block/research colors, Instrument Sans + JetBrains Mono + Newsreader; supersedes D-014 if accepted | Purple-on-dark reads as generic AI app; an instrument/receipt look fits "proves it" | **Rejected by owner** 2026-10-05 ("overused design, AI slop") |
| D-017 | 2026-10-05 | ruff pinned (0.16.10) with explicit rules `E4,E7,E9,F,B`, target py311 | Unpinned ruff with default rules made CI red without code changes | Accepted |
| D-018 | 2026-10-05 | Windows canary workflow is separate (weekly + manual); `ci.yml` forbids `continue-on-error` | Required checks must never be soft; Windows signal still needed | Accepted |
| D-019 | 2026-10-05 | Monetization: free-forever BYOK core; Pro (~$8/mo, ₹299) for sync, mobile approvals, AFK budgets, skill packs; never paywall safety, undo, or export | Fair, $0 to run, matches positioning | **Pending owner** (Q9) |
| D-020 | 2026-10-05 | Drill and self-repair claims must be measured; otherwise report `unknown` | Earlier runners hardcoded success | Accepted |
| D-021 | 2026-10-05 | Quality-pass method: read gates themselves, reproduce locally on 3.11 and 3.13, fix root causes, never weaken a test | See `QUALITY_PASS_2026-10-05.md` | Accepted |
| D-022 | 2026-10-05 | Design v0.3: derive every visual from what Aetheris does (step log, circle = looked / square = changed / orange = needs you, Undo on every change, proven-improvement page); IBM Plex Sans + Mono; color only for meaning; plain writing rules, no invented feature names or hype words | Owner wants a design made for this app, like GitHub or Nothing, not trend-driven | **Pending owner** (Q11) |
| D-023 | 2026-10-05 | Clickable prototype v0.4 (`docs/design/prototype/`) is the UI target: live run view (thinking, pinned plan, streaming output and diff, pause/stop, undo/redo) plus all sections (Home, Waiting for you, Reports, What it learned, What it knows, PC health, Settings, New task) | Owner: v0.3 right direction, wants more interactive, live AI view, all sections | **Pending owner** (Q11) |
| D-024 | 2026-10-06 | Design v0.5 (`docs/design/DESIGN_V0.5.md`): layered dark-first surfaces, Geist + Geist Mono, cyan = working / amber = needs you, Home opens on the task box, live view with follow-along inspector (Files, Browser, Changes, Terminal), one question mirrored everywhere, learning shown in the result. Design page by page from here, owner reviews each | Owner: v0.4 looked old and not engaging; wants design first, then approaches | **Pending owner** (Q11) |
| D-025 | 2026-10-06 | Design v0.6 (`docs/design/DESIGN_V0.6.md`): dark is the default; sidebar becomes the control panel (state, activity, Now, Up next queue, what it may do on its own, free requests, learn while away, Pause everything); pages move to top tabs; Do it / Plan first / Just ask; editable plan before start; "Before it starts" panel; no dead buttons in prototypes | Owner on v0.5: right direction but needs to feel smoother and softer, more real than screenshots; dark default; sidebar overused; wants full control | **Pending owner** (Q11); dark default decided by owner |
| D-026 | 2026-10-06 | Wording rules and a smaller Home (DESIGN_V0.6.md, v0.6.1): plain software labels, no chatty agent voice; Home = status line, task box, Approvals, Changes today; everything else lives in its tab | Owner: v0.6 "way better", but vocabulary "looks so much AI", some things should not be on Home, some bugs | Done; owner to review |
| D-027 | 2026-10-06 | Design v0.7 (`docs/design/DESIGN_V0.7.md`): Home shows failure and edge states only when they happen (Problems, While you were away, offline bar, quota meter above 80 %); first day gets empty states and a 4-item Getting started checklist; Undo since a time; activity bars explain themselves; overnight practice is a setting, not a sidebar row. Offline fallback is an optional small local model (Ollama), not a replacement for the free cloud models (D-003 still holds) | Owner approved the idea list after v0.6.1 ("yes, go through, i like the ideas"); v0.6.1 only showed the good path | Done; owner to review |
