import { NextResponse } from 'next/server';
import { requireGroup, failure } from '@/lib/server/http';
import { state } from '@/lib/server/game';
export async function GET(request: Request) {
  try { const { group } = await requireGroup(request); return NextResponse.json(await state(group.id)); }
  catch (error) { return failure(error); }
}
