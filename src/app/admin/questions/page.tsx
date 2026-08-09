"use client";

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { EmptyState, ErrorState, LoadingState, PageHeader, styles } from '@/components/ui';

interface Course {
  id: number;
  code: string;
  name: string;
}

interface Question {
  id: number;
  courseCode: string | null;
  courseName: string | null;
  instructorName: string;
  term: string | null;
  questionText: string | null;
  fileUrl: string | null;
}

const emptyForm = {
  courseId: '',
  instructorName: '',
  term: '',
  questionText: '',
  fileUrl: '',
};

export default function AdminQuestionsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [coursesRes, questionsRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/questions'),
      ]);
      const coursesJson = await coursesRes.json();
      const questionsJson = await questionsRes.json();
      if (!coursesJson.ok) throw new Error(coursesJson.message);
      if (!questionsJson.ok) throw new Error(questionsJson.message);
      setCourses(coursesJson.data);
      setQuestions(questionsJson.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load question bank');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: Number(form.courseId),
          instructorName: form.instructorName,
          term: form.term || null,
          questionText: form.questionText || null,
          fileUrl: form.fileUrl || null,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      setForm(emptyForm);
      setMessage('Question added.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add question');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: number) => {
    if (!window.confirm('Delete this question entry?')) return;
    try {
      const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete question');
    }
  };

  return (
    <main style={styles.page}>
      <PageHeader
        eyebrow="Admin"
        title="Question bank"
        subtitle="Add past questions as text, a file URL, or both."
      />

      {error ? <div style={{ marginBottom: '1rem' }}><ErrorState message={error} onRetry={load} /></div> : null}
      {message ? <p style={{ color: '#047857', fontWeight: 600 }}>{message}</p> : null}

      <form onSubmit={onSubmit} style={{ ...styles.card, display: 'grid', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <h3 style={{ margin: 0 }}>Add entry</h3>
        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <label style={styles.label}>
            Course
            <select style={styles.input} value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} required>
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
              ))}
            </select>
          </label>
          <label style={styles.label}>
            Instructor
            <input style={styles.input} value={form.instructorName} onChange={(e) => setForm({ ...form, instructorName: e.target.value })} required />
          </label>
          <label style={styles.label}>
            Term
            <input style={styles.input} value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} placeholder="2026-Spring" />
          </label>
        </div>
        <label style={styles.label}>
          Question text
          <textarea
            style={{ ...styles.input, minHeight: 120, resize: 'vertical' }}
            value={form.questionText}
            onChange={(e) => setForm({ ...form, questionText: e.target.value })}
            placeholder="Paste question text…"
          />
        </label>
        <label style={styles.label}>
          File URL
          <input style={styles.input} value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} placeholder="https://…/paper.pdf" />
        </label>
        <button type="submit" style={styles.button} disabled={saving}>
          {saving ? 'Saving…' : 'Add question'}
        </button>
      </form>

      {loading ? <LoadingState /> : null}

      {!loading && questions.length === 0 ? (
        <EmptyState title="No questions yet" body="Add the first past paper or question text above." />
      ) : null}

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {questions.map((q) => (
          <article key={q.id} style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: 0 }}>{q.courseCode} — {q.courseName}</h3>
                <p style={{ ...styles.muted, margin: '0.25rem 0' }}>{q.instructorName} · {q.term ?? '—'}</p>
                {q.questionText ? <p style={{ whiteSpace: 'pre-wrap' }}>{q.questionText}</p> : null}
                {q.fileUrl ? (
                  <a href={q.fileUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>Open file</a>
                ) : null}
              </div>
              <button type="button" style={styles.buttonDanger} onClick={() => onDelete(q.id)}>Delete</button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
