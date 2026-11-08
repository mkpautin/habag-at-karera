import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { assetPath, imageContentType, places } from '@/lib/server/challenges';
import { failure, requireGroup, AppError } from '@/lib/server/http';
import { state } from '@/lib/server/game';
const schema = z.object({ round: z.coerce.number().int().min(1).max(5) });
export async function GET(request: Request) {
  try {
    const { group } = await requireGroup(request); const { round } = schema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const current = await state(group.id);
    if (current.station !== 3 || current.round !== round || !current.stationStartedAt) throw new AppError(403, 'FORBIDDEN', 'Hindi pa bukas ang larawang ito.');
    const filename = places[round - 1]?.image;
    if (!filename || !/^[a-zA-Z0-9_.-]+$/.test(filename)) throw new AppError(404, 'NOT_FOUND', 'Walang larawan.');
    const bytes = await readFile(assetPath('station-3', filename));
    return new Response(bytes, { headers: { 'Content-Type': imageContentType(filename), 'Cache-Control': 'private, no-store' } });
  } catch (error) { return failure(error); }
}
