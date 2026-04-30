import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('index_values_daily')
    .select('*')
    .limit(1);
  return Response.json({ data, error });
}
