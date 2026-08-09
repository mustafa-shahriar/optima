import { jsonError, jsonOk, requireAdmin, requireUser, isErrorResponse, requireDb } from '@/lib/api';
import { createStudent, listStudents, writeAuditLog } from '@/lib/data';

export async function GET() {
  const userOrErr = await requireUser();
  if (isErrorResponse(userOrErr)) return userOrErr;

  const dbOrErr = requireDb();
  if (isErrorResponse(dbOrErr)) return dbOrErr;

  // Students may look up roster only by reg number via claims; listing is admin.
  if (userOrErr.role !== 'admin') {
    return jsonError('Admin access required', 403);
  }

  const data = await listStudents();
  return jsonOk(data);
}

export async function POST(request: Request) {
  const adminOrErr = await requireAdmin();
  if (isErrorResponse(adminOrErr)) return adminOrErr;

  const dbOrErr = requireDb();
  if (isErrorResponse(dbOrErr)) return dbOrErr;

  let body: { regNumber?: string; name?: string; section?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  if (!body.regNumber?.trim() || !body.name?.trim() || !body.section?.trim()) {
    return jsonError('regNumber, name, and section are required');
  }

  try {
    const student = await createStudent({
      regNumber: body.regNumber,
      name: body.name,
      section: body.section,
    });
    await writeAuditLog({
      actorId: adminOrErr.id,
      action: 'roster_created',
      targetType: 'student',
      targetId: student.id,
      metadata: { regNumber: student.regNumber },
    });
    return jsonOk(student, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to create student', 400);
  }
}
