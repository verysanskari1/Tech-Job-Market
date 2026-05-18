-- =============================================================
-- Cleanup: drop companies the scraper can't track
-- =============================================================
-- Run this in Supabase SQL editor to remove the companies that are
-- currently breaking the scraper or padding the company count with
-- zero-role placeholders.
--
-- After running, kick off the scraper actor in Apify. The summary at
-- the end should have only "real" companies (no more "Unknown ATS" or
-- 0-roles warnings except for true intermittents).
-- =============================================================

-- ── Companies with no queryable public ATS ──
-- These ran their own career portals; no public job-board API:
delete from companies where name in (
  'Apple',     -- jobs.apple.com — custom Workday-derived, walled
  'Google',    -- careers.google.com — custom
  'Meta',      -- metacareers.com — custom
  'Microsoft', -- careers.microsoft.com — custom
  'Shopify',   -- migrated off Greenhouse to a custom system; no public board
  'GitHub',    -- migrated to Microsoft's careers system after acquisition
  'Retool',    -- public Ashby board returns 404; their actual ATS unknown
  'Netflix',   -- public Lever board is empty / dead; uses jobs.netflix.com
  'Klarna'     -- SmartRecruiters handle 'Klarna1' returns 0; correct handle unknown
);

-- ── Rippling: leave in place ──
-- ashby/rippling timed out on the last run but should work — Ashby blocks
-- Apify IPs intermittently. If it keeps failing for 3+ days, drop it too:
-- delete from companies where name = 'Rippling';

-- ── Atlassian: leave in place ──
-- icims/careers-americas returns 0 — known iCIMS scraper issue, not a
-- handle problem. Fix the scraper, not the row.

-- After running this:
--   1. Re-run the scraper actor in Apify.
--   2. Refresh tech-job-market.vercel.app (or wait an hour for ISR).
--   3. Company count should drop from ~85 to ~80, but every remaining
--      one should have real data — no more zero-role placeholders.
