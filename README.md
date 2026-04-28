# The Tech Job Market by HackerRank

A daily index that tracks tech hiring across 100 companies, modelled on how a stock market index works.

---

## Architecture overview

| Layer | What it does |
|---|---|
| **Supabase** | Postgres database — stores companies, raw job postings, classifications, daily snapshots, and index values |
| **Apify scraper** (Phase 2) | Node.js Actor — hits Greenhouse / Lever / Ashby APIs nightly and writes to `raw_roles` |
| **Classifier** (Phase 3) | Node.js script — calls Claude Haiku to classify each unclassified role into a category + seniority |
| **Snapshot calculator** (Phase 4) | Node.js script — aggregates counts and computes index values nightly |
| **Next.js site** (Phase 5) | Front-end — displays indexes, role tracker, company drill-ins |
| **Content automation** (Phase 6) | Vercel Cron — generates daily LinkedIn / X / Instagram drafts via Claude API |

---

## Phase 1 — Database schema

File: `phase1_schema.sql`

Run the entire file in the **Supabase SQL Editor** once to create all tables, indexes, and seed data.

### Tables

| Table | Purpose |
|---|---|
| `companies` | Master list of tracked companies with ATS metadata |
| `raw_roles` | Every job posting ever seen, with `removed_at` set when a role disappears |
| `classified_roles` | Claude Haiku classification output for each raw role |
| `snapshots_daily` | Per-company open-role counts aggregated nightly |
| `indexes` | Index definitions (Composite, AI 50, etc.) |
| `index_values_daily` | Calculated index value + daily change % per index per day |

---

## Phase 2 — Apify scraper

Directory: `scraper/`

A Node.js [Apify Actor](https://apify.com/actors) that runs nightly and populates `raw_roles`.

### How it works

1. Loads all companies from Supabase
2. For each company, fetches open roles from the appropriate ATS:
   - **Greenhouse** — `boards-api.greenhouse.io/v1/boards/{handle}/jobs`
   - **Lever** — `api.lever.co/v0/postings/{handle}?mode=json`
   - **Ashby** — `jobs.ashby.com/api/posting-api/job-posts?teamToken={handle}`
3. Upserts rows into `raw_roles` (conflict key: `company_id + ats_role_id`)
4. Sets `removed_at = now()` on any role that was open yesterday but is missing today
5. Logs a per-company summary of `found` and `removed` counts for manual spot-checking

If a company returns 0 roles the scraper **skips the upsert** for that company and logs a warning — this prevents incorrectly marking all existing roles as removed due to an API error.

### Environment variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (not the anon key) |

### Deploy to Apify

1. Push the `scraper/` directory to Apify via the CLI: `apify push`
2. In the Apify console, set the two environment variables above under **Actor → Settings → Environment variables**
3. Create a **Schedule** with cron `30 17 * * *` (17:30 UTC = 23:00 IST) pointing at this actor

### Local development

```bash
cd scraper
cp .env.example .env        # fill in your Supabase creds
npm install
npm run build
node dist/main.js           # runs against real Supabase
```

---

## Index math

```
index_value(t) = 1000 × (open_roles(constituents, t) / open_roles(constituents, base_date))
daily_change   = (value_today - value_yesterday) / value_yesterday × 100
```

Base date = launch day = 1000 points. Roles open more than 90 days count as 0.5 (soft decay).

---

## Indexes tracked

| Index | Constituents |
|---|---|
| Composite | All tracked companies |
| AI 50 | Top 50 AI-native companies |
| Early but Hot | High-growth startups |
| Public Tech | Publicly listed companies |
| India-HQ | Indian-founded companies |

## Role categories

`AI Engineer` · `ML/Research` · `Forward Deployed Engineer` · `GTM Engineer` · `Software Engineer` · `New Grad/Junior` · `Other`

Seniority axis: `Junior` · `Mid` · `Senior` · `Staff+`
