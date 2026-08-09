import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { getLatestClaimForUser } from '@/lib/data';

export async function requirePageUser() {
  const user = await getSessionUser();
  if (!user) redirect('/auth/login');
  return user;
}

export async function requireClaimedStudent() {
  const user = await requirePageUser();
  if (user.role === 'admin') return user;
  if (!user.studentId) redirect('/claim');
  return user;
}

export async function requireAdminPage() {
  const user = await requirePageUser();
  if (user.role !== 'admin') redirect('/dashboard');
  return user;
}

/** After OAuth, send unclaimed students to /claim instead of dashboard content */
export async function redirectUnclaimedStudent() {
  const user = await requirePageUser();
  if (user.role === 'student' && !user.studentId) {
    const claim = await getLatestClaimForUser(user.id);
    if (!claim || claim.status !== 'approved') {
      redirect('/claim');
    }
  }
  return user;
}
