import { getResults } from '@/lib/data';

export default async function ResultsPage() {
  const results = await getResults();

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.25rem', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ marginTop: 0 }}>Results overview</h1>
      <p style={{ color: '#475569' }}>A structured view of course totals and grades.</p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 12, overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#eff6ff' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Course</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Term</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Total</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Grade</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row, index) => (
              <tr key={`${row.course ?? 'course'}-${row.term}-${index}`} style={{ borderTop: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.75rem' }}>{row.course ?? 'Untitled course'}</td>
                <td style={{ padding: '0.75rem' }}>{row.term}</td>
                <td style={{ padding: '0.75rem' }}>{row.total}</td>
                <td style={{ padding: '0.75rem' }}>{row.grade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
