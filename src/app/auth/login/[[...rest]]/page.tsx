import { SignIn } from '@clerk/nextjs';

export default function LoginPage() {
  return (
    <main style={{ maxWidth: 640, margin: '4rem auto', padding: '2rem', background: '#fff', borderRadius: 16, boxShadow: '0 10px 24px rgba(15,23,42,0.08)' }}>
      <h1 style={{ marginTop: 0 }}>Continue with Google</h1>
      <p style={{ color: '#475569' }}>Use your Google account to sign in and access the portal.</p>
      <SignIn routing="hash" signUpUrl="/auth/register" forceRedirectUrl="/dashboard" />
    </main>
  );
}
