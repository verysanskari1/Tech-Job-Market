# The Doomberg Index — UI / Interaction Spec

A self-contained brief you can paste into Vercel v0, Lovable, Figma Make, or
any other AI design tool to regenerate this homepage. Written in plain
language; no React-isms.

---

## 1. Brand & feel

- **Name:** The Doomberg Index
- **Tagline:** "We're not doomed until it's 0."
- **What it is:** A live ticker for the number of open software-engineering
  roles across the world's most relevant tech companies. Modelled on how a
  stock-market index works, but for hiring.
- **Vibe:** A serious financial terminal that's slightly amused with itself.
  Quiet confidence. Newsreader italic everywhere a number wants to feel
  important; Satoshi sans for everything else.

## 2. Color palette

The whole site is dark by default.

| Token       | Hex      | Use                                                       |
|-------------|----------|-----------------------------------------------------------|
| `terminal`  | #141419  | Page background                                           |
| `surface`   | #1C1C24  | Card/panel background                                     |
| `surface-raised` | #23232D | Inner panels, hover states                            |
| `surface-border` | #2E2E3A | All hairline borders, table dividers                  |
| `canvas`    | #FFFFFF  | Primary text & big numbers                                |
| `aurora`    | #AEF96C  | **Primary accent** — chart fill, active toggles, CTAs    |
| `cursor`    | #05C770  | Hover state for CTAs, positive deltas (▲)                |
| `ember`     | #D26F6C  | Negative deltas (▼), destructive actions                  |
| `terrain`   | #003333  | Letter-avatar background (one of nine rotation colors)    |
| `universe`  | #3355FF  | Optional accent — alternative palette letter-avatar       |
| `comet`     | #AA99FF  | Optional accent — alternative palette letter-avatar       |
| `dune`      | #FABD83  | Optional accent — alternative palette letter-avatar       |
| `sunrise`   | #FCF283  | Optional accent — alternative palette letter-avatar       |

White text uses opacity ramps (`/90`, `/70`, `/50`, `/40`, `/30`) for the
visual hierarchy — never use a different shade of gray.

## 3. Typography

- **Sans (body, UI):** Satoshi — weights 300 / 400 / 500 / 700 / 900
- **Serif (display, emphasis):** Newsreader — italic; weights 400 / 500

Rules:

- Newsreader **italic** is reserved for: the brand name "Doomberg", every
  big numeric display (the hero count, the company count on the company
  page, the count on the role page, the count on each Top Roles card),
  in-prose emphasis ("until it's *0*", "every open role *at Atlassian*"),
  and the letter-avatar fallback glyph.
- Satoshi covers all UI chrome (nav, buttons, table cells, chips).
- Uppercase labels use Satoshi with `tracking: 0.18–0.22em` and
  `font-size: 11px`. Always white at 40% opacity.

## 4. Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  NAVBAR (sticky, 56px, terminal/80 + backdrop-blur)             │
├─────────────────────────────────────────────────────────────────┤
│  TICKER TAPE (auto-scrolling row of mover chips)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                       [centered hero]                           │
│                       The Doomberg Index                        │
│                                                                 │
│              TOTAL OPEN TECH ROLES ACROSS 80 COMPANIES          │
│                                                                 │
│                        24,318  ▲ 2.3% vs 30d ago                │
│                                                                 │
│                  We're not doomed until it's 0.                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   [ 90-day area chart, aurora gradient fill on terminal bg ]   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│        [All tech 80] [AI 50 …] [Early but Hot …] [Public Tech …]│
├─────────────────────────────────────────────────────────────────┤
│  ◐ company chip · ◐ company chip · ◐ company chip · …          │
│         (top 12 by role count; "Show all 80 companies →")       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Top roles hiring                                               │
│  Click any role to see every company hiring for it.             │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                       │
│  │AI Engineer│ │Backend …  │ │Frontend …│  ...                  │
│  │ 4,231     │ │ 3,108     │ │ 2,894    │                       │
│  └──────────┘  └──────────┘  └──────────┘                       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Top companies                                                  │
│  The 40 companies with the most open software roles right now.  │
│                                                                 │
│   #  Company              Open roles   Top category             │
│   1  ◐ Anduril            1,905        Hardware Engineer        │
│   2  ◐ Databricks           812        Backend Engineer         │
│   …                                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Container is `max-width: 1280px`, centered, `px: 24px`, vertical gap
between sections: `80px`. Hero internal gap: `40px`.

## 5. Navbar

- Sticky, full-width, 56px tall, `terminal/80` with `backdrop-blur`.
- Left: **"Doomberg"** in Satoshi 700 (bold), 18px, canvas color. Clicks to `/`.
- Then two in-page anchor links in Satoshi 500, 14px, white at 60% opacity:
  - "Roles" → scrolls to `#roles`
  - "Companies" → scrolls to `#companies`
  - Both go to `canvas` (100% white) on hover.
- Right side (md+): "Updated daily · Nov 11, 2026" in Satoshi 400, 12px,
  white at 30%.

## 6. Ticker tape

A horizontal scrolling row above the hero showing today's "movers". Each
chip is a small pill: company logo + name + a ▲ or ▼ delta with the count.
Animates from right to left forever, pauses on hover.

Background: `surface` with top + bottom 1px `surface-border`.
Height: 44px. Padding: chips have 12px horizontal padding.

## 7. Hero (the centerpiece)

Everything in the hero block is **center-aligned** and capped at 768px max
width. Sequence top-to-bottom:

1. **Brand title.**
   - `The Doomberg Index` (with "Doomberg" colored `aurora`).
   - Font: Newsreader **italic**, weight 400.
   - Size: 56px (desktop) / 48px (mobile).
   - Line-height: 1.05.

2. **Label** (the "what is this number" caption).
   - All caps, Satoshi 400, 12px, white at 40%, letter-spacing 0.22em.
   - Text:
     - When "All tech" is selected: `TOTAL OPEN TECH ROLES ACROSS 80 COMPANIES`
     - Otherwise: `AI 50 · 47 COMPANIES`
   - This is the live "what does the big number mean" tagline. The
     company count is _the_ piece of information that contextualizes the
     headline number.

3. **Big number + delta.**
   - The headline integer in Newsreader **italic** 144px (desktop) / 96px
     (mobile), canvas color, `tabular-nums`, leading 1, single line.
     Formatted with thousands separators.
   - To its right, on the same baseline: the 30-day delta in Satoshi 500,
     18px. Positive: ▲ + percentage + " vs 30d ago" (white at 40%) — the
     ▲% in `cursor` green. Negative: ▼ in `ember` red.

4. **Subheading.**
   - `We're not doomed until it's 0.`
   - Newsreader **italic** 20px, white at 70%.
   - This line is the soul of the brand. It's both the punchline and the
     answer to "what does it take for this thing to be bad".

## 8. The hero chart

Beneath the hero block, inside a 1px `surface-border` panel with `surface`
fill and 16px radius. Height: 340px. 24px padding.

- **Type:** Area chart (recharts).
- **Data:** Daily total open roles for the active index over the last 90 days.
- **Stroke:** `aurora`, 2.5px, smooth (monotone).
- **Fill:** Vertical gradient from `aurora` at 35% opacity at the top to
  `aurora` at 0% at the bottom.
- **Grid:** Horizontal lines only, `surface-border`, 3-3 dash.
- **X-axis:** Date ticks like "May 12", Satoshi 11px, white at 42%, no axis
  line. `minTickGap: 40`.
- **Y-axis:** Numbers formatted with thousands separators. 56px wide, no axis line.
- **Tooltip:** On hover, vertical rule appears and a small card shows
  `MAY 12` (label, 11px uppercase) on top, then `24,318  Open roles`.
  Card: `surface-raised` background, 1px `surface-border`, 8px radius.

## 9. Index toggles

A horizontal row of chip buttons immediately below the chart. Wrap if narrow.

Each chip:
- 32px tall, fully rounded (pill), 16px horizontal padding.
- Default: `surface` fill, 1px `surface-border`, white text at 70% (label) + 40% (count).
- **Active:** `aurora` fill, `terminal` text. Label at 100%, count at 60% terminal.
- Hover (inactive only): border becomes `white/30`, label `canvas`.
- Transition: `colors 150ms`.

Chips, in order:
- **All tech** — meta value is the **company count** (e.g. "80 companies"),
  NOT the role count. The role count is already the giant number above.
  This makes it obvious how many companies are being aggregated.
- **AI 50** — meta is the role count for that subset (e.g. "4,318").
- **Early but Hot** — same.
- **Public Tech** — same.
- **India-HQ** — same.

When a chip is clicked, three things happen simultaneously:
1. The label, big number and delta in the hero block re-render to the new index.
2. The chart re-renders with that index's data.
3. The constituent strip below re-renders with that index's companies (and resets to top 12).

## 10. Constituents strip

A horizontally wrapping grid of company chips showing the companies in the
active index, sorted descending by role count. Initially, only the top 12
chips are visible. Below them, a single text link reads
`Show all 80 companies →`. Clicking it expands the strip to show every
company; the link becomes `Show less`.

Each chip:
- Pill shape, `surface` fill, 1px `surface-border`, 12px horizontal padding,
  6px vertical, 8px internal gap.
- 16×16 company logo (rounded 4px square) — DuckDuckGo favicon proxy, with
  letter-avatar fallback.
- Company name in Satoshi 500, 14px, white at 80%.
- Role count in Satoshi 400, 12px, white at 40%, `tabular-nums`.
- Hover: border becomes `aurora/60`, name becomes `canvas`.
- Whole chip is a link to `/company/[slug]`.

Centered horizontally. Wraps onto multiple rows.

## 11. "Top roles" section

Anchor id `#roles`. Section spacing: top of section, two-line header:

- H2: `Top roles hiring` in Newsreader **italic**, 36px, canvas.
- Sub: `Click any role to see every company hiring for it.` in Satoshi 400,
  14px, white at 50%.

Below: a 3-column grid (1 col mobile, 2 col md, 3 col lg) of role cards.
Each card:
- `surface` background, 1px `surface-border`, 12px radius, 20px padding.
- Top row: role category name (Satoshi 500, 16px, canvas) on the left;
  the role count (Newsreader **italic**, 30px, canvas, `tabular-nums`) on the right, baseline-aligned.
- Sub-row: `across 47 companies` in Satoshi 400, 12px, white at 40%.
- A 4px-tall progress bar at the bottom showing this role's count relative
  to the biggest role in the set. Fill: `aurora`. Track: `surface-raised`.
- Hover: border becomes `aurora/60`. Role name becomes `aurora`. A
  popover appears below the card (see next).
- Whole card is a link to `/role/[slug]`.

**Hover popover** (12.5):
- Appears beneath the card on hover, 8px gap.
- Width: matches card width.
- `surface-raised` background, 1px `surface-border`, 12px radius, 16px padding.
- Label at top: `TOP COMPANIES HIRING` (10px uppercase, white at 40%, 0.18em tracking).
- Below: 5 rows. Each row is `logo · company name (truncate)`
  on the left, count on the right, followed by a 4px progress bar
  below scaled to the top company in the popover. Mini version of the
  same vocabulary used on the role card itself.
- Pointer-events: none (don't intercept clicks).

## 12. "Top companies" section

Anchor id `#companies`. Same header treatment as Top Roles:

- H2: `Top companies` in Newsreader italic 36px.
- Sub: `The 40 companies with the most open software roles right now.`

Below: a single table inside a `surface` panel (16px radius, 24px padding).
Columns:

| # | Company | Open roles | Top category |
|---|---------|-----------:|--------------|

- Column headers in Satoshi 500, 12px, white at 40%, bottom-bordered with `surface-border`.
- **Company column:** logo (24px) + name (Satoshi 500, 14px, canvas).
  - Hover: name color shifts to `aurora`, with an underline that fades
    in (decoration `aurora/60`, underline-offset 4px).
  - This is the only affordance — it should feel like an ordinary link. No
    explicit "click to drill in" caption anywhere.
  - On hovering the row, a popover (12.5-style, 288px wide) appears below
    the name showing the company's category breakdown as 6 stacked mini
    progress bars. Pointer-events: none.
- **Open roles column:** Satoshi 500, 14px, white at 80%, `tabular-nums`,
  right-aligned.
- **Top category column:** a small chip — `surface-raised` background, 1px
  `surface-border`, 4px radius, 8px horizontal padding, 2px vertical,
  Satoshi 400 12px. Itself a link to `/role/[slug]`. Hover: border becomes
  `white/40`, text becomes `canvas`.

Rows themselves have `hover: surface-raised/30` background.

## 13. Company drill-in (`/company/[slug]`)

A dedicated page. Header is two columns on desktop:

- Left: 72px square company logo (rounded 16px). To the right of it: company
  name in Newsreader **italic** 64px, then a row of small pill tags
  showing each index the company belongs to (e.g. "AI 50", "Public Tech").
- Right: `OPEN ROLES` label, then the role count in Newsreader italic 60px
  in `aurora` color.

Below the header, three sections (in order):

1. **Roles by category** — a panel of stacked progress bars (one row per
   category). Each row is a Link to `/role/[slug]`. Hover turns the
   category name `aurora`.

2. **Every open role** — a filterable role list. Filter bar at top:
   - Text input on the left for searching role titles. Pill rounded,
     `surface` background, `surface-border`, white text.
   - Right side: a row of category filter chips. First chip is
     `All (N)` and the rest are `Backend Engineer (12)` style. Active chip
     becomes `aurora` fill on `terminal` text.
   - Below: a vertical list inside one `surface` panel, each row is a role.
     Role row layout:
     - Title (Satoshi 500, 14–16px, canvas)
     - Meta line: small category chip (links to `/role/[slug]`) ·
       seniority · location · "Posted Mar 14, 2026"
     - Right side: a `Take a mock interview →` button that
       **only appears on hover** (`opacity-0 group-hover:opacity-100`),
       `aurora` fill, `terminal` text, fully rounded.

## 14. Role drill-in (`/role/[slug]`)

Like the company page but for a role category.

- Centered header: small uppercase label `OPEN ROLES · BACKEND ENGINEER`,
  big number in Newsreader italic, then a one-line italic prose summary:
  `Backend Engineer roles open right now across 38 companies.`
- A CTA strip immediately below: a `surface` panel, left side has
  `Practice for Backend Engineer interviews` + a small sub-line. Right
  side has a single `aurora` pill button: `Take a mock interview →`.
- Below: a list of companies hiring for this role, ordered by role count.
  Each row: number, logo (32px), company name, mini progress bar, count.
  Whole row is a link to `/company/[slug]`. Hover turns the name `aurora`.

## 15. Letter-avatar fallback

When DuckDuckGo's favicon fetch fails for a company, render a colored
square with the company's initials in **Newsreader italic**. The square
color is picked deterministically by hashing the company name into one of
nine `{ background, foreground }` palette pairs from the brand colors:

```
terrain × aurora
aurora  × terrain
universe × ice
comet × terminal
ember × canvas
dune × terminal
sunrise × terminal
glacier × terrain
sprout × terrain
```

Same company always lands on the same color. This keeps the visual rhythm
strong even when third-party logos fail.

## 16. Motion

- All transitions are `150ms` ease-out.
- Hover states never shift layout — they change color, opacity, border, or
  underline only.
- The hero chart animates in once on mount (recharts default). Index
  toggles do **not** animate the line; they swap instantly to feel snappy.
- No big page-level animations, no parallax, no auto-rotating carousels.
  This is a financial-terminal feel, not a marketing site.

## 17. Empty / loading states

- Hero number: shown immediately. If data hasn't loaded yet, render a
  skeleton card the height of the chart panel with a subtle pulse.
- Constituent strip: render 12 placeholder pill skeletons.
- Companies table: 10 placeholder rows.
- Top roles cards: render 6 placeholder cards.

## 18. Mobile

- Hero number scales down to 96px.
- Chart panel keeps its 340px height but the chart itself reduces left axis
  width to ~40px to give more room.
- Index toggle row is horizontally scrollable on overflow.
- Constituent strip wraps as usual.
- Top roles grid collapses to one column.
- Top companies table: hide the "Top category" column under 640px; keep
  rank, company, open roles.
