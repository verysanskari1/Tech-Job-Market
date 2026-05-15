# The Doomberg Terminal — Designer Brief

A self-contained brief for a designer. Pair with `DESIGN.md` (this folder)
for component-level interaction specs.

---

## What it is

**The Doomberg Terminal** is a financial-style dashboard for tech hiring. It
tracks open software-engineering roles across ~100 of the world's most
relevant tech companies — startups, scale-ups, and public giants — and
presents them as a single live index. The name is a play on Bloomberg, with
a wink at the prevailing "tech is doomed" narrative. The tagline:
*"We're not doomed until it's 0."*

## What it tracks

- **Open tech roles**, scraped daily from each company's ATS (Greenhouse,
  Lever, Ashby, SmartRecruiters, Workday, iCIMS). One row per role.
- Roles are **classified into 13 categories**: Backend / Frontend / AI / ML /
  Infra / Security / Data / Mobile / Hardware / Forward-Deployed / GTM /
  QA-Test / New-Grad. Plus a catch-all "Other".
- **Sub-indexes**: AI-first companies (51), Hot startups (32), Public Tech
  (42), India-HQ (6). Same dataset, different filters.
- **Day-over-day and week-over-week deltas** on every count.
- **P(doom)**: a synthetic "how doomed are we" value, clamp(0, 1, 0.5 −
  Δ30d / 30). Always moves with the data.
- **News** about tracked companies — layoffs, funding rounds, product
  launches, key hires. (Currently mock data; real Layoffs.fyi + TechCrunch
  RSS pipeline is the next phase.)

## V1 scope (live now)

The live product at `tech-job-market.vercel.app` has:

1. **Hero**: centered brand, total open tech roles across X tracked
   companies, 30-day delta, P(doom) visualised as a 0–1 bar with a colored
   marker (green / yellow / red).
2. **Index toggle** (5 chips): All tech, AI-first, Hot startups, Public,
   India. Swapping the chip retunes the hero number, delta label,
   description sentence, and main chart.
3. **Main time-series chart** with 7D / 1M / YTD range toggle.
4. **Constituents strip**: every company in the active index as a small
   chip with logo + name + role count, click-through to its page.
5. **Most in demand tech roles** section: a grid of 12 role cards, each
   with a 7-day sparkline and Δ. Hover → preview of top 5 companies
   hiring for that role. Inline search filters in place.
6. **Top companies hiring** section: a paginated table of all tracked
   companies, with logo, open tech roles count, 7-day delta, 7-day
   sparkline, and top-category chip. Inline search filters in place.
7. **Role page** (`/role/[slug]`): hiring trend chart + ranked list of
   companies hiring for that role.
8. **Company page** (`/company/[slug]`): logo + name + indexes prose
   ("Featured in All tech · AI-first"), one-line description, stats row
   (funding stage / employees / HQ / tracked-since), 365-day hiring trend
   with toggle, role breakdown with share-of-total %, careers-page CTA.
9. **Ticker tape** (top of every page): horizontal scrolling row of daily
   movers with ▲/▼ deltas. Pauses on hover, shows full details in a
   tooltip.
10. **News popup** (bottom-right of every page): collapsed = single
    rotating headline with company / open-tech-roles / 7-day delta line +
    a progress bar showing time until the next headline. Click → slide-out
    drawer with the full feed. Categories: Layoff / Funding / Product / Other.
11. **News tab** (`/news`): full chronological feed with category filters.

## Brand & visual system

- **Name**: The Doomberg Terminal (full); "Doomberg" alone as the short
  brand mark.
- **Logo / wordmark**: typeset only — "The **Doomberg** Terminal" with
  Doomberg in `#AEF96C` aurora green. We don't have a separate mark/icon.
- **Vibe**: financial terminal that's slightly amused with itself. Quiet
  confidence. Serious about the data, dry about the framing.
- **Color palette** (always dark):
  - Page bg `#141419` · Card bg `#1C1C24` · Card inner `#23232D`
  - Hairlines `#2E2E3A`
  - Text: white in opacity steps — 100 / 90 / 70 / 50 / 40 / 30 / 20
  - **Aurora `#AEF96C`** — primary accent. Chart fill, active toggles, CTAs.
  - Cursor `#05C770` — positive deltas (▲), CTA hover.
  - Ember `#D26F6C` — negative deltas (▼).
  - Sunrise `#FCF283` — middle warning state on P(doom).
  - Other palette colors (Terrain / Universe / Comet / Dune / Glacier /
    Sprout) — used for letter-avatar fallbacks when a company logo isn't
    available.
- **Typography**:
  - Body / UI: **Satoshi** (Fontshare) — 300 / 400 / 500 / 700 / 900.
  - Display / emphasis: **Newsreader italic** (Google Fonts) — 400 / 500.
  - Reserved for italic display: brand name "Doomberg", every big numeric
    display, in-prose emphasis, letter-avatar fallback glyph. Everything
    else is Satoshi.
  - Uppercase labels: Satoshi 11px, white at 40%, letter-spacing
    0.18–0.22em.

## What we need from you

### Web screens (desktop, 1440px)

1. **Homepage** — hero + chart + toggles + constituents + Top Roles + Top
   Companies + News popup (collapsed) + Ticker.
2. **Homepage with news drawer open** — slide-in from the right, backdrop
   over the page.
3. **Company page** (use Anthropic or Stripe as a worked example).
4. **Role page** (use Backend Engineer or AI Engineer).
5. **News page** (full feed with filter chips active).
6. **Empty / loading state** for a fresh user — what if data hasn't
   loaded yet, or news is empty.

### Mobile screens (375px — iPhone 13/14)

1. **Homepage** — hero, chart, toggles. Pay attention to how the giant
   headline number scales.
2. **News popup** — both collapsed (above the bottom edge) and expanded
   (full-width drawer covers the page).
3. **Company page** — header stack, stats grid behavior, chart at narrow
   width.
4. **Ticker behavior** on a narrow viewport.
5. **Inline search inputs** below each section heading.

### Things to design opinions on

- Is the **right-bottom news chip** placement intrusive on mobile? Should it
  collapse further into a circular FAB?
- The **P(doom) bar** is a 0–1 visualization next to the hero number — is
  this readable, or should it become a separate panel?
- We have no logo / wordmark mark. **Do we need one?** A small icon for
  the favicon, browser tab, and OG image. Should it riff on a stock ticker
  arrow, a candlestick, or something else?
- **OG image / Twitter card** — what does it look like when someone shares
  the homepage on social?
- The Newsreader italic + Satoshi pairing is intentional and feels right
  to us. **Confirm or push back.**

## Mobile status, honestly

The current web build is "responsive" in the sense that breakpoints exist
and nothing visibly overflows, but it has not been designed for mobile —
hero number, ticker speed, news popup, and inline search were laid out
desktop-first. We're explicitly asking you to do the mobile pass; consider
the current mobile rendering a placeholder, not a target.

## Objective for the design pass

V1 is already shipped. The goal of this design pass is:

1. **Make it shareable.** Someone landing on the homepage should
   immediately understand what it is, want to spend 30+ seconds
   exploring, and consider posting it. Right now it's clean but a bit
   anonymous.
2. **Fix mobile** to first-class quality — about half of social-driven
   visits are mobile.
3. **Establish a brand mark** if you think we need one. Favicon, OG
   image, social-share card.
4. **Refine information density** — some sections feel sparse, some feel
   busy. Help us find the balance.

Out of scope for this pass: rewriting the data model, building new
sections, swapping the framework. We want the existing experience polished
and brand-elevated, not redesigned.

## Constraints

- Stack: Next.js + Tailwind. Implementation will translate your designs
  back into the existing component system.
- Brand colors and fonts are committed — work with what's there.
- Dark mode only; we're not building a light theme.
- Performance budget is tight — avoid heavy animations or large hero
  images that would inflate page weight.

## Reference

- Live: `tech-job-market.vercel.app`
- Repo: `verysanskari1/tech-job-market`
- Detailed interaction spec: `site/DESIGN.md` (same folder as this brief)

## Timeline

V1 is shipped. We can incorporate design changes in rolling iterations —
no hard deadline, but ideally first round of designs in ~2 weeks so we
can validate before the news pipeline + descriptions DB lands.
