"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { EXAM_TYPE_LABELS, type ExamType } from '@/lib/exams';
import { EmptyState, ErrorState, LoadingState, PageHeader, styles } from '@/components/ui';

interface Course {
  id: number;
  code: string;
  name: string;
  academicYear: number;
  semester: number;
}

interface ResultDetail {
  courseId: number;
  courseCode: string;
  courseName: string;
  term: string;
  components: Array<{
    examId: number;
    type: ExamType;
    maxMarks: string;
    marksObtained: string | null;
  }>;
  total: number | null;
  grade: string | null;
  finalized: boolean;
  enteredCount: number;
  expectedCount: number;
}

export default function ResultsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [results, setResults] = useState<ResultDetail[]>([]);
  const [courseId, setCourseId] = useState('');
  const [term, setTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (courseId) params.set('courseId', courseId);
      if (term) params.set('term', term);

      const [coursesRes, resultsRes] = await Promise.all([
        fetch('/api/courses'),
        fetch(`/api/results?${params.toString()}`),
      ]);
      const coursesJson = await coursesRes.json();
      const resultsJson = await resultsRes.json();
      if (!coursesJson.ok) throw new Error(coursesJson.message);
      if (!resultsJson.ok) throw new Error(resultsJson.message);
      setCourses(coursesJson.data);
      setResults(resultsJson.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load results');
    } finally {
      setLoading(false);
    }
  }, [courseId, term]);

  useEffect(() => {
    load();
  }, [load]);

  const terms = useMemo(() => {
    const set = new Set(results.map((r) => r.term));
    return Array.from(set).sort().reverse();
  }, [results]);

  return (
    <main style={styles.page}>
      <PageHeader
        eyebrow="My Results"
        title="Result lookup"
        subtitle="Component breakdown for each course. Partial entries show as not finalized."
      />

      <div style={{ ...styles.card, display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '1rem' }}>
        <label style={styles.label}>
          Course
          <select style={styles.input} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
            ))}
          </select>
        </label>
        <label style={styles.label}>
          Term
          <input
            style={styles.input}
            list="term-options"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="e.g. 2026-Spring"
          />
          <datalist id="term-options">
            {terms.map((t) => <option key={t} value={t} />)}
          </datalist>
        </label>
      </div>

      {loading ? <LoadingState label="Loading results…" /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {!loading && !error && results.length === 0 ? (
        <EmptyState title="No results yet" body="Once marks are entered for your courses, they will appear here." />
      ) : null}

      <div style={{ display: 'grid', gap: '1rem' }}>
        {results.map((row) => (
          <article key={`${row.courseId}-${row.term}`} style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: 0 }}>{row.courseCode} — {row.courseName}</h3>
                <p style={{ ...styles.muted, margin: '0.25rem 0 0' }}>{row.term}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                {row.finalized ? (
                  <>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '1.25rem' }}>{row.total} · {row.grade}</p>
                    <p style={{ ...styles.muted, margin: 0, fontSize: 13 }}>Finalized</p>
                  </>
                ) : (
                  <>
                    <p style={{ margin: 0, fontWeight: 700, color: '#c2410c' }}>Results not finalized</p>
                    <p style={{ ...styles.muted, margin: 0, fontSize: 13 }}>
                      {row.enteredCount}/{row.expectedCount} components entered
                    </p>
                  </>
                )}
              </div>
            </div>

            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Component</th>
                    <th style={styles.th}>Max</th>
                    <th style={styles.th}>Obtained</th>
                  </tr>
                </thead>
                <tbody>
                  {row.components.map((c) => (
                    <tr key={c.examId}>
                      <td style={styles.td}>{EXAM_TYPE_LABELS[c.type]}</td>
                      <td style={styles.td}>{c.maxMarks}</td>
                      <td style={styles.td}>{c.marksObtained ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
