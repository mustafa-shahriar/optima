import { SignUp } from '@clerk/nextjs';

export default function RegisterPage() {
  return (
    <main style={{ maxWidth: 640, margin: '4rem auto', padding: '2rem', background: '#fff', borderRadius: 16, boxShadow: '0 10px 24px rgba(15,23,42,0.08)' }}>
      <h1 style={{ marginTop: 0 }}>Create your account</h1>
      <p style={{ color: '#475569' }}>Sign up with Google to access the student portal.</p>
      <SignUp routing="hash" signInUrl="/auth/login" forceRedirectUrl="/dashboard" />
    </main>
  );
}
