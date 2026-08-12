"use client";

import type { ChangeEvent, FormEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { EXAM_TYPE_LABELS, EXAM_TYPES, type ExamType } from '@/lib/exams';
import { EmptyState, ErrorState, PageHeader, Spinner, TableSkeleton, styles } from '@/components/ui';
import { buildResultsAiPrompt } from '@/lib/import-prompts';
import { parseResultsCsv, type ParsedResultRow } from '@/lib/csv-parser';

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
  const [savingStudentId, setSavingStudentId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Bulk import state
  const [showBulk, setShowBulk] = useState(false);
  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedResultRow[]>([]);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [importingBulk, setImportingBulk] = useState(false);

  useEffect(() => {
    fetch('/api/courses')
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setCourses(json.data);
      })
      .catch(() => setError('Unable to load courses'));
  }, []);

  const activeExamTypes: ExamType[] = exams.length > 0
    ? exams.map((e) => e.type)
    : [...EXAM_TYPES];

  const aiPrompt = buildResultsAiPrompt(activeExamTypes);

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

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(aiPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  const handleTextChange = (text: string) => {
    setRawText(text);
    const parsed = parseResultsCsv(text, activeExamTypes);
    setParsedRows(parsed);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleTextChange(content);
      }
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = async () => {
    if (!courseId || !term.trim()) {
      setError('Please select a Course and enter a Term before submitting bulk results.');
      return;
    }
    if (parsedRows.length === 0) return;
    if (exams.length === 0) {
      setError('Please load the grid first or ensure exam weights are configured for this course.');
      return;
    }

    setImportingBulk(true);
    setError(null);
    setMessage(null);

    // Map exam types to exam IDs
    const examMapByType = new Map(exams.map((e) => [e.type, e.id]));

    const items = parsedRows.map((r) => {
      const marks: Array<{ examId: number; marksObtained: number }> = [];
      for (const [examType, rawVal] of Object.entries(r.marks)) {
        const examId = examMapByType.get(examType as ExamType);
        const val = Number(rawVal);
        if (examId && !isNaN(val)) {
          marks.push({ examId, marksObtained: val });
        }
      }
      return { regNumber: r.regNumber, marks };
    }).filter((i) => i.marks.length > 0);

    if (items.length === 0) {
      setError('No valid component marks could be mapped from the input.');
      setImportingBulk(false);
      return;
    }

    try {
      const res = await fetch('/api/results/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: Number(courseId),
          term: term.trim(),
          items,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);

      let msg = `Bulk import completed: Saved results for ${json.data.savedStudentsCount} student(s) (${json.data.totalComponentsSaved} component mark(s)).`;
      if (json.data.unmappedRegNumbers?.length > 0) {
        msg += ` Note: ${json.data.unmappedRegNumbers.length} reg number(s) were not found in student records (${json.data.unmappedRegNumbers.slice(0, 3).join(', ')}${json.data.unmappedRegNumbers.length > 3 ? '…' : ''}).`;
      }

      setMessage(msg);
      setRawText('');
      setParsedRows([]);
      setShowBulk(false);

      // Reload grid to reflect newly imported marks
      await loadGrid();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to import bulk results');
    } finally {
      setImportingBulk(false);
    }
  };

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

    setSavingStudentId(row.student.id);
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
      setSavingStudentId(null);
    }
  };

  return (
    <main style={styles.page}>
      <PageHeader
        eyebrow="Admin"
        title="Result entry"
        subtitle="Enter marks per student per component. Save attendance early and come back for the final later."
        actions={
          <button
            type="button"
            style={showBulk ? styles.buttonSecondary : styles.button}
            onClick={() => setShowBulk(!showBulk)}
          >
            {showBulk ? 'Close Bulk Import' : '⚡ Bulk Import CSV / Text'}
          </button>
        }
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
          <button
            type="submit"
            style={{ ...styles.button, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner size={16} color="#ffffff" />
                <span>Loading grid…</span>
              </>
            ) : (
              'Load student grid'
            )}
          </button>
        </div>
      </form>

      {showBulk && (
        <div style={{ ...styles.card, marginBottom: '1.5rem', border: '1px solid #bfdbfe', background: '#eff6ff' }}>
          <h3 style={{ marginTop: 0, color: '#1e40af' }}>Bulk Import Results (CSV / Text)</h3>
          <p style={{ ...styles.muted, marginTop: 0 }}>
            Convert teacher result sheets into CSV and import component marks for multiple students simultaneously.
          </p>

          {/* AI Prompt Copiable Card */}
          <div style={{ background: '#fff', padding: '1rem', borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>
                🤖 Copiable AI Prompt for Teacher PDFs / Result Sheets
              </span>
              <button
                type="button"
                onClick={handleCopyPrompt}
                style={{
                  ...styles.button,
                  fontSize: 13,
                  padding: '0.4rem 0.8rem',
                  background: copiedPrompt ? '#059669' : '#2563eb',
                }}
              >
                {copiedPrompt ? '✓ Copied AI Prompt!' : '📋 Copy AI Prompt'}
              </button>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 0.5rem 0' }}>
              Copy this prompt and attach the teacher&apos;s result PDF / Excel / Document in ChatGPT, Claude, or Gemini to automatically get a compatible CSV file.
            </p>
            <pre
              style={{
                background: '#f8fafc',
                padding: '0.75rem',
                borderRadius: 6,
                fontSize: 12,
                color: '#334155',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                margin: 0,
                border: '1px solid #e2e8f0',
              }}
            >
              {aiPrompt}
            </pre>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ ...styles.label, marginBottom: '0.35rem' }}>
                Upload CSV / TXT Result File
              </label>
              <input
                type="file"
                accept=".csv,.txt,.tsv"
                onChange={handleFileUpload}
                style={{ fontSize: 14 }}
              />
            </div>

            <label style={styles.label}>
              Or Paste CSV / Text Content
              <textarea
                rows={5}
                value={rawText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={`regNumber,${activeExamTypes.join(',')}\n2023-ENG-017,10,18,15,8,72\n2023-ENG-018,9,,14,7,`}
                style={{ ...styles.input, fontFamily: 'monospace', fontSize: 13 }}
              />
            </label>

            {parsedRows.length > 0 ? (
              <div>
                <p style={{ fontWeight: 600, color: '#0f172a', margin: '0 0 0.5rem' }}>
                  Parsed {parsedRows.length} student result row(s) ready to import:
                </p>
                <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', marginBottom: '0.75rem' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Reg Number</th>
                        {activeExamTypes.map((t) => (
                          <th key={t} style={styles.th}>{EXAM_TYPE_LABELS[t] ?? t}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.slice(0, 10).map((row, idx) => (
                        <tr key={idx}>
                          <td style={styles.td}><strong>{row.regNumber}</strong></td>
                          {activeExamTypes.map((t) => (
                            <td key={t} style={styles.td}>{row.marks[t] ?? '—'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedRows.length > 10 ? (
                    <p style={{ padding: '0.5rem', margin: 0, fontSize: 12, color: '#64748b', textAlign: 'center' }}>
                      …and {parsedRows.length - 10} more rows
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={handleBulkSubmit}
                  disabled={importingBulk || !courseId || !term.trim()}
                  style={{ ...styles.button, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {importingBulk ? (
                    <>
                      <Spinner size={16} color="#ffffff" />
                      <span>Importing Results…</span>
                    </>
                  ) : (
                    `Import Results for ${parsedRows.length} Student(s)`
                  )}
                </button>
                {(!courseId || !term.trim()) && (
                  <p style={{ color: '#dc2626', fontSize: 13, margin: '0.35rem 0 0' }}>
                    * Select a Course and enter a Term above before importing.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

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
      {message ? <p style={{ color: '#047857', fontWeight: 600, background: '#ecfdf5', padding: '0.75rem', borderRadius: 8 }}>{message}</p> : null}
      {loading ? <TableSkeleton rows={6} cols={exams.length > 0 ? exams.length + 2 : 5} /> : null}

      {!loading && rows.length === 0 && exams.length === 0 ? (
        <EmptyState title="No grid loaded" body="Choose a course and term to begin entering marks or bulk importing." />
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
                    <button
                      type="button"
                      style={{ ...styles.button, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      disabled={savingStudentId === row.student.id}
                      onClick={() => saveStudent(row)}
                    >
                      {savingStudentId === row.student.id ? <Spinner size={14} color="#ffffff" /> : null}
                      <span>Save</span>
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

