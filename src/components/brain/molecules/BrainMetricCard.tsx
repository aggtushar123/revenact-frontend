import { TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  icon: React.ReactNode;
  accentColor?: string;
}

export function BrainMetricCard({ label, value, unit, trend, trendLabel, icon, accentColor = 'var(--accent)' }: Props) {
  const hasTrend = trend !== undefined;
  const isPositive = (trend ?? 0) >= 0;

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderRadius: '8px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      transition: 'border-color 200ms',
      cursor: 'default',
    }}
    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '11px',
          color: 'var(--text-tertiary)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          {label}
        </span>
        <div style={{
          width: '32px', height: '32px', borderRadius: '6px',
          background: `${accentColor}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accentColor,
        }}>
          {icon}
        </div>
      </div>

      {/* Value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '32px',
          color: 'var(--text-primary)',
          lineHeight: 1,
        }}>
          {value}
        </span>
        {unit && (
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '13px',
            color: 'var(--text-secondary)',
          }}>
            {unit}
          </span>
        )}
      </div>

      {/* Trend */}
      {hasTrend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {isPositive
            ? <TrendingUp size={13} color="var(--success)" />
            : <TrendingDown size={13} color="var(--danger)" />
          }
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '11px',
            color: isPositive ? 'var(--success)' : 'var(--danger)',
          }}>
            {isPositive ? '+' : ''}{trend}{trendLabel ?? ''}
          </span>
        </div>
      )}
    </div>
  );
}
