import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { claimRequests, students, users } from '@/db/schema';

export async function GET(request: Request) {
  try {
    if (!db) {
      return NextResponse.json({ ok: false, message: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = db
      .select({
        id: claimRequests.id,
        userId: claimRequests.userId,
        studentId: claimRequests.studentId,
        status: claimRequests.status,
        requestedAt: claimRequests.requestedAt,
        rejectionReason: claimRequests.rejectionReason,
        email: users.email,
        regNumber: students.regNumber,
      })
      .from(claimRequests)
      .leftJoin(users, eq(claimRequests.userId, users.id))
      .leftJoin(students, eq(claimRequests.studentId, students.id));

    if (status) {
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return NextResponse.json({ ok: false, message: 'status must be pending, approved, or rejected' }, { status: 400 });
      }
      query = query.where(eq(claimRequests.status, status)) as typeof query;
    }

    const rows = await query.orderBy(desc(claimRequests.requestedAt));
    return NextResponse.json({ ok: true, data: rows });
  } catch (error) {
    return NextResponse.json({ ok: false, message: 'Unable to fetch claims', error: error instanceof Error ? error.message : 'unknown error' }, { status: 500 });
  }
}
