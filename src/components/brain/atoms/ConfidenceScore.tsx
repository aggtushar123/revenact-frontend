interface Props {
  score: number;   // 0–1
  trend?: number;  // optional delta
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export function ConfidenceScore({ score, trend, size = 'md', animated = false }: Props) {
  const pct = Math.round(score * 100);

  const color = pct >= 80 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--danger)';
  const bgColor = pct >= 80 ? 'rgba(16,185,129,0.1)' : pct >= 60 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';

  const fontSize = size === 'lg' ? '22px' : size === 'md' ? '15px' : '12px';
  const trackHeight = size === 'lg' ? '4px' : '3px';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize,
            fontWeight: 500,
            color,
            background: bgColor,
            padding: '2px 7px',
            borderRadius: '3px',
          }}
          className={animated ? 'animate-count-up' : ''}
          aria-label={`Confidence: ${pct}%`}
        >
          {pct}%
        </span>
        {trend !== undefined && (
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '11px',
            color: trend >= 0 ? 'var(--success)' : 'var(--danger)',
          }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}
          </span>
        )}
      </div>
      {/* Mini progress bar */}
      <div style={{
        width: '100%',
        height: trackHeight,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: '2px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: color,
          borderRadius: '2px',
          transition: 'width 600ms cubic-bezier(0.0,0.0,0.2,1)',
        }} />
      </div>
    </div>
  );
}
