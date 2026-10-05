# Monetization (proposal)

**Status:** proposed (D-019). Owner decision: `handoff/OPEN_QUESTIONS.md` Q9. Nothing here is built. Build no payment code before v1 has real users.

## 1. Constraints

- The owner has $0 budget and is an individual developer in India.
- The core promise is local-first and private. Charging for basic privacy or safety would betray it.
- Model costs belong to whoever pays the provider. Aetheris must never resell tokens at a loss.

## 2. Recommended model: generous free core + Pro for convenience and scale

| Tier | Price (indicative) | Who | Includes |
| --- | --- | --- | --- |
| **Free (forever)** | $0 | Everyone | Full local assistant, safety layer, approvals, memory, skills, reports, Guardian read-only, BYOK free-tier router (Gemini/Groq/OpenRouter), all receipts and undo |
| **Pro** | ~$8/mo or ~$72/yr; India price ~₹299/mo | Daily users | Encrypted cross-device sync, mobile companion (approve from phone), AFK learning scheduler with larger budgets, premium skill packs, weekly growth report PDF, priority updates |
| **Pro + Credits** | Pro + prepaid credits | Users without their own keys | Managed model access at cost + margin, hard spend caps, per-task cost shown before running |
| **Teams** (later, v2+) | per seat | Small dev teams | Shared skills and memory spaces, admin approvals, audit export |

Principles: never paywall safety, undo, receipts, or data export. Pay for convenience, scale, and sync, not for trust.

## 3. Payments stack (when the time comes)

- **Merchant of record**, not a raw processor: Lemon Squeezy or Paddle. They handle global VAT/GST, invoices, and chargebacks. That matters for a solo developer in India; Stripe India has invite and export-compliance friction.
- **Razorpay** as an India-only option if domestic UPI checkout proves important.
- Licensing: signed license key checked offline (Ed25519 signature, no phone-home required), grace period, never bricks local features.
- No payment SDK inside the core process; the license check is a tiny verified module behind the existing config boundary.

## 4. What makes it worth paying for

Measured, visible value: "This month Aetheris saved you an estimated 6h 40m: 41 tasks, 3 proven improvements, 0 regressions." That number must come from the real task log, never invented (AGENTS.md invariant 7).

## 5. Sequence

1. v1 free, 20-50 pilot users, instrument time saved (opt-in, local).
2. Pro waitlist on the website; measure conversion intent.
3. Ship sync + mobile approvals as the first paid features.
4. Credits only after spend caps and cost-preview UX are proven safe.
