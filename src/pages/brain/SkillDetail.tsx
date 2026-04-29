import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Archive, GitBranch, Activity, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { publishSkill, deprecateSkill } from '../../features/brain/brainSlice';
import { StatusBadge } from '../../components/brain/atoms/StatusBadge';

export function SkillDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const skill = useAppSelector(s => s.brain.skills.find(sk => sk.id === id));
  const [tab, setTab] = useState<'current' | 'diff'>('current');
  const [published, setPublished] = useState(false);

  if (!skill) {
    return (
      <div className="brain-surface" style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: 'var(--text-secondary)' }}>Skill not found</p>
      </div>
    );
  }

  const handlePublish = () => {
    dispatch(publishSkill(skill.id));
    setPublished(true);
    setTimeout(() => setPublished(false), 1500);
  };

  const monoStyle = { fontFamily: "'DM Mono', monospace", fontSize: '12px' };
  const labelStyle = { fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };

  return (
    <div className={`brain-surface ${published ? 'animate-pulse-success' : ''}`} style={{ minHeight: '100%', padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <button onClick={() => navigate('/brain/skills')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-tertiary)', ...monoStyle, cursor: 'pointer', padding: 0, width: 'fit-content' }}>
        <ArrowLeft size={14} /> Back to Skills
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ ...monoStyle, fontSize: '22px', color: 'var(--text-primary)', margin: '0 0 10px', letterSpacing: '-0.02em' }}>{skill.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <StatusBadge status={skill.status} type="skill" size="md" />
            <span style={{ ...monoStyle, fontSize: '11px', color: 'var(--text-tertiary)' }}>{skill.version}</span>
            <span style={{ ...monoStyle, fontSize: '11px', color: 'var(--text-tertiary)' }}>·</span>
            <span style={{ ...monoStyle, fontSize: '11px', color: 'var(--text-tertiary)' }}>{skill.domain}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {skill.status !== 'published' && (
            <button onClick={handlePublish} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '6px', color: 'var(--success)', ...monoStyle, cursor: 'pointer' }}>
              <Upload size={13} /> {published ? 'Published!' : 'Publish'}
            </button>
          )}
          {skill.status === 'published' && (
            <button onClick={() => dispatch(deprecateSkill(skill.id))} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: '6px', color: 'var(--text-secondary)', ...monoStyle, cursor: 'pointer' }}>
              <Archive size={13} /> Deprecate
            </button>
          )}
          <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: '6px', color: 'var(--text-secondary)', ...monoStyle, cursor: 'pointer' }}>
            <GitBranch size={13} /> New Version
          </button>
        </div>
      </div>

      {/* Agent outcome stats */}
      {skill.successRate !== null && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { label: 'Success Rate', value: `${Math.round((skill.successRate ?? 0) * 100)}%`, icon: <Activity size={14} />, color: 'var(--success)' },
            { label: 'Escalation Rate', value: `${Math.round((skill.escalationRate ?? 0) * 100)}%`, icon: <AlertTriangle size={14} />, color: 'var(--warning)' },
            { label: 'Correction Rate', value: `${Math.round((skill.correctionRate ?? 0) * 100)}%`, icon: <RefreshCw size={14} />, color: 'var(--danger)' },
          ].map(m => (
            <div key={m.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', color: m.color }}>
                {m.icon}
                <span style={labelStyle}>{m.label}</span>
              </div>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', color: m.color }}>{m.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Code viewer with tabs */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', overflow: 'hidden' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-default)' }}>
          {[{ key: 'current', label: 'Current Version' }, { key: 'diff', label: 'Diff View' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as 'current' | 'diff')} style={{ padding: '12px 20px', background: 'none', border: 'none', borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent', color: tab === t.key ? 'var(--accent)' : 'var(--text-tertiary)', ...monoStyle, cursor: 'pointer', transition: 'color 120ms' }}>
              {t.label}
            </button>
          ))}
          {skill.usedByAgents && skill.usedByAgents.length > 0 && (
            <span style={{ ...monoStyle, fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: 'auto', alignSelf: 'center', paddingRight: '20px' }}>
              Used by {skill.usedByAgents.length} agent{skill.usedByAgents.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {tab === 'current' ? (
          <pre style={{ margin: 0, padding: '24px', overflowX: 'auto', ...monoStyle, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.7, background: 'transparent' }}>
            <code>{skill.yamlContent}</code>
          </pre>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {[{ label: 'Previous', content: skill.previousYamlContent, isOld: true }, { label: 'Current', content: skill.yamlContent, isOld: false }].map(panel => (
              <div key={panel.label} style={{ borderRight: panel.isOld ? '1px solid var(--border-default)' : 'none' }}>
                <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                  <span style={labelStyle}>{panel.label}</span>
                </div>
                <pre style={{ margin: 0, padding: '20px', overflowX: 'auto', ...monoStyle, fontSize: '12px', color: panel.isOld ? 'var(--text-secondary)' : 'var(--text-primary)', lineHeight: 1.7, background: 'transparent' }}>
                  <code>{panel.content ?? '—'}</code>
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Used by agents */}
      {skill.usedByAgents && skill.usedByAgents.length > 0 && (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '20px' }}>
          <span style={{ ...labelStyle, display: 'block', marginBottom: '12px' }}>Used by Agents</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {skill.usedByAgents.map(a => (
              <span key={a} style={{ padding: '4px 12px', background: 'var(--accent-dim)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '4px', ...monoStyle, color: 'var(--accent)' }}>{a}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
