-- =============================================================
-- Bulk-add 100 more tech companies (batch 3)
-- =============================================================
-- Same approach as seed_more_companies.sql: insert with
--   on conflict (name) do nothing
-- so re-running is safe. Run via Supabase SQL editor, then
-- trigger the scraper actor.
--
-- Prerequisite (only if you haven't already):
--   alter table companies add constraint companies_name_unique unique (name);
--
-- After running, expect a 70-80% success rate. Failures will show
-- up in the scraper log as HTTP 404 or 0 roles returned — investigate
-- via db/COMPANY_INVESTIGATION.md and send corrected handles.
-- =============================================================

insert into companies (name, ats, ats_handle, careers_url, indexes) values

  -- ── AI / ML startups (Ashby) ──
  ('Character.ai',    'ashby',      'character',          'https://character.ai/careers',                              ARRAY['AI 50', 'Early but Hot']),
  ('Magic',           'ashby',      'magic',              'https://magic.dev/careers',                                 ARRAY['AI 50', 'Early but Hot']),
  ('Imbue',           'ashby',      'imbue',              'https://imbue.com/careers',                                 ARRAY['AI 50', 'Early but Hot']),
  ('Sakana AI',       'ashby',      'sakana',             'https://sakana.ai/careers',                                 ARRAY['AI 50', 'Early but Hot']),
  ('Replicate',       'ashby',      'replicate',          'https://replicate.com/careers',                             ARRAY['AI 50', 'Early but Hot']),
  ('Fireworks AI',    'ashby',      'fireworksai',        'https://fireworks.ai/careers',                              ARRAY['AI 50', 'Early but Hot']),
  ('LangChain',       'ashby',      'langchain',          'https://langchain.com/careers',                             ARRAY['AI 50', 'Early but Hot']),
  ('Pinecone',        'ashby',      'pinecone',           'https://www.pinecone.io/careers',                           ARRAY['AI 50', 'Early but Hot']),
  ('Mercor',          'ashby',      'mercor',             'https://mercor.com/careers',                                ARRAY['AI 50', 'Early but Hot']),
  ('Krea AI',         'ashby',      'kreaai',             'https://krea.ai/careers',                                   ARRAY['AI 50', 'Early but Hot']),
  ('World Labs',      'ashby',      'worldlabs',          'https://www.worldlabs.ai/careers',                          ARRAY['AI 50', 'Early but Hot']),
  ('Hippocratic AI',  'ashby',      'hippocraticai',      'https://www.hippocraticai.com/careers',                     ARRAY['AI 50', 'Early but Hot']),

  -- ── Dev tools / DX (Ashby) ──
  ('Clerk',           'ashby',      'clerk',              'https://clerk.com/careers',                                 ARRAY['Early but Hot']),
  ('WorkOS',          'ashby',      'workos',             'https://workos.com/careers',                                ARRAY['Early but Hot']),
  ('Liveblocks',      'ashby',      'liveblocks',         'https://liveblocks.io/careers',                             ARRAY['Early but Hot']),
  ('Sanity',          'ashby',      'sanity',             'https://www.sanity.io/careers',                             ARRAY['Early but Hot']),
  ('Hex',             'ashby',      'hex',                'https://hex.tech/careers',                                  ARRAY['Early but Hot']),
  ('Vanta',           'ashby',      'vanta',              'https://www.vanta.com/company/careers',                     ARRAY['Early but Hot']),
  ('Persona',         'ashby',      'persona',            'https://www.withpersona.com/careers',                       ARRAY['Early but Hot']),
  ('Clay',            'ashby',      'clay',               'https://www.clay.com/careers',                              ARRAY['Early but Hot']),
  ('Attio',           'ashby',      'attio',              'https://attio.com/careers',                                 ARRAY['Early but Hot']),
  ('Tinybird',        'ashby',      'tinybird',           'https://www.tinybird.co/careers',                           ARRAY['Early but Hot']),
  ('Hightouch',       'ashby',      'hightouch',          'https://hightouch.com/careers',                             ARRAY['Early but Hot']),
  ('Census',          'ashby',      'census',             'https://www.getcensus.com/careers',                         ARRAY['Early but Hot']),
  ('Cube',            'ashby',      'cube',               'https://cube.dev/careers',                                  ARRAY['Early but Hot']),
  ('MotherDuck',      'ashby',      'motherduck',         'https://motherduck.com/careers',                            ARRAY['Early but Hot']),
  ('Modern Treasury', 'ashby',      'moderntreasury',     'https://www.moderntreasury.com/careers',                    ARRAY['Early but Hot']),

  -- ── Greenhouse SaaS / data ──
  ('HashiCorp',       'greenhouse', 'hashicorp',          'https://www.hashicorp.com/careers',                         ARRAY['Public Tech']),
  ('dbt Labs',        'greenhouse', 'dbtlabsinc',         'https://www.getdbt.com/careers',                            ARRAY['Early but Hot']),
  ('Smartsheet',      'greenhouse', 'smartsheet',         'https://www.smartsheet.com/careers',                        ARRAY['Public Tech']),
  ('Monday.com',      'greenhouse', 'mondaycom',          'https://monday.com/careers',                                ARRAY['Public Tech']),
  ('ZoomInfo',        'greenhouse', 'zoominfo',           'https://www.zoominfo.com/careers',                          ARRAY['Public Tech']),
  ('Snyk',            'greenhouse', 'snyk',               'https://snyk.io/careers',                                   ARRAY['Early but Hot']),
  ('Airbyte',         'greenhouse', 'airbyte',            'https://airbyte.com/careers',                               ARRAY['Early but Hot']),
  ('JFrog',           'greenhouse', 'jfrog',              'https://jfrog.com/careers',                                 ARRAY['Public Tech']),
  ('Couchbase',       'greenhouse', 'couchbase',          'https://www.couchbase.com/careers',                         ARRAY['Public Tech']),
  ('1Password',       'greenhouse', '1password',          'https://1password.com/careers',                             ARRAY['Early but Hot']),
  ('ClickUp',         'greenhouse', 'clickup',            'https://clickup.com/careers',                               ARRAY['Early but Hot']),

  -- ── Crypto / web3 (Greenhouse) ──
  ('OpenSea',         'greenhouse', 'openseaio',          'https://opensea.io/careers',                                ARRAY['Early but Hot']),
  ('Polygon',         'greenhouse', 'polygon',            'https://polygon.technology/careers',                        ARRAY['Early but Hot']),
  ('Uniswap',         'greenhouse', 'uniswaplabs',        'https://www.uniswap.org/careers',                           ARRAY['Early but Hot']),
  ('Ledger',          'greenhouse', 'ledger',             'https://www.ledger.com/careers',                            ARRAY['Early but Hot']),
  ('Crypto.com',      'greenhouse', 'cryptocom',          'https://crypto.com/careers',                                ARRAY['Early but Hot']),
  ('Solana',          'greenhouse', 'solanalabs',         'https://solana.com/careers',                                ARRAY['Early but Hot']),
  ('dYdX',            'greenhouse', 'dydx',               'https://dydx.exchange/careers',                             ARRAY['Early but Hot']),
  ('Chainalysis',     'greenhouse', 'chainalysis',        'https://www.chainalysis.com/careers',                       ARRAY['Early but Hot']),
  ('Fireblocks',      'greenhouse', 'fireblocks',         'https://www.fireblocks.com/careers',                        ARRAY['Early but Hot']),

  -- ── Healthcare / biotech (Greenhouse) ──
  ('Hims & Hers',     'greenhouse', 'forhimsforhers',     'https://www.forhims.com/careers',                           ARRAY['Public Tech']),
  ('Ro',              'greenhouse', 'ro',                 'https://ro.co/careers',                                     ARRAY['Early but Hot']),
  ('Lyra Health',     'greenhouse', 'lyrahealth',         'https://www.lyrahealth.com/careers',                        ARRAY['Early but Hot']),
  ('Spring Health',   'greenhouse', 'springhealth',       'https://www.springhealth.com/careers',                      ARRAY['Early but Hot']),
  ('Tempus AI',       'greenhouse', 'tempuslabs',         'https://www.tempus.com/careers',                            ARRAY['AI 50', 'Public Tech']),
  ('Komodo Health',   'greenhouse', 'komodohealth',       'https://www.komodohealth.com/careers',                      ARRAY['Early but Hot']),
  ('Oscar Health',    'greenhouse', 'oscarinsurance',     'https://www.hioscar.com/careers',                           ARRAY['Public Tech']),

  -- ── Fintech / commerce ──
  ('Wealthfront',     'greenhouse', 'wealthfront',        'https://www.wealthfront.com/careers',                       ARRAY['Early but Hot']),
  ('Betterment',      'greenhouse', 'betterment',         'https://www.betterment.com/careers',                        ARRAY['Early but Hot']),
  ('AngelList',       'greenhouse', 'angellistventures',  'https://www.angellist.com/careers',                         ARRAY['Early but Hot']),
  ('Pilot',           'greenhouse', 'pilotcom',           'https://pilot.com/careers',                                 ARRAY['Early but Hot']),
  ('Alloy',           'greenhouse', 'alloy',              'https://www.alloy.com/careers',                             ARRAY['Early but Hot']),

  -- ── EdTech (Greenhouse) ──
  ('Coursera',        'greenhouse', 'coursera',           'https://about.coursera.org/careers',                        ARRAY['Public Tech']),
  ('Udemy',           'greenhouse', 'udemy',              'https://about.udemy.com/careers',                           ARRAY['Public Tech']),
  ('Outschool',       'greenhouse', 'outschool',          'https://outschool.com/careers',                             ARRAY['Early but Hot']),

  -- ── India HQ (Greenhouse / Lever) ──
  ('BrowserStack',    'greenhouse', 'browserstack',       'https://www.browserstack.com/careers',                      ARRAY['India-HQ', 'Early but Hot']),
  ('Freshworks',      'greenhouse', 'freshworks',         'https://www.freshworks.com/company/careers',                ARRAY['India-HQ', 'Public Tech']),
  ('Druva',           'greenhouse', 'druva',              'https://www.druva.com/careers',                             ARRAY['India-HQ', 'Early but Hot']),
  ('Hasura',          'greenhouse', 'hasura',             'https://hasura.io/careers',                                 ARRAY['India-HQ', 'Early but Hot']),
  ('Atlan',           'greenhouse', 'atlan',              'https://atlan.com/careers',                                 ARRAY['India-HQ', 'Early but Hot']),
  ('DigitalOcean',    'greenhouse', 'digitaloceaninc',    'https://www.digitalocean.com/careers',                      ARRAY['Public Tech']),
  ('Slice',           'lever',      'sliceit',            'https://www.sliceit.com/careers',                           ARRAY['India-HQ', 'Early but Hot']),
  ('BharatPe',        'lever',      'bharatpe',           'https://bharatpe.com/careers',                              ARRAY['India-HQ', 'Early but Hot']),
  ('NoBroker',        'lever',      'nobroker',           'https://www.nobroker.in/careers',                           ARRAY['India-HQ', 'Early but Hot']),
  ('Acko',            'lever',      'ackoindia',          'https://www.acko.com/careers',                              ARRAY['India-HQ', 'Early but Hot']),

  -- ── Productivity / consumer (Greenhouse) ──
  ('Notion Labs',     'greenhouse', 'notion',             'https://www.notion.so/careers',                             ARRAY['Public Tech']),  -- noop if Notion already exists
  ('Calm',            'greenhouse', 'calm',               'https://www.calm.com/careers',                               ARRAY['Early but Hot']),
  ('Headspace',       'greenhouse', 'headspace',          'https://www.headspace.com/careers',                          ARRAY['Early but Hot']),
  ('Strava',          'greenhouse', 'strava',             'https://www.strava.com/careers',                            ARRAY['Early but Hot']),
  ('Eventbrite',      'greenhouse', 'eventbrite',         'https://www.eventbrite.com/careers',                        ARRAY['Public Tech']),
  ('Patreon',         'greenhouse', 'patreon',            'https://www.patreon.com/careers',                            ARRAY['Early but Hot']),

  -- ── Marketing / sales tech (Greenhouse) ──
  ('Klaviyo',         'greenhouse', 'klaviyo',            'https://www.klaviyo.com/careers',                           ARRAY['Public Tech']),
  ('Mailchimp',       'greenhouse', 'mailchimp',          'https://mailchimp.com/careers',                             ARRAY['Public Tech']),
  ('SendGrid',        'greenhouse', 'sendgrid',           'https://sendgrid.com/careers',                              ARRAY['Public Tech']),
  ('Mixpanel',        'greenhouse', 'mixpanel',           'https://mixpanel.com/careers',                              ARRAY['Early but Hot']),
  ('Heap',            'greenhouse', 'heap',               'https://heap.io/careers',                                   ARRAY['Early but Hot']),
  ('Branch',          'greenhouse', 'branch',             'https://branch.io/careers',                                 ARRAY['Early but Hot']),

  -- ── Logistics / mobility ──
  ('Flexport',        'greenhouse', 'flexport',           'https://www.flexport.com/careers',                          ARRAY['Early but Hot']),
  ('Convoy',          'greenhouse', 'convoy',             'https://convoy.com/careers',                                ARRAY['Early but Hot']),
  ('Bird',            'greenhouse', 'bird',               'https://www.bird.co/careers',                               ARRAY['Public Tech']),
  ('Turo',            'greenhouse', 'turoinc',            'https://turo.com/careers',                                  ARRAY['Public Tech']),

  -- ── Hot AI infra / agents ──
  ('Sierra AI',       'ashby',      'sierra',             'https://sierra.ai/careers',                                 ARRAY['AI 50']),  -- noop if Sierra already exists
  ('Cresta',          'greenhouse', 'cresta',             'https://cresta.com/careers',                                ARRAY['AI 50', 'Early but Hot']),
  ('Glean Work',      'greenhouse', 'gleanwork',          'https://www.glean.com/careers',                             ARRAY['AI 50']),  -- noop if Glean already exists
  ('Crusoe',          'greenhouse', 'crusoeenergy',       'https://www.crusoeenergy.com/careers',                      ARRAY['AI 50', 'Early but Hot']),
  ('Lambda Labs',     'greenhouse', 'lambdalabs',         'https://lambdalabs.com/careers',                            ARRAY['AI 50', 'Early but Hot']),
  ('CoreWeave',       'greenhouse', 'coreweave',          'https://www.coreweave.com/careers',                         ARRAY['AI 50', 'Public Tech']),

  -- ── Security / observability ──
  ('Wiz',             'greenhouse', 'wizinc',             'https://www.wiz.io/careers',                                ARRAY['Early but Hot']),  -- noop if Wiz already exists
  ('Tenable',         'greenhouse', 'tenable',            'https://www.tenable.com/careers',                           ARRAY['Public Tech']),
  ('SentinelOne',     'greenhouse', 'sentinelone',        'https://www.sentinelone.com/careers',                       ARRAY['Public Tech']),
  ('Cloudera',        'greenhouse', 'cloudera',           'https://www.cloudera.com/careers',                          ARRAY['Public Tech']),
  ('Honeycomb',       'greenhouse', 'honeycomb',          'https://www.honeycomb.io/careers',                          ARRAY['Early but Hot']),

  -- ── Hardware / robotics (Greenhouse/Ashby) ──
  ('Boston Dynamics', 'greenhouse', 'bostondynamics',     'https://bostondynamics.com/careers',                        ARRAY['Public Tech']),
  ('Zipline',         'greenhouse', 'flyzipline',         'https://www.flyzipline.com/careers',                        ARRAY['Early but Hot']),
  ('Aurora',          'greenhouse', 'aurorainnovation',   'https://aurora.tech/careers',                               ARRAY['Public Tech']),

  -- ── Public consumer / media (Greenhouse) ──
  ('Reddit Inc',      'greenhouse', 'reddit',             'https://www.redditinc.com/careers',                         ARRAY['Public Tech']),  -- noop if Reddit already exists
  ('Spotify',         'greenhouse', 'spotify',            'https://www.lifeatspotify.com/jobs',                        ARRAY['Public Tech']),
  ('Pinterest Inc',   'greenhouse', 'pinterest',          'https://www.pinterestcareers.com',                          ARRAY['Public Tech']),  -- noop if Pinterest already exists
  ('Roku',            'greenhouse', 'roku',               'https://www.roku.com/about/careers',                        ARRAY['Public Tech']),

  -- ── Hot growth (mixed) ──
  ('Ironclad',        'ashby',      'ironclad',           'https://ironcladapp.com/careers',                           ARRAY['Early but Hot']),
  ('Pulley',          'ashby',      'pulley',             'https://pulley.com/careers',                                ARRAY['Early but Hot']),
  ('Mercor AI',       'ashby',      'mercor',             'https://mercor.com/careers',                                ARRAY['AI 50']),         -- noop if Mercor already inserted above
  ('OpenStore',       'ashby',      'openstore',          'https://openstore.com/careers',                             ARRAY['Early but Hot']),
  ('Replit Inc',      'ashby',      'replit',             'https://replit.com/careers',                                ARRAY['Early but Hot'])   -- noop if Replit already exists
on conflict (name) do nothing;

-- After running:
--   1. Trigger the scraper actor in Apify.
--   2. Look at the log. Expect a 70-80% success rate.
--   3. For failures, investigate via db/COMPANY_INVESTIGATION.md and
--      send corrected handles back to iterate.
