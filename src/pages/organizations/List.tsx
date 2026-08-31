import { MetricsPanel } from '../../components/organizations/MetricsPanel';
import { ActionBar } from '../../components/organizations/ActionBar';
import { OrganizationsTable } from '../../components/organizations/OrganizationsTable';

export function List() {
  return (
    <div className="flex flex-col h-full w-full bg-white text-[#1f2937]">
      {/* Glass Metrics Banner */}
      <div className="px-6 pt-5 pb-4">
        <MetricsPanel />
      </div>
      
      {/* Search and Table Area */}
      <div className="flex flex-col flex-1 overflow-hidden px-6">
        <ActionBar />
        
        <div className="flex-1 overflow-hidden mt-3 relative">
          <OrganizationsTable />
        </div>
      </div>
    </div>
  );
}
