"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { EXAM_TYPES, EXAM_TYPE_LABELS, type ExamType } from '@/lib/exams';
import { EmptyState, ErrorState, LoadingState, PageHeader, styles } from '@/components/ui';

interface Course {
  id: number;
  code: string;
  name: string;
  creditHours: string;
  yearLevel: number;
  semester: number;
  academicYear: number;
}

interface ExamRow {
  type: ExamType;
  maxMarks: string;
}

const emptyCourse = {
  code: '',
  name: '',
  creditHours: '3.0',
  yearLevel: '1',
  semester: '1',
  academicYear: String(new Date().getFullYear()),
};

const defaultWeights = (): ExamRow[] =>
  EXAM_TYPES.map((type) => ({
    type,
    maxMarks: type === 'final_exam' ? '60' : '10',
  }));

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState(emptyCourse);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [weights, setWeights] = useState<ExamRow[]>(defaultWeights());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const total = useMemo(
    () => weights.reduce((sum, w) => sum + (Number(w.maxMarks) || 0), 0),
    [weights],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/courses');
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      setCourses(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load courses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadExams = async (courseId: number) => {
    setSelectedId(courseId);
    setMessage(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/exams`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      if (json.data.exams.length === 0) {
        setWeights(defaultWeights());
      } else {
        const byType = new Map(json.data.exams.map((e: { type: ExamType; maxMarks: string }) => [e.type, e.maxMarks]));
        setWeights(
          EXAM_TYPES.map((type) => ({
            type,
            maxMarks: String(byType.get(type) ?? '0'),
          })),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load exams');
    }
  };

  const createCourse = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          name: form.name,
          creditHours: Number(form.creditHours),
          yearLevel: Number(form.yearLevel),
          semester: Number(form.semester),
          academicYear: Number(form.academicYear),
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      setForm(emptyCourse);
      setMessage(`Created ${json.data.code}. Set exam weights below.`);
      await load();
      await loadExams(json.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create course');
    } finally {
      setSaving(false);
    }
  };

  const saveWeights = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/courses/${selectedId}/exams`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weights: weights
            .filter((w) => Number(w.maxMarks) > 0)
            .map((w) => ({ type: w.type, maxMarks: Number(w.maxMarks) })),
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      setMessage(json.data.warning ?? 'Exam weights saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save exam weights');
    } finally {
      setSaving(false);
    }
  };

  const selected = courses.find((c) => c.id === selectedId) ?? null;

  return (
    <main style={styles.page}>
      <PageHeader
        eyebrow="Admin"
        title="Courses & exam weights"
        subtitle="Define course offerings, then set attendance / tests / quiz / final marks. Weights should sum to 100."
      />

      {error ? <div style={{ marginBottom: '1rem' }}><ErrorState message={error} onRetry={load} /></div> : null}
      {message ? <p style={{ color: total === 100 || !message.includes('sum') ? '#047857' : '#c2410c', fontWeight: 600 }}>{message}</p> : null}

      <form onSubmit={createCourse} style={{ ...styles.card, display: 'grid', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <h3 style={{ margin: 0 }}>Add course</h3>
        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          <label style={styles.label}>Code<input style={styles.input} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></label>
          <label style={styles.label}>Name<input style={styles.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
          <label style={styles.label}>Credit hours<input style={styles.input} type="number" step="0.5" value={form.creditHours} onChange={(e) => setForm({ ...form, creditHours: e.target.value })} required /></label>
          <label style={styles.label}>Year level<input style={styles.input} type="number" min={1} max={4} value={form.yearLevel} onChange={(e) => setForm({ ...form, yearLevel: e.target.value })} required /></label>
          <label style={styles.label}>
            Semester
            <select style={styles.input} value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </label>
          <label style={styles.label}>Academic year<input style={styles.input} type="number" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} required /></label>
        </div>
        <button type="submit" style={styles.button} disabled={saving}>{saving ? 'Saving…' : 'Create course'}</button>
      </form>

      {loading ? <LoadingState /> : null}

      {!loading && courses.length === 0 ? (
        <EmptyState title="No courses yet" body="Create a course offering to configure exam components." />
      ) : null}

      {!loading && courses.length > 0 ? (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'minmax(240px, 1fr) minmax(280px, 1.2fr)' }}>
          <div style={{ display: 'grid', gap: '0.75rem', alignContent: 'start' }}>
            {courses.map((course) => (
              <button
                key={course.id}
                type="button"
                onClick={() => loadExams(course.id)}
                style={{
                  ...styles.card,
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: selectedId === course.id ? '2px solid #2563eb' : '1px solid transparent',
                }}
              >
                <p style={{ margin: 0, fontWeight: 700 }}>{course.code}</p>
                <p style={{ ...styles.muted, margin: '0.25rem 0 0' }}>{course.name}</p>
                <p style={{ ...styles.muted, margin: '0.25rem 0 0', fontSize: 13 }}>
                  Y{course.yearLevel}/S{course.semester} · {course.academicYear} · {course.creditHours} cr
                </p>
              </button>
            ))}
          </div>

          <div style={styles.card}>
            {selected ? (
              <>
                <h3 style={{ marginTop: 0 }}>Exam weights — {selected.code}</h3>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {weights.map((row, index) => (
                    <label key={row.type} style={styles.label}>
                      {EXAM_TYPE_LABELS[row.type]}
                      <input
                        style={styles.input}
                        type="number"
                        min={0}
                        step="0.5"
                        value={row.maxMarks}
                        onChange={(e) => {
                          const next = [...weights];
                          next[index] = { ...row, maxMarks: e.target.value };
                          setWeights(next);
                        }}
                      />
                    </label>
                  ))}
                </div>
                <p style={{
                  marginTop: '1rem',
                  fontWeight: 700,
                  color: total === 100 ? '#047857' : '#c2410c',
                }}>
                  Running total: {total}
                  {total !== 100 ? ' — should add up to 100' : ' ✓'}
                </p>
                <button type="button" style={{ ...styles.button, marginTop: '0.75rem' }} onClick={saveWeights} disabled={saving}>
                  Save exam weights
                </button>
              </>
            ) : (
              <p style={styles.muted}>Select a course to edit its exam component weights.</p>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
