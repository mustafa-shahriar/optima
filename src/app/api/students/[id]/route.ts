import { jsonError, jsonOk, requireAdmin, isErrorResponse, requireDb } from '@/lib/api';
import {
  deleteStudent,
  getStudentById,
  isStudentClaimed,
  updateStudent,
  writeAuditLog,
} from '@/lib/data';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const adminOrErr = await requireAdmin();
  if (isErrorResponse(adminOrErr)) return adminOrErr;

  const dbOrErr = requireDb();
  if (isErrorResponse(dbOrErr)) return dbOrErr;

  const { id } = await params;
  const studentId = Number(id);
  if (!Number.isInteger(studentId)) return jsonError('Invalid student id');

  const student = await getStudentById(studentId);
  if (!student) return jsonError('Student not found', 404);

  const claimed = await isStudentClaimed(studentId);
  return jsonOk({ ...student, claimed });
}

export async function PATCH(request: Request, { params }: Params) {
  const adminOrErr = await requireAdmin();
  if (isErrorResponse(adminOrErr)) return adminOrErr;

  const dbOrErr = requireDb();
  if (isErrorResponse(dbOrErr)) return dbOrErr;

  const { id } = await params;
  const studentId = Number(id);
  if (!Number.isInteger(studentId)) return jsonError('Invalid student id');

  let body: { regNumber?: string; name?: string; section?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  try {
    const student = await updateStudent(studentId, body);
    if (!student) return jsonError('Student not found', 404);
    await writeAuditLog({
      actorId: adminOrErr.id,
      action: 'roster_updated',
      targetType: 'student',
      targetId: studentId,
    });
    return jsonOk(student);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to update student', 400);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const adminOrErr = await requireAdmin();
  if (isErrorResponse(adminOrErr)) return adminOrErr;

  const dbOrErr = requireDb();
  if (isErrorResponse(dbOrErr)) return dbOrErr;

  const { id } = await params;
  const studentId = Number(id);
  if (!Number.isInteger(studentId)) return jsonError('Invalid student id');

  const { searchParams } = new URL(request.url);
  const confirm = searchParams.get('confirm') === '1';
  const claimed = await isStudentClaimed(studentId);

  if (claimed && !confirm) {
    return jsonError(
      'This student record is linked to a user account. Pass confirm=1 to delete and orphan the link.',
      409,
      { claimed: true },
    );
  }

  const result = await deleteStudent(studentId);
  if (!result.deleted) return jsonError('Student not found', 404);

  await writeAuditLog({
    actorId: adminOrErr.id,
    action: 'roster_deleted',
    targetType: 'student',
    targetId: studentId,
    metadata: { wasClaimed: result.wasClaimed },
  });

  return jsonOk({ deleted: true, wasClaimed: result.wasClaimed });
}
