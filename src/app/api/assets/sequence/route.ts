import { z } from 'zod';
import { imageIds, sequenceFile } from '@/lib/server/challenges';
import { imageResponse } from '@/lib/server/images';
import { failure, requireGroup, AppError } from '@/lib/server/http';
import { state } from '@/lib/server/game';
const schema = z.object({ round: z.coerce.number().int().min(1).max(2), id: z.enum(imageIds) });
export async function GET(request: Request) {
  try {
    const { group } = await requireGroup(request);
    const url = new URL(request.url); const { round, id } = schema.parse(Object.fromEntries(url.searchParams));
    const current = await state(group.id);
    if (current.station !== 2 || current.round !== round || !current.stationStartedAt) throw new AppError(403, 'FORBIDDEN', 'Hindi pa bukas ang larawang ito.');
    const filename = sequenceFile(round, id);
    if (!filename) throw new AppError(404, 'NOT_FOUND', 'Walang larawan.');
    return await imageResponse(filename);
  } catch (error) { return failure(error); }
}
