"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClaimsSkeleton, EmptyState, ErrorState, PageHeader, Spinner, StatusPill, styles } from '@/components/ui';

interface Claim {
  id: number;
  email: string | null;
  userName: string | null;
  regNumber: string | null;
  studentName: string | null;
  studentId: number;
  status: string;
  requestedAt: string;
  rejectionReason: string | null;
}

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/claims?status=pending');
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      setClaims(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load claims');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const groups = useMemo(() => {
    const map = new Map<number, Claim[]>();
    for (const claim of claims) {
      const list = map.get(claim.studentId) ?? [];
      list.push(claim);
      map.set(claim.studentId, list);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [claims]);

  const decide = async (claimId: number, decision: 'approved' | 'rejected') => {
    setBusyId(claimId);
    setError(null);
    try {
      const res = await fetch(`/api/claims/${claimId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          rejectionReason: decision === 'rejected' ? (rejectReasons[claimId] || null) : null,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update claim');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main style={styles.page}>
      <PageHeader
        eyebrow="Admin"
        title="Claim review queue"
        subtitle="Duplicate claims for the same reg number are grouped so you can resolve conflicts carefully."
      />

      {error ? <div style={{ marginBottom: '1rem' }}><ErrorState message={error} onRetry={load} /></div> : null}
      {loading ? <ClaimsSkeleton /> : null}

      {!loading && claims.length === 0 ? (
        <EmptyState title="No pending claims" body="New student claim requests will show up here." />
      ) : null}

      <div style={{ display: 'grid', gap: '1.25rem' }}>
        {groups.map(([studentId, group]) => {
          const duplicate = group.length > 1;
          return (
            <section
              key={studentId}
              style={{
                ...styles.card,
                border: duplicate ? '1px solid #fdba74' : undefined,
                background: duplicate ? '#fff7ed' : '#fff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: 0 }}>
                    {group[0].regNumber ?? 'Unknown reg'} — {group[0].studentName ?? 'Student record'}
                  </h3>
                  {duplicate ? (
                    <p style={{ margin: '0.35rem 0 0', color: '#c2410c', fontWeight: 700, fontSize: 14 }}>
                      Duplicate claim — {group.length} users requested this reg number. Talk to the students before approving either one.
                    </p>
                  ) : null}
                </div>
              </div>

              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {group.map((claim) => (
                  <article key={claim.id} style={{ ...styles.card, boxShadow: 'none', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700 }}>{claim.email ?? 'Unknown email'}</p>
                        <p style={{ ...styles.muted, margin: '0.25rem 0 0', fontSize: 13 }}>
                          {claim.userName ?? '—'} · requested {new Date(claim.requestedAt).toLocaleString()}
                        </p>
                      </div>
                      <StatusPill status={claim.status} />
                    </div>

                    <label style={{ ...styles.label, marginTop: '0.75rem' }}>
                      Rejection reason (optional)
                      <input
                        style={styles.input}
                        value={rejectReasons[claim.id] ?? ''}
                        onChange={(e) => setRejectReasons({ ...rejectReasons, [claim.id]: e.target.value })}
                        placeholder="Shown to the student if you reject"
                      />
                    </label>

                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        style={{ ...styles.button, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        disabled={busyId === claim.id}
                        onClick={() => decide(claim.id, 'approved')}
                      >
                        {busyId === claim.id ? <Spinner size={14} color="#ffffff" /> : null}
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        style={{ ...styles.buttonDanger, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        disabled={busyId === claim.id}
                        onClick={() => decide(claim.id, 'rejected')}
                      >
                        {busyId === claim.id ? <Spinner size={14} color="#dc2626" /> : null}
                        <span>Reject</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
