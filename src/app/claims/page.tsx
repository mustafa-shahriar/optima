import { getClaims } from '@/lib/data';

export default async function ClaimsPage() {
  const claims = await getClaims();

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.25rem', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ marginTop: 0 }}>Claim review queue</h1>
      <p style={{ color: '#475569' }}>Review pending claims and manage the approval workflow.</p>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {claims.map((claim, index) => (
          <article key={`${claim.email ?? 'claim'}-${index}`} style={{ padding: '1rem', background: '#fff', borderRadius: 12, boxShadow: '0 8px 20px rgba(15,23,42,0.06)' }}>
            <p style={{ margin: 0, fontWeight: 700 }}>{claim.email ?? 'Unknown'}</p>
            <p style={{ margin: '0.25rem 0 0', color: '#475569' }}>Requested reg number: {claim.regNumber ?? '—'}</p>
            <p style={{ margin: '0.25rem 0 0', color: '#2563eb' }}>Status: {claim.status}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
