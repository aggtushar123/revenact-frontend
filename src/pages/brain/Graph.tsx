import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Network, ShieldAlert, X } from 'lucide-react';
import { useAppDispatch, useAppSelector, useCapability } from '../../hooks';
import { fetchGraph } from '../../features/graph/graphSlice';
import type { GraphNode, GraphPayload, NodeKind } from '../../features/graph/graphSlice';
import { applyFilters } from '../../features/graph/filters';
import type { GraphFilters } from '../../features/graph/filters';
import { formatCompactMoney, formatDate } from '../../features/customers/formatters';
import type { CurrencyCode } from '../../features/auth/authSlice';

/**
 * The knowledge graph, drawn as columns rather than a physics simulation:
 * owners → customers → products → decisions. Every node is a real row and
 * every line a real foreign key; the layout is deterministic so the same
 * book always draws the same picture, and nothing jiggles.
 */
const COLUMNS: { kind: NodeKind[]; title: string }[] = [
  { kind: ['owner'], title: 'Owners' },
  { kind: ['customer'], title: 'Customers' },
  { kind: ['product'], title: 'Products' },
  { kind: ['initiative', 'proposal'], title: 'Decisions' },
];
const WIDTH = 1080;
const COLUMN_X = [110, 340, 600, 830];
const ROW = 30;
const TOP = 36;

const FILL: Record<string, string> = {
  owner: 'var(--color-info)',
  product: 'var(--color-accent)',
  initiative: 'var(--color-ink)',
  proposal: 'var(--color-ink-faint)',
  good: 'var(--color-success)',
  average: 'var(--color-warning)',
  poor: 'var(--color-danger)',
};

function fillFor(node: GraphNode): string {
  return node.kind === 'customer' ? FILL[node.health_category] : FILL[node.kind];
}

function radiusFor(node: GraphNode): number {
  const arr = 'arr' in node ? node.arr : 0;
  if (!arr) return 6;
  return Math.max(6, Math.min(12, 4 + Math.sqrt(arr) / 60));
}

type Placed = { node: GraphNode; x: number; y: number; r: number };

function layout(data: GraphPayload): { placed: Placed[]; height: number } {
  const placed: Placed[] = [];
  let height = 0;
  COLUMNS.forEach((column, index) => {
    const nodes = data.nodes.filter((n) => column.kind.includes(n.kind));
    nodes.forEach((node, row) => {
      placed.push({ node, x: COLUMN_X[index], y: TOP + row * ROW, r: radiusFor(node) });
    });
    height = Math.max(height, TOP + nodes.length * ROW);
  });
  return { placed, height: Math.max(height, 160) };
}

function Detail({ node, currency, neighbours, onClose }: { node: GraphNode; currency: CurrencyCode; neighbours: GraphNode[]; onClose: () => void }) {
  const money = (n: number) => formatCompactMoney(n, currency);
  const link =
    node.kind === 'customer' ? { to: `/organizations/${node.id.split(':')[1]}`, label: 'Open the organization' }
    : node.kind === 'initiative' ? { to: '/brain/initiatives', label: 'Open initiatives' }
    : node.kind === 'proposal' ? { to: '/brain/review', label: 'Open the review queue' }
    : node.kind === 'product' ? { to: '/settings/products', label: 'Open products' }
    : null;
  return (
    <aside className="bg-surface border border-line-subtle rounded-lg px-4 py-3 flex flex-col gap-2 w-full lg:w-[300px] shrink-0" aria-label={`Details for ${node.label}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">{node.kind}</div>
          <h3 className="text-[14px] font-bold text-ink">{node.label}</h3>
        </div>
        <button type="button" onClick={onClose} aria-label="Close details" className="text-ink-faint hover:text-ink">
          <X className="w-4 h-4" />
        </button>
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[12px]">
        {node.kind === 'customer' && (
          <>
            <dt className="text-ink-faint">ARR</dt><dd className="text-ink tabular-nums">{money(node.arr)}</dd>
            <dt className="text-ink-faint">Downside</dt><dd className="text-ink tabular-nums">{money(node.downside)}</dd>
            <dt className="text-ink-faint">Health</dt><dd className="text-ink">{node.health_category}{node.health_score !== null ? ` · ${node.health_score}` : ''}</dd>
            <dt className="text-ink-faint">Risk</dt><dd className="text-ink tabular-nums">{Math.round(node.risk * 100)}%</dd>
            <dt className="text-ink-faint">Renewal</dt>
            <dd className="text-ink tabular-nums">
              {node.days_to_renewal === null ? 'no date' : node.days_to_renewal < 0 ? `overdue by ${-node.days_to_renewal} days` : `in ${node.days_to_renewal} days`}
            </dd>
            <dt className="text-ink-faint">Open tasks</dt><dd className="text-ink tabular-nums">{node.open_tasks}</dd>
          </>
        )}
        {(node.kind === 'product' || node.kind === 'owner') && (
          <>
            <dt className="text-ink-faint">Customers</dt><dd className="text-ink tabular-nums">{node.customers}</dd>
            <dt className="text-ink-faint">ARR</dt><dd className="text-ink tabular-nums">{money(node.arr)}</dd>
            <dt className="text-ink-faint">Downside</dt><dd className="text-ink tabular-nums">{money(node.downside)}</dd>
          </>
        )}
        {node.kind === 'initiative' && (
          <>
            <dt className="text-ink-faint">Status</dt><dd className="text-ink">{node.status}</dd>
            <dt className="text-ink-faint">Metric</dt><dd className="text-ink">{node.metric_label}{node.member_label ? ` · ${node.member_label}` : ''}</dd>
            <dt className="text-ink-faint">Target</dt><dd className="text-ink tabular-nums">{node.target_value ?? '—'} by {formatDate(node.target_by)}</dd>
            <dt className="text-ink-faint">Owner</dt><dd className="text-ink">{node.owner ?? 'unassigned'}</dd>
          </>
        )}
        {node.kind === 'proposal' && (
          <>
            <dt className="text-ink-faint">Kind</dt><dd className="text-ink">{node.proposal_kind}</dd>
            <dt className="text-ink-faint">From</dt><dd className="text-ink">{node.from_session ? `session “${node.from_session}”` : 'the Ops agent'}</dd>
          </>
        )}
      </dl>
      {neighbours.length > 0 && (
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink-faint mb-0.5">Connected to</div>
          <ul className="text-[12px] text-ink-muted flex flex-col gap-0.5">
            {neighbours.map((n) => (
              <li key={n.id}>
                <span className="text-ink-faint">{n.kind} · </span>{n.label}
              </li>
            ))}
          </ul>
        </div>
      )}
      {link && (
        <Link to={link.to} className="text-[12px] font-semibold text-accent hover:underline">
          {link.label} →
        </Link>
      )}
    </aside>
  );
}

export function GraphPage() {
  const dispatch = useAppDispatch();
  const canSeeAll = useCapability('view_all_accounts');
  const { data, isLoading, error } = useAppSelector((s) => s.graph);
  const [selected, setSelected] = useState<string | null>(null);
  const [filters, setFilters] = useState<GraphFilters>({ onlyDownside: false, owner: null, product: null });

  useEffect(() => {
    if (canSeeAll) dispatch(fetchGraph());
  }, [dispatch, canSeeAll]);

  const shown = useMemo(() => (data ? applyFilters(data, filters) : null), [data, filters]);
  const { placed, height } = useMemo(() => (shown ? layout(shown) : { placed: [], height: 160 }), [shown]);
  const owners = useMemo(() => (data?.nodes ?? []).filter((n) => n.kind === 'owner'), [data]);
  const products = useMemo(() => (data?.nodes ?? []).filter((n) => n.kind === 'product'), [data]);
  const filtering = filters.onlyDownside || filters.owner !== null || filters.product !== null;
  const selectClass = 'px-2 py-1 bg-surface border border-line rounded-lg text-[12px] text-ink focus:outline-none focus:border-accent';
  const byId = useMemo(() => new Map(placed.map((p) => [p.node.id, p])), [placed]);
  const neighbourIds = useMemo(() => {
    if (!shown || !selected) return new Set<string>();
    const ids = new Set<string>();
    shown.edges.forEach((e) => {
      if (e.from === selected) ids.add(e.to);
      if (e.to === selected) ids.add(e.from);
    });
    return ids;
  }, [shown, selected]);
  const selectedNode = selected ? byId.get(selected)?.node ?? null : null;
  const dim = (id: string) => selected !== null && id !== selected && !neighbourIds.has(id);

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 gap-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Network className="w-4 h-4 text-accent" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">Company Brain</span>
        </div>
        <h1 className="text-[20px] font-bold text-ink tracking-tight">Knowledge graph</h1>
        <p className="text-[13px] text-ink-faint font-medium mt-0.5">
          Who owns what, what runs on which product, where the downside sits, and what has been decided about it. Every node is a real record; every line a real relation. Click a node to see its figures and neighbours.
        </p>
      </div>

      {!canSeeAll && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-warning-dim border border-warning/30 text-[12.5px] text-warning">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          The graph is organisation-wide, which needs the view-all-accounts capability.
        </div>
      )}
      {error && (
        <p className="text-[12.5px] font-semibold text-danger" role="alert">
          {error}
        </p>
      )}
      {isLoading && !data && <p className="text-[12px] text-ink-faint">Loading…</p>}

      {data && (
        <div className="flex items-center gap-3 flex-wrap text-[12px]">
          <label className="flex items-center gap-1.5 text-ink-muted">
            <input
              type="checkbox"
              checked={filters.onlyDownside}
              onChange={(e) => setFilters({ ...filters, onlyDownside: e.target.checked })}
              className="accent-[var(--color-accent)]"
            />
            Only accounts carrying downside
          </label>
          <label className="flex items-center gap-1.5 text-ink-muted">
            Owner
            <select value={filters.owner ?? ''} onChange={(e) => setFilters({ ...filters, owner: e.target.value || null })} className={selectClass} aria-label="Owner">
              <option value="">Everyone</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-ink-muted">
            Product
            <select value={filters.product ?? ''} onChange={(e) => setFilters({ ...filters, product: e.target.value || null })} className={selectClass} aria-label="Product">
              <option value="">All products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </label>
          {filtering && (
            <button type="button" onClick={() => { setFilters({ onlyDownside: false, owner: null, product: null }); setSelected(null); }} className="text-[12px] font-semibold text-accent hover:underline">
              Clear filters
            </button>
          )}
        </div>
      )}

      {data && shown && (
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          <div className="bg-surface border border-line-subtle rounded-lg overflow-x-auto flex-1 min-w-0">
            {shown.nodes.length === 0 && (
              <p className="text-[12px] text-ink-faint px-4 py-3">No accounts match these filters.</p>
            )}
            <svg viewBox={`0 0 ${WIDTH} ${height + 12}`} width="100%" style={{ minWidth: 720 }} role="img" aria-label="Knowledge graph">
              {COLUMNS.map((column, index) => (
                <text key={column.title} x={COLUMN_X[index]} y={16} textAnchor="middle" className="fill-[var(--color-ink-faint)]" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {column.title}
                </text>
              ))}
              {shown!.edges.map((edge) => {
                const a = byId.get(edge.from);
                const b = byId.get(edge.to);
                if (!a || !b) return null;
                const [l, r] = a.x <= b.x ? [a, b] : [b, a];
                const mid = (l.x + r.x) / 2;
                const active = selected !== null && (edge.from === selected || edge.to === selected);
                return (
                  <path
                    key={`${edge.from}-${edge.to}`}
                    d={`M ${l.x + l.r} ${l.y} C ${mid} ${l.y}, ${mid} ${r.y}, ${r.x - r.r} ${r.y}`}
                    fill="none"
                    stroke={active ? 'var(--color-accent)' : 'var(--color-line)'}
                    strokeWidth={active ? 1.8 : 1}
                    opacity={selected !== null && !active ? 0.25 : 1}
                    data-kind={edge.kind}
                  />
                );
              })}
              {placed.map(({ node, x, y, r }) => (
                <g
                  key={node.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${node.kind} ${node.label}`}
                  aria-pressed={selected === node.id}
                  onClick={() => setSelected(selected === node.id ? null : node.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelected(selected === node.id ? null : node.id);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                  opacity={dim(node.id) ? 0.3 : 1}
                >
                  <circle cx={x} cy={y} r={r} fill={fillFor(node)} stroke={selected === node.id ? 'var(--color-ink)' : 'var(--color-surface)'} strokeWidth={selected === node.id ? 2 : 1.5} />
                  <text x={node.kind === 'owner' ? x - r - 6 : x + r + 6} y={y + 4} textAnchor={node.kind === 'owner' ? 'end' : 'start'} className="fill-[var(--color-ink)]" style={{ fontSize: 11, fontWeight: selected === node.id ? 700 : 500 }}>
                    {node.label.length > 34 ? `${node.label.slice(0, 33)}…` : node.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          {selectedNode && (
            <Detail
              node={selectedNode}
              currency={data.currency}
              neighbours={[...neighbourIds].map((id) => byId.get(id)?.node).filter((n): n is GraphNode => Boolean(n))}
              onClose={() => setSelected(null)}
            />
          )}
        </div>
      )}
      {data && (
        <p className="text-[11px] text-ink-faint">
          Customers are coloured by health; node size follows ARR.{' '}
          {filtering && shown ? `Showing ${shown.nodes.length} of ${data.nodes.length} nodes and ${shown.edges.length} of ${data.edges.length} relations` : `${data.nodes.length} nodes, ${data.edges.length} relations`}, as of {formatDate(data.as_of)}.
        </p>
      )}
    </div>
  );
}
