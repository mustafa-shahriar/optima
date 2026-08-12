import type { CSSProperties, ReactNode } from 'react';

export const styles = {
  page: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '2rem 1.25rem',
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
    <div style={{ ...styles.card, display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748b' }}>
      <Spinner size={20} color="#2563eb" />
      <p style={{ margin: 0 }}>{label}</p>
    </div>
  );
}

export function Spinner({ size = 16, color = 'currentColor', style }: { size?: number; color?: string; style?: CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="animate-spin"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" strokeOpacity="0.25" />
      <path
        d="M12 2C6.47715 2 2 6.47715 2 12C2 14.249 2.7423 16.3243 4 18"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 010-9.18l-7.98-6.19a24.04 24.04 0 000 21.56l7.98-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

export function GoogleButton({
  onClick,
  loading = false,
  text = 'Sign in with Google',
  style,
  variant = 'primary',
}: {
  onClick?: () => void;
  loading?: boolean;
  text?: string;
  style?: CSSProperties;
  variant?: 'primary' | 'secondary' | 'pill';
}) {
  const baseStyle: CSSProperties =
    variant === 'secondary'
      ? {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
          border: '1px solid #cbd5e1',
          background: '#fff',
          color: '#0f172a',
          padding: '0.75rem 1.4rem',
          borderRadius: 8,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 15,
          fontWeight: 600,
          opacity: loading ? 0.8 : 1,
          transition: 'all 0.15s ease',
        }
      : variant === 'pill'
      ? {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          border: 0,
          background: '#2563eb',
          color: '#fff',
          padding: '0.6rem 0.95rem',
          borderRadius: 999,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 500,
          fontSize: 14,
          opacity: loading ? 0.8 : 1,
          transition: 'all 0.15s ease',
        }
      : {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
          border: 0,
          background: '#2563eb',
          color: '#fff',
          padding: '0.85rem 1.4rem',
          borderRadius: 8,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 15,
          fontWeight: 600,
          opacity: loading ? 0.8 : 1,
          transition: 'all 0.15s ease',
        };

  return (
    <button type="button" onClick={onClick} disabled={loading} style={{ ...baseStyle, ...style }}>
      {loading ? (
        <>
          <Spinner size={variant === 'pill' ? 14 : 18} color={variant === 'secondary' ? '#2563eb' : '#ffffff'} />
          <span>Connecting…</span>
        </>
      ) : (
        <>
          <GoogleIcon size={variant === 'pill' ? 16 : 18} />
          <span>{text}</span>
        </>
      )}
    </button>
  );
}

/* Skeleton Loading Components */
export function Skeleton({ width = '100%', height = 20, style }: { width?: string | number; height?: string | number; style?: CSSProperties }) {
  return <span className="skeleton" style={{ width, height, ...style }} />;
}

export function CardSkeleton({ height = 120, style }: { height?: number; style?: CSSProperties }) {
  return (
    <div style={{ ...styles.card, height, display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center', ...style }}>
      <Skeleton width="40%" height={16} />
      <Skeleton width="70%" height={24} />
      <Skeleton width="50%" height={14} />
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <Skeleton width="45%" height={14} />
      <Skeleton width="30%" height={32} />
    </div>
  );
}

export function TableSkeleton({ rows = 4, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={styles.table}>
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} style={styles.th}>
                <Skeleton width="70%" height={16} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} style={styles.td}>
                  <Skeleton width={c === 0 ? '80%' : '60%'} height={16} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <Skeleton width="120px" height={14} />
        <Skeleton width="280px" height={32} />
        <Skeleton width="200px" height={16} />
      </div>
      <div style={styles.grid}>
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </div>
      <div style={styles.grid}>
        <CardSkeleton height={80} />
        <CardSkeleton height={80} />
        <CardSkeleton height={80} />
      </div>
      <div style={styles.card}>
        <Skeleton width="180px" height={22} style={{ marginBottom: '1rem' }} />
        <Skeleton width="90%" height={16} style={{ marginBottom: '0.5rem' }} />
        <Skeleton width="75%" height={16} style={{ marginBottom: '0.5rem' }} />
        <Skeleton width="60%" height={16} />
      </div>
    </div>
  );
}

export function HistorySkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <StatSkeleton />
      <TableSkeleton rows={5} cols={5} />
    </div>
  );
}

export function QuestionsSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <CardSkeleton height={140} />
      <CardSkeleton height={140} />
      <CardSkeleton height={140} />
    </div>
  );
}

export function ResultsSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton width="40%" height={22} />
          <Skeleton width="20%" height={22} />
        </div>
        <TableSkeleton rows={3} cols={3} />
      </div>
      <div style={{ ...styles.card, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton width="45%" height={22} />
          <Skeleton width="15%" height={22} />
        </div>
        <TableSkeleton rows={3} cols={3} />
      </div>
    </div>
  );
}

export function ClaimsSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <CardSkeleton height={100} />
      <CardSkeleton height={100} />
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

