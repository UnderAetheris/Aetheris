# Prototype v0.6

Clickable design prototype for the Aetheris desktop app. **Sample data only**: every number, file and result in it is made up for design review. It is a design target, not product code.

Replaces v0.5 (`../prototype-v0.5/`) as the proposed target once the owner accepts it. Rationale: [`../DESIGN_V0.6.md`](../DESIGN_V0.6.md).

## Try it

Open `aetheris-prototype-v0.6.html` in any browser. Everything (fonts, icons, data) is inside the file. Dark by default.

- **Type a task** on Home: the "Before it starts" panel opens. Change folder, permission and model from the chips.
- **Plan first**, then `Enter`: edit the plan (drag, rename, change what each step may do, skip, add), then Start. It appears under Now and Running.
- `Alt Enter` (or "Add to the queue" in the sidebar) puts a task in **Up next**. Drag to reorder.
- **Needs you**: `Y` / `N` to answer, `←` / `→` to move between cards. Undo in the toast.
- **Sidebar**: switch Watch / Ask first / Trusted, turn on learning while away, **Pause everything** (`Ctrl Shift P`).
- **Changed today**: Undo / Redo any line.
- Click the date-fix task to open the live view: `Space` pause, `Y` / `N` answer, `↑` / `↓` move between steps.
- `Ctrl K` command menu, `Ctrl N` new task.

URL options (for screenshots): `?view=home|task|tasks|needs|reports|learned|knows|skills|pc|settings`, `&theme=light|dark`, `&speed=3`, `&ff=N` (fast-forward to event N of 10), `&hold=ms` (freeze ms after reaching it), `&palette=1`, `&paused=1`.

## Files

| File | What |
| --- | --- |
| `tokens.css` | Colours, radii, spacing, motion. Will become `shell/src/styles/tokens.css`. |
| `app.css` | Components and layouts. |
| `app.js` | Views, controls, simulated run, command menu, toasts, keyboard. Vanilla JS. |
| `data.js` | Sample data. |
| `icons.js` | Lucide icons (ISC licence) as inline SVG. |
| `fonts/*.woff2.b64` | Geist and Geist Mono (SIL OFL 1.1), base64 so the repo stays text-only. |
| `build.py` | Inlines everything into `aetheris-prototype-v0.6.html`. `python build.py`, no dependencies. |
