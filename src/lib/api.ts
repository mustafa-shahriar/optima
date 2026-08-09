import { NextResponse } from 'next/server';
import { getSessionUser, type SessionUser } from '@/lib/session';
import { db } from '@/db';

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, message, ...extra }, { status });
}

export async function requireUser(): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();
  if (!user) {
    return jsonError('Unauthenticated', 401);
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser | NextResponse> {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  if (user.role !== 'admin') {
    return jsonError('Admin access required', 403);
  }
  return user;
}

export function requireDb() {
  if (!db) {
    return jsonError('Database not configured', 500);
  }
  return db;
}

export function isErrorResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
