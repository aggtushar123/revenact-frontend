import { useNavigate } from 'react-router-dom';
import { Activity, CheckSquare, Clock, BarChart2, PlusCircle, Brain } from 'lucide-react';
import { useAppSelector } from '../../hooks';
import { BrainMetricCard } from '../../components/brain/molecules/BrainMetricCard';
import { DomainCoverageBar } from '../../components/brain/molecules/DomainCoverageBar';
import { BrainActivityFeed } from '../../components/brain/organisms/BrainActivityFeed';

export function BrainDashboard() {
  const navigate = useNavigate();
  const { metrics, domainCoverage, feedbackLog, connectors } = useAppSelector(s => s.brain);

  const hasConnectors = connectors.filter(c => c.status === 'connected').length > 0;

  return (
    <div className="brain-surface" style={{
      minHeight: '100%',
      padding: '32px 36px',
      display: 'flex',
      flexDirection: 'column',
      gap: '32px',
    }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <Brain size={18} color="var(--accent)" />
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '11px',
              color: 'var(--text-tertiary)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              Company Brain
            </span>
          </div>
          <h1 className="font-display" style={{
            fontSize: '28px',
            color: 'var(--text-primary)',
            margin: 0,
            fontWeight: 400,
          }}>
            Knowledge Dashboard
          </h1>
        </div>
        {metrics.nodesPendingReview > 0 && (
          <button
            onClick={() => navigate('/brain/review')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 16px',
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '6px',
              color: 'var(--warning)',
              fontFamily: "'DM Mono', monospace",
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 120ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.12)')}
          >
            <CheckSquare size={14} />
            Review Queue
            <span style={{
              background: 'var(--warning)',
              color: '#ffffff',
              borderRadius: '3px',
              padding: '1px 6px',
              fontSize: '10px',
              fontWeight: 700,
            }}>
              {metrics.nodesPendingReview}
            </span>
          </button>
        )}
      </div>

      {/* Empty state — no connectors */}
      {!hasConnectors ? (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '80px 40px',
          border: '1px dashed var(--border-default)',
          borderRadius: '12px',
          textAlign: 'center',
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'var(--accent-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Brain size={22} color="var(--accent)" />
          </div>
          <div>
            <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: 'var(--text-primary)', margin: '0 0 8px' }}>
              Connect your first data source
            </p>
            <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
              Connect a data source to start extracting institutional knowledge into the graph.
            </p>
          </div>
          <button
            onClick={() => navigate('/brain/connectors')}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: '6px',
              color: '#ffffff',
              fontFamily: "'DM Mono', monospace",
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <PlusCircle size={14} />
            Add Connector
          </button>
        </div>
      ) : (
        <>
          {/* Metric cards row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
          }}>
            <BrainMetricCard
              label="Knowledge Coverage"
              value={metrics.knowledgeCoverage}
              unit="%"
              trend={metrics.coverageTrend}
              trendLabel="% this week"
              icon={<BarChart2 size={16} />}
              accentColor="var(--accent)"
            />
            <BrainMetricCard
              label="Agent Success Rate"
              value={metrics.agentSuccessRate}
              unit="%"
              trend={+1.4}
              trendLabel="% 30d"
              icon={<Activity size={16} />}
              accentColor="var(--success)"
            />
            <BrainMetricCard
              label="Pending Review"
              value={metrics.nodesPendingReview}
              unit="nodes"
              icon={<CheckSquare size={16} />}
              accentColor="var(--warning)"
            />
            <BrainMetricCard
              label="Knowledge Freshness"
              value={metrics.freshnessScore}
              unit="days avg"
              icon={<Clock size={16} />}
              accentColor="var(--info)"
            />
          </div>

          {/* Main content — two column */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 380px',
            gap: '24px',
            alignItems: 'start',
          }}>
            {/* Left — domain coverage */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              padding: '24px',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '20px',
              }}>
                <span style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}>
                  Coverage by Domain
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {(['high', 'medium', 'low'] as const).map(level => (
                    <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '2px',
                        background: level === 'high' ? 'var(--success)' : level === 'medium' ? 'var(--warning)' : 'var(--danger)',
                      }} />
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>
                        {level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {domainCoverage.map(d => (
                <DomainCoverageBar
                  key={d.domain}
                  domain={d}
                  onClick={() => navigate('/brain/nodes')}
                />
              ))}

              {/* Quick actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => navigate('/brain/review')}
                  style={{
                    flex: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '9px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    color: 'var(--text-secondary)',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 120ms',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <CheckSquare size={13} />
                  Review Queue
                </button>
                <button
                  onClick={() => navigate('/brain/connectors')}
                  style={{
                    flex: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '9px',
                    background: 'var(--bg-subtle)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    color: 'var(--text-secondary)',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 120ms',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <PlusCircle size={13} />
                  Add Connector
                </button>
              </div>
            </div>

            {/* Right — activity feed */}
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              padding: '24px',
            }}>
              <BrainActivityFeed entries={feedbackLog.slice(0, 10)} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
