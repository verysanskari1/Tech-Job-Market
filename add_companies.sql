-- Add more companies and update index constituents
-- Run this in the Supabase SQL Editor

INSERT INTO companies (name, ats, ats_handle, indexes, tags) VALUES
  -- AI Native (AI 50 + Composite)
  ('Cohere',        'greenhouse', 'cohere',          array['Composite','AI 50'],                       array['ai-native']),
  ('Runway',        'greenhouse', 'runwayml',         array['Composite','AI 50'],                       array['ai-native']),
  ('Harvey',        'ashby',      'harvey',            array['Composite','AI 50'],                       array['ai-native','legal-tech']),
  ('Perplexity',    'greenhouse', 'perplexityai',     array['Composite','AI 50'],                       array['ai-native']),
  ('ElevenLabs',    'greenhouse', 'elevenlabs',       array['Composite','AI 50'],                       array['ai-native']),
  ('Together AI',   'greenhouse', 'togethercomputer', array['Composite','AI 50'],                       array['ai-native']),
  ('Scale AI',      'greenhouse', 'scaleai',          array['Composite','AI 50','Early but Hot'],       array['ai-native','data']),
  ('Weights & Biases','greenhouse','wandb',           array['Composite','AI 50'],                       array['ai-native','dev-tools']),
  ('Mistral',       'greenhouse', 'mistral',          array['Composite','AI 50'],                       array['ai-native']),
  ('Character.AI',  'greenhouse', 'character',        array['Composite','AI 50'],                       array['ai-native']),

  -- Early but Hot + Composite
  ('Figma',         'greenhouse', 'figma',            array['Composite','Early but Hot'],               array['design-tools']),
  ('Discord',       'greenhouse', 'discord',          array['Composite','Early but Hot'],               array['social']),
  ('Retool',        'greenhouse', 'retool',           array['Composite','Early but Hot'],               array['dev-tools']),
  ('Rippling',      'greenhouse', 'rippling',         array['Composite','Early but Hot'],               array['hr-tech']),
  ('Brex',          'greenhouse', 'brex',             array['Composite','Early but Hot'],               array['fintech']),
  ('Replit',        'ashby',      'replit',           array['Composite','Early but Hot'],               array['dev-tools']),
  ('Airtable',      'greenhouse', 'airtable',         array['Composite','Early but Hot'],               array['productivity']),
  ('Plaid',         'greenhouse', 'plaid',            array['Composite','Early but Hot'],               array['fintech']),

  -- Public Tech + Composite
  ('Shopify',       'greenhouse', 'shopify',          array['Composite','Public Tech'],                 array['ecommerce']),
  ('Cloudflare',    'greenhouse', 'cloudflare',       array['Composite','Public Tech'],                 array['infrastructure']),
  ('Datadog',       'greenhouse', 'datadog',          array['Composite','Public Tech'],                 array['observability']),
  ('Snowflake',     'greenhouse', 'snowflake',        array['Composite','Public Tech'],                 array['data']),
  ('Databricks',    'greenhouse', 'databricks',       array['Composite','Public Tech','AI 50'],         array['data','ai-native']),
  ('Coinbase',      'greenhouse', 'coinbase',         array['Composite','Public Tech'],                 array['crypto']),
  ('MongoDB',       'lever',      'mongodb',          array['Composite','Public Tech'],                 array['database']),
  ('Twilio',        'greenhouse', 'twilio',           array['Composite','Public Tech'],                 array['communications']),
  ('Confluent',     'greenhouse', 'confluent',        array['Composite','Public Tech'],                 array['data']),

  -- India-HQ + Composite
  ('Freshworks',    'greenhouse', 'freshworks',       array['Composite','India-HQ'],                    array['saas']),
  ('Zepto',         'lever',      'zepto',            array['Composite','India-HQ'],                    array['ecommerce']),
  ('Razorpay',      'greenhouse', 'razorpay',         array['Composite','India-HQ'],                    array['fintech']),
  ('Groww',         'greenhouse', 'groww',            array['Composite','India-HQ'],                    array['fintech'])

ON CONFLICT DO NOTHING;

-- Rebuild index constituents to include new companies
UPDATE indexes SET constituents = (SELECT array_agg(id) FROM companies WHERE 'Composite'       = ANY(indexes)) WHERE name = 'Composite';
UPDATE indexes SET constituents = (SELECT array_agg(id) FROM companies WHERE 'AI 50'           = ANY(indexes)) WHERE name = 'AI 50';
UPDATE indexes SET constituents = (SELECT array_agg(id) FROM companies WHERE 'Early but Hot'   = ANY(indexes)) WHERE name = 'Early but Hot';
UPDATE indexes SET constituents = (SELECT array_agg(id) FROM companies WHERE 'Public Tech'     = ANY(indexes)) WHERE name = 'Public Tech';
UPDATE indexes SET constituents = (SELECT array_agg(id) FROM companies WHERE 'India-HQ'        = ANY(indexes)) WHERE name = 'India-HQ';

-- Verify
SELECT name, array_length(constituents, 1) AS company_count FROM indexes;
