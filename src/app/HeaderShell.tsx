"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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

function buildStudentNav(claimed: boolean, isAdmin = false): NavItem[] {
  if (claimed) {
    return [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/results', label: 'My Results' },
      { href: '/history', label: 'Mark History' },
      { href: '/questions', label: 'Question Bank' },
    ];
  }

  if (isAdmin) {
    return [{ href: '/claim', label: 'Claim Record' }];
  }

  return [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/claim', label: 'Claim' },
  ];
}

function buildAdminNav(pendingClaims: number): NavItem[] {
  return [
    { href: '/admin', label: 'Admin Dashboard' },
    { href: '/admin/roster', label: 'Student Records' },
    { href: '/admin/claims', label: 'Claims', badge: pendingClaims },
    { href: '/admin/courses', label: 'Courses' },
    { href: '/admin/results', label: 'Results' },
    { href: '/admin/questions', label: 'Question Bank' },
  ];
}

export function HeaderShell() {
  const [me, setMe] = useState<MeData | null>(null);
  const [pendingClaims, setPendingClaims] = useState(0);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const adminMenuRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    setMobileOpen(false);
    setAdminMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
        setAdminMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  const isAdmin = me?.role === 'admin';

  const studentNav = me ? buildStudentNav(claimed, isAdmin) : [];
  const adminNav = isAdmin ? buildAdminNav(pendingClaims) : [];

  const isLinkActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/admin') return pathname === '/admin';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isAdminSectionActive = pathname === '/admin' || pathname.startsWith('/admin/');

  const renderNavLink = (item: NavItem, onNavigate?: () => void) => {
    const active = isLinkActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`nav-link ${active ? 'active' : ''}`}
        onClick={onNavigate}
      >
        {item.label}
        {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
      </Link>
    );
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
            <div className="nav-desktop-links">
              {studentNav.map((item) => renderNavLink(item))}

              {isAdmin ? (
                <div className="nav-dropdown" ref={adminMenuRef}>
                  <button
                    type="button"
                    className={`nav-link nav-dropdown-trigger ${isAdminSectionActive ? 'active' : ''}`}
                    aria-expanded={adminMenuOpen}
                    aria-haspopup="true"
                    onClick={() => setAdminMenuOpen((open) => !open)}
                  >
                    Admin
                    <span className="nav-dropdown-chevron" aria-hidden="true">
                      {adminMenuOpen ? '▴' : '▾'}
                    </span>
                    {pendingClaims > 0 ? <span className="nav-badge">{pendingClaims}</span> : null}
                  </button>
                  {adminMenuOpen ? (
                    <div className="nav-dropdown-menu">
                      {adminNav.map((item) => {
                        const active = isLinkActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-dropdown-item ${active ? 'active' : ''}`}
                            onClick={() => setAdminMenuOpen(false)}
                          >
                            {item.label}
                            {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

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

      {me && (
        <div className={`nav-mobile-menu ${mobileOpen ? 'open' : ''}`}>
          {studentNav.map((item) => renderNavLink(item, () => setMobileOpen(false)))}

          {isAdmin ? (
            <>
              <div className="nav-mobile-section-label">Admin</div>
              {adminNav.map((item) => renderNavLink(item, () => setMobileOpen(false)))}
            </>
          ) : null}

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
