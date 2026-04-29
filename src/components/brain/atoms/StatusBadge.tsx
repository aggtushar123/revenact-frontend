import type { NodeStatus, SkillStatus, ConnectorStatus } from '../../../features/brain/types';

type StatusConfig = {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
};

const nodeStatusMap: Record<NodeStatus, StatusConfig> = {
  healthy:   { label: 'Healthy',    bg: 'rgba(16,185,129,0.12)',  text: 'var(--success)', border: 'rgba(16,185,129,0.3)',  dot: 'var(--success)' },
  stale:     { label: 'Stale',      bg: 'rgba(92,90,87,0.2)',     text: '#9A9690', border: 'rgba(92,90,87,0.3)',    dot: '#9A9690' },
  pending:   { label: 'Pending',    bg: 'rgba(245,158,11,0.12)',  text: 'var(--warning)', border: 'rgba(245,158,11,0.3)',  dot: 'var(--warning)' },
  conflicted:{ label: 'Conflicted', bg: 'rgba(239,68,68,0.12)',   text: 'var(--danger)', border: 'rgba(239,68,68,0.3)',   dot: 'var(--danger)' },
  new:       { label: 'New',        bg: 'rgba(244,63,94,0.12)',  text: 'var(--accent)', border: 'rgba(244,63,94,0.3)',  dot: 'var(--accent)' },
};

const skillStatusMap: Record<SkillStatus, StatusConfig> = {
  published:     { label: 'Published',    bg: 'rgba(16,185,129,0.12)', text: 'var(--success)', border: 'rgba(16,185,129,0.3)',  dot: 'var(--success)' },
  draft:         { label: 'Draft',        bg: 'rgba(59,130,246,0.12)', text: 'var(--info)', border: 'rgba(59,130,246,0.3)', dot: 'var(--info)' },
  deprecated:    { label: 'Deprecated',   bg: 'rgba(92,90,87,0.2)',    text: '#9A9690', border: 'rgba(92,90,87,0.3)',   dot: '#9A9690' },
  'under-review':{ label: 'Under Review', bg: 'rgba(245,158,11,0.12)', text: 'var(--warning)', border: 'rgba(245,158,11,0.3)', dot: 'var(--warning)' },
};

const connectorStatusMap: Record<ConnectorStatus, StatusConfig> = {
  connected:    { label: 'Connected',    bg: 'rgba(16,185,129,0.12)',  text: 'var(--success)', border: 'rgba(16,185,129,0.3)',  dot: 'var(--success)' },
  disconnected: { label: 'Disconnected', bg: 'rgba(92,90,87,0.2)',     text: '#9A9690', border: 'rgba(92,90,87,0.3)',    dot: '#9A9690' },
  error:        { label: 'Error',        bg: 'rgba(239,68,68,0.12)',   text: 'var(--danger)', border: 'rgba(239,68,68,0.3)',   dot: 'var(--danger)' },
};

interface Props {
  status: NodeStatus | SkillStatus | ConnectorStatus;
  type?: 'node' | 'skill' | 'connector';
  size?: 'sm' | 'md';
  showDot?: boolean;
}

export function StatusBadge({ status, type = 'node', size = 'sm', showDot = true }: Props) {
  const map = type === 'skill' ? skillStatusMap : type === 'connector' ? connectorStatusMap : nodeStatusMap;
  const cfg = (map as Record<string, StatusConfig>)[status] ?? nodeStatusMap.healthy;

  const padding = size === 'md' ? '4px 10px' : '3px 8px';
  const fontSize = size === 'md' ? '12px' : '11px';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding,
        background: cfg.bg,
        color: cfg.text,
        border: `1px solid ${cfg.border}`,
        borderRadius: '4px',
        fontSize,
        fontFamily: "'DM Mono', monospace",
        fontWeight: 500,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
      aria-label={`Status: ${cfg.label}`}
    >
      {showDot && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: cfg.dot,
            flexShrink: 0,
          }}
        />
      )}
      {cfg.label}
    </span>
  );
}
