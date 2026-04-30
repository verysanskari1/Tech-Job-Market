-- Add ~50 more companies
-- Note: ATS handles are best guesses — if a company shows 0 roles after scraping,
-- find the correct handle at boards.greenhouse.io/<handle> or jobs.lever.co/<handle>

INSERT INTO companies (name, ats, ats_handle, indexes, tags) VALUES

  -- Big Public Tech
  ('Netflix',           'greenhouse', 'netflix',         array['Composite','Public Tech'],               array['streaming']),
  ('Uber',              'greenhouse', 'uber',             array['Composite','Public Tech'],               array['mobility']),
  ('Airbnb',            'greenhouse', 'airbnb',           array['Composite','Public Tech'],               array['travel']),
  ('Lyft',              'greenhouse', 'lyft',             array['Composite','Public Tech'],               array['mobility']),
  ('Atlassian',         'greenhouse', 'atlassian',        array['Composite','Public Tech'],               array['dev-tools']),
  ('HubSpot',           'greenhouse', 'hubspot',          array['Composite','Public Tech'],               array['saas']),
  ('Zoom',              'greenhouse', 'zoom',             array['Composite','Public Tech'],               array['communications']),
  ('Okta',              'greenhouse', 'okta',             array['Composite','Public Tech'],               array['security']),
  ('CrowdStrike',       'greenhouse', 'crowdstrike',      array['Composite','Public Tech'],               array['security']),
  ('Canva',             'greenhouse', 'canva',            array['Composite','Public Tech'],               array['design-tools']),
  ('Dropbox',           'greenhouse', 'dropbox',          array['Composite','Public Tech'],               array['productivity']),
  ('Palo Alto Networks','greenhouse', 'paloaltonetworks', array['Composite','Public Tech'],               array['security']),
  ('Workday',           'greenhouse', 'workday',          array['Composite','Public Tech'],               array['hr-tech']),
  ('Twilio',            'greenhouse', 'twilio',           array['Composite','Public Tech'],               array['communications']),

  -- AI Native
  ('Sarvam AI',         'ashby',      'sarvam',           array['Composite','AI 50'],                     array['ai-native']),
  ('Stability AI',      'greenhouse', 'stability-ai',     array['Composite','AI 50'],                     array['ai-native']),
  ('Adept',             'greenhouse', 'adept',            array['Composite','AI 50'],                     array['ai-native']),
  ('Inflection AI',     'greenhouse', 'inflection',       array['Composite','AI 50'],                     array['ai-native']),
  ('Hugging Face',      'greenhouse', 'huggingface',      array['Composite','AI 50'],                     array['ai-native','dev-tools']),
  ('Midjourney',        'greenhouse', 'midjourney',       array['Composite','AI 50'],                     array['ai-native']),
  ('xAI',               'greenhouse', 'xai',              array['Composite','AI 50'],                     array['ai-native']),
  ('Pika',              'ashby',      'pika-labs',        array['Composite','AI 50'],                     array['ai-native']),
  ('Sierra',            'ashby',      'sierra',           array['Composite','AI 50'],                     array['ai-native']),
  ('Poolside',          'greenhouse', 'poolside',         array['Composite','AI 50'],                     array['ai-native']),

  -- Early but Hot
  ('Deel',              'greenhouse', 'deel',             array['Composite','Early but Hot'],             array['hr-tech']),
  ('Miro',              'greenhouse', 'miro',             array['Composite','Early but Hot'],             array['productivity']),
  ('Loom',              'greenhouse', 'loomlabs',         array['Composite','Early but Hot'],             array['productivity']),
  ('Gusto',             'greenhouse', 'gusto',            array['Composite','Early but Hot'],             array['hr-tech']),
  ('Carta',             'greenhouse', 'carta',            array['Composite','Early but Hot'],             array['fintech']),
  ('Lattice',           'greenhouse', 'lattice',          array['Composite','Early but Hot'],             array['hr-tech']),
  ('Postman',           'greenhouse', 'postman',          array['Composite','Early but Hot'],             array['dev-tools']),
  ('Descript',          'greenhouse', 'descript',         array['Composite','Early but Hot'],             array['ai-native','media']),
  ('Navan',             'greenhouse', 'navan',            array['Composite','Early but Hot'],             array['travel']),
  ('Mercury',           'greenhouse', 'mercury',          array['Composite','Early but Hot'],             array['fintech']),
  ('Coda',              'greenhouse', 'coda',             array['Composite','Early but Hot'],             array['productivity']),
  ('Remote',            'greenhouse', 'remote',           array['Composite','Early but Hot'],             array['hr-tech']),
  ('Figma',             'greenhouse', 'figma',            array['Composite','Early but Hot'],             array['design-tools']),

  -- India-HQ
  ('Zomato',            'greenhouse', 'zomato',           array['Composite','India-HQ'],                  array['food-tech']),
  ('Swiggy',            'greenhouse', 'swiggy',           array['Composite','India-HQ'],                  array['food-tech']),
  ('Meesho',            'greenhouse', 'meesho',           array['Composite','India-HQ'],                  array['ecommerce']),
  ('CRED',              'greenhouse', 'cred',             array['Composite','India-HQ'],                  array['fintech']),
  ('PhonePe',           'greenhouse', 'phonepe',          array['Composite','India-HQ'],                  array['fintech']),
  ('Ola',               'greenhouse', 'ola',              array['Composite','India-HQ'],                  array['mobility']),
  ('BrowserStack',      'greenhouse', 'browserstack',     array['Composite','India-HQ'],                  array['dev-tools']),
  ('Postman',           'greenhouse', 'postman',          array['Composite','India-HQ'],                  array['dev-tools']),
  ('Chargebee',         'greenhouse', 'chargebee',        array['Composite','India-HQ'],                  array['saas']),
  ('Hasura',            'greenhouse', 'hasura',           array['Composite','India-HQ'],                  array['dev-tools'])

ON CONFLICT DO NOTHING;

-- Rebuild all index constituents
UPDATE indexes SET constituents = (SELECT array_agg(id) FROM companies WHERE 'Composite'     = ANY(indexes)) WHERE name = 'Composite';
UPDATE indexes SET constituents = (SELECT array_agg(id) FROM companies WHERE 'AI 50'         = ANY(indexes)) WHERE name = 'AI 50';
UPDATE indexes SET constituents = (SELECT array_agg(id) FROM companies WHERE 'Early but Hot' = ANY(indexes)) WHERE name = 'Early but Hot';
UPDATE indexes SET constituents = (SELECT array_agg(id) FROM companies WHERE 'Public Tech'   = ANY(indexes)) WHERE name = 'Public Tech';
UPDATE indexes SET constituents = (SELECT array_agg(id) FROM companies WHERE 'India-HQ'      = ANY(indexes)) WHERE name = 'India-HQ';

-- Verify counts
SELECT name, array_length(constituents, 1) AS company_count FROM indexes ORDER BY company_count DESC;
