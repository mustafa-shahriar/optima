import { jsonError, jsonOk, requireAdmin, requireUser, isErrorResponse, requireDb } from '@/lib/api';
import { deleteCourse, getCourse, listExamsForCourse, updateCourse } from '@/lib/data';

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
  return jsonOk({ ...course, exams });
}

export async function PATCH(request: Request, { params }: Params) {
  const adminOrErr = await requireAdmin();
  if (isErrorResponse(adminOrErr)) return adminOrErr;

  const dbOrErr = requireDb();
  if (isErrorResponse(dbOrErr)) return dbOrErr;

  const { id } = await params;
  const courseId = Number(id);
  if (!Number.isInteger(courseId)) return jsonError('Invalid course id');

  let body: Partial<{
    code: string;
    name: string;
    creditHours: number | string;
    yearLevel: number;
    semester: number;
    academicYear: number;
  }>;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  if (body.semester != null && ![1, 2].includes(Number(body.semester))) {
    return jsonError('semester must be 1 or 2');
  }

  try {
    const course = await updateCourse(courseId, body);
    if (!course) return jsonError('Course not found', 404);
    return jsonOk(course);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to update course', 400);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const adminOrErr = await requireAdmin();
  if (isErrorResponse(adminOrErr)) return adminOrErr;

  const dbOrErr = requireDb();
  if (isErrorResponse(dbOrErr)) return dbOrErr;

  const { id } = await params;
  const courseId = Number(id);
  if (!Number.isInteger(courseId)) return jsonError('Invalid course id');

  try {
    const deleted = await deleteCourse(courseId);
    if (!deleted) return jsonError('Course not found', 404);
    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to delete course', 400);
  }
}
