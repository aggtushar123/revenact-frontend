import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, BookOpen } from 'lucide-react';
import { useAppSelector } from '../../hooks';
import { StatusBadge } from '../../components/brain/atoms/StatusBadge';
import type { SkillStatus } from '../../features/brain/types';

const STATUS_OPTS: SkillStatus[] = ['draft', 'published', 'deprecated', 'under-review'];

export function SkillsLibrary() {
  const navigate = useNavigate();
  const { skills } = useAppSelector(s => s.brain);
  const [statusFilter, setStatusFilter] = useState<SkillStatus | 'all'>('all');

  const filtered = statusFilter === 'all' ? skills : skills.filter(s => s.status === statusFilter);

  return (
    <div className="brain-surface" style={{ minHeight: '100%', padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Company Brain</span>
          <h1 className="font-display" style={{ fontSize: '28px', color: 'var(--text-primary)', margin: '4px 0 0', fontWeight: 400 }}>Skills Library</h1>
        </div>
      </div>

      {/* Status filter pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {(['all', ...STATUS_OPTS] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s as SkillStatus | 'all')} style={{ padding: '5px 14px', background: statusFilter === s ? 'var(--accent)' : 'var(--bg-surface)', border: `1px solid ${statusFilter === s ? 'var(--accent)' : 'var(--border-default)'}`, borderRadius: '4px', color: statusFilter === s ? '#ffffff' : 'var(--text-secondary)', fontFamily: "'DM Mono', monospace", fontSize: '11px', cursor: 'pointer', transition: 'all 120ms', textTransform: 'capitalize' }}>
            {s === 'all' ? 'All' : s}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--text-tertiary)', alignSelf: 'center' }}>{filtered.length} skills</span>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 110px 90px 140px 130px 110px 40px', padding: '10px 20px', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-elevated)' }}>
          {['Skill Name', 'Domain', 'Version', 'Last Published', 'Agent Usage (30d)', 'Status', ''].map(h => (
            <span key={h} style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <BookOpen size={32} color="var(--text-tertiary)" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: 'var(--text-secondary)', margin: '0 0 8px' }}>No skills files yet</p>
            <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '13px', color: 'var(--text-tertiary)', margin: 0 }}>Skills are compiled once nodes are approved.</p>
          </div>
        ) : filtered.map((skill, i) => (
          <div key={skill.id} onClick={() => navigate(`/brain/skills/${skill.id}`)}
            style={{ display: 'grid', gridTemplateColumns: '2fr 110px 90px 140px 130px 110px 40px', padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none', cursor: 'pointer', transition: 'background 120ms', alignItems: 'center' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BookOpen size={13} color="var(--text-tertiary)" />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '13px', color: 'var(--text-primary)' }}>{skill.name}</span>
            </div>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--text-secondary)' }}>{skill.domain}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--text-tertiary)' }}>{skill.version}</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--text-tertiary)' }}>{skill.lastPublished ? new Date(skill.lastPublished).toLocaleDateString() : '—'}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: skill.agentUsage30d > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{skill.agentUsage30d.toLocaleString()}</span>
              {skill.agentUsage30d > 0 && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'var(--text-tertiary)' }}>calls</span>}
            </div>
            <StatusBadge status={skill.status} type="skill" />
            <ChevronRight size={14} color="var(--text-tertiary)" />
          </div>
        ))}
      </div>
    </div>
  );
}
