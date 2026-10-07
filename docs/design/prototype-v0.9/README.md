# Prototype v0.9

Clickable design prototype for the Aetheris desktop app. **Sample data only**: every number, file and result in it is made up for design review. It is a design target, not product code.

Builds on v0.8 (`../prototype-v0.8/`). Adds the Settings page: permissions per action and per folder, Check an action, models, folders, schedule, notifications, reasons, privacy, appearance, hard limits and shortcuts. Every change can be undone and is saved in History. Rationale: [`../DESIGN_V0.9.md`](../DESIGN_V0.9.md).

## Try it

Open `aetheris-prototype-v0.9.html` in any browser. Everything is inside the file. Dark by default.

- Click the gear at the bottom of the sidebar (or open `?view=settings`).
- Permissions: change **Install packages**, add a folder override with the folder button, click **Default** to reset. Type into **Check an action** or click an example.
- Press `/` and type "delete" or "quiet"; click a result.
- Models: drag a provider to change the order, **Add key** for OpenRouter.
- Notifications: **Show a test notification**.
- Approvals → History → **Settings** filter: every change you made.

Everything from v0.8 still works.

URL options: `?view=settings&sec=perm|models|folders|sched|notif|reasons|privacy|look|limits|keys`, plus all v0.8 options (`?state=…`, `?view=…`, `&sub=…`, `&theme=light|dark`, `&ff=N`).

## Files

| File | What |
| --- | --- |
| `tokens.css` | Colours, radii, spacing, motion. |
| `app.css` | Components and layouts (v0.9 additions at the end). |
| `app.js` | Views, controls, simulated run, states, reasons, Approvals, Settings, command menu. Vanilla JS. |
| `data.js` | Sample data. |
| `icons.js` | Lucide icons (ISC licence) as inline SVG. |
| `fonts/*.woff2.b64` | Geist and Geist Mono (SIL OFL 1.1), base64 so the repo stays text-only. |
| `build.py` | Inlines everything into `aetheris-prototype-v0.9.html`. `python build.py`, no dependencies. |
