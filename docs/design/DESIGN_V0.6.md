# Design v0.6

_Status: superseded by v0.7 ([`DESIGN_V0.7.md`](DESIGN_V0.7.md)), which keeps everything here and adds failure, first-day, away and offline states. v0.6.1 was accepted by the owner on 2026-10-06 ("so perfect"). Prototype: [`prototype-v0.6/`](prototype-v0.6/)._

## Why v0.5 was not good enough

Owner, 2026-10-06, on v0.5:

1. Right direction, but it should feel more engaging, smoother and softer. It looked made for screenshots, not like something you use.
2. Dark should be the default.
3. Home and especially the sidebar felt overused (a list of pages, like every other app), and the app did not feel like *you* are in control.

Looking at v0.5 again, the cause was the same for all three: most of the screen *showed* things, very little of it *did* anything. The sidebar was navigation. Chips in the task box were labels. You could watch the agent, but you could not steer it before it started, reorder its work, or stop everything at once.

## The main change: the sidebar is a control panel, not a page list

Pages moved to tabs at the top of the main panel. The sidebar shows the agent and the controls over it:

| Part | What it does |
| --- | --- |
| Status | Running / Waiting / Paused / Idle, next to the name. |
| Activity | 36 bars, 2 s each: number of steps and edits in the last 72 s. Shows at a glance whether it is busy, stuck or idle. Amber bar while an approval is waiting. |
| Running | Running tasks with a progress ring and the current step. Pause each one on hover. Click to open the live view. Completed tasks leave this list. |
| Queue | Tasks waiting to start. Drag to reorder, move to top, remove (with Undo). `Alt Enter` in the task box adds to the queue. |
| Permissions | **Read only** (suggests changes, never makes them), **Ask first** (asks before editing, installing, deleting or pushing), **Edit files** (edits files in your folders, still asks before installing, deleting or pushing). One sentence below says exactly what the level allows. |
| Model requests today | How much of the free model quota is used. |
| Overnight practice | On/off, 1 to 7 am. Results need approval. |
| Pause all | One button (`Ctrl Shift P`). Every task holds where it is; nothing runs or changes until you resume. A bar across the main panel says so. |

## Home (v0.6.1)

Home shows only what needs you now and what changed. Everything else has its own tab.

1. **Date and status line**: "2 approvals waiting", then "2 tasks running · 3 queued · 3 changes today".
2. **Task box** with three modes: **Task** (runs now), **Plan** (you review a plan before it runs), **Question** (no files are changed). Folder, permissions and model are real menus. As soon as you type, a panel shows: Starts, Folder, Permissions, Model.
3. **Plan review** (Plan mode): drag steps, rename, click a permission to cycle *read only / ask first / automatic*, skip or restore a step, add a step. The last line says where approval is needed.
4. **Approvals**: one at a time, with the exact command, what happens and how to undo it, Details for the files. `Y` approve, `N` later, `←` / `→` move between them.
5. **Changes today**: every change with Undo / Redo.

Removed from Home in v0.6.1 (each already has a place): the greeting, the three stat numbers, the suggestion chips, the Running cards (sidebar shows them), the practice score (Progress tab), PC health (PC health tab), and the model chip in the top bar (the task box has it).

## Wording rules (v0.6.1)

The owner found the v0.6 wording "so much AI". The UI now reads like ordinary software:

- **No chatty agent voice.** No "Can I push this fix?", "I'll start with...", "Okay, it will ask again tomorrow", "Good morning". Use plain labels: "Approval needed: push to GitHub", "Snoozed until tomorrow".
- **No cute page names.** "Needs you" → **Approvals**, "What it learned" → **Progress**, "What it knows" → **Memory**, "Changed today" → **Changes today**, "Up next" → **Queue**, "Learn while I'm away" → **Overnight practice**, "Pause everything" → **Pause all**.
- **Standard words for standard things**: Run, Queue, Approve, Later, Undo, Completed, Permissions, Read only.
- **Short.** Toasts are one short line ("Task started.", "Removed from the queue."). Step titles state the result ("All 40 tests pass", "New test fails, as expected").
- **Where the prototype cannot do the real thing** (folder picker, Stop, opening GitHub), the toast says what the desktop app does there, in one line.

## Control while it works

- Live task view: Pause, Stop, add an instruction while it runs, `Space` pause, `Y` / `N` answer, `↑` / `↓` move between steps. The right side (Changes, Terminal, Browser, Files) follows the live step while **Live** is on.
- The demo speed control was removed from the task header (it was a prototype tool, not a product control); `?speed=` still works in the URL.

## Softer, smoother

| Token | v0.5 | v0.6 |
| --- | --- | --- |
| Default theme | follows saved choice, light first time | **dark** |
| Radii | 6 / 8 / 10 / 14 | 6 / 8 / 10 / 12 / 16 / 20 |
| Surfaces | flat fills | very soft top-to-bottom gradient (`--surface`) plus a 1 px inner top highlight (`--hi`) |
| Cards | static | a faint light follows the pointer (`--spot`) |
| Easing | ease-out only | ease-out, plus a small spring (`--spring`) for knobs and toggles |
| Durations | 120 / 200 / 420 ms | 140 / 220 / 460 ms |

Source of truth: [`prototype-v0.6/tokens.css`](prototype-v0.6/tokens.css). Motion still only shows that something changed state; `prefers-reduced-motion` turns it off.

## No dead buttons

Every control in the prototype does what it says (with sample data). Where the real action needs the desktop app (folder picker, file picker, Stop), a toast says what the full app will do. This is the rule for every page from now on: if a control is drawn, it works in the prototype.

## Page queue

Designed: **Home**, **Live task view**, **Command menu**, **Sidebar control panel**. Next, one page at a time, each shown to the owner before the next:

1. **Approvals** (full list; reuses the approval card)
2. **Progress** (practice score, every self-change tried with result, skills)
3. **Reports** (daily and weekly)
4. **Memory** (editable, with where each memory came from)
5. **Tasks** (all tasks, long goals, the full queue)
6. **Skills**
7. **PC health**
8. **Settings** (Automatic / Ask first / Never per action, models, folders)
9. **First-run setup** (free API keys, folders, first task in under 10 minutes)

## Known gaps

- Narrow windows (< 900 px): the sidebar becomes a top strip with the status and Pause all; the queue and permissions are not reachable there yet.
- Tasks started from Home run a short five-step sample in the sidebar; only the date fix has the full live view.
- Not checked on a real Windows machine yet (font rendering, Segoe fallback).
- Logo is still a placeholder idea.
