"use client";

import type { FormEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { ClaimsSkeleton, EmptyState, ErrorState, PageHeader, Spinner, StatusPill, styles } from '@/components/ui';

interface ClaimRow {
  id: number;
  status: string;
  regNumber: string | null;
  rejectionReason: string | null;
  requestedAt: string;
}

interface MeResponse {
  role?: 'student' | 'admin';
  studentId: number | null;
  claimStatus: string;
  student: { name: string; regNumber: string; section: string } | null;
  latestClaim: ClaimRow | null;
}

export default function ClaimPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [regNumber, setRegNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCorrection, setShowCorrection] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [meRes, claimsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/claims?mine=1'),
      ]);
      const meJson = await meRes.json();
      const claimsJson = await claimsRes.json();
      if (!meJson.ok) throw new Error(meJson.message || 'Unable to load account');
      if (!claimsJson.ok) throw new Error(claimsJson.message || 'Unable to load claims');
      setMe(meJson.data);
      setClaims(claimsJson.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submitClaim = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regNumber }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || 'Unable to submit claim');
      setRegNumber('');
      setShowCorrection(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit claim');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main style={styles.page}>
        <PageHeader eyebrow="Claim" title="Claim your student record" subtitle="Checking your claim status…" />
        <ClaimsSkeleton />
      </main>
    );
  }

  if (error && !me) {
    return (
      <main style={styles.page}>
        <ErrorState message={error} onRetry={load} />
      </main>
    );
  }

  if (me?.studentId && me.student) {
    return (
      <main style={styles.page}>
        <PageHeader
          eyebrow="Claim"
          title="Student record linked"
          subtitle="Your account is connected to a student record. Results and CGPA are unlocked."
        />
        <div style={styles.card}>
          <p style={{ margin: 0, fontWeight: 700 }}>{me.student.name}</p>
          <p style={styles.muted}>{me.student.regNumber} · {me.student.section}</p>
          <a href="/dashboard" style={{ ...styles.button, display: 'inline-block', marginTop: '1rem', textDecoration: 'none' }}>
            Open dashboard
          </a>
        </div>
      </main>
    );
  }

  const latest = me?.latestClaim ?? claims[0] ?? null;
  const pending = latest?.status === 'pending';
  const rejected = latest?.status === 'rejected';
  const canSubmit = !pending || showCorrection;

  return (
    <main style={styles.page}>
      <PageHeader
        eyebrow="Claim"
        title="Claim your student record"
        subtitle={
          me?.role === 'admin'
            ? "Enter your registration number to link your student record directly without needing approval."
            : "Enter the registration number that matches your official student record. An admin must approve before results unlock."
        }
      />

      {error ? <div style={{ marginBottom: '1rem' }}><ErrorState message={error} /></div> : null}

      {pending && !showCorrection ? (
        <div style={{ ...styles.card, borderLeft: '4px solid #f97316', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700 }}>Your request is waiting on admin approval</p>
              <p style={styles.muted}>Claimed reg number: <strong>{latest?.regNumber ?? '—'}</strong></p>
            </div>
            <StatusPill status="pending" />
          </div>
          <p style={{ ...styles.muted, marginTop: '0.75rem' }}>
            Results, mark history, and the question bank stay locked until this is approved.
          </p>
          <button type="button" style={{ ...styles.buttonSecondary, marginTop: '0.75rem' }} onClick={() => setShowCorrection(true)}>
            Submit a correction
          </button>
        </div>
      ) : null}

      {rejected && !showCorrection ? (
        <div style={{ ...styles.card, borderLeft: '4px solid #dc2626', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700 }}>Your claim was rejected</p>
              <p style={styles.muted}>
                {latest?.rejectionReason?.trim()
                  ? latest.rejectionReason
                  : 'Please submit again with the correct registration number.'}
              </p>
            </div>
            <StatusPill status="rejected" />
          </div>
          <button type="button" style={{ ...styles.button, marginTop: '0.75rem' }} onClick={() => setShowCorrection(true)}>
            Submit a new claim
          </button>
        </div>
      ) : null}

      {canSubmit ? (
        <form onSubmit={submitClaim} style={{ ...styles.card, display: 'grid', gap: '1rem', maxWidth: 480 }}>
          <label style={styles.label}>
            Registration number
            <input
              style={styles.input}
              value={regNumber}
              onChange={(e) => setRegNumber(e.target.value)}
              placeholder="e.g. 2023-ENG-017"
              required
            />
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="submit"
              style={{ ...styles.button, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Spinner size={16} color="#ffffff" />
                  <span>Submitting…</span>
                </>
              ) : (
                pending ? 'Submit correction' : 'Submit claim'
              )}
            </button>
            {showCorrection && pending ? (
              <button type="button" style={styles.buttonSecondary} onClick={() => setShowCorrection(false)}>
                Cancel
              </button>
            ) : null}
          </div>
          {pending && showCorrection ? (
            <p style={{ ...styles.muted, margin: 0, fontSize: 14 }}>
              Your previous pending request stays visible to admins — this creates a new claim rather than editing the old one.
            </p>
          ) : null}
        </form>
      ) : null}

      {!latest && !canSubmit ? (
        <EmptyState title="No claim yet" body="Enter your registration number to get started." />
      ) : null}

      {claims.length > 0 ? (
        <section style={{ marginTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem' }}>Your claim history</h2>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {claims.map((claim) => (
              <article key={claim.id} style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700 }}>{claim.regNumber ?? '—'}</p>
                    <p style={{ ...styles.muted, margin: '0.25rem 0 0', fontSize: 13 }}>
                      Requested {new Date(claim.requestedAt).toLocaleString()}
                    </p>
                    {claim.rejectionReason ? (
                      <p style={{ ...styles.muted, margin: '0.35rem 0 0', fontSize: 13 }}>{claim.rejectionReason}</p>
                    ) : null}
                  </div>
                  <StatusPill status={claim.status} />
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
