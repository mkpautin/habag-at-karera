import { NextResponse } from 'next/server';
import { z } from 'zod';
import { login } from '@/lib/server/auth';
import { body, failure } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rate-limit';

const schema = z.object({ username: z.string().min(1).max(80), password: z.string().min(1).max(200) });
export async function POST(request: Request) {
  try {
    const input = await body(request, schema);
    await rateLimit('login', input.username.toLocaleLowerCase(), 10, 60_000);
    const result = await login(input.username, input.password);
    if (!result) return NextResponse.json({ code: 'INVALID_CREDENTIALS', message: 'Mali ang username o password.' }, { status: 401 });
    return NextResponse.json(result);
  } catch (error) { return failure(error); }
}
