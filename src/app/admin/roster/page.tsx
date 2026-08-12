"use client";

import type { ChangeEvent, FormEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { EmptyState, ErrorState, LoadingState, PageHeader, styles } from '@/components/ui';
import { ROSTER_AI_PROMPT } from '@/lib/import-prompts';
import { parseRosterCsv, type ParsedRosterRow } from '@/lib/csv-parser';

interface Student {
  id: number;
  regNumber: string;
  name: string;
  section: string;
}

const emptyForm = { regNumber: '', name: '', section: '' };

export default function AdminRosterPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Bulk import state
  const [showBulk, setShowBulk] = useState(false);
  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRosterRow[]>([]);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [importingBulk, setImportingBulk] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/students');
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      setStudents(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load student records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(ROSTER_AI_PROMPT);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
  };

  const handleTextChange = (text: string) => {
    setRawText(text);
    const parsed = parseRosterCsv(text);
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
    if (parsedRows.length === 0) return;
    setImportingBulk(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/students/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: parsedRows }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);

      setMessage(`Bulk import completed: ${json.data.createdCount} student(s) added, ${json.data.skippedCount} skipped.`);
      setRawText('');
      setParsedRows([]);
      setShowBulk(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to import students');
    } finally {
      setImportingBulk(false);
    }
  };

  const startEdit = (student: Student) => {
    setEditingId(student.id);
    setForm({
      regNumber: student.regNumber,
      name: student.name,
      section: student.section,
    });
    setMessage(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(editingId ? `/api/students/${editingId}` : '/api/students', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      resetForm();
      setMessage(editingId ? 'Student updated.' : 'Student added.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save student');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (student: Student) => {
    const claimedCheck = await fetch(`/api/students/${student.id}`);
    const claimedJson = await claimedCheck.json();
    const claimed = claimedJson.ok && claimedJson.data.claimed;

    const confirmMsg = claimed
      ? `${student.regNumber} is linked to a user account. Delete anyway and orphan that link?`
      : `Delete ${student.regNumber} from student records?`;
    if (!window.confirm(confirmMsg)) return;

    setError(null);
    try {
      const url = claimed
        ? `/api/students/${student.id}?confirm=1`
        : `/api/students/${student.id}`;
      const res = await fetch(url, { method: 'DELETE' });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      setMessage('Student deleted.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete student');
    }
  };

  return (
    <main style={styles.page}>
      <PageHeader
        eyebrow="Admin"
        title="Student records management"
        subtitle="Registration number, name, and section — the source of truth for claims."
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

      {error ? <div style={{ marginBottom: '1rem' }}><ErrorState message={error} onRetry={load} /></div> : null}
      {message ? <p style={{ color: '#047857', fontWeight: 600, background: '#ecfdf5', padding: '0.75rem', borderRadius: 8 }}>{message}</p> : null}

      {showBulk && (
        <div style={{ ...styles.card, marginBottom: '1.5rem', border: '1px solid #bfdbfe', background: '#eff6ff' }}>
          <h3 style={{ marginTop: 0, color: '#1e40af' }}>Bulk Import Student Records</h3>
          <p style={{ ...styles.muted, marginTop: 0 }}>
            Upload a CSV / TXT file or paste CSV text directly to add multiple student records at once.
          </p>

          {/* AI Prompt Copiable Card */}
          <div style={{ background: '#fff', padding: '1rem', borderRadius: 8, border: '1px solid #cbd5e1', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>
                🤖 Copiable AI Prompt (for PDFs & Documents)
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
              If teachers give you a PDF, Word document, or image of student lists, copy this prompt and paste it into ChatGPT, Claude, or Gemini along with your document to get a perfectly formatted CSV!
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
              {ROSTER_AI_PROMPT}
            </pre>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ ...styles.label, marginBottom: '0.35rem' }}>
                Upload CSV / TXT File
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
                placeholder={`regNumber,name,section\n2023-ENG-017,John Doe,A\n2023-ENG-018,Jane Smith,B`}
                style={{ ...styles.input, fontFamily: 'monospace', fontSize: 13 }}
              />
            </label>

            {parsedRows.length > 0 ? (
              <div>
                <p style={{ fontWeight: 600, color: '#0f172a', margin: '0 0 0.5rem' }}>
                  Parsed {parsedRows.length} student record(s) ready to import:
                </p>
                <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', marginBottom: '0.75rem' }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Reg Number</th>
                        <th style={styles.th}>Name</th>
                        <th style={styles.th}>Section</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.slice(0, 10).map((row, idx) => (
                        <tr key={idx}>
                          <td style={styles.td}>{row.regNumber}</td>
                          <td style={styles.td}>{row.name}</td>
                          <td style={styles.td}>{row.section}</td>
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
                  disabled={importingBulk}
                  style={styles.button}
                >
                  {importingBulk ? 'Importing…' : `Import ${parsedRows.length} Student Record(s)`}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} style={{ ...styles.card, display: 'grid', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <h3 style={{ margin: 0 }}>{editingId ? 'Edit student' : 'Add single student'}</h3>
        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          <label style={styles.label}>
            Reg number
            <input style={styles.input} value={form.regNumber} onChange={(e) => setForm({ ...form, regNumber: e.target.value })} required />
          </label>
          <label style={styles.label}>
            Name
            <input style={styles.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label style={styles.label}>
            Section
            <input style={styles.input} value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} required />
          </label>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" style={styles.button} disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Update' : 'Add'}
          </button>
          {editingId ? (
            <button type="button" style={styles.buttonSecondary} onClick={resetForm}>Cancel</button>
          ) : null}
        </div>
      </form>

      {loading ? <LoadingState /> : null}

      {!loading && students.length === 0 ? (
        <EmptyState title="No student records found" body="Add the first student record or use bulk import to begin." />
      ) : null}

      {!loading && students.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Reg number</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Section</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td style={styles.td}>{student.regNumber}</td>
                  <td style={styles.td}>{student.name}</td>
                  <td style={styles.td}>{student.section}</td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button type="button" style={styles.buttonSecondary} onClick={() => startEdit(student)}>Edit</button>
                      <button type="button" style={styles.buttonDanger} onClick={() => onDelete(student)}>Delete</button>
                    </div>
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
