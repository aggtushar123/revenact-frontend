
const tableData = [
  { source: 'Call', account: 'Hyatt Regency Brand Portfolio', sentiment: 'Neutral', area: 'Product & Growth', category: 'Security & Compliance', subcategory: 'Data Privacy' },
  { source: 'Call', account: 'FMC R&D and Regulatory Affairs', sentiment: 'Positive', area: 'Product & Growth', category: 'Bug Report', subcategory: 'Performance Iss' },
  { source: 'Call', account: 'Arista EOS Software Engineering Division', sentiment: 'Positive', area: 'Customer Success', category: 'Account Management', subcategory: 'Plan Upgrade' },
  { source: 'Call', account: 'FMC Global Sustainability & ESG Office', sentiment: 'Neutral', area: 'Customer Success', category: 'Integration Support', subcategory: 'API Issue' },
  { source: 'Call', account: 'Kroger Manufacturing Division (33 U.S. Plants)', sentiment: 'Positive', area: 'Customer Success', category: 'Reporting & Analytics', subcategory: 'Export Problem' },
  { source: 'Call', account: 'Hyatt Place / Hyatt House Portfolio', sentiment: 'Negative', area: 'Support & Operations', category: 'Onboarding', subcategory: 'Setup Assistance' },
  { source: 'Call', account: 'Valvoline R&D - Engine Oils & Chemicals Division', sentiment: 'Positive', area: 'Product & Growth', category: 'Account Management', subcategory: 'User Access' },
  { source: 'Call', account: 'Arista EOS Software Engineering Division', sentiment: 'Positive', area: 'Customer Success', category: 'Bug Report', subcategory: 'Backend Failure' },
  { source: 'Call', account: 'Hyatt Place / Hyatt House Portfolio', sentiment: 'Positive', area: 'Customer Success', category: 'Onboarding', subcategory: 'Training Request' },
  { source: 'Call', account: 'Kroger Manufacturing Division (33 U.S. Plants)', sentiment: 'Negative', area: 'Customer Success', category: 'Feature Request', subcategory: 'UI Enhancement' },
  { source: 'Call', account: 'Arista EOS Software Engineering Division', sentiment: 'Neutral', area: 'Customer Success', category: 'System Notification', subcategory: 'Alert Fatigue' },
  { source: 'Call', account: 'FMC Global Sustainability & ESG Office', sentiment: 'Positive', area: 'Product & Growth', category: 'System Notification', subcategory: 'Notification Del' },
  { source: 'Call', account: 'Hyatt Regency Brand Portfolio', sentiment: 'Neutral', area: 'Customer Success', category: 'Integration Support', subcategory: 'API Issue' },
  { source: 'Call', account: 'FMC Agricultural Solutions - Latin America', sentiment: 'Positive', area: 'Customer Success', category: 'Integration Support', subcategory: 'Webhook Failure' },
  { source: 'Call', account: 'FMC Global Sustainability & ESG Office', sentiment: 'Neutral', area: 'Product & Growth', category: 'Feature Request', subcategory: 'New Integration' },
];

const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case 'Positive': return 'bg-success text-white';
    case 'Negative': return 'bg-danger text-white'; // Dark Orange/Red
    case 'Neutral': return 'bg-warning text-white';  // Amber/Yellow
    default: return 'bg-line text-ink-muted';
  }
};

export function ActivityDetailedTable() {
  return (
    <div className="w-full h-full p-6 flex flex-col">
      <h3 className="text-[14px] font-bold text-ink mb-4">Detailed Activity Breakdown</h3>
      
      <div className="flex-1 overflow-x-auto border border-line rounded-lg max-h-[480px]">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-elevated">
            <tr>
              <th className="py-2.5 px-4 text-[12px] font-bold text-ink-muted border-b border-r border-line whitespace-nowrap">Source Type</th>
              <th className="py-2.5 px-4 text-[12px] font-bold text-ink-muted border-b border-r border-line whitespace-nowrap">Account Name</th>
              <th className="py-2.5 px-4 text-[12px] font-bold text-ink-muted border-b border-r border-line whitespace-nowrap">Sentiment</th>
              <th className="py-2.5 px-4 text-[12px] font-bold text-ink-muted border-b border-r border-line whitespace-nowrap">AI Area</th>
              <th className="py-2.5 px-4 text-[12px] font-bold text-ink-muted border-b border-r border-line whitespace-nowrap">AI Category</th>
              <th className="py-2.5 px-4 text-[12px] font-bold text-ink-muted border-b border-line whitespace-nowrap">AI Subcategory</th>
            </tr>
          </thead>
          <tbody className="bg-surface">
            {tableData.map((row, idx) => (
              <tr key={idx} className="hover:bg-subtle/80 transition-colors border-b border-line-subtle last:border-0">
                <td className="py-2 px-4 text-[13px] text-ink-muted border-r border-line-subtle">{row.source}</td>
                <td className="py-2 px-4 text-[13px] text-ink font-medium border-r border-line-subtle truncate max-w-[200px]">{row.account}</td>
                <td className="py-1.5 px-4 border-r border-line-subtle">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${getSentimentColor(row.sentiment)}`}>
                    {row.sentiment}
                  </span>
                </td>
                <td className="py-2 px-4 text-[13px] text-ink-muted border-r border-line-subtle">{row.area}</td>
                <td className="py-2 px-4 text-[13px] text-ink-muted border-r border-line-subtle">{row.category}</td>
                <td className="py-2 px-4 text-[13px] text-ink-muted">{row.subcategory}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
