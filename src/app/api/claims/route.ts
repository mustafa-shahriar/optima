import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { claimRequests, students, user } from '@/db/schema';

export async function GET(request: Request) {
  try {
    if (!db) {
      return NextResponse.json({ ok: false, message: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const baseQuery = db
      .select()
      .from(claimRequests)
      .leftJoin(user, eq(claimRequests.userId, user.id))
      .leftJoin(students, eq(claimRequests.studentId, students.id));

    let query = baseQuery;

    if (status) {
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return NextResponse.json({ ok: false, message: 'status must be pending, approved, or rejected' }, { status: 400 });
      }
      query = baseQuery.where(eq(claimRequests.status, status));
    }

    const rows = await query.orderBy(desc(claimRequests.requestedAt));

    const data = rows.map((row) => ({
      id: row.claim_requests.id,
      userId: row.claim_requests.userId,
      studentId: row.claim_requests.studentId,
      status: row.claim_requests.status,
      requestedAt: row.claim_requests.requestedAt,
      rejectionReason: row.claim_requests.rejectionReason,
      email: row.user?.email ?? null,
      regNumber: row.students?.regNumber ?? null,
    }));

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json({ ok: false, message: 'Unable to fetch claims', error: error instanceof Error ? error.message : 'unknown error' }, { status: 500 });
  }
}
