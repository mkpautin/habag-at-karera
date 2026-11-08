import { NextResponse } from 'next/server';
import { z } from 'zod';
import { body, failure, requireGroup } from '@/lib/server/http';
import { transition } from '@/lib/server/game';
export async function POST(request: Request) {
  try { const { group } = await requireGroup(request); const input = await body(request, z.object({ station: z.number().int().min(1).max(3), version: z.number().int().nonnegative() })); return NextResponse.json(await transition(group.id, input.station, input.version)); }
  catch (error) { return failure(error); }
}
