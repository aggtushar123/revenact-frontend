import type { DomainCoverage } from '../../../features/brain/types';

interface Props {
  domain: DomainCoverage;
  onClick?: () => void;
}

const confidenceColors = {
  high:   'var(--success)',
  medium: 'var(--warning)',
  low:    'var(--danger)',
};

export function DomainCoverageBar({ domain, onClick }: Props) {
  const color = confidenceColors[domain.confidence];

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '10px 0',
        borderBottom: '1px solid var(--border-subtle)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '12px',
            color: 'var(--text-primary)',
          }}>
            {domain.domain}
          </span>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '10px',
            color: 'var(--text-tertiary)',
          }}>
            {domain.nodeCount} nodes
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '10px',
            color,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}>
            {domain.confidence}
          </span>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '12px',
            color: 'var(--text-secondary)',
          }}>
            {domain.coverage}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        width: '100%',
        height: '4px',
        background: 'rgba(255,255,255,0.06)',
        borderRadius: '2px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${domain.coverage}%`,
          height: '100%',
          background: color,
          borderRadius: '2px',
          transition: 'width 600ms cubic-bezier(0.0,0.0,0.2,1)',
        }} />
      </div>
    </div>
  );
}
