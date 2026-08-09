"use client";

import { authClient } from '@/lib/auth-client';

export default function LoginPage() {
  const handleSignIn = () => {
    authClient.signIn.social({ provider: 'google', callbackURL: '/dashboard' });
  };

  return (
    <main style={{ maxWidth: 440, margin: '6rem auto', padding: '2.5rem', background: '#fff', borderRadius: 16, boxShadow: '0 10px 24px rgba(15,23,42,0.08)', textAlign: 'center' }}>
      <h1 style={{ marginTop: 0 }}>Welcome to Optima</h1>
      <p style={{ color: '#475569', lineHeight: 1.6 }}>Sign in with your Google account to access the student portal.</p>
      <button
        type="button"
        onClick={handleSignIn}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a',
          padding: '0.75rem 1.5rem', borderRadius: 8, cursor: 'pointer',
          fontSize: 15, fontWeight: 500, marginTop: '1rem',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 010-9.18l-7.98-6.19a24.04 24.04 0 000 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        Continue with Google
      </button>
    </main>
  );
}
