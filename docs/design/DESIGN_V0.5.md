# Design v0.5

_Status: proposal, waiting for the owner (Q11). Prototype: [`prototype-v0.5/`](prototype-v0.5/). Supersedes v0.4 as the target if accepted._

## Why v0.4 was not good enough

Owner, 2026-10-06: v0.4 was "fine but not that good", "looks kind of old", not engaging enough to compete with today's apps. Looking at it again, the problems were real:

- **Flat.** One surface colour, thin lines everywhere, no depth. It read as a wireframe, not a finished product.
- **No first action.** Home opened on lists. The thing you came to do (give it a task) was a button in the corner.
- **Weak hierarchy.** Every section had the same weight, so nothing pulled the eye.
- **The live view was a log, not a window into the work.** You saw what it did, but not *what it was looking at*.

v0.5 keeps what was right in v0.3/v0.4 (plain words, steps instead of chat bubbles, looked vs changed, Undo everywhere, proof before claims) and fixes the four problems.

## What changed

| Area | v0.5 |
| --- | --- |
| Surfaces | Three layers: canvas (sidebar), raised content panel with a 14 px corner, cards on top. Dark first, light as a full equal. |
| Type | Geist for words, Geist Mono for anything the computer produced (times, paths, tools, counts). Both SIL OFL, self-hosted. Windows fallback: Segoe UI Variable, Cascadia Mono. |
| Colour | Neutral greys plus exactly two signal colours: **cyan = working right now**, **amber = needs you**. Green/red only for passed/failed and added/removed lines. Nothing else is coloured. |
| Home | Opens with the task box ("Give it a task, or ask a question…") and three suggestions. Below: Needs you (answer in place), Running (live step strip), Done today; right column: practice score, PC health, learning while away. |
| Live task view | Plan bar on top (6 steps, live segment animates, the asking step turns amber). Step thread in the middle. Right side follows along: **Files** it read, **Browser** with the exact passage it is reading highlighted, **Changes** typing in line by line, **Terminal** streaming. Click a step to pin the right side to it. |
| One question, everywhere | When the task asks to push, the same question appears in the thread, on Home in "Needs you", and as an amber ring in the sidebar. Answer it anywhere; all three update. |
| Proof in the result | The finished card says what it saved to memory and which skill it used, with that skill's real success count. Learning is visible where it happens, not only on a stats page. |
| Steering | A box under the thread: tell it something while it works. Your note appears as a step. |
| Command menu | `Ctrl K` for every action and page, with keyboard hints. |

## Tokens

Source of truth: [`prototype-v0.5/tokens.css`](prototype-v0.5/tokens.css). Summary (dark / light):

| Token | Dark | Light | Use |
| --- | --- | --- | --- |
| `--bg` | `#0B0C0E` | `#F2F2F0` | Canvas, sidebar |
| `--panel` | `#111215` | `#FAFAF9` | Main content panel |
| `--raised` | `#16171B` | `#FFFFFF` | Cards, inputs |
| `--text` / `-2` / `-3` | `#EDEEF0` / `#A3A6AE` / `#6E727B` | `#16171A` / `#5C6068` / `#8A8E96` | Primary / secondary / hints |
| `--live` | `#4CC9F0` | `#0A86B8` | Working right now |
| `--ask` | `#F5A524` | `#B86E00` | Needs you |
| `--good` / `--bad` | `#3DD68C` / `#F26D6D` | `#178A52` / `#CC3B3B` | Passed, added / failed, removed |

Radii 6 / 8 / 10 / 14. Spacing 4, 8, 12, 16, 24, 32, 48. Base text 14 px, titles 20 to 28 px.

## Motion rules

Motion only shows that something changed state. Durations: 120 ms (hover, press), 200 ms (menus, toggles), 420 ms (a new step, a page). Easing `cubic-bezier(.16,1,.3,1)`. Everything respects `prefers-reduced-motion`.

| Motion | Means |
| --- | --- |
| Step slides up 8 px and fades in | A new step started |
| Shimmer on the step title | This step is running now |
| Moving cyan sweep on the plan bar / step strip | Work in progress on that step |
| Blinking caret | Text is being written |
| Diff line slides in | It just wrote this line |
| Amber box scales in | It needs you |
| Score line draws once on load | — (only decorative motion we allow, once, under 1.5 s) |
| Card slides right and collapses | You answered it; Undo is in the toast |

## Signature parts (reused by every other page)

Step node (circle = looked, square = changed, amber square = asked) · step strip · plan bar · question box · result card · follow-along inspector with four tabs · Needs-you card · toast with Undo · command menu · tags (`kept`, `no gain`, `broke 1`, `From memory`).

## Page queue

Designed: **Home**, **Live task view**, **Command menu**. Next, one page at a time, each shown to the owner before the next:

1. **Needs you** (full inbox; reuses the question box)
2. **What it learned** (practice score, every change tried with result, skills)
3. **Reports** (daily and weekly)
4. **What it knows** (memory you can edit, with where each memory came from)
5. **Tasks** (all tasks, long goals)
6. **Skills**
7. **PC health**
8. **Settings** (On its own / Ask me / Never per action, models, folders)
9. **First-run setup** (free API keys, folders, first task in under 10 minutes)

## Known gaps

- Narrow windows (< 900 px) work but are not polished; Aetheris is a desktop app first.
- Not checked on a real Windows machine yet (font rendering, Segoe fallback).
- Logo is a placeholder idea (rising line: looked, looked, changed). Not final.
