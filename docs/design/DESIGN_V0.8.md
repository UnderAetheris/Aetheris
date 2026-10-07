# Design v0.8

_Status: proposed, 2026-10-06. Prototype: [`prototype-v0.8/`](prototype-v0.8/). Builds on v0.7 ([`DESIGN_V0.7.md`](DESIGN_V0.7.md)); everything there still applies, including the wording rules in v0.6. This round: the **Approvals page**, and a reason for every stop, undo and decline, tied to the log and the files it is about._

## Why

The owner asked that every stop or revert lets them say why, together with the log or the changes, and that the reason is kept in the app. A reason is only worth giving if it changes something, so each reason now says what it will do before it is saved, and History shows what it did afterwards.

## One system, used everywhere

Every action that undoes or blocks work goes through the same steps:

1. **The action happens at once.** Nothing waits for a reason.
2. **A reason card appears** at the bottom: what happened, Undo, and "Why?". It is optional: Skip, `Esc`, or leave it and it closes after 20 s.
3. **Pick a reason** (four per action), and optionally:
   - **Point at the line**: the log lines and files from that moment are listed; mark the ones the reason is about.
   - **Details**: a short note.
4. **What this does** appears under the reasons before saving, so the owner knows what the reason will change.
5. **Saved in History** with the log and files from that moment, the marked lines, the note, and what happened next. The toast has **View**, which opens that entry.

| Action | Where | Reasons |
| --- | --- | --- |
| Stop | Task header, Problems, sidebar | Taking too long, Wrong approach, Not needed now, Doing it myself |
| Undo | Changes today, Undo since, Problems | Wrong result, Broke something, Not what I asked, Changed my mind |
| Decline | Approvals, task question | Too risky, Wrong files, Not needed, Do it differently |
| Remove from queue | Sidebar | Not needed, Already done, Wrong task |
| Retry | Problems | Same again, Fix the failing tests first, Smaller steps, Use another model |
| Flag a line | Task view, Changes and Terminal | Wrong value, Should not change, Wrong file, Explain this |

Approvals do not ask for a reason.

### What a reason does

Each reason has one fixed effect, so the result is predictable and can be undone:

- **Nothing else** (Not needed now, Changed my mind, Already done, ...): kept in History only.
- **Memory** (Wrong result, Not what I asked, Wrong files): the note is added to Memory and shown to the next task that edits those files. Editable and removable in Memory.
- **Rule** (Broke something): adds a rule "Run the tests before a change like this", visible in Rules and removable.
- **Rule suggestion** (Taking too long, Too risky): if the same reason happens again, Rules suggests a rule with the decisions that led to it. It is never added on its own.
- **Instruction** (Wrong approach, Do it differently, flags, retry reasons): the note goes to the task, or **Save and start again** / **Save and ask again** restarts with it.

## Flag a line while it runs

In the task view, click a line number in Changes, or a line in Terminal. The line is marked amber, and the reason card asks "What is wrong with it?". **Send to task** adds it to the thread as an instruction ("Line 31 in test_dates.py: Wrong value. Day comes first in India"); the task keeps going and handles it before the next step. Undo removes the flag.

## Approvals page

Three tabs.

**Waiting**: list on the left, the selected request on the right with the command, what it changes (files and sizes), how it can be undone, and **similar past decisions** ("You approved 2 cleanups in Downloads before. None were undone."). Approve `Y`, Later `N`, Decline `D`, `↑` `↓` to move.

**History**: every approve, decline, stop, undo, flag and retry, grouped by day.
- Filters: All, Approved, Declined, Stopped, Undone, No reason (with count), and search across titles, reasons and notes.
- **Reasons, last 7 days**: count per reason; click one to filter. This shows patterns, for example the same task stopped three times for "Taking too long".
- Open a row: reason and note, what happened next, the log at that time with marked lines, files. Click a log line to mark or unmark it. **Edit reason** adds or changes a reason later; entries without one open ready to fill in.

**Rules**: what Aetheris may do without asking.
- A **suggested rule** at the top when a reason repeats, with a link to the decisions behind it. Add rule or Not now.
- Each rule says where it came from ("Your answer Always allow, yesterday 11:15 am") with **View decision**.
- Values: No approval needed / Ask first / Never, or On / Off. Built-in rules (deleting, installing, Windows settings) stay on Ask first and cannot be changed.
- Full per-action settings move to Settings (next page).

## Also changed

- Changes today has a **History** link next to Undo since.
- `Ctrl K` has "History: every decision with its reason".

## Checked

- Scripted run through every path above (stop, undo, retry, decline, flag, history filter, mark, edit, rules): no script errors.
- Automated click-through of every visible control on Home (all states), task view and the three Approvals tabs, dark and light, 1440 / 1366 / 390 px. Only hover-only row buttons report "no change" (checked by hand).
- Fixed on the way: the rule value menu closed as soon as it opened; a CSS class clash made the reasons box collapse on phones.

## Page queue

1. **Settings** (Automatic / Ask first / Never per action, models, folders, overnight practice, quiet hours, how often to ask for reasons)
2. Quick add from anywhere (`Alt Space`), tray icon, Windows notifications with Approve / Later / Decline
3. **Progress** and **Reports** (including reasons over time)
4. **Memory** (shows notes that came from reasons, with a link back), Tasks, Skills, PC health, first-run setup

## Known gaps

- Effects are simulated: Memory is not a page yet, so "Added to Memory" only shows in History. The suggested rule is sample data; it does not yet update from new reasons.
- Flags work on the date-fix task only (the only task with a full live view).
- The reason card closes after 20 s; whether that is too short needs testing with the owner.
- No setting yet to ask for reasons less often (planned for Settings).
