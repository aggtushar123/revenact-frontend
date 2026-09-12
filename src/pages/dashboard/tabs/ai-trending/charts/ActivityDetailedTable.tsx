import type { InteractionRow } from '../../../../../features/interactions/interactionsSlice';

const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case 'Positive':
      return 'bg-success text-white';
    case 'Negative':
      return 'bg-danger text-white';
    case 'Neutral':
      return 'bg-warning text-white';
    default:
      return 'bg-line text-ink-muted';
  }
};

/** An unclassified row's taxonomy cells. A dash rather than an empty cell, so a
 *  blank reads as "nothing here yet" instead of as a rendering fault. */
const or_dash = (value: string) => value || '—';

/** The most recent interactions, newest first across emails, calls and tickets.
 *
 * Capped server-side at fifty rows — this is a "recent examples" table, not a
 * record browser, and the mock it replaces showed fifteen with no paging. The
 * `title` column is new: the mock showed six columns of categorisation and never
 * said what the interaction actually was, which made every row look the same. */
export function ActivityDetailedTable({ rows }: { rows: InteractionRow[] }) {
  return (
    <div className="w-full h-full p-6 flex flex-col">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-[14px] font-bold text-ink">Detailed Activity Breakdown</h3>
        {rows.length > 0 && (
          <span className="text-[11px] text-ink-faint">{rows.length} most recent</span>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-[12.5px] text-ink-faint">No activity matches these filters.</p>
      ) : (
        <div className="flex-1 overflow-x-auto border border-line rounded-lg max-h-[480px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-elevated">
              <tr>
                <th className="py-2.5 px-4 text-[12px] font-bold text-ink-muted border-b border-r border-line whitespace-nowrap">
                  Source Type
                </th>
                <th className="py-2.5 px-4 text-[12px] font-bold text-ink-muted border-b border-r border-line whitespace-nowrap">
                  Account Name
                </th>
                <th className="py-2.5 px-4 text-[12px] font-bold text-ink-muted border-b border-r border-line whitespace-nowrap">
                  Subject
                </th>
                <th className="py-2.5 px-4 text-[12px] font-bold text-ink-muted border-b border-r border-line whitespace-nowrap">
                  Sentiment
                </th>
                <th className="py-2.5 px-4 text-[12px] font-bold text-ink-muted border-b border-r border-line whitespace-nowrap">
                  AI Area
                </th>
                <th className="py-2.5 px-4 text-[12px] font-bold text-ink-muted border-b border-r border-line whitespace-nowrap">
                  AI Category
                </th>
                <th className="py-2.5 px-4 text-[12px] font-bold text-ink-muted border-b border-line whitespace-nowrap">
                  AI Subcategory
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-subtle/80 transition-colors border-b border-line-subtle last:border-0"
                >
                  <td className="py-2 px-4 text-[13px] text-ink-muted border-r border-line-subtle">
                    {row.source}
                  </td>
                  <td className="py-2 px-4 text-[13px] text-ink font-medium border-r border-line-subtle truncate max-w-[200px]">
                    {row.account}
                  </td>
                  <td
                    className="py-2 px-4 text-[13px] text-ink-muted border-r border-line-subtle truncate max-w-[260px]"
                    title={row.title}
                  >
                    {row.title}
                  </td>
                  <td className="py-1.5 px-4 border-r border-line-subtle">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${getSentimentColor(row.sentiment)}`}
                    >
                      {row.sentiment}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-[13px] text-ink-muted border-r border-line-subtle">
                    {or_dash(row.area)}
                  </td>
                  <td className="py-2 px-4 text-[13px] text-ink-muted border-r border-line-subtle">
                    {or_dash(row.category)}
                  </td>
                  <td className="py-2 px-4 text-[13px] text-ink-muted">
                    {or_dash(row.subcategory)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
