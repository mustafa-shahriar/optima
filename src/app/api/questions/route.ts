import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { courses, questions } from '@/db/schema';

export async function GET(request: Request) {
  try {
    if (!db) {
      return NextResponse.json({ ok: false, message: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const instructor = searchParams.get('instructor');

    let query = db
      .select({
        id: questions.id,
        courseId: questions.courseId,
        instructorName: questions.instructorName,
        term: questions.term,
        questionText: questions.questionText,
        fileUrl: questions.fileUrl,
        createdAt: questions.createdAt,
        courseName: courses.name,
      })
      .from(questions)
      .leftJoin(courses, eq(questions.courseId, courses.id));

    if (courseId) {
      const parsedCourseId = Number(courseId);
      if (!Number.isInteger(parsedCourseId)) {
        return NextResponse.json({ ok: false, message: 'courseId must be an integer' }, { status: 400 });
      }
      query = query.where(eq(questions.courseId, parsedCourseId)) as typeof query;
    }

    if (instructor) {
      query = query.where(eq(questions.instructorName, instructor)) as typeof query;
    }

    const rows = await query.orderBy(desc(questions.createdAt));
    return NextResponse.json({ ok: true, data: rows });
  } catch (error) {
    return NextResponse.json({ ok: false, message: 'Unable to fetch questions', error: error instanceof Error ? error.message : 'unknown error' }, { status: 500 });
  }
}
