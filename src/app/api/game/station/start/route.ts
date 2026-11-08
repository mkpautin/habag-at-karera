import { NextResponse } from 'next/server';
import { z } from 'zod';
import { body, failure, requireGroup } from '@/lib/server/http';
import { startStation } from '@/lib/server/game';
export async function POST(request: Request) {
  try { const { group } = await requireGroup(request); const { station } = await body(request, z.object({ station: z.number().int().min(1).max(3) })); return NextResponse.json(await startStation(group.id, station)); }
  catch (error) { return failure(error); }
}
