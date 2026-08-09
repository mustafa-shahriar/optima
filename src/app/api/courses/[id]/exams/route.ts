import { jsonError, jsonOk, requireAdmin, requireUser, isErrorResponse, requireDb } from '@/lib/api';
import { EXAM_TYPES, type ExamType } from '@/lib/exams';
import { getCourse, listExamsForCourse, replaceExamsForCourse } from '@/lib/data';
type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const userOrErr = await requireUser();
  if (isErrorResponse(userOrErr)) return userOrErr;

  const dbOrErr = requireDb();
  if (isErrorResponse(dbOrErr)) return dbOrErr;

  const { id } = await params;
  const courseId = Number(id);
  if (!Number.isInteger(courseId)) return jsonError('Invalid course id');

  const course = await getCourse(courseId);
  if (!course) return jsonError('Course not found', 404);

  const exams = await listExamsForCourse(courseId);
  const total = exams.reduce((sum, e) => sum + Number(e.maxMarks), 0);
  return jsonOk({ course, exams, total });
}

export async function PUT(request: Request, { params }: Params) {
  const adminOrErr = await requireAdmin();
  if (isErrorResponse(adminOrErr)) return adminOrErr;

  const dbOrErr = requireDb();
  if (isErrorResponse(dbOrErr)) return dbOrErr;

  const { id } = await params;
  const courseId = Number(id);
  if (!Number.isInteger(courseId)) return jsonError('Invalid course id');

  const course = await getCourse(courseId);
  if (!course) return jsonError('Course not found', 404);

  let body: { weights?: Array<{ type: string; maxMarks: number }> };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  if (!Array.isArray(body.weights) || body.weights.length === 0) {
    return jsonError('weights array is required');
  }

  const weights: Array<{ type: ExamType; maxMarks: number }> = [];
  const seen = new Set<string>();

  for (const row of body.weights) {
    if (!EXAM_TYPES.includes(row.type as ExamType)) {
      return jsonError(`Invalid exam type: ${row.type}`);
    }
    if (seen.has(row.type)) {
      return jsonError(`Duplicate exam type: ${row.type}`);
    }
    if (typeof row.maxMarks !== 'number' || row.maxMarks <= 0) {
      return jsonError(`maxMarks must be a positive number for ${row.type}`);
    }
    seen.add(row.type);
    weights.push({ type: row.type as ExamType, maxMarks: row.maxMarks });
  }

  const total = weights.reduce((sum, w) => sum + w.maxMarks, 0);
  const exams = await replaceExamsForCourse(courseId, weights);

  return jsonOk({
    exams,
    total,
    warning: total !== 100 ? `Exam weights sum to ${total}, not 100` : null,
  });
}
