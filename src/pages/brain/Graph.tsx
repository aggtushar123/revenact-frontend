import { useEffect, useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../hooks';
import { setActiveNode, setGraphDomains, setConfidenceThreshold } from '../../features/brain/brainSlice';
import { StatusBadge } from '../../components/brain/atoms/StatusBadge';
import { ConfidenceScore } from '../../components/brain/atoms/ConfidenceScore';
import type { KnowledgeNode } from '../../features/brain/types';

const DOMAIN_COLORS: Record<string, string> = {
  Support:     '#F43F5E',
  Finance:     '#3B82F6',
  Engineering: '#F59E0B',
  Operations:  '#10B981',
  Sales:       '#8B5CF6',
  HR:          '#EF4444',
};

function GraphCanvas({ nodes, activeNodeId, onNodeClick }: {
  nodes: KnowledgeNode[];
  activeNodeId: string | null;
  onNodeClick: (id: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width = canvas.offsetWidth;
    const h = canvas.height = canvas.offsetHeight;
    const cx = w / 2, cy = h / 2;
    const DOMAIN_CENTERS: Record<string, { x: number; y: number }> = {
      Support:     { x: cx,         y: cy - 160 },
      Finance:     { x: cx + 220,   y: cy - 80  },
      Engineering: { x: cx + 200,   y: cy + 100 },
      Operations:  { x: cx,         y: cy + 170 },
      Sales:       { x: cx - 220,   y: cy + 80  },
      HR:          { x: cx - 200,   y: cy - 100 },
    };

    const pos: Record<string, { x: number; y: number; vx: number; vy: number }> = {};
    nodes.forEach(n => {
      const dc = DOMAIN_CENTERS[n.domain] ?? { x: cx, y: cy };
      pos[n.id] = { x: dc.x + (Math.random() - 0.5) * 80, y: dc.y + (Math.random() - 0.5) * 80, vx: 0, vy: 0 };
    });

    let tick = 0;
    function draw() {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      tick++;

      // Simple force simulation
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        const pa = pos[a.id];
        // Attraction to domain center
        const dc = DOMAIN_CENTERS[a.domain] ?? { x: cx, y: cy };
        pa.vx += (dc.x - pa.x) * 0.004;
        pa.vy += (dc.y - pa.y) * 0.004;
        // Repulsion between nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const pb = pos[b.id];
          const dx = pa.x - pb.x, dy = pa.y - pb.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 1400 / (dist * dist);
          pa.vx += (dx / dist) * force; pa.vy += (dy / dist) * force;
          pb.vx -= (dx / dist) * force; pb.vy -= (dy / dist) * force;
        }
        pa.vx *= 0.85; pa.vy *= 0.85;
        pa.x += pa.vx; pa.y += pa.vy;
        pa.x = Math.max(40, Math.min(w - 40, pa.x));
        pa.y = Math.max(40, Math.min(h - 40, pa.y));
      }

      // Draw edges
      nodes.forEach(n => {
        (n.relationships ?? []).forEach(rel => {
          const p1 = pos[n.id], p2 = pos[rel.targetId];
          if (!p1 || !p2) return;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(0,0,0,${rel.strength * 0.08})`;
          ctx.lineWidth = rel.strength * 1.5;
          ctx.stroke();
        });
      });

      // Draw nodes
      nodes.forEach(n => {
        const p = pos[n.id];
        if (!p) return;
        const r = 6 + n.confidence * 14;
        const color = DOMAIN_COLORS[n.domain] ?? '#9A9690';
        const isActive = n.id === activeNodeId;

        // Outer glow for active/new
        if (isActive || n.status === 'new') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, r + 6, 0, Math.PI * 2);
          ctx.fillStyle = `${color}22`;
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        const alpha = n.status === 'stale' ? '66' : 'CC';
        ctx.fillStyle = `${color}${alpha}`;
        ctx.fill();

        // Border based on status
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = isActive ? '#FFFFFF' :
          n.status === 'pending' ? '#F59E0B' :
          n.status === 'conflicted' ? '#EF4444' :
          n.status === 'stale' ? 'rgba(0,0,0,0.15)' : color;
        ctx.lineWidth = isActive ? 2.5 : n.status === 'stale' ? 1 : 1.5;
        if (n.status === 'stale') { ctx.setLineDash([4, 3]); } else { ctx.setLineDash([]); }
        ctx.stroke();
        ctx.setLineDash([]);

        // Label
        if (r > 10 || isActive) {
          ctx.fillStyle = '#4B5563';
          ctx.font = `400 10px 'DM Mono', monospace`;
          ctx.textAlign = 'center';
          const short = n.name.length > 18 ? n.name.slice(0, 16) + '…' : n.name;
          ctx.fillText(short, p.x, p.y + r + 14);
        }
      });

      setPositions(Object.fromEntries(Object.entries(pos).map(([id, v]) => [id, { x: v.x, y: v.y }])));

      if (tick < 150) animRef.current = requestAnimationFrame(draw);
      else {
        // After stabilized, just re-draw statically on hover
        drawStatic(ctx, w, h);
      }
    }

    function drawStatic(ctx: CanvasRenderingContext2D, w: number, h: number) {
      ctx.clearRect(0, 0, w, h);
      nodes.forEach(n => {
        (n.relationships ?? []).forEach(rel => {
          const p1 = pos[n.id], p2 = pos[rel.targetId];
          if (!p1 || !p2) return;
          ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(0,0,0,${rel.strength * 0.08})`; ctx.lineWidth = rel.strength * 1.5; ctx.stroke();
        });
      });
      nodes.forEach(n => {
        const p = pos[n.id];
        if (!p) return;
        const r = 6 + n.confidence * 14;
        const color = DOMAIN_COLORS[n.domain] ?? '#9A9690';
        const isActive = n.id === activeNodeId;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `${color}${n.status === 'stale' ? '66' : 'CC'}`; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = isActive ? '#FFFFFF' : n.status === 'pending' ? '#F59E0B' : n.status === 'conflicted' ? '#EF4444' : color;
        ctx.lineWidth = isActive ? 2.5 : 1.5;
        if (n.status === 'stale') ctx.setLineDash([4, 3]); else ctx.setLineDash([]);
        ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#4B5563'; ctx.font = `400 10px 'DM Mono', monospace`; ctx.textAlign = 'center';
        const short = n.name.length > 18 ? n.name.slice(0, 16) + '…' : n.name;
        ctx.fillText(short, p.x, p.y + r + 14);
      });
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [nodes, activeNodeId]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    for (const n of nodes) {
      const p = positions[n.id];
      if (!p) continue;
      const r = 6 + n.confidence * 14;
      if (Math.hypot(mx - p.x, my - p.y) <= r + 4) { onNodeClick(n.id); return; }
    }
  };

  return <canvas ref={canvasRef} onClick={handleClick} style={{ width: '100%', height: '100%', cursor: 'crosshair', display: 'block' }} />;
}

export function KnowledgeGraph() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { nodes, activeNodeId, graphFilters } = useAppSelector(s => s.brain);
  const activeNode = nodes.find(n => n.id === activeNodeId);
  const allDomains = [...new Set(nodes.map(n => n.domain))];

  const filtered = nodes.filter(n =>
    (graphFilters.domains.length === 0 || graphFilters.domains.includes(n.domain)) &&
    n.confidence >= graphFilters.confidenceThreshold
  );

  const monoStyle = { fontFamily: "'DM Mono', monospace" };

  return (
    <div className="brain-surface" style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Top controls bar */}
      <div style={{ position: 'absolute', top: 16, left: 16, right: 16, zIndex: 10, display: 'flex', alignItems: 'center', gap: '10px', pointerEvents: 'none' }}>
        {/* Domain filters */}
        <div style={{ display: 'flex', gap: '6px', pointerEvents: 'all' }}>
          {allDomains.map(d => {
            const active = graphFilters.domains.includes(d);
            return (
              <button key={d} onClick={() => dispatch(setGraphDomains(active ? graphFilters.domains.filter(x => x !== d) : [...graphFilters.domains, d]))}
                style={{ padding: '4px 10px', background: active ? DOMAIN_COLORS[d] + '22' : 'rgba(255,255,255,0.85)', border: `1px solid ${active ? DOMAIN_COLORS[d] : 'var(--border-default)'}`, borderRadius: '4px', color: active ? DOMAIN_COLORS[d] : 'var(--text-secondary)', ...monoStyle, fontSize: '11px', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                {d}
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        {/* Zoom controls */}
        <div style={{ display: 'flex', gap: '6px', pointerEvents: 'all' }}>
          {[ZoomIn, ZoomOut, Maximize2].map((Icon, i) => (
            <button key={i} style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.85)', border: '1px solid var(--border-default)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* Confidence threshold slider */}
      <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 10, background: 'rgba(255,255,255,0.9)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', backdropFilter: 'blur(8px)' }}>
        <span style={{ ...monoStyle, fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
          Min confidence: {Math.round(graphFilters.confidenceThreshold * 100)}%
        </span>
        <input type="range" min={0} max={100} value={Math.round(graphFilters.confidenceThreshold * 100)} onChange={e => dispatch(setConfidenceThreshold(parseInt(e.target.value) / 100))}
          style={{ width: '140px', accentColor: 'var(--accent)' }} />
      </div>

      {/* Canvas */}
      <GraphCanvas nodes={filtered} activeNodeId={activeNodeId} onNodeClick={id => dispatch(setActiveNode(id === activeNodeId ? null : id))} />

      {/* Node detail side panel */}
      {activeNode && (
        <div className="animate-slide-in-right" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '340px', background: 'var(--bg-elevated)', borderLeft: '1px solid var(--border-default)', overflowY: 'auto', zIndex: 20, padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <StatusBadge status={activeNode.status} type="node" size="md" />
              <h2 className="font-display" style={{ fontSize: '18px', color: 'var(--text-primary)', margin: '10px 0 4px', fontWeight: 400, lineHeight: 1.3 }}>{activeNode.name}</h2>
              <span style={{ ...monoStyle, fontSize: '11px', color: 'var(--text-tertiary)' }}>{activeNode.domain} · {activeNode.owner}</span>
            </div>
            <button onClick={() => dispatch(setActiveNode(null))} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '4px' }}>
              <X size={16} />
            </button>
          </div>

          <ConfidenceScore score={activeNode.confidence} size="md" animated />

          {activeNode.content && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '14px' }}>
              <p style={{ fontFamily: "'Lato', sans-serif", fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{activeNode.content.slice(0, 200)}…</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ ...monoStyle, fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sources</span>
            {activeNode.sources.map(s => (
              <span key={s} style={{ ...monoStyle, fontSize: '11px', color: 'var(--text-secondary)', padding: '4px 8px', background: 'var(--bg-surface)', borderRadius: '4px', border: '1px solid var(--border-subtle)', display: 'inline-block' }}>{s}</span>
            ))}
          </div>

          <button onClick={() => navigate(`/brain/nodes/${activeNode.id}`)} style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: 'var(--accent-dim)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: '6px', color: 'var(--accent)', ...monoStyle, fontSize: '12px', cursor: 'pointer' }}>
            View full detail →
          </button>
        </div>
      )}
    </div>
  );
}
