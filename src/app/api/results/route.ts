import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { courses, resultComponents } from '@/db/schema';

export async function GET(request: Request) {
  try {
    if (!db) {
      return NextResponse.json({ ok: false, message: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const courseId = searchParams.get('courseId');
    const term = searchParams.get('term');

    const query = db
      .select({
        id: resultComponents.id,
        studentId: resultComponents.studentId,
        courseId: resultComponents.courseId,
        term: resultComponents.term,
        examId: resultComponents.examId,
        marksObtained: resultComponents.marksObtained,
        enteredAt: resultComponents.enteredAt,
        courseName: courses.name,
      })
      .from(resultComponents)
      .leftJoin(courses, eq(resultComponents.courseId, courses.id));

    let filtered = query;

    if (studentId) {
      const parsedStudentId = Number(studentId);
      if (!Number.isInteger(parsedStudentId)) {
        return NextResponse.json({ ok: false, message: 'studentId must be an integer' }, { status: 400 });
      }
      filtered = filtered.where(eq(resultComponents.studentId, parsedStudentId)) as typeof filtered;
    }

    if (courseId) {
      const parsedCourseId = Number(courseId);
      if (!Number.isInteger(parsedCourseId)) {
        return NextResponse.json({ ok: false, message: 'courseId must be an integer' }, { status: 400 });
      }
      filtered = filtered.where(eq(resultComponents.courseId, parsedCourseId)) as typeof filtered;
    }

    if (term) {
      filtered = filtered.where(eq(resultComponents.term, term)) as typeof filtered;
    }

    const rows = await filtered.orderBy(desc(resultComponents.enteredAt));

    return NextResponse.json({ ok: true, data: rows });
  } catch (error) {
    return NextResponse.json({ ok: false, message: 'Unable to fetch results', error: error instanceof Error ? error.message : 'unknown error' }, { status: 500 });
  }
}
