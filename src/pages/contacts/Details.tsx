import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, Phone, Building2, Clock, Pencil, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchContactById, deleteContact } from '../../features/customers/customersSlice';
import { initials, capitalize, formatRelativeTime } from '../../features/customers/formatters';
import { ContactFormModal } from '../../components/contacts/ContactFormModal';
import { ConfirmDialog } from '../../components/organizations/ConfirmDialog';

// Minimal profile page — Contact has no ActivityFeed/tabs of its own
// (it isn't a Customer/Account, just a person recorded against one),
// so unlike Organization/Account Details this is a single card, not a
// tabbed multi-panel layout. The header (avatar/name/company, back
// button) is rendered by Navbar.tsx, same as the Organization/Account
// Details pages' own headers — see that file's own `contact` branch.
export function ContactDetails() {
  const { id } = useParams<{ id: string }>();
  const contactId = Number(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedContact: contact, selectedContactLoading, selectedContactError } = useAppSelector(
    (state) => state.customers
  );

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (Number.isFinite(contactId)) dispatch(fetchContactById(contactId));
  }, [dispatch, contactId]);

  if (selectedContactLoading || !contact) {
    return (
      <div className="flex flex-col h-full w-full bg-surface text-ink items-center justify-center">
        <span className="text-[13px] font-medium text-danger">
          {selectedContactError ?? 'Loading contact…'}
        </span>
      </div>
    );
  }

  const sentimentColor =
    contact.sentiment === 'positive'
      ? 'bg-success-dim text-success border-success/40'
      : contact.sentiment === 'negative'
        ? 'bg-danger-dim text-danger border-danger/40'
        : 'bg-warning-dim text-warning border-warning/40';

  return (
    <div className="flex flex-col h-full w-full bg-surface text-ink overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl w-full mx-auto p-6 flex flex-col gap-6">
        {/* Profile header card */}
        <div className="bg-surface border border-line-subtle rounded-2xl shadow-sm p-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-accent-dim border border-accent/30 flex items-center justify-center text-[22px] font-bold text-accent shadow-sm shrink-0">
              {initials(contact.name)}
            </div>
            <div className="flex flex-col gap-1.5">
              <h1 className="text-[20px] font-bold text-ink tracking-tight">{contact.name}</h1>
              <span className="px-2.5 py-0.5 rounded-md bg-subtle border border-line-subtle text-[11.5px] font-bold text-ink-muted uppercase tracking-tight w-fit">
                {contact.role_display}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-line rounded-lg text-[12px] font-semibold text-ink-muted hover:bg-subtle transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              onClick={() => setIsDeleting(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-line rounded-lg text-[12px] font-semibold text-danger hover:bg-danger-dim transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>

        {/* Status/sentiment pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-line-subtle rounded-lg">
            <span className={`w-2 h-2 rounded-full ${contact.status === 'active' ? 'bg-success' : 'bg-line-strong'}`} />
            <span className="text-[12.5px] font-semibold text-ink-muted">{capitalize(contact.status)}</span>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[11.5px] font-bold border ${sentimentColor}`}>
            {capitalize(contact.sentiment)} sentiment
          </span>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-4">
          <InfoCard icon={<Mail className="w-4 h-4" />} label="Email" value={contact.email} />
          <InfoCard icon={<Phone className="w-4 h-4" />} label="Phone" value={contact.phone || '—'} />
          <InfoCard
            icon={<Building2 className="w-4 h-4" />}
            label="Company"
            value={contact.company_name}
            onClick={() => navigate(`/organizations/${contact.company_id}`)}
          />
          <InfoCard
            icon={<Building2 className="w-4 h-4" />}
            label="Account"
            value={contact.account_name ?? '—'}
          />
          <InfoCard
            icon={<Clock className="w-4 h-4" />}
            label="Last Contacted"
            value={formatRelativeTime(contact.last_contacted_at)}
          />
        </div>
      </div>

      {isEditing && (
        <ContactFormModal
          contact={contact}
          onClose={() => setIsEditing(false)}
          onSaved={() => dispatch(fetchContactById(contactId))}
        />
      )}

      {isDeleting && (
        <ConfirmDialog
          title={`Delete ${contact.name}?`}
          message="This can't be undone."
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            await dispatch(deleteContact(contact.id)).unwrap();
            navigate('/contacts/list');
          }}
          onClose={() => setIsDeleting(false)}
        />
      )}
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`p-4 bg-surface rounded-xl border border-line-subtle shadow-sm flex items-start gap-3 transition-shadow ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-accent/40' : ''
      }`}
      onClick={onClick}
    >
      <div className="p-2 bg-accent-dim/50 rounded-lg text-accent">{icon}</div>
      <div>
        <p className="text-[11px] font-bold text-ink-faint uppercase tracking-widest">{label}</p>
        <p className={`text-sm font-bold ${onClick ? 'text-accent' : 'text-ink'}`}>{value}</p>
      </div>
    </div>
  );
}
