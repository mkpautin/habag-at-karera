import { eventStream } from '@/lib/server/events';
import { failure, requireAdmin } from '@/lib/server/http';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  try { await requireAdmin(request); return eventStream(request); }
  catch (error) { return failure(error); }
}
