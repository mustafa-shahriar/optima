import { jsonError, jsonOk, requireAdmin, requireUser, isErrorResponse, requireDb } from '@/lib/api';
import {
  createClaimRequest,
  getClaimsForUser,
  getStudentByRegNumber,
  listClaims,
  writeAuditLog,
} from '@/lib/data';

export async function GET(request: Request) {
  const userOrErr = await requireUser();
  if (isErrorResponse(userOrErr)) return userOrErr;

  const dbOrErr = requireDb();
  if (isErrorResponse(dbOrErr)) return dbOrErr;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? undefined;
  const mine = searchParams.get('mine') === '1';

  if (status && !['pending', 'approved', 'rejected'].includes(status)) {
    return jsonError('status must be pending, approved, or rejected');
  }

  if (userOrErr.role === 'admin' && !mine) {
    const data = await listClaims(status);
    return jsonOk(data);
  }

  const data = await getClaimsForUser(userOrErr.id);
  const filtered = status ? data.filter((c) => c.status === status) : data;
  return jsonOk(filtered);
}

export async function POST(request: Request) {
  const userOrErr = await requireUser();
  if (isErrorResponse(userOrErr)) return userOrErr;

  const dbOrErr = requireDb();
  if (isErrorResponse(dbOrErr)) return dbOrErr;

  if (userOrErr.role === 'admin') {
    return jsonError('Admins do not submit student claims', 403);
  }

  if (userOrErr.studentId) {
    return jsonError('Your account is already linked to a roster record', 400);
  }

  let body: { regNumber?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const regNumber = body.regNumber?.trim();
  if (!regNumber) {
    return jsonError('regNumber is required');
  }

  const student = await getStudentByRegNumber(regNumber);
  if (!student) {
    return jsonError('No roster record matches that registration number', 404);
  }

  try {
    const claim = await createClaimRequest(userOrErr.id, student.id);
    await writeAuditLog({
      actorId: userOrErr.id,
      action: 'claim_submitted',
      targetType: 'claim_request',
      targetId: claim.id,
      metadata: { regNumber, studentId: student.id },
    });
    return jsonOk({
      id: claim.id,
      status: claim.status,
      studentId: claim.studentId,
      regNumber: student.regNumber,
      requestedAt: claim.requestedAt,
    }, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to create claim', 400);
  }
}

/** Admin-only convenience for pending count in nav */
export async function HEAD() {
  const adminOrErr = await requireAdmin();
  if (isErrorResponse(adminOrErr)) return adminOrErr;
  return new Response(null, { status: 200 });
}
