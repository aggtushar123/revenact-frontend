

import type { HealthDataRow } from '../mockData';

const STATUS_COLORS = {
  Poor: 'bg-danger text-[#0D0F0E]',
  Average: 'bg-warning text-[#0D0F0E]',
  Good: 'bg-success text-[#0D0F0E]',
};

export function AccountHealthDetailTable({ data }: { data: HealthDataRow[] }) {
  return (
    <div className="w-full flex flex-col h-full bg-surface relative">
      <div className="flex items-center justify-between p-4 border-b border-line-subtle shrink-0">
        <h3 className="text-[14px] font-bold text-ink">Account Health Details</h3>
      </div>
      
      <div className="flex-1 overflow-auto bg-surface min-h-[400px]">
        <table className="w-full text-left border-collapse select-none">
          <thead className="sticky top-0 bg-elevated z-10 shadow-sm border-b border-line">
            <tr>
              {['Account ID', 'Account', 'Primary Owner', 'Lifecycle Stage', 'Renewal Date', 'Health Status', 'Health Score', 'CSM Pulse Score', 'Latest Pulse Modified', 'AI Pulse Score', 'AI Pulse Reason'].map((heading, idx) => (
                <th key={idx} className={`py-2 px-3 text-[11px] font-mono font-bold text-ink-muted uppercase tracking-wider ${idx === 0 ? 'w-[70px] text-right pr-4' : ''}`}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line-subtle">
            {data.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-sm text-ink-faint">
                  No accounts match the current filter.
                </td>
              </tr>
            ) : data.map((row) => (
              <tr 
                key={row.id} 
                className="hover:bg-subtle transition-colors group cursor-default"
              >
                <td className="py-2.5 px-3 text-[12px] font-medium text-ink-muted text-right pr-4">
                  {row.id}
                </td>
                <td className="py-2.5 px-3 text-[12px] font-medium text-ink">
                  {row.account}
                </td>
                <td className="py-2.5 px-3 text-[12px] text-ink-muted">
                  {row.owner}
                </td>
                <td className="py-2.5 px-3 text-[12px] text-ink-muted">
                  {row.lifecycleStage}
                </td>
                <td className="py-2.5 px-3 text-[12px] text-ink-muted font-medium">
                  {row.renewalDate}
                </td>
                <td className="py-2.5 px-3">
                  <span className={`inline-flex px-6 py-0.5 rounded-sm text-[11px] font-medium shadow-sm w-[72px] justify-center ${STATUS_COLORS[row.healthStatus]}`}>
                    {row.healthStatus}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-[12px] text-ink-muted text-center">
                  {row.healthScore}
                </td>
                <td className="py-2.5 px-3 text-[12px] text-ink-muted text-center">
                  {row.csmPulseScore}
                </td>
                <td className="py-2.5 px-3 text-[12px] text-ink-muted font-medium whitespace-nowrap">
                  {row.lastPulseModified}
                </td>
                <td className="py-2.5 px-3 text-[12px] text-ink-muted text-center">
                  {row.aiPulseScore}
                </td>
                <td className="py-2.5 px-3 text-[11px] text-ink-muted max-w-[280px] truncate" title={row.aiPulseReason}>
                  {row.aiPulseReason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
