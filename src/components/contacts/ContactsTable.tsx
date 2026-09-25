import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, ArrowDownUp, Mail, Phone, Clock, Building } from 'lucide-react';
import { capitalize, formatRelativeTime, initials, companyLabel } from '../../features/customers/formatters';
import type { Contact } from '../../features/customers/customersSlice';
import { ContactRowActionsPopover } from './ContactRowActionsPopover';

interface ContactsTableProps {
  contacts: Contact[];
  isLoading: boolean;
  error: string | null;
  /** Index (0-based) of the first row in `contacts` within the full
   * (possibly search/company-filtered) result set. */
  offset: number;
  count: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onNext: () => void;
  onPrevious: () => void;
  /** Checkbox selection — lifted to List.tsx, the common parent, same
   * reasoning as the Organizations list's selection (a future bulk action could
   * read it from there without this table needing to know about it). */
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onEditRequest: (contact: Contact) => void;
  onDeleteRequest: (contact: Contact) => void;
}

// `contacts` is already just this one server-fetched, server-filtered
// page — the "no local slicing" convention —
// unlike this component's old client-side search/company filtering
// over the full CONTACTS_DATA mock.
export function ContactsTable({
  contacts,
  isLoading,
  error,
  offset,
  count,
  hasNext,
  hasPrevious,
  onNext,
  onPrevious,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEditRequest,
  onDeleteRequest,
}: ContactsTableProps) {
  const navigate = useNavigate();
  const [activeRowPopup, setActiveRowPopup] = useState<{ contact: Contact; style: React.CSSProperties } | null>(null);
  const allOnPageSelected = contacts.length > 0 && contacts.every((c) => selectedIds.has(c.id));

  const handleRowActionClick = (e: React.MouseEvent, contact: Contact) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const yOffset = rect.bottom > window.innerHeight - 150 ? rect.top - 100 : rect.bottom + 4;
    setActiveRowPopup({ contact, style: { top: yOffset, right: window.innerWidth - rect.right } });
  };

  const getSentimentColor = (sentiment: Contact['sentiment']) => {
    switch (sentiment) {
      case 'positive': return 'bg-success-dim text-success border-success/40';
      case 'negative': return 'bg-danger-dim text-danger border-danger/40';
      case 'neutral': return 'bg-warning-dim text-warning border-warning/40';
    }
  };

  const getStatusIndicator = (status: Contact['status']) => {
    return status === 'active' ? 'bg-success' : 'bg-line-strong';
  };

  return (
    <div className="w-full h-full bg-surface rounded-xl border border-line shadow-sm overflow-hidden flex flex-col relative z-0">
      <div className="overflow-x-auto overflow-y-auto w-full flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-max relative pb-16">
          <thead className="text-[12px] font-bold text-ink-muted bg-surface shadow-[0_1px_0_0_var(--border-default)]">
            <tr>
              <th className="px-6 py-4 font-bold border-b border-line-subtle sticky left-0 z-20 bg-surface shadow-[1px_0_0_0_var(--border-default)]">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    aria-label="Select all contacts on this page"
                    checked={allOnPageSelected}
                    onChange={onToggleSelectAll}
                    className="w-[14px] h-[14px] rounded-[4px] border border-line shadow-sm cursor-pointer accent-accent"
                  />
                  <span className="flex items-center gap-1.5 cursor-pointer">Contact Name <ArrowDownUp className="w-[11px] h-[11px] text-ink-faint" /></span>
                </div>
              </th>

              <th className="px-6 py-4 font-bold border-b border-line-subtle">
                 <span className="flex items-center gap-1.5 cursor-pointer">Role <ArrowDownUp className="w-[11px] h-[11px] text-ink-faint" /></span>
              </th>

              <th className="px-6 py-4 font-bold border-b border-line-subtle">
                 <span className="flex items-center gap-1.5 cursor-pointer">Company <ArrowDownUp className="w-[11px] h-[11px] text-ink-faint" /></span>
              </th>

              <th className="px-6 py-4 font-bold border-b border-line-subtle">
                 <span className="flex items-center gap-1.5 cursor-pointer">Contact Details <ArrowDownUp className="w-[11px] h-[11px] text-ink-faint" /></span>
              </th>

              <th className="px-6 py-4 font-bold border-b border-line-subtle">
                 <span className="flex items-center gap-1.5 cursor-pointer">Sentiment</span>
              </th>

              <th className="px-6 py-4 font-bold border-b border-line-subtle">
                 <span className="flex items-center gap-1.5 cursor-pointer">Status</span>
              </th>

              <th className="px-6 py-4 font-bold border-b border-line-subtle">
                 <span className="flex items-center gap-1.5 cursor-pointer">Last Contacted</span>
              </th>

              <th className="px-3 py-4 font-bold border-b border-line-subtle sticky right-0 z-30 bg-surface shadow-[-1px_0_0_0_var(--border-default)]">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="text-[13px] text-ink-muted whitespace-nowrap bg-surface relative z-0">
            {contacts.map((c) => (
              <tr key={c.id} className="group hover:bg-subtle transition-colors">

                <td className="px-6 py-4 border-b border-line-subtle relative sticky left-0 z-10 bg-surface group-hover:bg-subtle shadow-[1px_0_0_0_var(--border-default)] transition-colors">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      aria-label={`Select ${c.name}`}
                      checked={selectedIds.has(c.id)}
                      onChange={() => onToggleSelect(c.id)}
                      className="w-[14px] h-[14px] rounded-[4px] border border-line shadow-sm cursor-pointer accent-accent"
                    />
                    <div className="w-8 h-8 rounded-full bg-accent-dim text-accent flex items-center justify-center font-bold text-[11px] shadow-sm shrink-0 border border-accent/40">
                      {initials(c.name)}
                    </div>
                    <span
                      className="font-bold text-ink tracking-tight cursor-pointer hover:text-accent hover:underline transition-colors"
                      onClick={() => navigate(`/contacts/${c.id}`)}
                    >
                      {c.name}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4 border-b border-line-subtle text-ink-muted font-medium">
                   {c.role_display}
                </td>

                <td className="px-6 py-4 border-b border-line-subtle">
                   <div
                     className="flex items-center gap-2 text-ink-muted font-medium hover:text-accent cursor-pointer w-fit"
                     onClick={() => navigate(`/organizations/${c.companies[0]?.id}`)}
                     title={c.companies.map((co) => co.name).join(', ')}
                   >
                      <Building className="w-3.5 h-3.5 text-ink-faint" />
                      {companyLabel(c.companies)}{c.account_name ? ` • ${c.account_name}` : ''}
                   </div>
                </td>

                <td className="px-6 py-4 border-b border-line-subtle">
                   <div className="flex flex-col gap-1 text-[12px]">
                      <div className="flex items-center gap-1.5 text-ink-muted hover:text-accent transition-colors">
                        <Mail className="w-3.5 h-3.5" /> {c.email}
                      </div>
                      <div className="flex items-center gap-1.5 text-ink-muted">
                        <Phone className="w-3.5 h-3.5" /> {c.phone || '—'}
                      </div>
                   </div>
                </td>

                <td className="px-6 py-4 border-b border-line-subtle">
                   <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getSentimentColor(c.sentiment)}`}>
                     {capitalize(c.sentiment)}
                   </span>
                </td>

                <td className="px-6 py-4 border-b border-line-subtle">
                   <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${getStatusIndicator(c.status)}`}></span>
                      <span className="font-medium text-ink-muted">{capitalize(c.status)}</span>
                   </div>
                </td>

                <td className="px-6 py-4 border-b border-line-subtle text-ink-muted font-medium text-[12px]">
                   <div className="flex items-center gap-1.5">
                     <Clock className="w-3.5 h-3.5 text-ink-faint" /> {formatRelativeTime(c.last_contacted_at)}
                   </div>
                </td>

                <td className="px-3 py-4 border-b border-line-subtle sticky right-0 z-10 bg-surface group-hover:bg-subtle shadow-[-1px_0_0_0_var(--border-default)] transition-colors text-center">
                  <button
                    type="button"
                    aria-label={`Actions for ${c.name}`}
                    className="p-1.5 cursor-pointer hover:bg-line rounded-md transition-colors inline-block text-ink-faint hover:text-ink-muted"
                    onClick={(e) => handleRowActionClick(e, c)}
                  >
                    <MoreHorizontal className="w-5 h-5 mx-auto" />
                  </button>
                </td>

              </tr>
            ))}
            {!isLoading && !error && contacts.length === 0 && (
              <tr>
                <td colSpan={8} className="p-20 text-center text-ink-faint font-medium">No contacts found.</td>
              </tr>
            )}
            {isLoading && (
              <tr>
                <td colSpan={8} className="p-20 text-center text-ink-faint font-medium">Loading contacts…</td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={8} className="p-20 text-center text-danger font-medium">{error}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-6 py-3 border-t border-line-subtle bg-surface shrink-0 mt-auto relative z-10">
        <div className="text-[13px] text-ink-muted font-medium tracking-tight">
          Showing {count === 0 ? 0 : offset + 1}-{offset + contacts.length} of {count} contacts
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="px-3 py-1.5 rounded border border-line text-ink-muted hover:text-ink-muted hover:bg-subtle disabled:opacity-30 disabled:hover:bg-transparent transition-all outline-none text-[12px] font-medium"
          >
            Prev
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className="px-3 py-1.5 rounded border border-line text-ink-muted hover:text-ink-muted hover:bg-subtle disabled:opacity-30 disabled:hover:bg-transparent transition-all outline-none text-[12px] font-medium"
          >
            Next
          </button>
        </div>
      </div>

      {activeRowPopup && (
        <ContactRowActionsPopover
          onClose={() => setActiveRowPopup(null)}
          style={activeRowPopup.style}
          onEdit={() => {
            onEditRequest(activeRowPopup.contact);
            setActiveRowPopup(null);
          }}
          onDelete={() => {
            onDeleteRequest(activeRowPopup.contact);
            setActiveRowPopup(null);
          }}
        />
      )}
    </div>
  );
}
