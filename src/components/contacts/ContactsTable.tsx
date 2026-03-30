import { useState, useMemo } from 'react';
import { CONTACTS_DATA } from '../organizations/contactsData';
import { MoreHorizontal, ArrowDownUp, Mail, Phone, Clock, Building } from 'lucide-react';

interface ContactsTableProps {
  searchQuery: string;
  companyFilter: string;
}

const ORG_MAP: Record<number, string> = {
  1: 'Apple',
  2: 'Pizza Hut',
  3: 'Kraft Heinz'
};

export function ContactsTable({ searchQuery, companyFilter }: ContactsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const filteredData = useMemo(() => {
    return CONTACTS_DATA.filter((contact) => {
      const companyName = ORG_MAP[contact.orgId] || 'Unknown';
      const exactMatchCompany = !companyFilter || companyName === companyFilter;
      
      const lowerQuery = searchQuery.toLowerCase();
      const matchesSearch = !lowerQuery || 
        contact.name.toLowerCase().includes(lowerQuery) ||
        contact.email.toLowerCase().includes(lowerQuery) ||
        contact.role.toLowerCase().includes(lowerQuery) ||
        companyName.toLowerCase().includes(lowerQuery);

      return exactMatchCompany && matchesSearch;
    });
  }, [searchQuery, companyFilter]);

  const rowsPerPage = 5;
  const totalRows = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  
  const validCurrentPage = Math.min(currentPage, totalPages > 0 ? totalPages : 1);
  
  const startIndex = (validCurrentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const getSentimentColor = (sentiment: string) => {
    switch(sentiment) {
      case 'Positive': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Negative': return 'bg-rose-50 text-rose-600 border-rose-200';
      case 'Neutral': return 'bg-amber-50 text-amber-600 border-amber-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusIndicator = (status: string) => {
    return status === 'Active' ? 'bg-emerald-500' : 'bg-gray-300';
  };

  return (
    <div className="w-full h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col relative z-0">
      <div className="overflow-x-auto overflow-y-auto w-full flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-max relative pb-16">
          <thead className="text-[12px] font-bold text-gray-700 bg-white shadow-[0_1px_0_0_#f3f4f6]">
            <tr>
              <th className="px-6 py-4 font-bold border-b border-gray-100 sticky left-0 z-20 bg-white shadow-[1px_0_0_0_#ebebeb]">
                <div className="flex items-center gap-4">
                  <div className="w-[14px] h-[14px] rounded-[4px] border border-gray-200 shadow-sm cursor-pointer hover:border-indigo-400"></div>
                  <span className="flex items-center gap-1.5 cursor-pointer">Contact Name <ArrowDownUp className="w-[11px] h-[11px] text-gray-400" /></span>
                </div>
              </th>
              
              <th className="px-6 py-4 font-bold border-b border-gray-100">
                 <span className="flex items-center gap-1.5 cursor-pointer">Role <ArrowDownUp className="w-[11px] h-[11px] text-gray-400" /></span>
              </th>

              <th className="px-6 py-4 font-bold border-b border-gray-100">
                 <span className="flex items-center gap-1.5 cursor-pointer">Company <ArrowDownUp className="w-[11px] h-[11px] text-gray-400" /></span>
              </th>
              
              <th className="px-6 py-4 font-bold border-b border-gray-100">
                 <span className="flex items-center gap-1.5 cursor-pointer">Contact Details <ArrowDownUp className="w-[11px] h-[11px] text-gray-400" /></span>
              </th>

              <th className="px-6 py-4 font-bold border-b border-gray-100">
                 <span className="flex items-center gap-1.5 cursor-pointer">Sentiment</span>
              </th>

              <th className="px-6 py-4 font-bold border-b border-gray-100">
                 <span className="flex items-center gap-1.5 cursor-pointer">Status</span>
              </th>
              
              <th className="px-6 py-4 font-bold border-b border-gray-100">
                 <span className="flex items-center gap-1.5 cursor-pointer">Last Contacted</span>
              </th>
              
              <th className="px-3 py-4 font-bold border-b border-gray-100 sticky right-0 z-30 bg-white shadow-[-1px_0_0_0_#ebebeb]">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          
          <tbody className="text-[13px] text-gray-700 whitespace-nowrap bg-white relative z-0">
            {currentData.map((c, i) => (
              <tr key={i} className="group hover:bg-gray-50 transition-colors cursor-pointer">
                
                <td className="px-6 py-4 border-b border-[#f3f4f6] relative sticky left-0 z-10 bg-white group-hover:bg-gray-50 shadow-[1px_0_0_0_#ebebeb] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-[14px] h-[14px] rounded-[4px] border border-gray-200 shadow-sm cursor-pointer hover:border-indigo-400 bg-white"></div>
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[11px] shadow-sm shrink-0 border border-indigo-200">
                      {c.avatar}
                    </div>
                    <span className="font-bold text-gray-800 tracking-tight hover:text-indigo-600 hover:underline transition-colors">
                      {c.name}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4 border-b border-[#f8f9fa] text-gray-600 font-medium">
                   {c.role}
                </td>

                <td className="px-6 py-4 border-b border-[#f8f9fa]">
                   <div className="flex items-center gap-2 text-gray-700 font-medium hover:text-indigo-600 cursor-pointer">
                      <Building className="w-3.5 h-3.5 text-gray-400" />
                      {ORG_MAP[c.orgId] || 'Unknown'}
                   </div>
                </td>

                <td className="px-6 py-4 border-b border-[#f8f9fa]">
                   <div className="flex flex-col gap-1 text-[12px]">
                      <div className="flex items-center gap-1.5 text-gray-600 hover:text-indigo-600 transition-colors">
                        <Mail className="w-3.5 h-3.5" /> {c.email}
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Phone className="w-3.5 h-3.5" /> {c.phone}
                      </div>
                   </div>
                </td>

                <td className="px-6 py-4 border-b border-[#f8f9fa]">
                   <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getSentimentColor(c.sentiment)}`}>
                     {c.sentiment}
                   </span>
                </td>

                <td className="px-6 py-4 border-b border-[#f8f9fa]">
                   <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${getStatusIndicator(c.status)}`}></span>
                      <span className="font-medium text-gray-600">{c.status}</span>
                   </div>
                </td>

                <td className="px-6 py-4 border-b border-[#f8f9fa] text-gray-500 font-medium text-[12px]">
                   <div className="flex items-center gap-1.5">
                     <Clock className="w-3.5 h-3.5 text-gray-400" /> {c.lastContacted}
                   </div>
                </td>

                <td className="px-3 py-4 border-b border-[#f8f9fa] sticky right-0 z-10 bg-white group-hover:bg-gray-50 shadow-[-1px_0_0_0_#ebebeb] transition-colors text-center">
                  <div className="p-1.5 cursor-pointer hover:bg-gray-200 rounded-md transition-colors inline-block text-gray-400 hover:text-gray-700">
                    <MoreHorizontal className="w-5 h-5 mx-auto" />
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-white shrink-0 mt-auto relative z-10">
        <div className="text-[13px] text-gray-500 font-medium tracking-tight">
          Showing {totalRows === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, totalRows)} of {totalRows} contacts
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={validCurrentPage === 1}
            className="px-3 py-1.5 rounded border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all outline-none text-[12px] font-medium"
          >
            Prev
          </button>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={validCurrentPage === totalPages}
            className="px-3 py-1.5 rounded border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all outline-none text-[12px] font-medium"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
