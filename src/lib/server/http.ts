import { NextResponse } from 'next/server';
import { ZodError, type ZodType } from 'zod';
import { authenticate } from './auth';

export class AppError extends Error {
  constructor(public status: number, public code: string, message: string, public state?: unknown) { super(message); }
}
export function failure(error: unknown) {
  if (error instanceof AppError) return NextResponse.json({ code: error.code, message: error.message, state: error.state }, { status: error.status });
  if (error instanceof ZodError) return NextResponse.json({ code: 'INVALID_INPUT', message: 'Hindi wasto ang ipinadalang impormasyon.' }, { status: 400 });
  console.error(error);
  return NextResponse.json({ code: 'SERVER_ERROR', message: 'May pansamantalang problema. Subukan muli.' }, { status: 500 });
}
export async function body<T>(request: Request, schema: ZodType<T>): Promise<T> {
  try { return schema.parse(await request.json()); }
  catch (error) { if (error instanceof ZodError) throw error; throw new AppError(400, 'INVALID_JSON', 'Hindi wasto ang request.'); }
}
export async function requireGroup(request: Request) {
  const auth = await authenticate(request);
  if (!auth?.group) throw new AppError(401, 'UNAUTHORIZED', 'Mag-log in muna.');
  return auth;
}
export async function requireAdmin(request: Request) {
  const auth = await authenticate(request);
  if (auth?.account.role !== 'ADMIN') throw new AppError(403, 'FORBIDDEN', 'Walang pahintulot.');
  return auth;
}
