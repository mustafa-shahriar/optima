import { jsonError, jsonOk, requireAdmin, isErrorResponse, requireDb } from '@/lib/api';
import { decideClaim, listClaims } from '@/lib/data';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const adminOrErr = await requireAdmin();
  if (isErrorResponse(adminOrErr)) return adminOrErr;

  const dbOrErr = requireDb();
  if (isErrorResponse(dbOrErr)) return dbOrErr;

  const { id } = await params;
  const claimId = Number(id);
  if (!Number.isInteger(claimId)) return jsonError('Invalid claim id');

  const claims = await listClaims();
  const claim = claims.find((c) => c.id === claimId);
  if (!claim) return jsonError('Claim not found', 404);
  return jsonOk(claim);
}

export async function PATCH(request: Request, { params }: Params) {
  const adminOrErr = await requireAdmin();
  if (isErrorResponse(adminOrErr)) return adminOrErr;

  const dbOrErr = requireDb();
  if (isErrorResponse(dbOrErr)) return dbOrErr;

  const { id } = await params;
  const claimId = Number(id);
  if (!Number.isInteger(claimId)) return jsonError('Invalid claim id');

  let body: { decision?: string; rejectionReason?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  if (body.decision !== 'approved' && body.decision !== 'rejected') {
    return jsonError('decision must be approved or rejected');
  }

  try {
    const updated = await decideClaim({
      claimId,
      adminId: adminOrErr.id,
      decision: body.decision,
      rejectionReason: body.rejectionReason ?? null,
    });
    return jsonOk(updated);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to update claim', 400);
  }
}
