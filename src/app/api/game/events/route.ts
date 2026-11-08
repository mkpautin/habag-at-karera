import { eventStream } from '@/lib/server/events';
import { failure, requireGroup } from '@/lib/server/http';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  try { const { group } = await requireGroup(request); return eventStream(request, group.id); }
  catch (error) { return failure(error); }
}
