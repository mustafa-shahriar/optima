"use client";

import { useState } from 'react';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { GoogleButton } from '@/components/ui';

export function HomeAuthButton({ loggedIn }: { loggedIn: boolean }) {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await authClient.signIn.social({ provider: 'google', callbackURL: '/dashboard' });
    } catch {
      setLoading(false);
    }
  };

  if (loggedIn) {
    return (
      <Link
        href="/dashboard"
        style={{
          background: '#2563eb',
          color: 'white',
          padding: '0.85rem 1.4rem',
          borderRadius: 8,
          textDecoration: 'none',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        Go to dashboard
      </Link>
    );
  }

  return (
    <GoogleButton
      onClick={handleSignIn}
      loading={loading}
      variant="primary"
      text="Sign in with Google"
    />
  );
}
