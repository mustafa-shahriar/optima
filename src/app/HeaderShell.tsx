"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';

type UserRole = 'student' | 'admin' | null;

export function HeaderShell() {
  const [role, setRole] = useState<UserRole>(null);

  useEffect(() => {
    let isMounted = true;

    fetch('/api/auth/me')
      .then((response) => response.json())
      .then((payload) => {
        if (!isMounted) return;
        if (payload?.ok && payload.data?.role) {
          setRole(payload.data.role as UserRole);
        }
      })
      .catch(() => {
        if (isMounted) {
          setRole(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <nav style={{ borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '1rem 1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <Link href="/" style={{ fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}>Optima</Link>
        <SignedIn>
          <Link href="/dashboard" style={{ color: '#334155', textDecoration: 'none' }}>Dashboard</Link>
          <Link href="/results" style={{ color: '#334155', textDecoration: 'none' }}>Results</Link>
          <Link href="/questions" style={{ color: '#334155', textDecoration: 'none' }}>Questions</Link>
          {role === 'admin' ? <Link href="/claims" style={{ color: '#334155', textDecoration: 'none' }}>Claims</Link> : null}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <UserButton afterSignOutUrl="/" />
          </div>
        </SignedIn>
        <SignedOut>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
            <SignInButton mode="modal">
              <button type="button" style={{ border: '1px solid #cbd5e1', background: '#fff', color: '#2563eb', padding: '0.6rem 0.9rem', borderRadius: 999, cursor: 'pointer' }}>Login</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button type="button" style={{ border: 0, background: '#2563eb', color: '#fff', padding: '0.6rem 0.9rem', borderRadius: 999, cursor: 'pointer' }}>Register</button>
            </SignUpButton>
          </div>
        </SignedOut>
      </div>
    </nav>
  );
}
