import { NextResponse } from 'next/server';
import { db } from '@/db';
import { students } from '@/db/schema';

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json({ ok: false, message: 'Database not configured' }, { status: 500 });
    }

    const rows = await db.select({
      id: students.id,
      regNumber: students.regNumber,
      name: students.name,
      section: students.section,
    }).from(students).limit(10);

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ ok: false, message: 'Unable to fetch students', error: error instanceof Error ? error.message : 'unknown error' }, { status: 500 });
  }
}
