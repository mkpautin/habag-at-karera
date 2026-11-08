import { NextResponse } from 'next/server';
import { failure, requireAdmin } from '@/lib/server/http';
import { leaderboard } from '@/lib/server/leaderboard';
export async function GET(request: Request) {
  try { await requireAdmin(request); return NextResponse.json(await leaderboard()); }
  catch (error) { return failure(error); }
}
