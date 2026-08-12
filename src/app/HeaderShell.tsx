"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth-client';

import { GoogleButton, Skeleton, Spinner } from '@/components/ui';

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
  badge?: number;
}

export function HeaderShell() {
  const [me, setMe] = useState<MeData | null>(null);
  const [pendingClaims, setPendingClaims] = useState(0);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

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
    return () => {
      mounted = false;
    };
  }, []);

  // Automatically close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await authClient.signIn.social({ provider: 'google', callbackURL: '/dashboard' });
    } catch {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await authClient.signOut();
      window.location.href = '/';
    } catch {
      setSigningOut(false);
    }
  };

  const claimed = Boolean(me?.studentId);

  // Build nav items dynamically based on role and claim status.
  let nav: NavItem[] = [];

  if (me?.role === 'admin') {
    nav = [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/admin/roster', label: 'Student Records' },
      { href: '/admin/claims', label: 'Claims', badge: pendingClaims },
      { href: '/admin/courses', label: 'Courses' },
      { href: '/admin/results', label: 'Results' },
      { href: '/admin/questions', label: 'Question Bank' },
      { href: '/claim', label: 'Claim Record' },
    ];
  } else if (me?.role === 'student') {
    if (claimed) {
      nav = [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/results', label: 'My Results' },
        { href: '/history', label: 'Mark History' },
        { href: '/questions', label: 'Question Bank' },
        { href: '/claim', label: 'Claim' },
      ];
    } else {
      nav = [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/claim', label: 'Claim' },
      ];
    }
  }

  const isLinkActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav style={{ borderBottom: '1px solid #e2e8f0', background: '#fff', position: 'sticky', top: 0, zIndex: 50 }}>
      <div className="nav-container">
        <Link href="/" className="nav-brand">
          Optima
        </Link>

        {loading ? (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Skeleton width={32} height={32} style={{ borderRadius: '50%' }} />
            <Skeleton width={100} height={16} />
          </div>
        ) : me ? (
          <>
            {/* Desktop Nav Items */}
            <div className="nav-desktop-links">
              {nav.map((item) => {
                const active = isLinkActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-link ${active ? 'active' : ''}`}
                  >
                    {item.label}
                    {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
                  </Link>
                );
              })}
            </div>

            {/* Desktop User Actions */}
            <div className="nav-user-section nav-desktop-user">
              {me.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={me.image} alt={me.name} style={{ width: 32, height: 32, borderRadius: '50%' }} />
              ) : (
                <span style={{ width: 32, height: 32, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                  {me.name?.charAt(0)?.toUpperCase() ?? '?'}
                </span>
              )}
              <span style={{ fontSize: 14, fontWeight: 500, color: '#334155' }}>{me.name}</span>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                style={{
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  color: '#dc2626',
                  padding: '0.4rem 0.8rem',
                  borderRadius: 999,
                  cursor: signingOut ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {signingOut ? (
                  <>
                    <Spinner size={12} color="#dc2626" />
                    <span>Signing out…</span>
                  </>
                ) : (
                  'Sign out'
                )}
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="nav-mobile-toggle"
              aria-label="Toggle navigation menu"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? '✕' : '☰'}
            </button>
          </>
        ) : (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
            <GoogleButton
              onClick={handleSignIn}
              loading={signingIn}
              variant="pill"
              text="Sign in with Google"
            />
          </div>
        )}
      </div>

      {/* Mobile Menu Panel */}
      {me && (
        <div className={`nav-mobile-menu ${mobileOpen ? 'open' : ''}`}>
          {nav.map((item) => {
            const active = isLinkActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${active ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <span>{item.label}</span>
                {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
              </Link>
            );
          })}
          <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '0.5rem', paddingTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {me.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={me.image} alt={me.name} style={{ width: 28, height: 28, borderRadius: '50%' }} />
              ) : (
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                  {me.name?.charAt(0)?.toUpperCase() ?? '?'}
                </span>
              )}
              <span style={{ fontSize: 14, fontWeight: 500, color: '#334155' }}>{me.name}</span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              style={{ border: '1px solid #cbd5e1', background: '#fff', color: '#dc2626', padding: '0.4rem 0.8rem', borderRadius: 999, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

