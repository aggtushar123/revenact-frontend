import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Edit2, Clock, User, Database, GitBranch } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { approveNode, rejectNode, markNodeStale } from '../../features/brain/brainSlice';
import { StatusBadge } from '../../components/brain/atoms/StatusBadge';
import { ConfidenceScore } from '../../components/brain/atoms/ConfidenceScore';

export function NodeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const node = useAppSelector(s => s.brain.nodes.find(n => n.id === id));
  const [approved, setApproved] = useState(false);
  const [rejected, setRejected] = useState(false);

  if (!node) {
    return (
      <div className="brain-surface" style={{ minHeight: '100%', padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: 'var(--text-secondary)' }}>Node not found</p>
      </div>
    );
  }

  const handleApprove = () => {
    dispatch(approveNode(node.id));
    setApproved(true);
    setTimeout(() => navigate('/brain/nodes'), 1200);
  };
  const handleReject = () => {
    dispatch(rejectNode(node.id));
    setRejected(true);
    setTimeout(() => navigate('/brain/nodes'), 1000);
  };

  return (
    <div className={`brain-surface ${approved ? 'animate-pulse-success' : ''}`} style={{ minHeight: '100%', padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back nav */}
      <button onClick={() => navigate('/brain/nodes')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-tertiary)', fontFamily: "'DM Mono', monospace", fontSize: '12px', cursor: 'pointer', padding: 0, width: 'fit-content' }}>
        <ArrowLeft size={14} /> Back to Nodes
      </button>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>
        {/* Left — content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h1 className="font-display" style={{ fontSize: '26px', color: 'var(--text-primary)', margin: '0 0 10px', fontWeight: 400 }}>{node.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <StatusBadge status={node.status} type="node" size="md" />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--text-tertiary)' }}>{node.domain}</span>
            </div>
          </div>

          {/* Extracted content */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '24px' }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '14px' }}>Extracted Knowledge</span>
            <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.7, margin: 0 }}>
              {node.content ?? 'No content extracted yet.'}
            </p>
          </div>

          {/* Sources */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Database size={13} color="var(--text-tertiary)" />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Source Evidence</span>
            </div>
            {node.sources.map(src => (
              <div key={src} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: 'var(--text-primary)' }}>{src}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>last synced {node.updatedAt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — metadata & actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Actions */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Actions</span>
            <button onClick={handleApprove} disabled={approved || rejected} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: approved ? 'var(--success-dim)' : 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', color: 'var(--success)', fontFamily: "'DM Mono', monospace", fontSize: '12px', cursor: 'pointer', width: '100%', transition: 'all 120ms' }}>
              <CheckCircle size={14} /> {approved ? 'Approved ✓' : 'Approve'}
            </button>
            <button onClick={() => {}} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: '6px', color: 'var(--text-secondary)', fontFamily: "'DM Mono', monospace", fontSize: '12px', cursor: 'pointer', width: '100%' }}>
              <Edit2 size={14} /> Edit + Approve
            </button>
            <button onClick={handleReject} disabled={approved || rejected} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px', color: 'var(--danger)', fontFamily: "'DM Mono', monospace", fontSize: '12px', cursor: 'pointer', width: '100%' }}>
              <XCircle size={14} /> {rejected ? 'Rejected' : 'Reject'}
            </button>
            <button onClick={() => { dispatch(markNodeStale(node.id)); navigate('/brain/nodes'); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'none', border: '1px solid var(--border-subtle)', borderRadius: '6px', color: 'var(--text-tertiary)', fontFamily: "'DM Mono', monospace", fontSize: '12px', cursor: 'pointer', width: '100%' }}>
              <Clock size={14} /> Mark Stale
            </button>
          </div>

          {/* Metadata */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Metadata</span>
            <div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'var(--text-tertiary)', margin: '0 0 4px' }}>CONFIDENCE</p>
              <ConfidenceScore score={node.confidence} size="lg" animated />
            </div>
            <div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'var(--text-tertiary)', margin: '0 0 4px' }}>OWNER</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={12} color="var(--text-secondary)" />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: 'var(--text-primary)' }}>{node.owner}</span>
              </div>
            </div>
            <div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'var(--text-tertiary)', margin: '0 0 4px' }}>LAST UPDATED</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={12} color="var(--text-secondary)" />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: 'var(--text-primary)' }}>{node.updatedAt}</span>
              </div>
            </div>
            {node.relationships && node.relationships.length > 0 && (
              <div>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'var(--text-tertiary)', margin: '0 0 6px' }}>RELATIONSHIPS</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {node.relationships.map(r => (
                    <div key={r.targetId} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <GitBranch size={11} color="var(--text-tertiary)" />
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--accent)', cursor: 'pointer' }} onClick={() => navigate(`/brain/nodes/${r.targetId}`)}>
                        {r.targetId}
                      </span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'var(--text-tertiary)' }}>
                        {Math.round(r.strength * 100)}% match
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
