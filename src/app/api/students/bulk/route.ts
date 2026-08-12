import { jsonError, jsonOk, requireAdmin, isErrorResponse, requireDb } from '@/lib/api';
import { bulkCreateStudents } from '@/lib/data';

export async function POST(request: Request) {
  const adminOrErr = await requireAdmin();
  if (isErrorResponse(adminOrErr)) return adminOrErr;

  const dbOrErr = requireDb();
  if (isErrorResponse(dbOrErr)) return dbOrErr;

  let body: { items?: Array<{ regNumber: string; name: string; section: string }> };
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return jsonError('items array is required');
  }

  try {
    const result = await bulkCreateStudents(body.items, adminOrErr.id);
    return jsonOk(result, { status: 201 });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to bulk import students', 400);
  }
}
