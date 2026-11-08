import { NextResponse } from 'next/server';
import { z } from 'zod';
import { body, failure, requireGroup } from '@/lib/server/http';
import { startGame } from '@/lib/server/game';
export async function POST(request: Request) {
  try { const { group } = await requireGroup(request); const { version } = await body(request, z.object({ version: z.number().int().nonnegative() })); return NextResponse.json(await startGame(group.id, version)); }
  catch (error) { return failure(error); }
}
