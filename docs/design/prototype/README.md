# Clickable prototype (v0.4)

A working mock of the Aetheris desktop app. Plain HTML, CSS and JS, no build step. **Sample data only.** It is a design target, not product code; the real UI in `shell/` should match it.

**Quickest way to try it:** download `aetheris-prototype.html` and open it in any browser. Fonts are inside the file.

## What you can do in it

- Watch a task run live: it thinks, makes a plan, reads files, runs tests (output streams on the right), writes the fix (the diff types in on the right), reruns tests, then asks before pushing.
- Pause / Resume / Stop, change demo speed (1×, 3×, 10×), Replay.
- Click any step to see exactly what it did. Undo / Redo any change.
- Answer the question: Push, Not now, or Always allow. Keyboard: `Y` / `N`.
- Every section: Home, Waiting for you, Reports (daily and weekly), What it learned (practice score, changes tried, skills), What it knows (edit / forget), PC health, Settings (what needs your OK, models, folders, appearance, your data), New task.
- `Ctrl K` search and commands, `Ctrl N` new task, `G` then `H/W/R/L/K/P/S` to jump between sections, `Space` to pause, `Ctrl Shift L` light/dark.

URL options (used for screenshots): `?page=home|wait|reports|learned|memory|pc|settings|new|task`, `&theme=dark`, `&speed=3`, `&demo=0` (don't start the run), `&at=think|tests|edit|ask` (jump to that moment and pause), `&palette=1`.

## Files

| File | What |
| --- | --- |
| `index.html` | Entry for development (needs `fonts/`, see below) |
| `base.css`, `app.css` | Styles. Colors and type follow `../BRAND_DIRECTION.md` |
| `data.js` | Sample data |
| `app.js` | Screens, the live run, keyboard and command menu |
| `aetheris-prototype.html` | Everything above in one file, fonts embedded. Rebuild after edits (see below) |

Fonts for `index.html`: same download commands as `../mockups/README.md`, into `docs/design/prototype/fonts/`.

Rebuild the single file: inline `base.css` + `app.css` (with fonts as base64 `data:` URLs), `data.js` and `app.js` into one HTML. The session-3 build script is described in `handoff/CONVERSATION_LOG.md` §3.4; any equivalent is fine.

Screenshots: `../assets/v0.4/*.svg`.
