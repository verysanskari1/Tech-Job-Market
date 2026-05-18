-- =============================================================
-- Bulk-add ~50 well-known tech companies
-- =============================================================
-- High-confidence additions: I'm fairly sure about the ATS for each,
-- based on training knowledge as of 2025. Run this in Supabase SQL
-- editor, then trigger the scraper actor. Anything that fails will
-- show up in the scraper log as `HTTP 404` or `0 roles returned`.
-- Iterate on those individually.
--
-- A useful follow-up: run the scraper-qa health check to see which
-- new rows are returning data vs failing.
-- =============================================================

-- Use ON CONFLICT (name) DO NOTHING so re-running is safe.
-- If you don't have a unique constraint on name, run this first:
--   alter table companies add constraint companies_name_unique unique (name);

insert into companies (name, ats, ats_handle, careers_url, indexes) values
  -- ── Custom (we built scrapers for these) ──
  ('Microsoft',     'custom',     'microsoft',          'https://careers.microsoft.com/',                            ARRAY['Public Tech']),
  ('Apple',         'custom',     'apple',              'https://jobs.apple.com/',                                   ARRAY['Public Tech']),

  -- ── Dev tools / infra (Ashby) ──
  ('Resend',        'ashby',      'resend',             'https://resend.com/careers',                                ARRAY['Early but Hot']),
  ('Convex',        'ashby',      'convex',             'https://www.convex.dev/careers',                            ARRAY['Early but Hot']),
  ('Inngest',       'ashby',      'inngest',            'https://www.inngest.com/careers',                           ARRAY['Early but Hot']),
  ('Neon',          'ashby',      'neon',               'https://neon.tech/careers',                                 ARRAY['Early but Hot']),
  ('Render',        'ashby',      'render',             'https://render.com/careers',                                ARRAY['Early but Hot']),
  ('Tailscale',     'ashby',      'tailscale',          'https://tailscale.com/careers',                             ARRAY['Early but Hot']),
  ('Trigger.dev',   'ashby',      'triggerdotdev',      'https://trigger.dev/careers',                               ARRAY['Early but Hot']),
  ('Mintlify',      'ashby',      'mintlify',           'https://mintlify.com/careers',                              ARRAY['Early but Hot']),

  -- ── AI labs / products (Ashby) ──
  ('Cartesia',      'ashby',      'cartesia',           'https://cartesia.ai/careers',                               ARRAY['AI 50', 'Early but Hot']),
  ('Decagon',       'ashby',      'decagon',            'https://decagon.ai/careers',                                ARRAY['AI 50', 'Early but Hot']),
  ('Speakeasy',     'ashby',      'speakeasy',          'https://www.speakeasy.com/careers',                         ARRAY['Early but Hot']),
  ('Suno',          'ashby',      'suno',               'https://www.suno.com/careers',                              ARRAY['AI 50']),
  ('Synthesia',     'ashby',      'synthesia',          'https://www.synthesia.io/careers',                          ARRAY['AI 50']),
  ('11x',           'ashby',      '11x',                'https://www.11x.ai/careers',                                ARRAY['AI 50', 'Early but Hot']),

  -- ── Crypto / fintech (Greenhouse) ──
  ('Coinbase',      'greenhouse', 'coinbase',           'https://www.coinbase.com/careers',                          ARRAY['Public Tech']),
  ('Kraken',        'greenhouse', 'kraken',             'https://www.kraken.com/careers',                            ARRAY['Public Tech']),
  ('Mercury Bank',  'ashby',      'mercury',            'https://mercury.com/jobs',                                  ARRAY['Early but Hot']),
  ('Faire',         'greenhouse', 'faire',              'https://www.faire.com/careers',                             ARRAY['Early but Hot']),

  -- ── Mature SaaS (Greenhouse) ──
  ('Snowflake',     'greenhouse', 'snowflake',          'https://careers.snowflake.com/',                            ARRAY['Public Tech']),
  ('Salesforce',    'greenhouse', 'salesforce',         'https://www.salesforce.com/company/careers/',               ARRAY['Public Tech']),
  ('Niantic',       'greenhouse', 'nianticlabs',        'https://nianticlabs.com/careers/',                          ARRAY['Public Tech']),
  ('Unity',         'greenhouse', 'unitytechnologies',  'https://careers.unity.com/',                                ARRAY['Public Tech']),
  ('Crunchbase',    'greenhouse', 'crunchbase',         'https://about.crunchbase.com/careers/',                     ARRAY['Early but Hot']),
  ('Greenhouse',    'greenhouse', 'greenhouse',         'https://www.greenhouse.com/about/careers',                  ARRAY['Public Tech']),

  -- ── Hugging Face / AI (Lever) ──
  ('Hugging Face',  'lever',      'huggingface',        'https://huggingface.co/jobs',                               ARRAY['AI 50']),

  -- ── Modern fintech (Lever / Ashby) ──
  ('Robinhood',     'greenhouse', 'robinhood',          'https://careers.robinhood.com/',                            ARRAY['Public Tech']),
  ('Brex',          'greenhouse', 'brex',               'https://www.brex.com/careers',                              ARRAY['Early but Hot']),
  ('Mercury',       'ashby',      'mercury',            'https://mercury.com/jobs',                                  ARRAY['Early but Hot']),

  -- ── Productivity / dev (Greenhouse) ──
  ('Calendly',      'greenhouse', 'calendly',           'https://calendly.com/careers',                              ARRAY['Public Tech']),
  ('Loom',          'greenhouse', 'loom',               'https://www.loom.com/careers',                              ARRAY['Early but Hot']),
  ('Coda',          'greenhouse', 'coda',               'https://coda.io/careers',                                   ARRAY['Early but Hot']),
  ('Superhuman',    'ashby',      'superhuman',         'https://blog.superhuman.com/careers/',                      ARRAY['Early but Hot']),

  -- ── Cloud / observability (Greenhouse) ──
  ('Fastly',        'greenhouse', 'fastly',             'https://www.fastly.com/about/careers',                      ARRAY['Public Tech']),
  ('PagerDuty',     'greenhouse', 'pagerduty',          'https://careers.pagerduty.com/',                            ARRAY['Public Tech']),
  ('New Relic',     'greenhouse', 'newrelic',           'https://newrelic.com/about/careers',                        ARRAY['Public Tech']),

  -- ── E-commerce / commerce (varied) ──
  ('Whatnot',       'greenhouse', 'whatnotinc',         'https://www.whatnot.com/careers',                           ARRAY['Early but Hot']),
  ('Mercari',       'lever',      'mercari',            'https://about.mercari.com/en/careers/',                     ARRAY['Public Tech']),

  -- ── International (varied) ──
  ('Revolut',       'greenhouse', 'revolut',            'https://www.revolut.com/careers',                           ARRAY['Public Tech']),
  ('Monzo',         'greenhouse', 'monzo',              'https://monzo.com/careers',                                 ARRAY['Public Tech']),
  ('Wise',          'smartrecruiters', 'Wise',          'https://wise.jobs/',                                        ARRAY['Public Tech']),

  -- ── India HQ (Greenhouse / Lever) ──
  ('Zomato',        'lever',      'zomato',             'https://www.zomato.com/careers/',                           ARRAY['India-HQ', 'Public Tech']),
  ('Ola',           'lever',      'olacabs',            'https://www.olacabs.com/careers',                           ARRAY['India-HQ']),
  ('Swiggy',        'greenhouse', 'swiggy',             'https://careers.swiggy.com/',                               ARRAY['India-HQ', 'Public Tech']),
  ('Zerodha',       'lever',      'zerodha',            'https://zerodha.com/careers',                               ARRAY['India-HQ']),
  ('Postman India', 'greenhouse', 'postman',            'https://www.postman.com/company/careers/',                  ARRAY['India-HQ', 'Early but Hot']),

  -- ── Hardware / robotics (Greenhouse) ──
  ('Figure',        'greenhouse', 'figureai',           'https://www.figure.ai/careers',                             ARRAY['AI 50', 'Early but Hot']),
  ('Skydio',        'greenhouse', 'skydio',             'https://www.skydio.com/careers',                            ARRAY['Early but Hot']),

  -- ── Gaming (Greenhouse) ──
  ('Epic Games',    'greenhouse', 'epicgames',          'https://www.epicgames.com/site/en-US/careers',              ARRAY['Public Tech'])
on conflict (name) do nothing;

-- After running:
--   1. Trigger the scraper actor in Apify.
--   2. Look at the log. Expect a 70–80% success rate — some handles
--      above are educated guesses and will return 404 or 0 roles.
--   3. For failures, investigate via db/COMPANY_INVESTIGATION.md and
--      send me the corrected handles.
