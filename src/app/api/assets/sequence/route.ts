import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { assetPath, imageIds, sourceNumberById } from '@/lib/server/challenges';
import { failure, requireGroup, AppError } from '@/lib/server/http';
import { state } from '@/lib/server/game';
const schema = z.object({ round: z.coerce.number().int().min(1).max(2), id: z.enum(imageIds) });
export async function GET(request: Request) {
  try {
    const { group } = await requireGroup(request);
    const url = new URL(request.url); const { round, id } = schema.parse(Object.fromEntries(url.searchParams));
    const current = await state(group.id);
    if (current.station !== 2 || current.round !== round || !current.stationStartedAt) throw new AppError(403, 'FORBIDDEN', 'Hindi pa bukas ang larawang ito.');
    const bytes = await readFile(assetPath('station-2', `round-${round}`, `${sourceNumberById[id]}.jpg`));
    return new Response(bytes, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, no-store' } });
  } catch (error) { return failure(error); }
}
