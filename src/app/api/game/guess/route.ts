import { NextResponse } from 'next/server';
import { z } from 'zod';
import { body, failure, requireGroup } from '@/lib/server/http';
import { submit } from '@/lib/server/game';
import { isCorrectGuess } from '@/lib/server/challenges';
import { rateLimit } from '@/lib/server/rate-limit';
const schema = z.object({ station: z.union([z.literal(1), z.literal(3)]), round: z.number().int().min(1).max(5), version: z.number().int().nonnegative(), answer: z.string().min(1).max(120) });
export async function POST(request: Request) {
  try {
    const { group } = await requireGroup(request); const input = await body(request, schema);
    await rateLimit('guess', group.id, 60, 60_000);
    const correct = (round: number) => isCorrectGuess(input.station, round, input.answer);
    return NextResponse.json(await submit(group.id, input.station, input.round, input.version, correct));
  } catch (error) { return failure(error); }
}
