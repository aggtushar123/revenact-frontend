import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, ChevronRight } from 'lucide-react';
import { useAppSelector } from '../../hooks';
import { StatusBadge } from '../../components/brain/atoms/StatusBadge';
import { ConfidenceScore } from '../../components/brain/atoms/ConfidenceScore';
import type { NodeStatus } from '../../features/brain/types';

const DOMAINS = ['All', 'Support', 'Finance', 'Engineering', 'Operations', 'Sales', 'HR'];
const STATUSES: NodeStatus[] = ['healthy', 'stale', 'pending', 'conflicted', 'new'];

export function KnowledgeNodes() {
  const navigate = useNavigate();
  const { nodes } = useAppSelector(s => s.brain);
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<NodeStatus | 'all'>('all');

  const filtered = nodes.filter(n => {
    const matchDomain = domainFilter === 'All' || n.domain === domainFilter;
    const matchStatus = statusFilter === 'all' || n.status === statusFilter;
    const matchSearch = !search || n.name.toLowerCase().includes(search.toLowerCase());
    return matchDomain && matchStatus && matchSearch;
  });

  return (
    <div className="brain-surface" style={{ minHeight: '100%', padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Company Brain</span>
        <h1 className="font-display" style={{ fontSize: '28px', color: 'var(--text-primary)', margin: '4px 0 0', fontWeight: 400 }}>Knowledge Nodes</h1>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input type="text" placeholder="Search nodes..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '30px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '6px', color: 'var(--text-primary)', fontFamily: "'DM Mono', monospace", fontSize: '12px', outline: 'none', width: '200px' }} />
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {DOMAINS.map(d => (
            <button key={d} onClick={() => setDomainFilter(d)} style={{ padding: '5px 12px', background: domainFilter === d ? 'var(--accent)' : 'var(--bg-surface)', border: `1px solid ${domainFilter === d ? 'var(--accent)' : 'var(--border-default)'}`, borderRadius: '4px', color: domainFilter === d ? '#ffffff' : 'var(--text-secondary)', fontFamily: "'DM Mono', monospace", fontSize: '11px', cursor: 'pointer', transition: 'all 120ms' }}>
              {d}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={13} color="var(--text-tertiary)" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as NodeStatus | 'all')} style={{ padding: '6px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '4px', color: 'var(--text-secondary)', fontFamily: "'DM Mono', monospace", fontSize: '11px', outline: 'none' }}>
            <option value="all">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <span style={{ marginLeft: 'auto', fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--text-tertiary)' }}>{filtered.length} nodes</span>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 110px 110px 140px 140px 40px', padding: '10px 20px', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-elevated)' }}>
          {['Node Name', 'Domain', 'Status', 'Confidence', 'Last Updated', ''].map(h => (
            <span key={h} style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color: 'var(--text-secondary)', margin: '0 0 8px' }}>No nodes match your filters</p>
          </div>
        ) : filtered.map((node, i) => (
          <div key={node.id} onClick={() => navigate(`/brain/nodes/${node.id}`)}
            style={{ display: 'grid', gridTemplateColumns: '2fr 110px 110px 140px 140px 40px', padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none', cursor: 'pointer', transition: 'background 120ms', alignItems: 'center' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div>
              <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '13px', color: 'var(--text-primary)', margin: '0 0 2px' }}>{node.name}</p>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'var(--text-tertiary)', margin: 0 }}>{node.sources.join(' · ')}</p>
            </div>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--text-secondary)' }}>{node.domain}</span>
            <StatusBadge status={node.status} type="node" />
            <ConfidenceScore score={node.confidence} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: 'var(--text-tertiary)' }}>{node.updatedAt}</span>
            <ChevronRight size={14} color="var(--text-tertiary)" />
          </div>
        ))}
      </div>
    </div>
  );
}
