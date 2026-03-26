import { MetricsPanel } from '../../components/organizations/MetricsPanel';
import { ActionBar } from '../../components/organizations/ActionBar';
import { OrganizationsTable } from '../../components/organizations/OrganizationsTable';

export function List() {
  return (
    <div className="flex flex-col h-full w-full bg-white text-[#1f2937]">
      {/* Top Metrics Area */}
      <div className="px-6 pt-6 pb-4">
        <MetricsPanel />
      </div>
      
      {/* Horizontal Divider */}
      <div className="px-6 mb-4">
        <div className="w-full h-px bg-gray-200"></div>
      </div>
      
      {/* Search and Table Area */}
      <div className="flex flex-col flex-1 overflow-hidden px-6">
        <ActionBar />
        
        <div className="flex-1 overflow-hidden mt-4 bg-white/50 relative">
           <OrganizationsTable />
        </div>
      </div>
    </div>
  );
}
