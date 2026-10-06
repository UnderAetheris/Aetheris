# Prototype v0.7

Clickable design prototype for the Aetheris desktop app. **Sample data only**: every number, file and result in it is made up for design review. It is a design target, not product code.

Builds on v0.6.1 (`../prototype-v0.6/`). Adds failure states, the first day, while you were away, offline, the quota warning, undo since a time and activity details. Rationale: [`../DESIGN_V0.7.md`](../DESIGN_V0.7.md).

## Try it

Open `aetheris-prototype-v0.7.html` in any browser. Everything (fonts, icons, data) is inside the file. Dark by default.

Pick a state with `?state=` or `Ctrl K` → "Prototype: show a state":

- `?state=problems`: a failed and a stuck task. Try **Details**, **Retry**, **Undo its changes**, **Keep waiting**, **Stop**. The quota meter shows in the sidebar.
- `?state=away`: the While you were away card. Each cell opens the right place; × hides it.
- `?state=first`: first day. Click an example under the task box and press `Enter`; the Getting started checklist ticks. Undo a change to finish it.
- `?state=offline`: offline bar with **Retry** and **Use local model**.
- `?state=normal`: v0.6.1 Home.

Also new in every state:

- **Undo since…** in Changes today: pick a time, check the list, `Enter`.
- Hover the activity bars in the sidebar to see what happened; click a bar to list the actions.

Everything from v0.6 still works: Plan mode, the queue, Approvals with `Y` / `N`, Pause all (`Ctrl Shift P`), the live task view, `Ctrl K`.

URL options: `?state=…`, `?view=home|task|tasks|needs|reports|learned|knows|skills|pc|settings`, `&theme=light|dark`, `&ff=N`, `&palette=1`, `&paused=1`.

## Files

| File | What |
| --- | --- |
| `tokens.css` | Colours, radii, spacing, motion. |
| `app.css` | Components and layouts (v0.7 additions at the end, under `v0.7: states`). |
| `app.js` | Views, controls, simulated run, states, command menu, toasts, keyboard. Vanilla JS. |
| `data.js` | Sample data, including problems and the away summary. |
| `icons.js` | Lucide icons (ISC licence) as inline SVG. |
| `fonts/*.woff2.b64` | Geist and Geist Mono (SIL OFL 1.1), base64 so the repo stays text-only. |
| `build.py` | Inlines everything into `aetheris-prototype-v0.7.html`. `python build.py`, no dependencies. |
