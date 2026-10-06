# Prototype v0.6

Superseded by v0.7 (`../prototype-v0.7/`), which builds on it. Kept for comparison. Rationale: [`../DESIGN_V0.6.md`](../DESIGN_V0.6.md).

Replaces v0.5 (`../prototype-v0.5/`) as the proposed target once the owner accepts it. Rationale: [`../DESIGN_V0.6.md`](../DESIGN_V0.6.md).

## Try it

Open `aetheris-prototype-v0.6.html` in any browser. Everything (fonts, icons, data) is inside the file. Dark by default.

- **Type a task** on Home: the panel under the box shows when it starts, the folder, permissions and model. Change them from the menus.
- **Plan** mode, then `Enter`: edit the plan (drag, rename, change each step's permission, skip, add), then **Run plan**. It appears under Running in the sidebar.
- `Alt Enter` (or **Add task** in the sidebar) adds to the **Queue**. Drag to reorder.
- **Approvals**: `Y` approve, `N` later, `←` / `→` move between cards. Undo in the toast.
- **Sidebar**: Read only / Ask first / Edit files, overnight practice, **Pause all** (`Ctrl Shift P`).
- **Changes today**: Undo / Redo any line.
- Click the date-fix task to open the live view: `Space` pause, `Y` / `N` answer, `↑` / `↓` move between steps.
- `Ctrl K` command menu, `Ctrl N` new task, `Esc` closes menus and the plan.

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
