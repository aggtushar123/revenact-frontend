import { CheckCircle, AlertTriangle, XCircle, Zap } from 'lucide-react';
import type { FeedbackEntry } from '../../../features/brain/types';

interface Props {
  entries: FeedbackEntry[];
}

const outcomeConfig = {
  success:    { icon: CheckCircle,   color: 'var(--success)', label: 'Success' },
  escalation: { icon: AlertTriangle, color: 'var(--warning)', label: 'Escalated' },
  correction: { icon: XCircle,       color: 'var(--danger)', label: 'Corrected' },
};

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)   return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

export function BrainActivityFeed({ entries }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <Zap size={14} color="var(--accent)" />
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '11px',
          color: 'var(--text-tertiary)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          Live Activity
        </span>
        <div style={{
          marginLeft: 'auto',
          width: '8px', height: '8px', borderRadius: '50%',
          background: 'var(--accent)',
          animation: 'pulse-border 2s infinite',
        }} />
      </div>

      {/* Feed items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {entries.map((entry, i) => {
          const cfg = outcomeConfig[entry.outcome];
          const Icon = cfg.icon;
          return (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '10px 8px',
                borderRadius: '6px',
                transition: 'background 120ms',
                cursor: 'pointer',
                animation: `fade-up ${200 + i * 40}ms both`,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Icon size={14} color={cfg.color} style={{ marginTop: '1px', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '11px',
                    color: cfg.color,
                  }}>
                    {cfg.label}
                  </span>
                  <span style={{
                    fontFamily: "'Lato', sans-serif",
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {entry.skillName}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '10px',
                    color: 'var(--text-tertiary)',
                  }}>
                    {entry.agentId}
                  </span>
                  {entry.nodeTitle && (
                    <>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>·</span>
                      <span style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: '10px',
                        color: 'var(--accent)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {entry.nodeTitle}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <span style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '10px',
                color: 'var(--text-tertiary)',
                flexShrink: 0,
                marginTop: '2px',
              }}>
                {timeAgo(entry.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
