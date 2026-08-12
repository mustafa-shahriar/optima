import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageHeader, styles } from '@/components/ui';
import { requirePageUser } from '@/lib/guards';
import { getLatestClaimForUser, getStudentDashboard } from '@/lib/data';
import { db } from '@/db';

export default async function DashboardPage() {
  const user = await requirePageUser();

  if (!db) {
    return (
      <main style={styles.page}>
        <PageHeader title="Dashboard" subtitle="Database is not configured." />
      </main>
    );
  }

  if (user.role === 'admin' && !user.studentId) {
    redirect('/admin');
  }

  if (!user.studentId) {
    const claim = await getLatestClaimForUser(user.id);
    if (!claim || claim.status !== 'approved') {
      redirect('/claim');
    }
  }

  const data = await getStudentDashboard(user.studentId!);
  const links = [
    { href: '/results', label: 'Current-term results' },
    { href: '/history', label: 'Full mark history' },
    { href: '/questions', label: 'Question bank' },
  ];

  return (
    <main style={styles.page}>
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back, ${data.student?.name ?? user.name}`}
        subtitle={data.student ? `${data.student.regNumber} · ${data.student.section}` : undefined}
      />

      <section style={{ ...styles.grid, marginBottom: '1rem' }}>
        <article style={styles.card}>
          <p style={{ margin: 0, color: '#64748b' }}>Section</p>
          <h2 style={{ margin: '0.35rem 0 0' }}>{data.student?.section ?? '—'}</h2>
        </article>
        <article style={{ ...styles.card, borderLeft: '4px solid #2563eb' }}>
          <p style={{ margin: 0, color: '#64748b' }}>CGPA</p>
          <h2 style={{ margin: '0.35rem 0 0' }}>{data.cgpa ?? '—'}</h2>
          <p style={{ ...styles.muted, margin: '0.35rem 0 0', fontSize: 13 }}>Fully-graded courses only</p>
        </article>
        <article style={styles.card}>
          <p style={{ margin: 0, color: '#64748b' }}>Graded courses</p>
          <h2 style={{ margin: '0.35rem 0 0' }}>{data.history.length}</h2>
        </article>
      </section>

      <section style={{ ...styles.grid, marginBottom: '1.25rem' }}>
        {links.map((link) => (
          <Link key={link.href} href={link.href} style={{ ...styles.card, textDecoration: 'none', color: 'inherit' }}>
            <p style={{ margin: 0, fontWeight: 700 }}>{link.label}</p>
          </Link>
        ))}
      </section>

      <section style={styles.card}>
        <h3 style={{ marginTop: 0 }}>Recent finalized results</h3>
        {data.history.length === 0 ? (
          <p style={styles.muted}>No finalized results yet — check back once every component is entered.</p>
        ) : (
          <ul style={{ paddingLeft: '1.1rem', lineHeight: 1.8, margin: 0 }}>
            {data.history.slice(0, 5).map((row) => (
              <li key={`${row.courseId}-${row.term}`}>
                <strong>{row.courseCode}</strong> — {row.term} · {row.total} · {row.grade}
              </li>
            ))}
          </ul>
        )}
        <Link href="/history" style={{ display: 'inline-block', marginTop: '0.75rem', color: '#2563eb' }}>
          View full mark history
        </Link>
      </section>
    </main>
  );
}
