import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  role: 'student' | 'admin';
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image,
    role: (session.user as any).role ?? 'student',
  };
}
