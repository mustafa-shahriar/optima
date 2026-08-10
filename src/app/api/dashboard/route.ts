import { jsonError, jsonOk, requireAdmin, requireUser, isErrorResponse, requireDb } from '@/lib/api';
import { getAdminDashboard, getStudentDashboard } from '@/lib/data';

export async function GET() {
  const userOrErr = await requireUser();
  if (isErrorResponse(userOrErr)) return userOrErr;

  const dbOrErr = requireDb();
  if (isErrorResponse(dbOrErr)) return dbOrErr;

  if (userOrErr.role === 'admin') {
    const data = await getAdminDashboard();
    return jsonOk({ role: 'admin', ...data });
  }

  if (!userOrErr.studentId) {
    return jsonError('Claim a student record before opening the dashboard', 403);
  }

  const data = await getStudentDashboard(userOrErr.studentId);
  return jsonOk({ role: 'student', ...data });
}

export async function HEAD() {
  const adminOrErr = await requireAdmin();
  if (isErrorResponse(adminOrErr)) return adminOrErr;
  return new Response(null, { status: 200 });
}
