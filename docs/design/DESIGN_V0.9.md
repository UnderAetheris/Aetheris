# Design v0.9

_Status: proposed, 2026-10-07. Prototype: [`prototype-v0.9/`](prototype-v0.9/). Builds on v0.8 ([`DESIGN_V0.8.md`](DESIGN_V0.8.md)); everything there still applies, including the wording rules in v0.6. This round: the **Settings** page._

## Why

The owner liked v0.8 and asked for Settings next, with ideas for it. Settings is where every "may it do this?" answer lives, so the main goals are: it must be clear which setting decides an action, every change must be undoable, and nothing in Settings may weaken the hard limits.

## Layout

Open with the gear next to the user name (bottom of the sidebar). Left: search and ten sections. Right: one section at a time, max 780 px wide. On a phone the sections become a strip that scrolls sideways.

| Section | What is in it |
| --- | --- |
| Permissions | Start from (Read only / Ask first / Edit files, same as the sidebar), one row per action (Automatic / Ask first / Never), per-folder overrides, Check an action |
| Models | Order of free providers (drag), requests used today, Test, Add key, Ollama set up, which model for what, limits |
| Folders | Folders it can use with a level each, Add a folder, Never open list (paths and patterns), skip build folders |
| Schedule | Overnight practice (hours, request budget, only when plugged in), routines (Run now, on/off, Add routine), quiet hours, battery, sleep |
| Notifications | Per event: Windows / In app / Off, sound, Show a test notification |
| Reasons | When to ask for a reason, when the card closes, after how many repeats a rule is suggested, ask before adding a Memory note |
| Privacy and data | Hide secrets before sending (always on) with a preview of what is replaced, usage sharing (off, no server), how long History is kept, Export, Delete History |
| Appearance | Theme, text size, reduce motion, spacing |
| Hard limits | What no setting, rule, approval or Aetheris itself can change |
| Shortcuts | Keyboard shortcuts |

## Ideas built into the prototype

1. **Every change can be undone.** Each change shows a toast with Undo and is saved in History as a Settings entry (History has a Settings filter). This also covers changes made by drag (model order) and removals (folders, Never open).
2. **"N settings changed from the default · Show".** Lists only changed settings. Each changed row has **Default** to reset it. Changed sections get an amber dot in the left list.
3. **Search settings** (`/`). Matches labels, descriptions and sections; a result opens the section and highlights the row.
4. **Check an action.** Type what a task might do ("npm install in website", "delete D:\Finance\tax-2025.pdf", "rm -rf C:\Windows"). It shows Automatic / Ask first / Never and the exact setting that decides it, with **Open**. Order: Never open list, then path outside the added folders, then per-folder override, then the per-action setting. Anything it cannot match asks first.
5. **Per-folder overrides.** Any action can differ for one folder ("Push a branch: Automatic in invoice-tool"). Shown as chips under the row; click to remove.
6. **Where a setting came from.** Rows changed by an approval have **Why**, which opens the decision in History.
7. **Models in order.** Drag to change which free provider is tried first; usage bar per provider turns amber above 80 %. Keys are entered in a password field and stored in Windows Credential Manager, never in a file. Only free tiers can be added.
8. **Test notification.** Shows what a Windows notification looks like (Approve / Later / Open), and says when quiet hours will hold it back.
9. **Redaction preview.** Privacy shows a sample request with the user folder, an API key and an email address replaced before it is sent.
10. **Locked rows.** Hard limits (permanent delete, forms, Windows settings, money) show a lock and cannot be changed. "Hide secrets" cannot be turned off.

## Proposed for later (not in the prototype)

- Import settings from an export file, and a "reset everything" with a preview of what changes.
- Per-model privacy: choose which providers may see file contents at all.
- Schedule preview: a week view of when routines, overnight practice and quiet hours fall.
- Notification digest: group several approvals into one notification.
- Warnings when two settings conflict (for example, overnight practice inside quiet hours with notifications set to Windows).

## Rules

- Settings never loosen a hard limit. Rules learned from Approvals can only move a row between Automatic, Ask first and Never where the row allows it.
- The sidebar Permissions control and Settings → Start from are the same setting.
- No setting needs a restart.

## Checked

- Scripted run through every section: change and undo, permission change, per-folder override, reset to default, preset, all Check an action examples plus typed ones, search and jump, drag order, key dialog (short key rejected), test notification, routines, Delete History dialog (Esc closes), theme, text size, reduce motion, changed list, History Settings filter. 47 checks pass, no script errors.
- Layout check of every section at 1440, 1366, 1100 and 390 px, dark and light. Only the sideways section strip on phones is reported (intended).
- Fixed on the way: option menus in Settings closed as soon as they opened; "Change Windows settings" was matched as "Edit files"; a path outside the added folders was answered with Ask first instead of Never.

## Known gaps

- Sample data. Settings are not saved after reload.
- Add a folder adds one sample folder; the real app opens the Windows folder picker.
- Check an action uses simple word matching; the real app must use the same code path as the permission check.
- Text size uses page zoom.

## Page queue

1. Quick add from anywhere (`Alt Space`), tray icon, Windows notifications with Approve / Later / Decline
2. **Progress** and **Reports** (including reasons over time)
3. **Memory** (notes that came from reasons, with a link back), Tasks, Skills, PC health, first-run setup
