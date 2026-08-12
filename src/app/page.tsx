import Link from 'next/link';
import { getSessionUser } from '@/lib/session';

export default async function HomePage() {
  const user = await getSessionUser();

  return (
    <main style={{ minHeight: 'calc(100vh - 65px)', background: 'linear-gradient(165deg, #eff6ff 0%, #f8fafc 45%, #ecfeff 100%)' }}>
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '4.5rem 1.5rem 3rem' }}>
        <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.22em', color: '#2563eb', fontWeight: 700, fontSize: 13 }}>
          Optima
        </p>
        <h1 style={{ margin: '0.75rem 0 0', fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', lineHeight: 1.1, fontWeight: 800 }}>
          Result And More
        </h1>
        <p style={{ margin: '1rem 0 0', maxWidth: 540, lineHeight: 1.7, color: '#334155', fontSize: '1.1rem' }}>
          Check component-level results, track CGPA, and browse past questions — after you claim your student record.
        </p>
        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', marginTop: '1.75rem' }}>
          {!user ? (
            <Link
              href="/auth/login"
              style={{ background: '#2563eb', color: 'white', padding: '0.85rem 1.2rem', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}
            >
              Sign in with Google
            </Link>
          ) : (
            <Link
              href="/dashboard"
              style={{ background: '#2563eb', color: 'white', padding: '0.85rem 1.2rem', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}
            >
              Go to dashboard
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
