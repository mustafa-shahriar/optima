"use client";

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { EXAM_TYPE_LABELS, type ExamType } from '@/lib/exams';
import { EmptyState, ErrorState, LoadingState, PageHeader, styles } from '@/components/ui';

interface Course {
  id: number;
  code: string;
  name: string;
}

interface Exam {
  id: number;
  type: ExamType;
  maxMarks: string;
}

interface GridRow {
  student: { id: number; regNumber: string; name: string; section: string };
  marks: Record<number, string>;
}

export default function AdminResultsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [term, setTerm] = useState('');
  const [exams, setExams] = useState<Exam[]>([]);
  const [rows, setRows] = useState<GridRow[]>([]);
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/courses')
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setCourses(json.data);
      })
      .catch(() => setError('Unable to load courses'));
  }, []);

  const loadGrid = useCallback(async (event?: FormEvent) => {
    event?.preventDefault();
    if (!courseId || !term.trim()) {
      setError('Pick a course and term first');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/results?grid=1&courseId=${courseId}&term=${encodeURIComponent(term.trim())}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      setExams(json.data.exams);
      setRows(json.data.rows);
      if (json.data.exams.length === 0) {
        setMessage('This course has no exam weights yet. Configure them under Courses first.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load entry grid');
    } finally {
      setLoading(false);
    }
  }, [courseId, term]);

  const updateMark = (studentId: number, examId: number, value: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.student.id === studentId
          ? { ...row, marks: { ...row.marks, [examId]: value } }
          : row,
      ),
    );
  };

  const saveStudent = async (row: GridRow) => {
    const marks = exams
      .map((exam) => ({
        examId: exam.id,
        raw: row.marks[exam.id],
      }))
      .filter((m) => m.raw !== '' && m.raw != null)
      .map((m) => ({
        examId: m.examId,
        marksObtained: Number(m.raw),
      }));

    if (marks.length === 0) {
      setError('Enter at least one component before saving. Partial entry is allowed.');
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: row.student.id,
          courseId: Number(courseId),
          term: term.trim(),
          marks,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      setMessage(`Saved ${marks.length} component(s) for ${row.student.regNumber}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save marks');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main style={styles.page}>
      <PageHeader
        eyebrow="Admin"
        title="Result entry"
        subtitle="Enter marks per student per component. Save attendance early and come back for the final later."
      />

      <form onSubmit={loadGrid} style={{ ...styles.card, display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '1rem' }}>
        <label style={styles.label}>
          Course
          <select style={styles.input} value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
            <option value="">Select course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
            ))}
          </select>
        </label>
        <label style={styles.label}>
          Term
          <input style={styles.input} value={term} onChange={(e) => setTerm(e.target.value)} placeholder="2026-Spring" required />
        </label>
        <div style={{ display: 'flex', alignItems: 'end' }}>
          <button type="submit" style={styles.button}>Load roster grid</button>
        </div>
      </form>

      <div style={{ ...styles.card, marginBottom: '1rem' }}>
        <label style={styles.label}>
          Source PDF URL (optional reference attachment — does not auto-fill marks)
          <input
            style={styles.input}
            value={pdfUrl}
            onChange={(e) => setPdfUrl(e.target.value)}
            placeholder="https://…/midterm-results.pdf"
          />
        </label>
        {pdfUrl ? (
          <a href={pdfUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb', display: 'inline-block', marginTop: '0.5rem' }}>
            Open source document
          </a>
        ) : null}
      </div>

      {error ? <div style={{ marginBottom: '1rem' }}><ErrorState message={error} /></div> : null}
      {message ? <p style={{ color: '#047857', fontWeight: 600 }}>{message}</p> : null}
      {loading ? <LoadingState label="Loading entry grid…" /> : null}

      {!loading && rows.length === 0 && exams.length === 0 ? (
        <EmptyState title="No grid loaded" body="Choose a course and term to begin entering marks." />
      ) : null}

      {!loading && rows.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Student</th>
                {exams.map((exam) => (
                  <th key={exam.id} style={styles.th}>
                    {EXAM_TYPE_LABELS[exam.type]}
                    <div style={{ fontWeight: 400, color: '#64748b' }}>/{exam.maxMarks}</div>
                  </th>
                ))}
                <th style={styles.th}>Save</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.student.id}>
                  <td style={styles.td}>
                    <strong>{row.student.regNumber}</strong>
                    <div style={{ color: '#64748b' }}>{row.student.name}</div>
                  </td>
                  {exams.map((exam) => (
                    <td key={exam.id} style={styles.td}>
                      <input
                        style={{ ...styles.input, minWidth: 72 }}
                        type="number"
                        min={0}
                        step="0.5"
                        value={row.marks[exam.id] ?? ''}
                        onChange={(e) => updateMark(row.student.id, exam.id, e.target.value)}
                        placeholder="—"
                      />
                    </td>
                  ))}
                  <td style={styles.td}>
                    <button type="button" style={styles.button} disabled={saving} onClick={() => saveStudent(row)}>
                      Save
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </main>
  );
}
