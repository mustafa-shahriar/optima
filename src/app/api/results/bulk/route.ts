import { jsonError, jsonOk, requireAdmin, isErrorResponse, requireDb } from '@/lib/api';
import { bulkUpsertResults } from '@/lib/data';

export async function POST(request: Request) {
  const adminOrErr = await requireAdmin();
  if (isErrorResponse(adminOrErr)) return adminOrErr;

  const dbOrErr = requireDb();
  if (isErrorResponse(dbOrErr)) return dbOrErr;

  let body: {
    courseId?: number;
    term?: string;
    items?: Array<{ regNumber: string; marks: Array<{ examId: number; marksObtained: number }> }>;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  if (!body.courseId || !body.term?.trim()) {
    return jsonError('courseId and term are required');
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return jsonError('items array is required');
  }

  try {
    const result = await bulkUpsertResults(
      Number(body.courseId),
      body.term.trim(),
      body.items,
      adminOrErr.id,
    );
    return jsonOk(result, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to bulk import results', 400);
  }
}
