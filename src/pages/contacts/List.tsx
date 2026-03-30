import { useState } from 'react';
import { MetricsPanel } from '../../components/contacts/MetricsPanel';
import { ActionBar } from '../../components/contacts/ActionBar';
import { ContactsTable } from '../../components/contacts/ContactsTable';

export function List() {
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');

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
        <ActionBar 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery}
          companyFilter={companyFilter}
          setCompanyFilter={setCompanyFilter}
        />
        
        <div className="flex-1 overflow-hidden mt-4 bg-white/50 relative">
           <ContactsTable 
             searchQuery={searchQuery}
             companyFilter={companyFilter}
           />
        </div>
      </div>
    </div>
  );
}
