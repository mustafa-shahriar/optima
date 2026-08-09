import type { CSSProperties, ReactNode } from 'react';

export const styles = {
  page: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '2rem 1.25rem',
    fontFamily: 'Georgia, "Times New Roman", serif',
  } as CSSProperties,
  muted: { color: '#475569', lineHeight: 1.6 } as CSSProperties,
  card: {
    padding: '1.25rem',
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 8px 20px rgba(15,23,42,0.06)',
  } as CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1rem',
  } as CSSProperties,
  button: {
    border: 0,
    background: '#2563eb',
    color: '#fff',
    padding: '0.65rem 1rem',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
  } as CSSProperties,
  buttonSecondary: {
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#0f172a',
    padding: '0.65rem 1rem',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
  } as CSSProperties,
  buttonDanger: {
    border: '1px solid #fecaca',
    background: '#fff',
    color: '#dc2626',
    padding: '0.65rem 1rem',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
  } as CSSProperties,
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '0.65rem 0.75rem',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    fontSize: 15,
  } as CSSProperties,
  label: {
    display: 'grid',
    gap: '0.35rem',
    fontSize: 14,
    color: '#334155',
    fontWeight: 600,
  } as CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  } as CSSProperties,
  th: {
    textAlign: 'left',
    padding: '0.75rem',
    background: '#eff6ff',
    fontSize: 14,
  } as CSSProperties,
  td: {
    padding: '0.75rem',
    borderTop: '1px solid #e2e8f0',
    fontSize: 14,
  } as CSSProperties,
  badge: {
    display: 'inline-block',
    padding: '0.15rem 0.55rem',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  } as CSSProperties,
};

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div style={{ ...styles.card, textAlign: 'center', color: '#475569' }}>
      <p style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>{title}</p>
      {body ? <p style={{ margin: '0.5rem 0 0' }}>{body}</p> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div style={{ ...styles.card, border: '1px solid #fecaca', background: '#fef2f2' }}>
      <p style={{ margin: 0, color: '#991b1b', fontWeight: 700 }}>{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} style={{ ...styles.buttonSecondary, marginTop: '0.75rem' }}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div style={{ ...styles.card, color: '#64748b' }}>
      <p style={{ margin: 0 }}>{label}</p>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    pending: { bg: '#fff7ed', fg: '#c2410c' },
    approved: { bg: '#ecfdf5', fg: '#047857' },
    rejected: { bg: '#fef2f2', fg: '#b91c1c' },
  };
  const c = colors[status] ?? { bg: '#f1f5f9', fg: '#334155' };
  return (
    <span style={{ ...styles.badge, background: c.bg, color: c.fg }}>
      {status}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
      <div>
        {eyebrow ? (
          <p style={{ margin: 0, color: '#2563eb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: 12 }}>
            {eyebrow}
          </p>
        ) : null}
        <h1 style={{ margin: '0.35rem 0 0', fontSize: '1.85rem' }}>{title}</h1>
        {subtitle ? <p style={{ ...styles.muted, margin: '0.4rem 0 0' }}>{subtitle}</p> : null}
      </div>
      {actions}
    </header>
  );
}
