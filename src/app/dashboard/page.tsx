import Link from 'next/link';
import { getDashboardData } from '@/lib/data';

export default async function DashboardPage() {
  const { student, results, questions, claims } = await getDashboardData();

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.25rem', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ margin: 0, color: '#2563eb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Dashboard</p>
          <h1 style={{ margin: '0.3rem 0 0', fontSize: '1.8rem' }}>Welcome back{student ? `, ${student.name}` : ''}</h1>
        </div>
        <Link href="/" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Back to home</Link>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <article style={{ padding: '1rem', background: '#fff', borderRadius: 12, boxShadow: '0 8px 20px rgba(15,23,42,0.06)' }}>
          <p style={{ margin: 0, color: '#64748b' }}>Reg number</p>
          <h2 style={{ margin: '0.3rem 0 0' }}>{student?.regNumber ?? '—'}</h2>
        </article>
        <article style={{ padding: '1rem', background: '#fff', borderRadius: 12, boxShadow: '0 8px 20px rgba(15,23,42,0.06)' }}>
          <p style={{ margin: 0, color: '#64748b' }}>Section</p>
          <h2 style={{ margin: '0.3rem 0 0' }}>{student?.section ?? '—'}</h2>
        </article>
        <article style={{ padding: '1rem', background: '#fff', borderRadius: 12, boxShadow: '0 8px 20px rgba(15,23,42,0.06)' }}>
          <p style={{ margin: 0, color: '#64748b' }}>Student record</p>
          <h2 style={{ margin: '0.3rem 0 0' }}>{student ? 'Ready' : 'Pending'}</h2>
        </article>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
        <article style={{ padding: '1rem', background: '#fff', borderRadius: 12, boxShadow: '0 8px 20px rgba(15,23,42,0.06)' }}>
          <h3 style={{ marginTop: 0 }}>Recent results</h3>
          {results.length === 0 ? <p>No results available yet.</p> : (
            <ul style={{ paddingLeft: '1.1rem', lineHeight: 1.8 }}>
              {results.map((row, index) => (
                <li key={`${row.course ?? 'course'}-${row.term}-${index}`}>
                  <strong>{row.course ?? 'Untitled course'}</strong> — {row.term} · {row.total} · {row.grade}
                </li>
              ))}
            </ul>
          )}
        </article>

        <article style={{ padding: '1rem', background: '#fff', borderRadius: 12, boxShadow: '0 8px 20px rgba(15,23,42,0.06)' }}>
          <h3 style={{ marginTop: 0 }}>Pending claims</h3>
          {claims.length === 0 ? <p>No pending claims.</p> : (
            <ul style={{ paddingLeft: '1.1rem', lineHeight: 1.8 }}>
              {claims.map((claim, index) => (
                <li key={`${claim.email ?? 'claim'}-${index}`}>{claim.email ?? 'Unknown'} — {claim.regNumber ?? '—'} ({claim.status})</li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section style={{ marginTop: '1rem', padding: '1rem', background: '#fff', borderRadius: 12, boxShadow: '0 8px 20px rgba(15,23,42,0.06)' }}>
        <h3 style={{ marginTop: 0 }}>Question bank</h3>
        {questions.length === 0 ? <p>No questions available yet.</p> : (
          <ul style={{ paddingLeft: '1.1rem', lineHeight: 1.8 }}>
            {questions.map((entry, index) => (
              <li key={`${entry.course ?? 'question'}-${index}`}>
                <strong>{entry.course ?? 'Untitled course'}</strong> — {entry.instructor} · {entry.term ?? '—'}
                <div style={{ color: '#475569', marginTop: '0.2rem' }}>{entry.body ?? 'No description provided.'}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
