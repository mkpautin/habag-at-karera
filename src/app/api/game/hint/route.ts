import { NextResponse } from 'next/server';
import { z } from 'zod';
import { body, failure, requireGroup } from '@/lib/server/http';
import { hint } from '@/lib/server/game';
const schema = z.object({ station: z.union([z.literal(1), z.literal(3)]), round: z.number().int().min(1).max(5), version: z.number().int().nonnegative() });
export async function POST(request: Request) {
  try { const { group } = await requireGroup(request); const input = await body(request, schema); return NextResponse.json(await hint(group.id, input.station, input.round, input.version)); }
  catch (error) { return failure(error); }
}
