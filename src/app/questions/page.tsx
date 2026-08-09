import { getQuestions } from '@/lib/data';

export default async function QuestionsPage() {
  const questions = await getQuestions();

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.25rem', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ marginTop: 0 }}>Question bank</h1>
      <p style={{ color: '#475569' }}>Browse course questions and instructor notes.</p>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {questions.map((entry, index) => (
          <article key={`${entry.course ?? 'question'}-${index}`} style={{ padding: '1rem', background: '#fff', borderRadius: 12, boxShadow: '0 8px 20px rgba(15,23,42,0.06)' }}>
            <h3 style={{ marginTop: 0 }}>{entry.course ?? 'Untitled course'}</h3>
            <p style={{ margin: '0.25rem 0', color: '#64748b' }}>{entry.instructor} · {entry.term ?? '—'}</p>
            <p>{entry.body ?? 'No question text provided.'}</p>
            {entry.attachment ? <p style={{ color: '#2563eb' }}>Attachment: {entry.attachment}</p> : null}
          </article>
        ))}
      </div>
    </main>
  );
}
