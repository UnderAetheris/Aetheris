# Prototype v0.8

Clickable design prototype for the Aetheris desktop app. **Sample data only**: every number, file and result in it is made up for design review. It is a design target, not product code.

Builds on v0.7 (`../prototype-v0.7/`). Adds the Approvals page (Waiting, History, Rules), a reason for every stop, undo, decline, retry and removal, pointing at the log line or file a reason is about, and flagging a line while a task runs. Rationale: [`../DESIGN_V0.8.md`](../DESIGN_V0.8.md).

## Try it

Open `aetheris-prototype-v0.8.html` in any browser. Everything is inside the file. Dark by default.

- `?state=problems`: **Stop** the stuck task. In the card, pick "Taking too long", **Point at the line**, mark the npm line, type a note, `Enter`. Click **View** in the toast.
- **Undo** a line in Changes today and pick "Broke something": a rule is added (see Approvals → Rules).
- **Retry** the failed task: "Anything to change this time?"
- `?view=needs`: Approvals. Waiting (`↑` `↓`, `Y` approve, `N` later, `D` decline), History (filters, search, reasons summary, open a row, click a log line to mark it, Edit reason), Rules (add the suggested rule, change a rule's value).
- `?view=task&ff=6`: click a line number in Changes (or a Terminal line) to flag it, pick a reason, **Send to task**: it appears in the thread.

Everything from v0.7 still works (`?state=first|away|offline`, Undo since, activity bars, Plan mode, queue, Pause all, `Ctrl K`).

URL options: `?state=…`, `?view=home|task|needs|…`, `&sub=waiting|history|rules`, `&open=<history id>`, `&theme=light|dark`, `&ff=N`.

## Files

| File | What |
| --- | --- |
| `tokens.css` | Colours, radii, spacing, motion. |
| `app.css` | Components and layouts (v0.8 additions at the end). |
| `app.js` | Views, controls, simulated run, states, reasons, Approvals page, command menu. Vanilla JS. |
| `data.js` | Sample data, including decision history, rules and the suggested rule. |
| `icons.js` | Lucide icons (ISC licence) as inline SVG. |
| `fonts/*.woff2.b64` | Geist and Geist Mono (SIL OFL 1.1), base64 so the repo stays text-only. |
| `build.py` | Inlines everything into `aetheris-prototype-v0.8.html`. `python build.py`, no dependencies. |
