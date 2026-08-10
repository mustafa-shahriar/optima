import { jsonError, jsonOk, requireAdmin, requireUser, isErrorResponse, requireDb } from '@/lib/api';
import {
  getResultEntryGrid,
  getStudentResults,
  upsertResultComponents,
} from '@/lib/data';

export async function GET(request: Request) {
  const userOrErr = await requireUser();
  if (isErrorResponse(userOrErr)) return userOrErr;

  const dbOrErr = requireDb();
  if (isErrorResponse(dbOrErr)) return dbOrErr;

  const { searchParams } = new URL(request.url);
  const courseIdParam = searchParams.get('courseId');
  const term = searchParams.get('term') ?? undefined;
  const grid = searchParams.get('grid') === '1';
  const studentIdParam = searchParams.get('studentId');

  const courseId = courseIdParam ? Number(courseIdParam) : undefined;
  if (courseIdParam && !Number.isInteger(courseId)) {
    return jsonError('courseId must be an integer');
  }

  // Admin entry grid: student records × exam components for a course/term
  if (grid) {
    if (userOrErr.role !== 'admin') return jsonError('Admin access required', 403);
    if (!courseId || !term) return jsonError('courseId and term are required for grid mode');
    try {
      const data = await getResultEntryGrid(courseId, term);
      return jsonOk(data);
    } catch (error) {
      return jsonError(error instanceof Error ? error.message : 'Unable to load entry grid', 400);
    }
  }

  let studentId: number | null = null;
  if (userOrErr.role === 'admin') {
    if (!studentIdParam) {
      return jsonError('studentId is required for admin result lookup');
    }
    studentId = Number(studentIdParam);
    if (!Number.isInteger(studentId)) return jsonError('studentId must be an integer');
  } else {
    if (!userOrErr.studentId) {
      return jsonError('Claim a student record before viewing results', 403);
    }
    studentId = userOrErr.studentId;
  }

  const data = await getStudentResults(studentId, { courseId, term });
  return jsonOk(data);
}

export async function POST(request: Request) {
  const adminOrErr = await requireAdmin();
  if (isErrorResponse(adminOrErr)) return adminOrErr;

  const dbOrErr = requireDb();
  if (isErrorResponse(dbOrErr)) return dbOrErr;

  let body: {
    studentId?: number;
    courseId?: number;
    term?: string;
    marks?: Array<{ examId: number; marksObtained: number }>;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  if (!body.studentId || !body.courseId || !body.term?.trim()) {
    return jsonError('studentId, courseId, and term are required');
  }
  if (!Array.isArray(body.marks) || body.marks.length === 0) {
    return jsonError('marks array is required (partial entry is allowed)');
  }

  try {
    const saved = await upsertResultComponents({
      studentId: Number(body.studentId),
      courseId: Number(body.courseId),
      term: body.term.trim(),
      enteredBy: adminOrErr.id,
      marks: body.marks.map((m) => ({
        examId: Number(m.examId),
        marksObtained: Number(m.marksObtained),
      })),
    });
    return jsonOk(saved, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to save results', 400);
  }
}
