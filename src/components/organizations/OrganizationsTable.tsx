import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Link as LinkIcon, ArrowDownUp, PlusCircle, Calculator, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { HealthPopover } from './HealthPopover';
import { CsatPopover } from './CsatPopover';
import { EditColumnsPopover } from './EditColumnsPopover';
import { RowActionsPopover } from './RowActionsPopover';
import { ALL_COLUMNS, DEFAULT_VISIBLE_COLUMNS, TABLE_DATA } from './tableData';
import type { ColumnId } from './tableData';

export function OrganizationsTable() {
  const navigate = useNavigate();
  const [visibleColumns, setVisibleColumns] = useState<ColumnId[]>(DEFAULT_VISIBLE_COLUMNS);
  const [showEditColumns, setShowEditColumns] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const rowsPerPage = 5;
  const totalRows = TABLE_DATA.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = TABLE_DATA.slice(startIndex, endIndex);

  const [healthHover, setHealthHover] = useState<{ val: number, style: React.CSSProperties } | null>(null);
  const [reasonHover, setReasonHover] = useState<{ text: string, style: React.CSSProperties } | null>(null);
  const [csatHover, setCsatHover] = useState<{ style: React.CSSProperties } | null>(null);
  const [activeRowPopup, setActiveRowPopup] = useState<{ id: number, style: React.CSSProperties } | null>(null);

  const handleRowActionClick = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    
    // Ensure the popup doesn't overflow bottom of viewport if scrolled
    const yOffset = rect.bottom > window.innerHeight - 200 ? rect.top - 160 : rect.bottom + 4;
    
    setActiveRowPopup({
      id,
      style: { top: yOffset, right: window.innerWidth - rect.right }
    });
  };

  /* Pulse mapping: 1=green, 2=red, 3=yellow, 0=gray */
  const renderPulse = (dots: number[]) => (
    <div className="flex items-center gap-[5px]">
      {dots.map((d, i) => (
        <div key={i} className={`w-2 h-2 rounded-full ${
          d === 1 ? 'bg-[#00a699]' : d === 2 ? 'bg-[#fa5c5c]' : d === 3 ? 'bg-[#ffbb00]' : 'bg-[#e5e7eb]'
        }`} />
      ))}
    </div>
  );

  const handleHealthMouseEnter = (e: React.MouseEvent, val: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHealthHover({
      val,
      style: { bottom: window.innerHeight - rect.top + 8, left: rect.left + (rect.width / 2), transform: 'translateX(-50%)' }
    });
  };

  const handleReasonMouseEnter = (e: React.MouseEvent, text: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setReasonHover({
      text,
      style: { top: rect.top + rect.height + 4, left: rect.left + (rect.width / 2), transform: 'translateX(-50%)' }
    });
  };

  const handleCsatMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCsatHover({
      style: { bottom: window.innerHeight - rect.top + 8, left: rect.left + (rect.width / 2), transform: 'translateX(-50%)' }
    });
  };

  const handleMouseLeave = () => {
    setHealthHover(null);
    setReasonHover(null);
    setCsatHover(null);
  };

  const renderCell = (colId: ColumnId, r: typeof TABLE_DATA[0]) => {
    switch (colId) {
      case 'revenactId':
        return <td key={colId} className="px-6 py-4 bg-[#f8f9fc] group-hover:bg-[#f1f3f6] border-b border-[#f1f3f5] border-l border-r text-right pr-6 transition-colors font-medium text-gray-700">{r.id}</td>;
      case 'owner':
        return (
          <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa]">
            <div className="flex items-center gap-2.5">
              {r.img ? (
                <img src={r.img} alt={r.owner} className="w-[26px] h-[26px] rounded-full object-cover border border-gray-200" />
              ) : (
                <div className={`w-[26px] h-[26px] rounded-full ${r.bg} text-white flex items-center justify-center font-bold text-[9px] shadow-sm`}>{r.avatar}</div>
              )}
              <span className="text-[#3b82f6] hover:underline cursor-pointer font-medium">{r.owner}</span>
            </div>
          </td>
        );
      case 'lifecycleStage':
        return <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] text-gray-500 font-medium">{r.stage}</td>;
      case 'health':
        return (
          <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] relative cursor-pointer" onMouseEnter={(e) => handleHealthMouseEnter(e, r.health.val)} onMouseLeave={handleMouseLeave}>
            <div className="flex items-center gap-2 font-bold text-gray-900">
              <span className={`w-[7px] h-[7px] rounded-full ${r.health.clr}`}></span> {r.health.val}
            </div>
          </td>
        );
      case 'pulse':
        return <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa]">{renderPulse(r.pulse)}</td>;
      case 'aiPulseScore':
        return <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] font-medium text-gray-600">{r.aiScore}</td>;
      case 'aiPulseReason':
        return (
          <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] text-gray-500 cursor-pointer" onMouseEnter={(e) => handleReasonMouseEnter(e, r.fullReason)} onMouseLeave={handleMouseLeave}>
            <div className="w-[200px] truncate text-[12px] font-medium">{r.reason}</div>
          </td>
        );
      case 'nps':
        return (
          <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa]">
            <div className="flex justify-center w-full">
              <div className={`${r.npsColor} text-white px-[18px] py-[6px] rounded-[4px] font-bold text-[12px] min-w-[80px] text-center`}>{r.nps}</div>
            </div>
          </td>
        );
      case 'csatScore':
        return (
          <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] cursor-pointer" onMouseEnter={handleCsatMouseEnter} onMouseLeave={handleMouseLeave}>
            <div className="flex justify-center w-full">
              <div className={`${r.csatColor} text-white px-[18px] py-[6px] rounded-[4px] font-bold text-[12px] min-w-[80px] text-center`}>{r.csat}</div>
            </div>
          </td>
        );
      case 'joinedDate':
        return <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] text-gray-500 text-[12px] font-medium">{r.joined}</td>;
      case 'renewalDate':
        return <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] text-gray-500 text-[12px] font-medium">{r.renewal}</td>;
      case 'arrAccount':
        return <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] text-gray-500 text-[13px] font-medium">{r.arrAccount}</td>;
      case 'arrHQ':
        return <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] text-gray-500 text-[13px] font-medium">{r.arrHQ}</td>;
      case 'implFee':
        return <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] text-gray-500 text-[13px] font-medium">{r.implFee}</td>;
      case 'tcv':
        return <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] text-gray-500 text-[13px] font-medium">{r.tcv}</td>;
      case 'tcvRenewal':
        return <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] text-gray-500 text-[13px] font-medium">{r.tcvRenewal}</td>;
      case 'contractStart':
        return (
          <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] text-gray-500 text-[13px] font-medium group/editx">
            <div className="flex items-center gap-2">
              <span>{r.contractStart}</span>
              <Pencil className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover/editx:opacity-100 cursor-pointer hover:text-indigo-500 transition-opacity" />
            </div>
          </td>
        );
      case 'contractEnd':
        return <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] text-gray-500 text-[13px] font-medium">{r.contractEnd}</td>;
      case 'productsUtilized':
        return (
          <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] text-gray-600 font-medium">
            <div className="flex items-center">
              <span>{r.productsUtilized.primary}</span>
              {r.productsUtilized.additional && (
                <span className="ml-2 px-1.5 py-0.5 rounded text-[11px] font-bold text-indigo-600 cursor-pointer hover:underline">
                  + {r.productsUtilized.additional}
                </span>
              )}
            </div>
          </td>
        );
      case 'topSourceChannel':
        return <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] text-gray-600 font-medium">{r.topSourceChannel}</td>;
      case 'totalContractedSeats':
        return <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] text-gray-600 font-medium text-right pr-6">{r.totalContractedSeats}</td>;
      case 'totalActiveSeats':
        return <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] text-gray-600 font-medium text-right pr-6">{r.totalActiveSeats}</td>;
      case 'totalSeatUtilization':
        return <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] text-gray-600 font-medium text-right pr-6">{r.totalSeatUtilization}</td>;
      case 'totalHires':
        return <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] text-gray-600 font-medium text-right pr-6">{r.totalHires}</td>;
      case 'scopeWebApp':
        return <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] text-gray-500 font-medium">{r.scopeWebApp}</td>;
      case 'cesPercentage':
        return <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] text-gray-600 font-medium text-right pr-6">{r.cesPercentage}</td>;
      case 'churnDate':
        return <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] text-gray-500 font-medium">{r.churnDate}</td>;
      case 'churnReason':
        return <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] text-gray-500 font-medium">{r.churnReason}</td>;
      case 'churnComment':
        return <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] text-gray-500 font-medium">{r.churnComment}</td>;
      case 'domain':
        return <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] text-[#3b82f6] hover:underline cursor-pointer font-medium">{r.domain}</td>;
      case 'createdBy':
        return <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] text-gray-400 text-[11px] font-medium">{r.createdBy}</td>;
      case 'modifiedBy':
        return <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] text-gray-400 text-[11px] font-medium">{r.modifiedBy}</td>;
      case 'nameAddress':
        return <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa] text-gray-500 font-medium text-[12px]">{r.nameAddress}</td>;
      default:
        return <td key={colId} className="px-6 py-4 border-b border-[#f8f9fa]"></td>;
    }
  };

  return (
    <div className="w-full h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col relative z-0">
      <div className="overflow-x-auto overflow-y-auto w-full flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-max relative pb-16">
          <thead className="text-[12px] font-bold text-gray-700 bg-white shadow-[0_1px_0_0_#f3f4f6]">
            <tr>
              {/* Compulsory Sticky Organization Header */}
              <th className="px-6 py-4 font-bold border-b border-gray-100 sticky left-0 z-20 bg-white shadow-[1px_0_0_0_#ebebeb]">
                <div className="flex items-center gap-4">
                  <div className="w-[14px] h-[14px] rounded-[4px] border border-gray-200 shadow-sm cursor-pointer hover:border-indigo-400"></div>
                  <span className="flex items-center gap-1.5 cursor-pointer">Organization <ArrowDownUp className="w-[11px] h-[11px] text-gray-400" /></span>
                </div>
              </th>

              {/* Dynamic Headers */}
              {visibleColumns.filter(id => id !== 'organization').map(colId => {
                const colDef = ALL_COLUMNS.find(c => c.id === colId);
                if (!colDef) return null;

                return (
                  <th key={colDef.id} className={`px-6 py-4 font-bold border-b border-gray-100 ${colDef.id === 'revenactId' ? 'bg-[#f8f9fc] border-l border-r border-[#f1f3f5]' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">{colDef.label}</span>
                      {colDef.isCalc && <Calculator className="w-[14px] h-[14px] text-gray-400 shrink-0" />}
                      <ArrowDownUp className="w-[11px] h-[11px] text-gray-400 shrink-0" />
                    </div>
                  </th>
                );
              })}

              {/* Edit Columns Plus Header */}
              <th className="px-3 py-4 font-bold border-b border-gray-100 sticky right-0 z-30 bg-white shadow-[-1px_0_0_0_#ebebeb]">
                <div className="relative flex justify-center w-full h-full items-center">
                  <button 
                    onClick={() => setShowEditColumns(!showEditColumns)}
                    className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <PlusCircle className="w-[17px] h-[17px] text-gray-400 cursor-pointer hover:text-gray-600 fill-gray-50" />
                  </button>
                  
                  {showEditColumns && (
                    <EditColumnsPopover 
                      allColumns={ALL_COLUMNS}
                      visibleColumns={visibleColumns}
                      setVisibleColumns={setVisibleColumns}
                      onClose={() => setShowEditColumns(false)}
                      style={{ top: '100%', right: '0', marginTop: '12px' }}
                    />
                  )}
                </div>
              </th>
            </tr>
          </thead>
          
          <tbody className="text-[13px] text-gray-700 whitespace-nowrap bg-white relative z-0">
            {currentData.map((r, i) => (
              <tr key={i} className="group hover:bg-gray-50 transition-colors">
                
                {/* Checkbox & Pinned Organization Item */}
                <td className="px-6 py-4 border-b border-[#f3f4f6] relative sticky left-0 z-10 bg-white group-hover:bg-gray-50 shadow-[1px_0_0_0_#ebebeb] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-[14px] h-[14px] rounded-[4px] border border-gray-200 shadow-sm cursor-pointer hover:border-indigo-400 bg-white"></div>
                    <div className="w-6 h-6 flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                      <img src={r.logo} alt={r.org} className="w-full h-full object-contain mix-blend-multiply" onError={(e) => { e.currentTarget.style.display='none' }} />
                    </div>
                    <span 
                      className="font-bold text-gray-800 tracking-tight cursor-pointer hover:text-indigo-600 hover:underline transition-colors"
                      onClick={() => navigate(`/organizations/${r.id}`)}
                    >
                      {r.org}
                    </span>
                    <LinkIcon className="w-3.5 h-3.5 text-gray-400 ml-1 hover:text-indigo-500 cursor-pointer shrink-0" />
                  </div>
                </td>

                {/* Dynamic Content Columns */}
                {visibleColumns.filter(id => id !== 'organization').map(colId => renderCell(colId, r))}

                {/* Trailing Standard Multi-action Block  */}
                <td className="px-3 py-4 border-b border-[#f8f9fa] sticky right-0 z-10 bg-white group-hover:bg-gray-50 shadow-[-1px_0_0_0_#ebebeb] transition-colors text-center">
                  <div 
                    className="p-1 cursor-pointer hover:bg-gray-200 rounded transition-colors inline-block"
                    onClick={(e) => handleRowActionClick(e, r.id)}
                  >
                    <MoreHorizontal className="w-[18px] h-[18px] text-gray-400 hover:text-gray-600 mx-auto" />
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-white shrink-0 mt-auto relative z-10">
        <div className="text-[13px] text-gray-500 font-medium tracking-tight">
          Showing {startIndex + 1}-{Math.min(endIndex, totalRows)} of {totalRows} organizations
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-[5px] rounded border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all outline-none"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-[5px] rounded border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all outline-none"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Portal-like Popovers */}
      {healthHover && <HealthPopover val={healthHover.val} style={healthHover.style} />}
      {csatHover && <CsatPopover style={csatHover.style} />}
      
      {reasonHover && (
        <div 
          style={reasonHover.style}
          className="fixed z-[100] w-[300px] bg-[#535d6c] text-white text-[12.5px] p-3.5 rounded-[6px] shadow-xl pointer-events-none transition-opacity leading-relaxed"
        >
          {reasonHover.text}
          <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-[10px] h-[10px] bg-[#535d6c] transform rotate-45 rounded-sm"></div>
        </div>
      )}

      {activeRowPopup && (
        <RowActionsPopover onClose={() => setActiveRowPopup(null)} style={activeRowPopup.style} />
      )}
    </div>
  );
}
