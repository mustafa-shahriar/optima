import { jsonError, jsonOk, requireAdmin, requireUser, isErrorResponse, requireDb } from '@/lib/api';
import { createCourse, listCourses } from '@/lib/data';

export async function GET() {
  const userOrErr = await requireUser();
  if (isErrorResponse(userOrErr)) return userOrErr;

  const dbOrErr = requireDb();
  if (isErrorResponse(dbOrErr)) return dbOrErr;

  const data = await listCourses();
  return jsonOk(data);
}

export async function POST(request: Request) {
  const adminOrErr = await requireAdmin();
  if (isErrorResponse(adminOrErr)) return adminOrErr;

  const dbOrErr = requireDb();
  if (isErrorResponse(dbOrErr)) return dbOrErr;

  let body: {
    code?: string;
    name?: string;
    creditHours?: number | string;
    yearLevel?: number;
    semester?: number;
    academicYear?: number;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  if (!body.code?.trim() || !body.name?.trim()) {
    return jsonError('code and name are required');
  }
  if (
    body.yearLevel == null ||
    body.semester == null ||
    body.academicYear == null
  ) {
    return jsonError('yearLevel, semester, and academicYear are required');
  }
  if (![1, 2].includes(Number(body.semester))) {
    return jsonError('semester must be 1 or 2');
  }

  try {
    const course = await createCourse({
      code: body.code,
      name: body.name,
      creditHours: body.creditHours ?? 3,
      yearLevel: Number(body.yearLevel),
      semester: Number(body.semester),
      academicYear: Number(body.academicYear),
    });
    return jsonOk(course, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to create course', 400);
  }
}
