"use client";

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { GoogleButton } from '@/components/ui';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await authClient.signIn.social({ provider: 'google', callbackURL: '/dashboard' });
    } catch {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 440, margin: '6rem auto', padding: '2.5rem', background: '#fff', borderRadius: 16, boxShadow: '0 10px 24px rgba(15,23,42,0.08)', textAlign: 'center' }}>
      <h1 style={{ marginTop: 0 }}>Welcome to Optima</h1>
      <p style={{ color: '#475569', lineHeight: 1.6 }}>Sign in with your Google account to access the student portal.</p>
      <div style={{ marginTop: '1.25rem' }}>
        <GoogleButton
          onClick={handleSignIn}
          loading={loading}
          variant="secondary"
          text="Continue with Google"
        />
      </div>
    </main>
  );
}

