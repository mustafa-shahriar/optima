import { jsonError, jsonOk, requireAdmin, requireUser, isErrorResponse, requireDb } from '@/lib/api';
import { createQuestion, listInstructors, listQuestions } from '@/lib/data';

export async function GET(request: Request) {
  const userOrErr = await requireUser();
  if (isErrorResponse(userOrErr)) return userOrErr;

  const dbOrErr = requireDb();
  if (isErrorResponse(dbOrErr)) return dbOrErr;

  if (userOrErr.role === 'student' && !userOrErr.studentId) {
    return jsonError('Claim a student record before browsing the question bank', 403);
  }

  const { searchParams } = new URL(request.url);
  const courseIdParam = searchParams.get('courseId');
  const instructor = searchParams.get('instructor') ?? undefined;
  const meta = searchParams.get('meta') === '1';

  if (meta) {
    const instructors = await listInstructors();
    return jsonOk({ instructors });
  }

  const courseId = courseIdParam ? Number(courseIdParam) : undefined;
  if (courseIdParam && !Number.isInteger(courseId)) {
    return jsonError('courseId must be an integer');
  }

  const data = await listQuestions({ courseId, instructor });
  return jsonOk(data);
}

export async function POST(request: Request) {
  const adminOrErr = await requireAdmin();
  if (isErrorResponse(adminOrErr)) return adminOrErr;

  const dbOrErr = requireDb();
  if (isErrorResponse(dbOrErr)) return dbOrErr;

  let body: {
    courseId?: number;
    instructorName?: string;
    term?: string;
    questionText?: string;
    fileUrl?: string;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  if (!body.courseId || !body.instructorName?.trim()) {
    return jsonError('courseId and instructorName are required');
  }

  try {
    const question = await createQuestion({
      courseId: Number(body.courseId),
      instructorName: body.instructorName,
      term: body.term,
      questionText: body.questionText,
      fileUrl: body.fileUrl,
      uploadedBy: adminOrErr.id,
    });
    return jsonOk(question, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to create question', 400);
  }
}
