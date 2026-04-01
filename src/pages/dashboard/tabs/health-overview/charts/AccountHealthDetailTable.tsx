

import type { HealthDataRow } from '../mockData';

const STATUS_COLORS = {
  Poor: 'bg-red-500 text-white',
  Average: 'bg-amber-400 text-white',
  Good: 'bg-teal-500 text-white',
};

export function AccountHealthDetailTable({ data }: { data: HealthDataRow[] }) {
  return (
    <div className="w-full flex flex-col h-full bg-white relative">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
        <h3 className="text-[14px] font-bold text-gray-800">Account Health Details</h3>
      </div>
      
      <div className="flex-1 overflow-auto bg-white min-h-[400px]">
        <table className="w-full text-left border-collapse select-none">
          <thead className="sticky top-0 bg-indigo-500 z-10 shadow-sm">
            <tr>
              {['Account ID', 'Account', 'Primary Owner', 'Lifecycle Stage', 'Renewal Date', 'Health Status', 'Health Score', 'CSM Pulse Score', 'Latest Pulse Modified', 'AI Pulse Score', 'AI Pulse Reason'].map((heading, idx) => (
                <th key={idx} className={`py-2 px-3 text-[11px] font-bold text-white uppercase tracking-wider ${idx === 0 ? 'w-[70px] text-right pr-4' : ''}`}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-sm text-gray-400">
                  No accounts match the current filter.
                </td>
              </tr>
            ) : data.map((row) => (
              <tr 
                key={row.id} 
                className="hover:bg-gray-50/70 transition-colors group cursor-default"
              >
                <td className="py-2.5 px-3 text-[12px] font-medium text-gray-500 text-right pr-4">
                  {row.id}
                </td>
                <td className="py-2.5 px-3 text-[12px] font-medium text-gray-900">
                  {row.account}
                </td>
                <td className="py-2.5 px-3 text-[12px] text-gray-700">
                  {row.owner}
                </td>
                <td className="py-2.5 px-3 text-[12px] text-gray-600">
                  {row.lifecycleStage}
                </td>
                <td className="py-2.5 px-3 text-[12px] text-gray-500 font-medium">
                  {row.renewalDate}
                </td>
                <td className="py-2.5 px-3">
                  <span className={`inline-flex px-6 py-0.5 rounded-sm text-[11px] font-medium shadow-sm w-[72px] justify-center ${STATUS_COLORS[row.healthStatus]}`}>
                    {row.healthStatus}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-[12px] text-gray-700 text-center">
                  {row.healthScore}
                </td>
                <td className="py-2.5 px-3 text-[12px] text-gray-700 text-center">
                  {row.csmPulseScore}
                </td>
                <td className="py-2.5 px-3 text-[12px] text-gray-500 font-medium whitespace-nowrap">
                  {row.lastPulseModified}
                </td>
                <td className="py-2.5 px-3 text-[12px] text-gray-700 text-center">
                  {row.aiPulseScore}
                </td>
                <td className="py-2.5 px-3 text-[11px] text-gray-500 max-w-[280px] truncate" title={row.aiPulseReason}>
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
