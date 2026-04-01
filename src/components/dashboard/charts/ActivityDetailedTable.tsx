
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
    case 'Positive': return 'bg-[#10b981] text-white';
    case 'Negative': return 'bg-[#ea580c] text-white'; // Dark Orange/Red
    case 'Neutral': return 'bg-[#f59e0b] text-white';  // Amber/Yellow
    default: return 'bg-gray-200 text-gray-700';
  }
};

export function ActivityDetailedTable() {
  return (
    <div className="w-full h-full p-6 flex flex-col">
      <h3 className="text-[14px] font-bold text-gray-800 mb-4">Detailed Activity Breakdown</h3>
      
      <div className="flex-1 overflow-x-auto border border-gray-200 rounded-lg max-h-[480px]">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-[#1d4ed8]">
            <tr>
              <th className="py-2.5 px-4 text-[12px] font-bold text-white border-b border-r border-[#1e40af] whitespace-nowrap">Source Type</th>
              <th className="py-2.5 px-4 text-[12px] font-bold text-white border-b border-r border-[#1e40af] whitespace-nowrap">Account Name</th>
              <th className="py-2.5 px-4 text-[12px] font-bold text-white border-b border-r border-[#1e40af] whitespace-nowrap">Sentiment</th>
              <th className="py-2.5 px-4 text-[12px] font-bold text-white border-b border-r border-[#1e40af] whitespace-nowrap">AI Area</th>
              <th className="py-2.5 px-4 text-[12px] font-bold text-white border-b border-r border-[#1e40af] whitespace-nowrap">AI Category</th>
              <th className="py-2.5 px-4 text-[12px] font-bold text-white border-b border-[#1e40af] whitespace-nowrap">AI Subcategory</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {tableData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50/80 transition-colors border-b border-gray-100 last:border-0">
                <td className="py-2 px-4 text-[13px] text-gray-600 border-r border-gray-100">{row.source}</td>
                <td className="py-2 px-4 text-[13px] text-gray-800 font-medium border-r border-gray-100 truncate max-w-[200px]">{row.account}</td>
                <td className="py-1.5 px-4 border-r border-gray-100">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${getSentimentColor(row.sentiment)}`}>
                    {row.sentiment}
                  </span>
                </td>
                <td className="py-2 px-4 text-[13px] text-gray-600 border-r border-gray-100">{row.area}</td>
                <td className="py-2 px-4 text-[13px] text-gray-600 border-r border-gray-100">{row.category}</td>
                <td className="py-2 px-4 text-[13px] text-gray-600">{row.subcategory}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
