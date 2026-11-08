import { NextResponse } from 'next/server';
import { provinces } from '@/lib/provinces';
import { failure, requireGroup } from '@/lib/server/http';
export async function GET(request: Request) {
  try { await requireGroup(request); return NextResponse.json(provinces); }
  catch (error) { return failure(error); }
}
