"use client";

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { EmptyState, ErrorState, LoadingState, PageHeader, styles } from '@/components/ui';

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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/students');
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      setStudents(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load roster');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
      : `Delete ${student.regNumber} from the roster?`;
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
        title="Roster management"
        subtitle="Registration number, name, and section — the source of truth for claims."
      />

      {error ? <div style={{ marginBottom: '1rem' }}><ErrorState message={error} onRetry={load} /></div> : null}
      {message ? <p style={{ color: '#047857', fontWeight: 600 }}>{message}</p> : null}

      <form onSubmit={onSubmit} style={{ ...styles.card, display: 'grid', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <h3 style={{ margin: 0 }}>{editingId ? 'Edit student' : 'Add student'}</h3>
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
        <EmptyState title="No students on the roster" body="Add the first registration record to begin claims." />
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
