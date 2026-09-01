import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Link as LinkIcon, ArrowDownUp, PlusCircle, Calculator, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { HealthPopover } from './HealthPopover';
import { CsatPopover } from './CsatPopover';
import { EditColumnsPopover } from './EditColumnsPopover';
import { RowActionsPopover } from './RowActionsPopover';
import { OrganizationFormModal } from './OrganizationFormModal';
import { ChurnOrganizationModal } from './ChurnOrganizationModal';
import { ConfirmDialog } from './ConfirmDialog';
import { ALL_COLUMNS, DEFAULT_VISIBLE_COLUMNS } from './tableData';
import type { ColumnId, OrgRow } from './tableData';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { updateCustomer } from '../../features/customers/customersSlice';

interface OrganizationsTableProps {
  rows: OrgRow[];
  isLoading: boolean;
  error: string | null;
  /** Index (0-based) of the first row in `rows` within the full result set. */
  offset: number;
  count: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onNext: () => void;
  onPrevious: () => void;
}

export function OrganizationsTable({
  rows,
  isLoading,
  error,
  offset,
  count,
  hasNext,
  hasPrevious,
  onNext,
  onPrevious,
}: OrganizationsTableProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const rawCustomers = useAppSelector((state) => state.customers.customers);
  const [visibleColumns, setVisibleColumns] = useState<ColumnId[]>(DEFAULT_VISIBLE_COLUMNS);
  const [showEditColumns, setShowEditColumns] = useState(false);

  // `rows` is already just this one server-fetched page — no local slicing.
  const currentData = rows;
  const startIndex = offset;
  const endIndex = offset + rows.length;

  const [healthHover, setHealthHover] = useState<{ val: number, style: React.CSSProperties } | null>(null);
  const [reasonHover, setReasonHover] = useState<{ text: string, style: React.CSSProperties } | null>(null);
  const [csatHover, setCsatHover] = useState<{ style: React.CSSProperties } | null>(null);
  const [activeRowPopup, setActiveRowPopup] = useState<{ id: number, name: string, style: React.CSSProperties } | null>(null);
  const [editingCustomerId, setEditingCustomerId] = useState<number | null>(null);
  const [churningCustomer, setChurningCustomer] = useState<{ id: number; name: string } | null>(null);
  const [archivingCustomer, setArchivingCustomer] = useState<{ id: number; name: string } | null>(null);

  const handleRowActionClick = (e: React.MouseEvent, id: number, name: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();

    // Ensure the popup doesn't overflow bottom of viewport if scrolled
    const yOffset = rect.bottom > window.innerHeight - 200 ? rect.top - 160 : rect.bottom + 4;

    setActiveRowPopup({
      id,
      name,
      style: { top: yOffset, right: window.innerWidth - rect.right }
    });
  };

  /* Pulse mapping: 1=good, 2=bad, 3=warning, 0=no signal */
  const renderPulse = (dots: number[]) => (
    <div className="flex items-center gap-[5px]">
      {dots.map((d, i) => (
        <div key={i} className={`w-2 h-2 rounded-full ${
          d === 1 ? 'bg-success' : d === 2 ? 'bg-danger' : d === 3 ? 'bg-warning' : 'bg-line-strong'
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

  const renderCell = (colId: ColumnId, r: OrgRow) => {
    switch (colId) {
      case 'revenactId':
        return <td key={colId} className="px-6 py-4 bg-subtle group-hover:bg-elevated border-b border-line-subtle border-l border-r text-right pr-6 transition-colors font-medium text-ink-muted">{r.id}</td>;
      case 'owner':
        return (
          <td key={colId} className="px-6 py-4 border-b border-line-subtle">
            <div className="flex items-center gap-2.5">
              {r.img ? (
                <img src={r.img} alt={r.owner} className="w-[26px] h-[26px] rounded-full object-cover border border-line" />
              ) : (
                <div className={`w-[26px] h-[26px] rounded-full ${r.bg} text-white flex items-center justify-center font-bold text-[9px] shadow-sm`}>{r.avatar}</div>
              )}
              <span className="text-info hover:underline cursor-pointer font-medium">{r.owner}</span>
            </div>
          </td>
        );
      case 'lifecycleStage':
        return <td key={colId} className="px-6 py-4 border-b border-line-subtle text-ink-muted font-medium">{r.stage}</td>;
      case 'health':
        return (
          <td key={colId} className="px-6 py-4 border-b border-line-subtle relative cursor-pointer" onMouseEnter={(e) => handleHealthMouseEnter(e, r.health.val)} onMouseLeave={handleMouseLeave}>
            <div className="flex items-center gap-2 font-bold text-ink">
              <span className={`w-[7px] h-[7px] rounded-full ${r.health.clr}`}></span> {r.health.val}
            </div>
          </td>
        );
      case 'pulse':
        return <td key={colId} className="px-6 py-4 border-b border-line-subtle">{renderPulse(r.pulse)}</td>;
      case 'aiPulseScore':
        return <td key={colId} className="px-6 py-4 border-b border-line-subtle font-medium text-ink-muted">{r.aiScore}</td>;
      case 'aiPulseReason':
        return (
          <td key={colId} className="px-6 py-4 border-b border-line-subtle text-ink-muted cursor-pointer" onMouseEnter={(e) => handleReasonMouseEnter(e, r.fullReason)} onMouseLeave={handleMouseLeave}>
            <div className="w-[200px] truncate text-[12px] font-medium">{r.reason}</div>
          </td>
        );
      case 'nps':
        return (
          <td key={colId} className="px-6 py-4 border-b border-line-subtle">
            <div className="flex justify-center w-full">
              <div className={`${r.npsColor} text-white px-[18px] py-[6px] rounded-[4px] font-bold text-[12px] min-w-[80px] text-center`}>{r.nps}</div>
            </div>
          </td>
        );
      case 'csatScore':
        return (
          <td key={colId} className="px-6 py-4 border-b border-line-subtle cursor-pointer" onMouseEnter={handleCsatMouseEnter} onMouseLeave={handleMouseLeave}>
            <div className="flex justify-center w-full">
              <div className={`${r.csatColor} text-white px-[18px] py-[6px] rounded-[4px] font-bold text-[12px] min-w-[80px] text-center`}>{r.csat}</div>
            </div>
          </td>
        );
      case 'joinedDate':
        return <td key={colId} className="px-6 py-4 border-b border-line-subtle text-ink-muted text-[12px] font-medium">{r.joined}</td>;
      case 'renewalDate':
        return <td key={colId} className="px-6 py-4 border-b border-line-subtle text-ink-muted text-[12px] font-medium">{r.renewal}</td>;
      case 'arrAccount':
        return <td key={colId} className="px-6 py-4 border-b border-line-subtle text-ink-muted text-[13px] font-medium">{r.arrAccount}</td>;
      case 'arrHQ':
        return <td key={colId} className="px-6 py-4 border-b border-line-subtle text-ink-muted text-[13px] font-medium">{r.arrHQ}</td>;
      case 'implFee':
        return <td key={colId} className="px-6 py-4 border-b border-line-subtle text-ink-muted text-[13px] font-medium">{r.implFee}</td>;
      case 'tcv':
        return <td key={colId} className="px-6 py-4 border-b border-line-subtle text-ink-muted text-[13px] font-medium">{r.tcv}</td>;
      case 'tcvRenewal':
        return <td key={colId} className="px-6 py-4 border-b border-line-subtle text-ink-muted text-[13px] font-medium">{r.tcvRenewal}</td>;
      case 'contractStart':
        return (
          <td key={colId} className="px-6 py-4 border-b border-line-subtle text-ink-muted text-[13px] font-medium group/editx">
            <div className="flex items-center gap-2">
              <span>{r.contractStart}</span>
              <Pencil className="w-3.5 h-3.5 text-ink-faint opacity-0 group-hover/editx:opacity-100 cursor-pointer hover:text-accent transition-opacity" />
            </div>
          </td>
        );
      case 'contractEnd':
        return <td key={colId} className="px-6 py-4 border-b border-line-subtle text-ink-muted text-[13px] font-medium">{r.contractEnd}</td>;
      case 'productsUtilized':
        return (
          <td key={colId} className="px-6 py-4 border-b border-line-subtle text-ink-muted font-medium">
            <div className="flex items-center">
              <span>{r.productsUtilized.primary}</span>
              {r.productsUtilized.additional && (
                <span className="ml-2 px-1.5 py-0.5 rounded text-[11px] font-bold text-accent cursor-pointer hover:underline">
                  + {r.productsUtilized.additional}
                </span>
              )}
            </div>
          </td>
        );
      case 'topSourceChannel':
        return <td key={colId} className="px-6 py-4 border-b border-line-subtle text-ink-muted font-medium">{r.topSourceChannel}</td>;
      case 'totalContractedSeats':
        return <td key={colId} className="px-6 py-4 border-b border-line-subtle text-ink-muted font-medium text-right pr-6">{r.totalContractedSeats}</td>;
      case 'totalActiveSeats':
        return <td key={colId} className="px-6 py-4 border-b border-line-subtle text-ink-muted font-medium text-right pr-6">{r.totalActiveSeats}</td>;
      case 'totalSeatUtilization':
        return <td key={colId} className="px-6 py-4 border-b border-line-subtle text-ink-muted font-medium text-right pr-6">{r.totalSeatUtilization}</td>;
      case 'totalHires':
        return <td key={colId} className="px-6 py-4 border-b border-line-subtle text-ink-muted font-medium text-right pr-6">{r.totalHires}</td>;
      case 'scopeWebApp':
        return <td key={colId} className="px-6 py-4 border-b border-line-subtle text-ink-muted font-medium">{r.scopeWebApp}</td>;
      case 'cesPercentage':
        return <td key={colId} className="px-6 py-4 border-b border-line-subtle text-ink-muted font-medium text-right pr-6">{r.cesPercentage}</td>;
      case 'churnDate':
        return <td key={colId} className="px-6 py-4 border-b border-line-subtle text-ink-muted font-medium">{r.churnDate}</td>;
      case 'churnReason':
        return <td key={colId} className="px-6 py-4 border-b border-line-subtle text-ink-muted font-medium">{r.churnReason}</td>;
      case 'churnComment':
        return <td key={colId} className="px-6 py-4 border-b border-line-subtle text-ink-muted font-medium">{r.churnComment}</td>;
      case 'domain':
        return <td key={colId} className="px-6 py-4 border-b border-line-subtle text-info hover:underline cursor-pointer font-medium">{r.domain}</td>;
      case 'createdBy':
        return <td key={colId} className="px-6 py-4 border-b border-line-subtle text-ink-faint text-[11px] font-medium">{r.createdBy}</td>;
      case 'modifiedBy':
        return <td key={colId} className="px-6 py-4 border-b border-line-subtle text-ink-faint text-[11px] font-medium">{r.modifiedBy}</td>;
      case 'nameAddress':
        return <td key={colId} className="px-6 py-4 border-b border-line-subtle text-ink-muted font-medium text-[12px]">{r.nameAddress}</td>;
      default:
        return <td key={colId} className="px-6 py-4 border-b border-line-subtle"></td>;
    }
  };

  return (
    <div className="w-full h-full bg-surface rounded-xl border border-line shadow-sm overflow-hidden flex flex-col relative z-0">
      <div className="overflow-x-auto overflow-y-auto w-full flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-max relative pb-16">
          <thead className="text-[12px] font-bold text-ink-muted bg-surface shadow-[0_1px_0_0_var(--border-default)]">
            <tr>
              {/* Compulsory Sticky Organization Header */}
              <th className="px-6 py-4 font-bold border-b border-line-subtle sticky left-0 z-20 bg-surface shadow-[1px_0_0_0_var(--border-default)]">
                <div className="flex items-center gap-4">
                  <div className="w-[14px] h-[14px] rounded-[4px] border border-line shadow-sm cursor-pointer hover:border-accent"></div>
                  <span className="flex items-center gap-1.5 cursor-pointer">Organization <ArrowDownUp className="w-[11px] h-[11px] text-ink-faint" /></span>
                </div>
              </th>

              {/* Dynamic Headers */}
              {visibleColumns.filter(id => id !== 'organization').map(colId => {
                const colDef = ALL_COLUMNS.find(c => c.id === colId);
                if (!colDef) return null;

                return (
                  <th key={colDef.id} className={`px-6 py-4 font-bold border-b border-line-subtle ${colDef.id === 'revenactId' ? 'bg-subtle border-l border-r border-line-subtle' : ''}`}>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">{colDef.label}</span>
                      {colDef.isCalc && <Calculator className="w-[14px] h-[14px] text-ink-faint shrink-0" />}
                      <ArrowDownUp className="w-[11px] h-[11px] text-ink-faint shrink-0" />
                    </div>
                  </th>
                );
              })}

              {/* Edit Columns Plus Header */}
              <th className="px-3 py-4 font-bold border-b border-line-subtle sticky right-0 z-30 bg-surface shadow-[-1px_0_0_0_var(--border-default)]">
                <div className="relative flex justify-center w-full h-full items-center">
                  <button
                    onClick={() => setShowEditColumns(!showEditColumns)}
                    className="p-1 rounded-full hover:bg-subtle transition-colors"
                  >
                    <PlusCircle className="w-[17px] h-[17px] text-ink-faint cursor-pointer hover:text-ink-muted fill-subtle" />
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

          <tbody className="text-[13px] text-ink-muted whitespace-nowrap bg-surface relative z-0">
            {error ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="px-6 py-8 text-center text-[13px] font-medium text-danger">
                  {error}
                </td>
              </tr>
            ) : isLoading && currentData.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="px-6 py-8 text-center text-[13px] font-medium text-ink-faint">
                  Loading organizations…
                </td>
              </tr>
            ) : currentData.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="px-6 py-8 text-center text-[13px] font-medium text-ink-faint">
                  No organizations yet.
                </td>
              </tr>
            ) : (
              currentData.map((r) => (
              <tr key={r.id} className="group hover:bg-subtle transition-colors">

                {/* Checkbox & Pinned Organization Item */}
                <td className="px-6 py-4 border-b border-line-subtle relative sticky left-0 z-10 bg-surface group-hover:bg-subtle shadow-[1px_0_0_0_var(--border-default)] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-[14px] h-[14px] rounded-[4px] border border-line shadow-sm cursor-pointer hover:border-accent bg-surface"></div>
                    <div className="w-6 h-6 flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                      <img src={r.logo} alt={r.org} className="w-full h-full object-contain mix-blend-multiply" onError={(e) => { e.currentTarget.style.display='none' }} />
                    </div>
                    <span
                      className="font-bold text-ink tracking-tight cursor-pointer hover:text-accent hover:underline transition-colors"
                      onClick={() => navigate(`/organizations/${r.id}`)}
                    >
                      {r.org}
                    </span>
                    <LinkIcon className="w-3.5 h-3.5 text-ink-faint ml-1 hover:text-accent cursor-pointer shrink-0" />
                  </div>
                </td>

                {/* Dynamic Content Columns */}
                {visibleColumns.filter(id => id !== 'organization').map(colId => renderCell(colId, r))}

                {/* Trailing Standard Multi-action Block  */}
                <td className="px-3 py-4 border-b border-line-subtle sticky right-0 z-10 bg-surface group-hover:bg-subtle shadow-[-1px_0_0_0_var(--border-default)] transition-colors text-center">
                  <button
                    type="button"
                    aria-label={`Actions for ${r.org}`}
                    className="p-1 cursor-pointer hover:bg-line rounded transition-colors inline-block"
                    onClick={(e) => handleRowActionClick(e, r.id, r.org)}
                  >
                    <MoreHorizontal className="w-[18px] h-[18px] text-ink-faint hover:text-ink-muted mx-auto" />
                  </button>
                </td>

              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-line-subtle bg-surface shrink-0 mt-auto relative z-10">
        <div className="text-[13px] text-ink-muted font-medium tracking-tight">
          {count > 0 ? `Showing ${startIndex + 1}-${Math.min(endIndex, count)} of ${count} organizations` : 'No organizations'}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious || isLoading}
            aria-label="Previous page"
            className="p-[5px] rounded border border-line text-ink-faint hover:text-ink-muted hover:bg-subtle disabled:opacity-30 disabled:hover:bg-transparent transition-all outline-none"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext || isLoading}
            aria-label="Next page"
            className="p-[5px] rounded border border-line text-ink-faint hover:text-ink-muted hover:bg-subtle disabled:opacity-30 disabled:hover:bg-transparent transition-all outline-none"
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
          className="fixed z-[100] w-[300px] bg-elevated text-ink text-[12.5px] p-3.5 rounded-[6px] border border-line-strong shadow-xl pointer-events-none transition-opacity leading-relaxed"
        >
          {reasonHover.text}
          <div className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-[10px] h-[10px] bg-elevated transform rotate-45"></div>
        </div>
      )}

      {activeRowPopup && (
        <RowActionsPopover
          onClose={() => setActiveRowPopup(null)}
          style={activeRowPopup.style}
          onEdit={() => {
            setEditingCustomerId(activeRowPopup.id);
            setActiveRowPopup(null);
          }}
          onArchive={() => {
            setArchivingCustomer({ id: activeRowPopup.id, name: activeRowPopup.name });
            setActiveRowPopup(null);
          }}
          onChurn={() => {
            setChurningCustomer({ id: activeRowPopup.id, name: activeRowPopup.name });
            setActiveRowPopup(null);
          }}
        />
      )}

      {editingCustomerId !== null && (
        (() => {
          const target = rawCustomers.find((c) => c.id === editingCustomerId);
          // Falls back to closing quietly rather than rendering a blank
          // modal — e.g. if the row was archived by someone else and
          // dropped out of `rawCustomers` between opening the row menu
          // and this render.
          return target ? (
            <OrganizationFormModal customer={target} onClose={() => setEditingCustomerId(null)} />
          ) : null;
        })()
      )}

      {churningCustomer && (
        <ChurnOrganizationModal
          customerId={churningCustomer.id}
          customerName={churningCustomer.name}
          onClose={() => setChurningCustomer(null)}
        />
      )}

      {archivingCustomer && (
        <ConfirmDialog
          title={`Archive ${archivingCustomer.name}?`}
          message="It'll be hidden from this list and the metrics banner, but not deleted — you can unarchive it later."
          confirmLabel="Archive"
          danger
          onConfirm={async () => {
            await dispatch(updateCustomer({ id: archivingCustomer.id, is_archived: true })).unwrap();
          }}
          onClose={() => setArchivingCustomer(null)}
        />
      )}
    </div>
  );
}
