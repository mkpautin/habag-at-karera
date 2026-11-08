import { NextResponse } from 'next/server';
import { z } from 'zod';
import { body, failure, requireGroup } from '@/lib/server/http';
import { submit } from '@/lib/server/game';
import { imageIds } from '@/lib/server/challenges';
import { rateLimit } from '@/lib/server/rate-limit';
const schema = z.object({ round: z.number().int().min(1).max(2), version: z.number().int().nonnegative(), order: z.array(z.enum(imageIds)).length(5).refine(x => new Set(x).size === 5) });
export async function POST(request: Request) {
  try { const { group } = await requireGroup(request); const input = await body(request, schema); await rateLimit('sequence', group.id, 60, 60_000); return NextResponse.json(await submit(group.id, 2, input.round, input.version, () => input.order.every((id, i) => id === imageIds[i]))); }
  catch (error) { return failure(error); }
}
