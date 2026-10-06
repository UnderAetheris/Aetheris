# Prototype v0.5

> **Superseded by [`../prototype-v0.6/`](../prototype-v0.6/).** Kept for history.

Clickable design prototype for the Aetheris desktop app. **Sample data only**: every number, file and result in it is made up for design review. It is a design target, not product code.

Replaces v0.4 (`../prototype/`) as the proposed target once the owner accepts it. Design rationale and rules: [`../DESIGN_V0.5.md`](../DESIGN_V0.5.md).

## Try it

Open `aetheris-prototype-v0.5.html` in any browser. Everything (fonts, icons, data) is inside the file.

- **Home**: watch the date-fix task move on its card; answer the cards in "Needs you" (each one has Undo).
- **Click the running task** (or the sidebar item) to open the live view: it thinks, reads, checks a web page, writes a test, runs it, fixes the code, reruns tests, then asks before pushing. The right side follows along: Files, Browser, Changes (diff types in), Terminal (output streams).
- Click any step to pin the right side to it; switch **Follow** back on to follow live again.
- `Ctrl K` command menu, `Ctrl N` new task, `Space` pause, `Y` / `N` answer, `↑` / `↓` move between steps. Light/dark from the sidebar or `Ctrl K`.
- Only Home and the task view are designed. The other pages say what they will show; they are next in the queue.

URL options (for screenshots): `?view=home|task|tasks|needs|reports|learned|knows|skills|pc|settings`, `&theme=light|dark`, `&speed=3`, `&ff=N` (fast-forward to event N of 10), `&hold=ms` (freeze ms after reaching it), `&palette=1`.

## Files

| File | What |
| --- | --- |
| `tokens.css` | Colours, radii, spacing, motion. Will become `shell/src/styles/tokens.css`. |
| `app.css` | Components and layouts. |
| `app.js` | Views, simulated run, command menu, toasts, keyboard. Vanilla JS. |
| `data.js` | Sample data. |
| `icons.js` | Lucide icons (ISC licence) as inline SVG. |
| `fonts/*.woff2.b64` | Geist and Geist Mono (SIL OFL 1.1), base64 so the repo stays text-only. |
| `build.py` | Inlines everything into `aetheris-prototype-v0.5.html`. `python build.py`, no dependencies. |

Edit the sources, run `python build.py`, open the HTML.
