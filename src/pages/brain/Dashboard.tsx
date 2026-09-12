import { Brain } from 'lucide-react';
import { MetricLayerPanel } from '../../components/brain/MetricLayerPanel';

/**
 * The Company Brain, as it actually stands.
 *
 * This page used to be a mock knowledge dashboard — invented Confluence
 * nodes, a review queue, an agent success rate — none of it backed by
 * anything. It was removed rather than kept as decoration: a page that
 * looks like a system of record and isn't one is worse than an empty page.
 *
 * What is real is the metric layer (Phase 1): every headline number defined
 * once on the backend, read from the same rollups the dashboards draw, with
 * its move since the last month-end. Phase 2 — what moved each number, and
 * signals with evidence — lands beside it.
 */
export function BrainDashboard() {
  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-6 gap-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-4 h-4 text-accent" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
            Company Brain
          </span>
        </div>
        <h1 className="text-[20px] font-bold text-ink tracking-tight">Overview</h1>
        <p className="text-[13px] text-ink-faint font-medium mt-0.5">
          The organisation's numbers, defined once — and, as history accrues, what moves them.
        </p>
      </div>

      <MetricLayerPanel />
    </div>
  );
}
