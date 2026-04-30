import { NextRequest, NextResponse } from 'next/server';
import { getTopTweetsForWeek } from '@/lib/ai-trends-queries';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const modelId  = Number(searchParams.get('modelId'));
  const week     = searchParams.get('week') ?? '';
  const limit    = Math.min(Number(searchParams.get('limit') ?? 10), 25);

  if (!modelId || !week) {
    return NextResponse.json({ error: 'modelId and week are required' }, { status: 400 });
  }

  try {
    const tweets = await getTopTweetsForWeek(modelId, week, limit);
    return NextResponse.json(tweets);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
