"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';

type UserRole = 'student' | 'admin' | null;

interface SessionData {
  name: string;
  image?: string | null;
  role: UserRole;
}

export function HeaderShell() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    authClient.getSession().then((res: any) => {
      if (!mounted) return;
      if (res?.data?.user) {
        setSession({
          name: res.data.user.name,
          image: res.data.user.image,
          role: res.data.user.role ?? 'student',
        });
      }
      setLoading(false);
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const handleSignIn = () => {
    authClient.signIn.social({ provider: 'google', callbackURL: '/dashboard' });
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = '/';
  };

  return (
    <nav style={{ borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '1rem 1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Link href="/" style={{ fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}>Optima</Link>
        {session ? (
          <>
            <Link href="/dashboard" style={{ color: '#334155', textDecoration: 'none' }}>Dashboard</Link>
            <Link href="/results" style={{ color: '#334155', textDecoration: 'none' }}>Results</Link>
            <Link href="/questions" style={{ color: '#334155', textDecoration: 'none' }}>Questions</Link>
            {session.role === 'admin' ? <Link href="/claims" style={{ color: '#334155', textDecoration: 'none' }}>Claims</Link> : null}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {session.image ? (
                <img src={session.image} alt={session.name} style={{ width: 32, height: 32, borderRadius: '50%' }} />
              ) : (
                <span style={{ width: 32, height: 32, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                  {session.name?.charAt(0)?.toUpperCase() ?? '?'}
                </span>
              )}
              <button type="button" onClick={handleSignOut} style={{ border: '1px solid #cbd5e1', background: '#fff', color: '#dc2626', padding: '0.5rem 0.8rem', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Sign out</button>
            </div>
          </>
        ) : (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
            {!loading && (
              <button type="button" onClick={handleSignIn} style={{ border: 0, background: '#2563eb', color: '#fff', padding: '0.6rem 0.9rem', borderRadius: 999, cursor: 'pointer', fontWeight: 500 }}>Sign in with Google</button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
