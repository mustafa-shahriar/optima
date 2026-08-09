"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';

type UserRole = 'student' | 'admin';

interface MeData {
  name: string;
  image?: string | null;
  role: UserRole;
  studentId: number | null;
  claimStatus: 'none' | 'pending' | 'approved' | 'rejected';
}

interface NavItem {
  href: string;
  label: string;
  locked?: boolean;
  badge?: number;
}

export function HeaderShell() {
  const [me, setMe] = useState<MeData | null>(null);
  const [pendingClaims, setPendingClaims] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const session = await authClient.getSession();
        if (!mounted) return;
        if (!session?.data?.user) {
          setMe(null);
          setLoading(false);
          return;
        }

        const res = await fetch('/api/auth/me');
        const json = await res.json();
        if (!mounted) return;

        if (json.ok) {
          setMe({
            name: json.data.name,
            image: json.data.image,
            role: json.data.role,
            studentId: json.data.studentId,
            claimStatus: json.data.claimStatus,
          });

          if (json.data.role === 'admin') {
            const claimsRes = await fetch('/api/claims?status=pending');
            const claimsJson = await claimsRes.json();
            if (mounted && claimsJson.ok) {
              setPendingClaims(claimsJson.data.length);
            }
          }
        }
      } catch {
        if (mounted) setMe(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  const handleSignIn = () => {
    authClient.signIn.social({ provider: 'google', callbackURL: '/dashboard' });
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = '/';
  };

  const claimed = Boolean(me?.studentId);
  const studentNav: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/results', label: 'My Results', locked: !claimed },
    { href: '/history', label: 'Mark History', locked: !claimed },
    { href: '/questions', label: 'Question Bank', locked: !claimed },
    { href: '/claim', label: 'Claim' },
  ];

  const adminNav: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/admin/roster', label: 'Roster' },
    { href: '/admin/claims', label: 'Claims', badge: pendingClaims },
    { href: '/admin/courses', label: 'Courses' },
    { href: '/admin/results', label: 'Results' },
    { href: '/admin/questions', label: 'Question Bank' },
  ];

  const nav = me?.role === 'admin' ? adminNav : studentNav;

  return (
    <nav style={{ borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '1rem 1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Link href="/" style={{ fontWeight: 700, color: '#2563eb', textDecoration: 'none', fontFamily: 'Georgia, serif' }}>
          Optima
        </Link>

        {me ? (
          <>
            {nav.map((item) =>
              item.locked ? (
                <span
                  key={item.href}
                  title="Available after your claim is approved"
                  style={{ color: '#94a3b8', cursor: 'not-allowed', textDecoration: 'none' }}
                >
                  {item.label}
                </span>
              ) : (
                <Link key={item.href} href={item.href} style={{ color: '#334155', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {item.label}
                  {item.badge ? (
                    <span style={{ background: '#2563eb', color: '#fff', borderRadius: 999, fontSize: 11, fontWeight: 700, padding: '0.1rem 0.45rem' }}>
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              ),
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {me.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={me.image} alt={me.name} style={{ width: 32, height: 32, borderRadius: '50%' }} />
              ) : (
                <span style={{ width: 32, height: 32, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                  {me.name?.charAt(0)?.toUpperCase() ?? '?'}
                </span>
              )}
              <button
                type="button"
                onClick={handleSignOut}
                style={{ border: '1px solid #cbd5e1', background: '#fff', color: '#dc2626', padding: '0.5rem 0.8rem', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
              >
                Sign out
              </button>
            </div>
          </>
        ) : (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
            {!loading && (
              <button
                type="button"
                onClick={handleSignIn}
                style={{ border: 0, background: '#2563eb', color: '#fff', padding: '0.6rem 0.9rem', borderRadius: 999, cursor: 'pointer', fontWeight: 500 }}
              >
                Sign in with Google
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
