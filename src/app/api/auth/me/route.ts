import { jsonError, jsonOk, requireUser, isErrorResponse, requireDb } from '@/lib/api';
import { getLatestClaimForUser, getStudentById } from '@/lib/data';

export async function GET() {
  const userOrErr = await requireUser();
  if (isErrorResponse(userOrErr)) return userOrErr;

  const dbOrErr = requireDb();
  if (isErrorResponse(dbOrErr)) return dbOrErr;

  const claim = userOrErr.studentId ? null : await getLatestClaimForUser(userOrErr.id);
  const student = userOrErr.studentId ? await getStudentById(userOrErr.studentId) : null;

  return jsonOk({
    ...userOrErr,
    student,
    claimStatus: userOrErr.studentId
      ? 'approved'
      : claim?.status ?? 'none',
    latestClaim: claim,
  });
}
