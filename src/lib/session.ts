import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  role: 'student' | 'admin';
  studentId: number | null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  const u = session.user as {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    role?: string;
    studentId?: number | null;
  };

  return {
    id: u.id,
    email: u.email,
    name: u.name,
    image: u.image,
    role: (u.role as 'student' | 'admin') ?? 'student',
    studentId: u.studentId ?? null,
  };
}
