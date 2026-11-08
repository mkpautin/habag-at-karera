import { NextResponse } from 'next/server';
import { z } from 'zod';
import { body, failure, requireAdmin } from '@/lib/server/http';
import { resetCompetition } from '@/lib/server/reset';

export async function POST(request: Request) {
  try {
    await requireAdmin(request);
    await body(request, z.object({ confirmation: z.literal('RESET') }));
    await resetCompetition();
    return NextResponse.json({ message: 'Na-reset na ang laro para sa lahat ng grupo.' });
  } catch (error) { return failure(error); }
}
