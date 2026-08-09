import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';

export interface SessionUser {
  id: string;
  email: string;
  role: 'student' | 'admin';
}

export async function getSessionUser(): Promise<SessionUser | null> {
  if (!db) {
    return null;
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  const row = await db.select({
    id: users.id,
    email: users.email,
    role: users.role,
  }).from(users).where(eq(users.email, session.user.email.toLowerCase())).limit(1);

  const user = row[0];
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role as SessionUser['role'],
  };
}
