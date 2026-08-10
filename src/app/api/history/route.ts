import { jsonError, jsonOk, requireUser, isErrorResponse, requireDb } from '@/lib/api';
import { getMarkHistory, getStudentCgpa } from '@/lib/data';

export async function GET(request: Request) {
  const userOrErr = await requireUser();
  if (isErrorResponse(userOrErr)) return userOrErr;

  const dbOrErr = requireDb();
  if (isErrorResponse(dbOrErr)) return dbOrErr;

  const { searchParams } = new URL(request.url);
  const studentIdParam = searchParams.get('studentId');

  let studentId: number | null = null;
  if (userOrErr.role === 'admin') {
    if (!studentIdParam) return jsonError('studentId is required for admin history lookup');
    studentId = Number(studentIdParam);
    if (!Number.isInteger(studentId)) return jsonError('studentId must be an integer');
  } else {
    if (!userOrErr.studentId) {
      return jsonError('Claim a student record before viewing mark history', 403);
    }
    studentId = userOrErr.studentId;
  }

  const [history, cgpa] = await Promise.all([
    getMarkHistory(studentId),
    getStudentCgpa(studentId),
  ]);

  return jsonOk({
    history,
    cgpa,
    note: 'CGPA only includes fully-graded courses where every exam component has been entered.',
  });
}
