import Link from 'next/link';
import { getStudentProfile } from '@/lib/data';

export default async function HomePage() {
  const student = await getStudentProfile();

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '3rem 1.5rem', fontFamily: 'Arial, sans-serif' }}>
      <section style={{ display: 'grid', gap: '1rem', background: '#f8fafc', padding: '2rem', borderRadius: 16 }}>
        <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2563eb', fontWeight: 700 }}>Optima</p>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>Result And More student portal</h1>
        <p style={{ margin: 0, lineHeight: 1.6, color: '#334155' }}>
          A complete student portal experience for results, CGPA, claim review, and question bank access, built with Next.js and PostgreSQL-ready Drizzle ORM.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/dashboard" style={{ background: '#2563eb', color: 'white', padding: '0.75rem 1rem', borderRadius: 8, textDecoration: 'none' }}>
            Open dashboard
          </Link>
          <Link href="/results" style={{ border: '1px solid #cbd5e1', color: '#0f172a', padding: '0.75rem 1rem', borderRadius: 8, textDecoration: 'none' }}>
            View results
          </Link>
          <Link href="/questions" style={{ border: '1px solid #cbd5e1', color: '#0f172a', padding: '0.75rem 1rem', borderRadius: 8, textDecoration: 'none' }}>
            Browse question bank
          </Link>
          <Link href="/api/health" style={{ border: '1px solid #cbd5e1', color: '#0f172a', padding: '0.75rem 1rem', borderRadius: 8, textDecoration: 'none' }}>
            API health
          </Link>
        </div>
      </section>

      <section style={{ marginTop: '2rem', padding: '1rem', background: '#fff', borderRadius: 12, boxShadow: '0 8px 20px rgba(15,23,42,0.06)' }}>
        <h2 style={{ marginTop: 0 }}>Student snapshot</h2>
        {student ? (
          <>
            <p><strong>{student.name}</strong> · {student.regNumber} · {student.section}</p>
          </>
        ) : (
          <p>No student record is available yet.</p>
        )}
      </section>
    </main>
  );
}
