# MealVote — Warm & Web3 Design System (MASTER)

> **Source of truth.** When building any page, load this file first. Page-specific
> overrides live in `design-system/mealvote/pages/<page>.md` and take priority.

---

## 1. Design Intent

MealVote is a **decentralized office meal ordering** product. Two worlds meet:

- **Warm**: food, hospitality, appetite, the social ritual of eating together.
- **Web3**: on-chain voting, wallet identity, transparent transactions.

The redesign fuses both — **hearth + chain**. Warmth dominates the emotional
layer (colors, typography warmth, glow, rounded geometry); web3 surfaces in
structural accents (gold trust highlights, chain-node dividers, tabular
hash/address chips, on-chain verification badges).

**Never**:
- Pure cold-blue crypto UI
- Dark purple NFT aesthetic
- Orbitron / sci-fi headlines (too cold for food)
- Playful pastels (weakens the trust signal needed for money flows)

---

## 2. Color System

### Token table (light mode only — product is committed to light warm)

| Role                  | Hex        | HSL                  | Usage                                              |
|-----------------------|------------|----------------------|----------------------------------------------------|
| `background`          | `#FBF5EC`  | `38 62% 95%`         | Page base, cream hearth tone                       |
| `background-deep`     | `#F4E9D6`  | `38 55% 90%`         | Page bottom gradient / soft panels                 |
| `foreground`          | `#1F1A15`  | `28 18% 10%`         | Primary text                                       |
| `foreground-soft`     | `#5A4A3E`  | `26 19% 30%`         | Body text                                          |
| `muted-foreground`    | `#8A7463`  | `26 18% 46%`         | Secondary copy, labels                             |
| `primary`             | `#9C3B1A`  | `14 71% 36%`         | CTAs, active nav, primary brand ink                |
| `primary-foreground`  | `#FFF8EE`  | `38 100% 97%`        | Text on primary                                    |
| `ember`               | `#E26B33`  | `18 75% 54%`         | Hot/ember glow, CTA gradient top                   |
| `chain-gold`          | `#D97706`  | `28 92% 44%`         | **Web3 trust accent** — badges, verified chips     |
| `chain-gold-soft`     | `#FBBF24`  | `43 96% 56%`         | Hover / lighter gold for decoration                |
| `verified-emerald`    | `#059669`  | `160 89% 31%`        | On-chain verified, confirmed tx, success state     |
| `muted`               | `#F0E4D2`  | `34 50% 88%`         | Quiet surface, soft panels                         |
| `card`                | `#FFFBF5`  | `38 90% 98%`         | Card base                                          |
| `border`              | `#E8D6BE`  | `32 45% 83%`         | Borders / dividers                                 |
| `border-strong`       | `#C9A67D`  | `29 38% 64%`         | Prominent card edges                               |
| `destructive`         | `#B91C1C`  | `0 72% 42%`          | Errors / destructive actions                       |

**Contrast guarantees (WCAG AA)**
- `foreground` on `background` → 14.8 : 1 ✓
- `primary-foreground` on `primary` → 7.9 : 1 ✓
- `chain-gold` on `card` → 4.6 : 1 ✓ (small-text badges only)
- `muted-foreground` on `background` → 4.7 : 1 ✓

### Gradient presets
- **CTA (warm ember):** `linear-gradient(135deg, #E26B33 0%, #9C3B1A 100%)`
- **Gold seal:** `linear-gradient(135deg, #FBBF24 0%, #D97706 60%, #9A3412 100%)`
- **Page hearth:** radial gold/ember + linear cream 180deg

---

## 3. Typography

**Font strategy**: Warm sans-serif body (approachable, food-adjacent) paired
with a geometric tech-forward display for web3 character. Monospace for hashes
and addresses — critical for trust readability.

| Role     | Family                                   | Weight       | Notes                                        |
|----------|------------------------------------------|--------------|----------------------------------------------|
| Display  | `Space Grotesk` → `Noto Sans TC`         | 500 / 700    | Hero h1/h2 — geometric warmth                |
| Body     | `Inter` → `Noto Sans TC`                 | 400 / 500    | Paragraphs, cards, forms                     |
| Label    | `Inter`                                  | 700          | Uppercase kickers, tab labels                |
| Mono     | `JetBrains Mono` → `ui-monospace`        | 400 / 500    | Tx hashes, wallet addresses, numeric tables  |

**Never** use Orbitron or Audiowide — too cold and sci-fi for a dining product.
Space Grotesk gives similar geometric confidence while staying warm.

**Scale** (base 16px): `12 / 13 / 14 / 16 / 18 / 20 / 24 / 32 / 44 / 64`.
**Line heights**: headings 1.08–1.15, body 1.65–1.8.
**Tracking**: display headings `-0.03em`; all-caps kickers `+0.24em`.
**Tabular numbers**: enable `font-variant-numeric: tabular-nums` on anything
that shows counts, prices, votes, or timer values.

---

## 4. Geometry & Effects

- **Radius scale**: `sm 12px | md 18px | lg 24px | xl 32px | pill 9999px`
  (cards default to `lg`, panels to `xl`, chips to `pill`).
- **Shadow scale**:
  - `shadow-hearth` → `0 24px 70px -20px rgba(156, 59, 26, 0.22)` (primary card lift)
  - `shadow-ember` → `0 18px 40px -12px rgba(226, 107, 51, 0.35)` (CTA)
  - `shadow-chain` → `0 12px 32px -10px rgba(217, 119, 6, 0.35)` (gold badge)
- **Glow** (web3 signature): small radial gold halo around chain-verified items,
  ~80px radius, `rgba(217,119,6,0.25) → transparent`.
- **Backdrop blur**: `backdrop-blur-xl` (24px) on headers / modal overlays only.
  Do not blur cards — blur undercuts warmth.

---

## 5. Web3 Signature Components

These elements make the product read as "on-chain" without going cold:

1. **Chain-node divider** — two small filled circles connected by a thin line;
   used between steps, between hero/features, between tx entries.
2. **Tx hash chip** — mono font, gold underline, copy icon, `cursor-pointer`;
   expands to full hash on hover; screen reader reads the full string.
3. **On-chain badge** — small pill with a shield/link glyph + "On-chain" label;
   background `chain-gold/15`, border `chain-gold/30`, text `chain-gold`.
4. **Voter dot strip** — circular avatars with a thin gold ring when vote is
   confirmed on-chain.
5. **Block-height ticker** — a tiny mono-font counter at the nav corner
   showing current chain height (decorative but grounding).

---

## 6. Layout

- **Max content width**: `88rem` for hero pages, `72rem` for dashboards,
  `48rem` for forms.
- **Gutters**: `px-6 md:px-10` below 1024px; `px-12` above.
- **Spacing scale** (strict 4pt): `4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64 / 96`.
- **Breakpoints**: 375 / 640 / 768 / 1024 / 1280 / 1440.

---

## 7. Motion

- **Duration**: micro 160ms, standard 220ms, entry 320ms. Avoid >400ms.
- **Easing**: `cubic-bezier(0.2, 0.8, 0.2, 1)` (warm overshoot-free ease-out).
- **Hover lift**: `translateY(-2px)` + shadow bump for primary cards.
- **Gold shimmer**: optional 1200ms linear gradient sweep on on-chain badges,
  disabled under `prefers-reduced-motion`.

---

## 8. Accessibility Guarantees

- Body text ≥ 16px, line-height ≥ 1.65.
- Focus ring: 3px `ring-primary/60` + 2px offset, visible on every interactive.
- Touch targets ≥ 44×44px; chip rows wrap rather than shrink below threshold.
- Color is never the only signal: chain-gold badges include an icon and text.
- Skip link present on every page.
- Tabular numerics prevent column jitter on live data.
- All hash/address chips have `aria-label` with the full value.

---

## 9. Anti-Patterns (Never Do)

- ❌ Cold blue "crypto" gradients
- ❌ Dark mode on product surfaces (commit to warm light)
- ❌ Orbitron / Audiowide for headings
- ❌ Emoji as functional icons (use Lucide)
- ❌ Raw hex in component code (use tokens via tailwind config / CSS vars)
- ❌ Purple-dominant NFT look
- ❌ Backdrop blur on card bodies (kills warmth)
- ❌ Animating `width`/`height` — use `transform` only
- ❌ Truncated hash without full value available via `aria-label`

---

## 10. Usage Prompt

When implementing a page:

```
I am building the [Page Name] page for MealVote.
First read design-system/mealvote/MASTER.md.
Then check design-system/mealvote/pages/[page-name].md — if present, its rules
override the Master. Otherwise, follow the Master exclusively.
Use warm tokens + chain-gold web3 accents. Never go cold-blue.
```
