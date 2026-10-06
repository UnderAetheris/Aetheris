# Design v0.6

_Status: proposal, waiting for the owner (Q11). Prototype: [`prototype-v0.6/`](prototype-v0.6/). Supersedes v0.5 ([`DESIGN_V0.5.md`](DESIGN_V0.5.md)) if accepted. Everything in v0.5 not mentioned here still applies (type, signal colours, live task view, motion meanings)._

## Why v0.5 was not good enough

Owner, 2026-10-06, on v0.5:

1. Right direction, but it should feel more engaging, smoother and softer. It looked made for screenshots, not like something you use.
2. Dark should be the default.
3. Home and especially the sidebar felt overused (a list of pages, like every other app), and the app did not feel like *you* are in control.

Looking at v0.5 again, the cause was the same for all three: most of the screen *showed* things, very little of it *did* anything. The sidebar was navigation. Chips in the task box were labels. You could watch the agent, but you could not steer it before it started, reorder its work, or stop everything at once.

## The main change: the sidebar is a control panel, not a page list

Pages moved to tabs at the top of the main panel. The sidebar now shows the agent itself and the controls over it:

| Part | What it does |
| --- | --- |
| State pill | Working / Needs you / Paused, always visible next to the name. |
| Activity | 36 bars, 2 s each: how many steps and edits it made in the last 72 s. Shows at a glance whether it is busy, stuck or idle. Amber bar when it is waiting for you. |
| Now | Running tasks with a progress ring and the step it is on. Pause each one on hover. Click to open the live view. |
| Up next | The queue. Drag to reorder, move to top, remove (with Undo). New tasks can be queued with `Alt Enter`. |
| What it may do on its own | Three levels: **Watch** (only looks), **Ask first** (asks before changes), **Trusted** (changes files itself, still asks before deleting, installing or pushing). One sentence below says exactly what the level means. |
| Free requests today | How much of the free model quota is used. |
| Learn while I'm away | On/off, with the hours. It only ever suggests changes. |
| Pause everything | One button (`Ctrl Shift P`). Every task holds where it is, nothing changes until you resume. A bar across the main panel says so. Undo in the toast. |

## Control before it starts

- **Three ways to give it work**: *Do it* (starts now), *Plan first* (shows a plan you edit before it starts), *Just ask* (answers, touches no files).
- **Before it starts** panel opens under the task box as soon as you type: when it starts, which folder it can use, what it may do on its own, which model and roughly how many requests. Each value flashes when you change it.
- **Every chip works**: folder, what it may do for this task only, and model are real menus.
- **Plan review**: drag steps to reorder, click a step to rename it, click its label to cycle *only looks / asks you / does it itself*, skip or bring back a step, add a step. The line at the bottom says in plain words where it will stop and ask.

## Control while it works and after

- **Needs you** is a stack: one decision at a time, the exact command, what happens and how to undo it, Details for the files. `Y` / `N` to answer, `←` / `→` to move between them. The cards behind show how many are left.
- **Changed today**: every change it made today with Undo / Redo on each line.
- **Running** cards show the step strip and have their own pause button.
- Top bar: model chip with requests left, search (`Ctrl K`).

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

1. **Needs you** (full inbox; reuses the decision stack)
2. **What it learned** (practice score, every change tried with result, skills)
3. **Reports** (daily and weekly)
4. **What it knows** (memory you can edit, with where each memory came from)
5. **Tasks** (all tasks, long goals, the full queue)
6. **Skills**
7. **PC health**
8. **Settings** (On its own / Ask me / Never per action, models, folders)
9. **First-run setup** (free API keys, folders, first task in under 10 minutes)

## Known gaps

- Narrow windows (< 900 px): the sidebar becomes a top strip with the state and Pause everything; the queue and levels are not reachable there yet.
- Tasks started from Home run a short sample of five steps; only the date fix has the full live view.
- Not checked on a real Windows machine yet (font rendering, Segoe fallback).
- Logo is still a placeholder idea.
