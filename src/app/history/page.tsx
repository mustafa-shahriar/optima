"use client";

import { useCallback, useEffect, useState } from 'react';
import { EmptyState, ErrorState, LoadingState, PageHeader, styles } from '@/components/ui';

interface HistoryRow {
  courseCode: string;
  courseName: string;
  creditHours: string;
  term: string;
  total: number;
  grade: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [cgpa, setCgpa] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/history');
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      setHistory(json.data.history);
      setCgpa(json.data.cgpa);
      setNote(json.data.note);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load history');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main style={styles.page}>
      <PageHeader
        eyebrow="Mark History"
        title="CGPA & completed courses"
        subtitle="One row per fully-graded course."
      />

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {!loading && !error ? (
        <>
          <section style={{ ...styles.card, marginBottom: '1rem', borderLeft: '4px solid #2563eb' }}>
            <p style={{ margin: 0, color: '#64748b' }}>Computed CGPA</p>
            <h2 style={{ margin: '0.35rem 0 0', fontSize: '2rem' }}>{cgpa ?? '—'}</h2>
            <p style={{ ...styles.muted, margin: '0.5rem 0 0', fontSize: 13 }}>{note}</p>
          </section>

          {history.length === 0 ? (
            <EmptyState
              title="No mark history yet"
              body="First-term students with no fully-graded courses will see this empty state."
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Term</th>
                    <th style={styles.th}>Course</th>
                    <th style={styles.th}>Total</th>
                    <th style={styles.th}>Grade</th>
                    <th style={styles.th}>Credit hours</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={`${row.courseCode}-${row.term}`}>
                      <td style={styles.td}>{row.term}</td>
                      <td style={styles.td}>{row.courseCode} — {row.courseName}</td>
                      <td style={styles.td}>{row.total}</td>
                      <td style={styles.td}>{row.grade}</td>
                      <td style={styles.td}>{row.creditHours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </main>
  );
}
