import { Layout, Sparkles, CheckCircle, MessageSquare, Search, Plus, Filter, Download, Mail, Phone, MoreHorizontal } from 'lucide-react';
import { initials, capitalize, formatRelativeTime } from '../../features/customers/formatters';
import type { Contact } from '../../features/customers/customersSlice';

export interface ContactsTabProps {
  contacts: Contact[];
  isLoading: boolean;
  error: string | null;
}

// Shared between the Organization Details page's own Contacts tab and
// the standalone Account page's Contacts tab — same card/table shape
// either way (only the fetch that populates `contacts` differs: every
// organization-level Contact for one Customer vs. every account-level
// Contact for one Account — see fetchContactsForCustomer/
// fetchContactsForAccount in customersSlice.ts), so this one component
// renders both rather than each page keeping its own copy.
export function ContactsTab({ contacts, isLoading, error }: ContactsTabProps) {
  const stats = {
    total: contacts.length,
    decisionMakers: contacts.filter(c =>
      c.role === 'executive_sponsor' || c.role === 'decision_maker' || c.role === 'economic_buyer'
    ).length,
    active: contacts.filter(c => c.status === 'active').length,
    positiveSentiment: contacts.filter(c => c.sentiment === 'positive').length,
  };

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar p-6 pt-2">
      {/* Contacts Summary Banner */}
      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 bg-surface p-4 rounded-2xl border border-line-subtle shadow-sm shrink-0">
        <ContactStatCard title="Total Contacts" value={stats.total.toString()} subtext="Across all departments" icon={<Layout className="w-4 h-4 text-accent" />} />
        <ContactStatCard title="Decision Makers" value={stats.decisionMakers.toString()} subtext="High influence" icon={<Sparkles className="w-4 h-4 text-accent" />} />
        <ContactStatCard title="Active Users" value={stats.active.toString()} subtext="Logged in last 30d" icon={<CheckCircle className="w-4 h-4 text-success" />} />
        <ContactStatCard title="Avg Sentiment" value={`${stats.total > 0 ? Math.round((stats.positiveSentiment / stats.total) * 100) : 0}%`} subtext="Positive feedback" icon={<MessageSquare className="w-4 h-4 text-info" />} />
      </div>

      {/* Action Bar & Table */}
      <div className="max-w-7xl w-full mx-auto bg-surface rounded-2xl border border-line-subtle shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-line-subtle bg-surface flex items-center justify-between gap-4">
           <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
              <input type="text" placeholder="Search contacts by name, role or email..." className="w-full pl-10 pr-4 py-2 bg-subtle/30 border border-line rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-accent/10 placeholder:text-ink-faint" />
           </div>
           <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-6 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg text-[13px] font-bold shadow-sm transition-all">
                 <Plus className="w-4 h-4" />
                 Add Contact
              </button>
              <button className="p-2 border border-line rounded-lg text-ink-faint hover:bg-subtle transition-colors">
                 <Filter className="w-4 h-4" />
              </button>
              <button className="p-2 border border-line rounded-lg text-ink-faint hover:bg-subtle transition-colors">
                 <Download className="w-4 h-4" />
              </button>
           </div>
        </div>

        {/* Contacts Table */}
        <div className="overflow-x-auto min-h-[400px]">
           <table className="w-full border-collapse">
              <thead>
                 <tr className="bg-surface border-b border-line-subtle">
                    <th className="p-4 w-10"><input type="checkbox" className="rounded border-line-strong text-accent" /></th>
                    <th className="p-4 text-left text-[11px] font-bold text-ink-faint uppercase tracking-wider">Contact</th>
                    <th className="p-4 text-left text-[11px] font-bold text-ink-faint uppercase tracking-wider">Role</th>
                    <th className="p-4 text-left text-[11px] font-bold text-ink-faint uppercase tracking-wider">Status</th>
                    <th className="p-4 text-left text-[11px] font-bold text-ink-faint uppercase tracking-wider">Sentiment</th>
                    <th className="p-4 text-left text-[11px] font-bold text-ink-faint uppercase tracking-wider">Last Contacted</th>
                    <th className="p-4 text-center w-10"></th>
                 </tr>
              </thead>
              <tbody>
                 {contacts.map((contact) => (
                   <tr key={contact.id} className="hover:bg-subtle border-b border-line-subtle transition-all cursor-pointer group">
                     <td className="p-4"><input type="checkbox" className="rounded" onClick={(e) => e.stopPropagation()} /></td>
                     <td className="p-4">
                        <div className="flex items-center gap-3">
                           <div className="w-9 h-9 rounded-full bg-accent-dim border border-accent/30 flex items-center justify-center text-[12px] font-bold text-accent shadow-xs">
                              {initials(contact.name)}
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[13.5px] font-bold text-ink group-hover:text-accent transition-colors">{contact.name}</span>
                              <span className="text-[11px] font-medium text-ink-faint lowercase">{contact.email}</span>
                           </div>
                        </div>
                     </td>
                     <td className="p-4">
                        <span className="px-2.5 py-1 rounded-md bg-subtle border border-line-subtle text-[11.5px] font-bold text-ink-muted uppercase tracking-tight">
                           {contact.role_display}
                        </span>
                     </td>
                     <td className="p-4">
                        <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${contact.status === 'active' ? 'bg-success' : 'bg-line-strong'}`} />
                           <span className={`text-[13px] font-medium ${contact.status === 'active' ? 'text-ink-muted' : 'text-ink-faint'}`}>{capitalize(contact.status)}</span>
                        </div>
                     </td>
                     <td className="p-4">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-bold ${
                          contact.sentiment === 'positive' ? 'bg-success-dim border-success/30 text-success' :
                          contact.sentiment === 'negative' ? 'bg-danger-dim border-danger/30 text-danger' :
                          'bg-warning-dim border-warning/30 text-warning'
                        }`}>
                           <div className={`w-1.5 h-1.5 rounded-full ${
                             contact.sentiment === 'positive' ? 'bg-success' :
                             contact.sentiment === 'negative' ? 'bg-danger' :
                             'bg-warning'
                           }`} />
                           {capitalize(contact.sentiment)}
                        </div>
                     </td>
                     <td className="p-4">
                        <div className="flex flex-col">
                           <span className="text-[13px] font-bold text-ink-muted">{formatRelativeTime(contact.last_contacted_at)}</span>
                           <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Mail className="w-3 h-3 text-accent hover:text-accent cursor-pointer" />
                              <Phone className="w-3 h-3 text-accent hover:text-accent cursor-pointer" />
                           </div>
                        </div>
                     </td>
                     <td className="p-4"><MoreHorizontal className="w-4 h-4 text-ink-faint opacity-0 group-hover:opacity-100 transition-opacity" /></td>
                   </tr>
                 ))}
                 {!isLoading && !error && contacts.length === 0 && (
                   <tr>
                     <td colSpan={7} className="p-20 text-center text-ink-faint font-medium">No contacts found.</td>
                   </tr>
                 )}
                 {isLoading && (
                   <tr>
                     <td colSpan={7} className="p-20 text-center text-ink-faint font-medium">Loading contacts…</td>
                   </tr>
                 )}
                 {error && (
                   <tr>
                     <td colSpan={7} className="p-20 text-center text-danger font-medium">{error}</td>
                   </tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}

function ContactStatCard({ title, value, subtext, icon }: { title: string; value: string; subtext: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-3 bg-subtle rounded-xl border border-line-subtle">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[11px] font-bold text-ink-faint uppercase tracking-widest leading-none mb-1">{title}</span>
        <span className="text-[20px] font-bold text-ink leading-tight">{value}</span>
        <span className="text-[11px] font-medium text-ink-faint pt-0.5">{subtext}</span>
      </div>
    </div>
  );
}
