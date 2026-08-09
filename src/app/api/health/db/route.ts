import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json({ ok: false, message: 'Database not configured' }, { status: 500 });
    }

    await db.execute(sql`SELECT 1`);
    return NextResponse.json({ ok: true, message: 'Database connection ok' });
  } catch (error) {
    return NextResponse.json({ ok: false, message: 'Database unavailable', error: error instanceof Error ? error.message : 'unknown error' }, { status: 500 });
  }
}
