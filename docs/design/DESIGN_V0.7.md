# Design v0.7

_Status: proposed, 2026-10-06. Prototype: [`prototype-v0.7/`](prototype-v0.7/). Builds on v0.6.1 ([`DESIGN_V0.6.md`](DESIGN_V0.6.md)); everything there still applies, including the wording rules. This round covers steps 1 and 2 of the plan the owner approved after v0.6.1: failure states, the first day, coming back after time away, offline, and undoing many changes at once._

## Why

v0.6.1 only showed the good path: tasks run, approvals arrive, changes can be undone. Real use also has failed tasks, stuck tasks, an empty first day, a laptop without internet and a free model quota running out. Home has to say clearly what went wrong and offer the next action, without looking alarming when nothing is wrong.

## States

The prototype can show each state with `?state=` (or `Ctrl K` → "Prototype: show a state"):

| State | What Home shows |
| --- | --- |
| `normal` | v0.6.1 Home: status line, task box, Approvals, Changes today. |
| `problems` | A **Problems** section above Approvals, the quota meter, "1 failed today" in the sidebar, "N problems" in the state pill. |
| `away` | A **While you were away** card at the top (since 11:40 pm). |
| `first` | First day: empty lists, a **Getting started** checklist and example tasks under the task box. |
| `offline` | An offline bar under the tabs; running tasks show "Waiting for internet". |

## Problems

One section for anything that needs a decision because it did not go as planned. It only appears when there is at least one problem.

- **Failed task**: title, `Failed` tag, the step it stopped at and why in one line ("Stopped at step 3 of 5: 2 of 40 tests failed after the docs were edited"). Actions: **Retry**, **Undo its changes**, **Details** (failed test output and which files it edited).
- **Stuck task** (no progress for a set time): `No progress` tag, what it is waiting for. Actions: **Stop**, **Keep waiting** (checks again in 10 min). In the sidebar the task's line turns amber: "No progress for 6 min".
- Every action has Undo in its toast.
- The headline counts both: "2 approvals waiting · 2 problems".

## While you were away

Shown when Aetheris ran for a while without the app open (overnight, or the laptop was locked). One card, four cells, each opens the right place:

- tasks completed (with names), tasks failed, overnight practice result, approvals waiting (with the oldest time).

Dismiss with ×; Undo in the toast brings it back. It does not come back on its own until the next time away.

## First day

Nothing in Running, Queue or Changes yet, so every list has an empty state that says what will appear there.

- Headline "No tasks yet" and one line: Aetheris only uses the folders you add.
- **Getting started**: Add a folder ✓, Connect a free model ✓ (done in setup), Run a first task, Undo a change once. The last one is there so the owner learns where Undo is before needing it. Items tick as they happen. **Hide** removes it; `Ctrl K` brings it back.
- Three example tasks under the task box; click fills the box.

## Offline

- Bar under the tabs: "No internet connection. Tasks that need an online model are waiting." with **Retry** and **Use local model**.
- Running tasks pause and show "Waiting for internet"; nothing is lost.
- **Use local model** switches to Ollama; the bar says it is slower but tasks continue.
- The state pill reads "Offline".

## Free model quota

The quota meter in the sidebar is hidden while use is normal. Above 80 % of the daily free limit it appears with a forecast ("About 2 h left at this rate") and **Change model**. Before, it was always visible and mostly noise.

## Undo since a time

Changes today has **Undo since…** (shown when there are two or more changes). Pick a time; a dialog lists every change that will be undone and says that files go back to how they were at that time and running tasks pause while it happens. `Enter` confirms, `Esc` cancels; Redo in the toast.

## Activity bars

The bars were decorative. Now hovering a bar shows how long ago, how many actions and what they were ("Rename: edited a test file"). Clicking a bar lists the actions with the task each belongs to; picking a date-fix action opens its live view (the only task with a full view in the prototype).

## Sidebar

- Overnight practice moved out of the sidebar into `Ctrl K` (and Settings later). It is a setting, not something to look at every day.
- "1 failed today" under "4 completed today" when there is a failure; click goes to Problems.
- Checked at 1366 × 768 and 1536 × 864 (125 % scaling): the sidebar fits; the Running and Queue lists scroll when long.

## Checked

- Automated click-through of every visible control in each state, dark and light, 1440 / 1366 / 390 px: no script errors, no overflow. The only "no change" hits are row buttons that appear on hover (pause, move to top) and the hidden offline bar's buttons; checked by hand with hover first.
- Screenshots of each state in dark and light, and a 60 s recording.

## Page queue

Next, in the order agreed with the owner:

1. **Approvals** page (full list, filters, history of decisions)
2. **Settings** (Automatic / Ask first / Never per action, models, folders, overnight practice, quiet hours)
3. Quick add from anywhere (`Alt Space`), tray icon, Windows notifications with Approve / Later
4. **Progress** and **Reports**
5. Memory, Tasks, Skills, PC health, first-run setup

## Known gaps

- Problems are sample data; retry starts the short five-step sample task.
- "While you were away" times are fixed in the sample.
- The local model path is a message only; no speed or quality difference is shown.
- Narrow windows (< 900 px) still use the top strip; Problems and the checklist work there, the queue does not.
- Not checked on a real Windows machine yet.
