import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Edit2, Clock, ChevronRight, CheckSquare } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { approveNode, rejectNode } from '../../features/brain/brainSlice';
import { StatusBadge } from '../../components/brain/atoms/StatusBadge';
import { ConfidenceScore } from '../../components/brain/atoms/ConfidenceScore';
import { KeyboardHint } from '../../components/brain/atoms/KeyboardHint';

export function ReviewQueue() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { nodes } = useAppSelector(s => s.brain);
  const queue = nodes.filter(n => n.status === 'pending' || n.status === 'new' || n.status === 'conflicted');
  const [activeIdx, setActiveIdx] = useState(0);
  const [justApproved, setJustApproved] = useState<string | null>(null);

  const activeNode = queue[activeIdx] ?? null;

  const handleApprove = useCallback(() => {
    if (!activeNode) return;
    dispatch(approveNode(activeNode.id));
    setJustApproved(activeNode.id);
    setTimeout(() => { setJustApproved(null); setActiveIdx(i => Math.min(i, queue.length - 2)); }, 700);
  }, [activeNode, dispatch, queue.length]);

  const handleReject = useCallback(() => {
    if (!activeNode) return;
    dispatch(rejectNode(activeNode.id));
    setActiveIdx(i => Math.min(i, queue.length - 2));
  }, [activeNode, dispatch, queue.length]);

  // Keyboard shortcuts: A/E/R/J/K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
      if (e.key === 'a' || e.key === 'A') handleApprove();
      if (e.key === 'r' || e.key === 'R') handleReject();
      if (e.key === 'j' || e.key === 'J') setActiveIdx(i => Math.min(i + 1, queue.length - 1));
      if (e.key === 'k' || e.key === 'K') setActiveIdx(i => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleApprove, handleReject, queue.length]);

  const styles = {
    label: { fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' },
  };

  if (queue.length === 0) {
    return (
      <div className="brain-surface" style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', padding: '60px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckSquare size={22} color="var(--success)" />
        </div>
        <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', color: 'var(--text-primary)', margin: 0 }}>All caught up</p>
        <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>No nodes are awaiting review right now.</p>
        <button onClick={() => navigate('/brain/graph')} style={{ padding: '10px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '6px', color: 'var(--text-secondary)', fontFamily: "'DM Mono', monospace", fontSize: '12px', cursor: 'pointer' }}>
          View Knowledge Graph
        </button>
      </div>
    );
  }

  return (
    <div className="brain-surface" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '24px 32px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={styles.label}>Company Brain</span>
          <h1 className="font-display" style={{ fontSize: '24px', color: 'var(--text-primary)', margin: '4px 0 0', fontWeight: 400 }}>Review Queue</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={styles.label}>{queue.length} pending</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[['A', 'Approve'], ['R', 'Reject'], ['J/K', 'Navigate']].map(([key, label]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <KeyboardHint keys={[key]} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'var(--text-tertiary)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Split panel */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '380px 1fr', overflow: 'hidden' }}>
        {/* Left — queue list */}
        <div style={{ borderRight: '1px solid var(--border-subtle)', overflowY: 'auto' }}>
          {queue.map((node, i) => (
            <div
              key={node.id}
              onClick={() => setActiveIdx(i)}
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                background: i === activeIdx ? 'var(--bg-subtle)' : 'transparent',
                borderLeft: i === activeIdx ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 120ms',
                opacity: justApproved === node.id ? 0.3 : 1,
              }}
              onMouseEnter={e => { if (i !== activeIdx) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
              onMouseLeave={e => { if (i !== activeIdx) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>{node.name}</p>
                <ChevronRight size={13} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <StatusBadge status={node.status} type="node" />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'var(--text-tertiary)' }}>{node.domain}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>{Math.round(node.confidence * 100)}% conf</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right — node detail */}
        {activeNode && (
          <div style={{ overflowY: 'auto', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <h2 className="font-display" style={{ fontSize: '22px', color: 'var(--text-primary)', margin: '0 0 8px', fontWeight: 400 }}>{activeNode.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <StatusBadge status={activeNode.status} type="node" size="md" />
                  <span style={styles.label}>{activeNode.domain} · {activeNode.owner}</span>
                </div>
              </div>
              <ConfidenceScore score={activeNode.confidence} size="lg" animated />
            </div>

            {/* Content */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '20px' }}>
              <span style={{ ...styles.label, display: 'block', marginBottom: '12px' }}>Extracted Knowledge</span>
              <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.7, margin: 0 }}>
                {activeNode.content}
              </p>
            </div>

            {/* Sources */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '16px 20px' }}>
              <span style={{ ...styles.label, display: 'block', marginBottom: '10px' }}>Sources</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {activeNode.sources.map(src => (
                  <span key={src} style={{ padding: '4px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--text-secondary)' }}>{src}</span>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleApprove} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 20px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', color: 'var(--success)', fontFamily: "'DM Mono', monospace", fontSize: '12px', cursor: 'pointer', flex: 1, justifyContent: 'center' }}>
                <CheckCircle size={14} /> Approve <KeyboardHint keys={['A']} />
              </button>
              <button onClick={() => {}} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 20px', background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: '6px', color: 'var(--text-secondary)', fontFamily: "'DM Mono', monospace", fontSize: '12px', cursor: 'pointer', flex: 1, justifyContent: 'center' }}>
                <Edit2 size={14} /> Edit <KeyboardHint keys={['E']} />
              </button>
              <button onClick={handleReject} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 20px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px', color: 'var(--danger)', fontFamily: "'DM Mono', monospace", fontSize: '12px', cursor: 'pointer', flex: 1, justifyContent: 'center' }}>
                <XCircle size={14} /> Reject <KeyboardHint keys={['R']} />
              </button>
              <button onClick={() => {}} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 20px', background: 'none', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-tertiary)', fontFamily: "'DM Mono', monospace", fontSize: '12px', cursor: 'pointer' }}>
                <Clock size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
