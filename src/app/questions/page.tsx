"use client";

import { useCallback, useEffect, useState } from 'react';
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

export default function QuestionsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [courseId, setCourseId] = useState('');
  const [instructor, setInstructor] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (courseId) params.set('courseId', courseId);
      if (instructor) params.set('instructor', instructor);

      const [coursesRes, metaRes, questionsRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/questions?meta=1'),
        fetch(`/api/questions?${params.toString()}`),
      ]);
      const coursesJson = await coursesRes.json();
      const metaJson = await metaRes.json();
      const questionsJson = await questionsRes.json();
      if (!coursesJson.ok) throw new Error(coursesJson.message);
      if (!metaJson.ok) throw new Error(metaJson.message);
      if (!questionsJson.ok) throw new Error(questionsJson.message);
      setCourses(coursesJson.data);
      setInstructors(metaJson.data.instructors);
      setQuestions(questionsJson.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load questions');
    } finally {
      setLoading(false);
    }
  }, [courseId, instructor]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main style={styles.page}>
      <PageHeader
        eyebrow="Question Bank"
        title="Past questions"
        subtitle="Filter by course and instructor."
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
          Instructor
          <select style={styles.input} value={instructor} onChange={(e) => setInstructor(e.target.value)}>
            <option value="">All instructors</option>
            {instructors.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>
      </div>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {!loading && !error && questions.length === 0 ? (
        <EmptyState
          title={courseId ? 'No questions yet for this course' : 'No questions yet'}
          body="Check back after an admin uploads past papers or question text."
        />
      ) : null}

      <div style={{ display: 'grid', gap: '1rem' }}>
        {questions.map((q) => (
          <article key={q.id} style={styles.card}>
            <h3 style={{ marginTop: 0 }}>{q.courseCode ?? 'Course'} — {q.courseName ?? 'Untitled'}</h3>
            <p style={{ ...styles.muted, margin: '0.25rem 0' }}>
              {q.instructorName} · {q.term ?? '—'}
            </p>
            {q.questionText ? <p style={{ whiteSpace: 'pre-wrap' }}>{q.questionText}</p> : null}
            {q.fileUrl ? (
              <a href={q.fileUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>
                Open attachment
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </main>
  );
}
