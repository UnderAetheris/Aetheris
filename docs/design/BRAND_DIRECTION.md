# Brand direction v0.2: "The Instrument"

**Status:** proposed (D-016, supersedes the color/type parts of D-014). Owner decision: `handoff/OPEN_QUESTIONS.md` Q11.
**Author:** AI co-founder, session 3 (2026-10-05).

## 1. Why change v0.1

`DESIGN_SYSTEM.md` v0.1 specified a blue-black background, Inter, a purple `#7C5CFF` accent, and "feels like Linear/Raycast". Every one of those choices is individually good and together they are **the default look of 2024-2026 AI SaaS**. Thousands of generated landing pages and dashboards ship exactly that combination. The owner's bar is "unique, not another vibecoded app". A user should recognize an Aetheris screenshot with the logo cropped out.

## 2. The idea in one line

> Aetheris looks like a **precision instrument that keeps a lab notebook**: calm graphite and bone, hairline rules, monospaced evidence, and color used only when it means something.

The look comes from the product promise. Aetheris is the assistant that **proves** it got better and can undo anything. Instruments, receipts, calibration certificates, and flight recorders are the visual language of proof, and no AI chat app uses them.

## 3. Principles

1. **Color is a signal, never decoration.** The base UI is near-monochrome. The only hues on screen are semantic (passed, needs you, blocked, research). When something is colored, it matters.
2. **Evidence is visible.** Every claim of progress carries a receipt chip (`rcpt_3d53…`, `bench coding_tasks_v1 +4.2%`). Click it to see the measurement.
3. **Hairlines, not shadows.** Structure comes from 1px rules on a 4px grid, like engineering paper. Elevation only for floating layers.
4. **Precise motion.** Movement eases like an instrument needle: fast attack, soft settle, no bounce, no confetti.
5. **Typography carries the brand.** Distinct type is cheaper and more recognizable than illustrations.

## 4. Tokens (replace §1 color/type in DESIGN_SYSTEM.md once accepted)

### Color: dark ("Graphite"), default

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#0E0E0C` | Warm graphite, not blue-black |
| `--surface-1` | `#151513` | Sidebar, cards |
| `--surface-2` | `#1D1D1A` | Hover, inputs |
| `--rule` | `#2A2A26` | Hairlines and dividers |
| `--text-1` | `#ECE8DF` | "Bone" primary text |
| `--text-2` | `#A9A498` | Secondary |
| `--text-3` | `#6E6A60` | Meta, timestamps |
| `--ink` | `#ECE8DF` | Primary action = inverted bone button with graphite text |
| `--signal` | `#C8FF3D` | **Aetheris identity.** Phosphor-chartreuse, used sparingly: live cursor, "Aetheris is acting" pulse, focus ring, Level tick |
| `--pass` | `#4FD1A5` | Passed, safe, allowed |
| `--attend` | `#F2B24C` | Needs you, pending approval |
| `--block` | `#FF6B57` | Failed, blocked, threat |
| `--research` | `#7FB8FF` | Research, links, citations |

Light ("Paper"): bg `#F3EFE6`, surface `#FBF8F2`, rule `#DDD6C8`, text `#1A1916`, signal darkened to `#5E7F00` for contrast. Every text pair meets WCAG AA 4.5:1. Verify with a contrast test in CI when tokens land.

Why chartreuse: it reads as "live signal" (oscilloscope phosphor, CRT), it is not owned by any major AI brand (purple, black, orange, and teal are taken), and it is hard to fake by accident.

### Type (all free, OFL, self-hosted)

| Role | Font | Why |
| --- | --- | --- |
| UI | **Instrument Sans** | Neutral, slightly technical, rare in AI apps; the name matches the metaphor |
| Evidence, IDs, code, numbers | **JetBrains Mono** | Tabular, legible at 12px |
| Reports and long-form | **Newsreader** (serif) | Reports read like a typeset lab notebook, not a dashboard |

Scale and weights stay as in v0.1.

## 5. Signature elements (what makes it recognizable)

| Element | Description | Where |
| --- | --- | --- |
| **Trace rail** | A thin vertical rail beside every task: `plan · act · measure · record`, with a tick per step. Live steps pulse in `--signal`. Clicking a tick opens the evidence. | Task detail, activity feed |
| **Receipt chip** | Mono pill with a short ID and a one-word verdict. Every "done", "improved", or "undone" claim has one. | Everywhere progress is claimed |
| **Calibration card** | The "Level" is shown as a calibration certificate (benchmark, baseline, current, delta, date, signed by the eval gate), not an XP bar. | Home, Reports |
| **Sign to approve** | T2 approvals use a 600ms press-and-hold that fills a hairline ring (keyboard: hold `A`). Fast for experts, impossible to approve by accident. | Approvals inbox |
| **Hairline grid** | A faint 4px grid shows behind empty states and reports; disappears in dense views. | Empty states, reports |
| **Quiet pulse** | When Aetheris works unattended, a single 2px `--signal` line breathes in the sidebar. No spinners. | Global |

## 6. Motion tokens

| Token | Duration | Easing |
| --- | --- | --- |
| `--motion-tick` | 90ms | `cubic-bezier(.3,0,.1,1)` (needle attack) |
| `--motion-settle` | 220ms | `cubic-bezier(.16,1,.3,1)` |
| `--motion-page` | 300ms | same as settle |

The v0.1 rules stay: motion explains state change; `prefers-reduced-motion` swaps movement for opacity.

## 7. Website (marketing) direction

- Hero: a **live, real trace** of Aetheris fixing a failing test, rendered as an instrument readout, ending in a receipt chip and an "Undo" button. No 3D blobs, no gradient meshes, no floating chat bubbles.
- Section rhythm: claim, then the receipt that proves it, then the undo that makes it safe.
- Copy voice: short, factual, slightly dry. "It got 4.2% better at your repo this week. Here's the proof. Here's the undo."

## 8. What not to do

Purple-to-blue gradients, glassmorphism stacks, neon glow on everything, emoji-heavy UI, generic "sparkle" AI icons, chat-bubble-only layouts, lottie confetti, stock 3D illustrations.

## 9. Next steps once accepted

1. Update `DESIGN_SYSTEM.md` §1 with these tokens; keep components and motion rules.
2. `shell/src/styles/tokens.css` plus a token contrast test (F26 M1).
3. Build the Trace rail and Receipt chip first: they carry the brand and the product promise.
4. Redraw `docs/design/assets/app-shell-wireframe.svg` in the new language.
