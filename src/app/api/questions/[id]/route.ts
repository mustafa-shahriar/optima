import { jsonError, jsonOk, requireAdmin, isErrorResponse, requireDb } from '@/lib/api';
import { deleteQuestion } from '@/lib/data';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const adminOrErr = await requireAdmin();
  if (isErrorResponse(adminOrErr)) return adminOrErr;

  const dbOrErr = requireDb();
  if (isErrorResponse(dbOrErr)) return dbOrErr;

  const { id } = await params;
  const questionId = Number(id);
  if (!Number.isInteger(questionId)) return jsonError('Invalid question id');

  const deleted = await deleteQuestion(questionId);
  if (!deleted) return jsonError('Question not found', 404);
  return jsonOk({ deleted: true });
}
