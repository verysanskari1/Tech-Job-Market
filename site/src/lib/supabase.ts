import { createClient } from '@supabase/supabase-js';

// Use placeholder values when env vars are missing so the supabase client
// constructor doesn't throw at build time (which happens during Next.js's
// "Collecting page data" step for any module that imports supabase at
// module level — including API routes).
//
// Real env vars are required for any actual query to succeed; the placeholders
// here only exist to keep module evaluation from blowing up the build.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(url, key);
