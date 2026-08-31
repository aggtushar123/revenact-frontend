import { useEffect, useId, useState, type FormEvent } from 'react';
import { Plus, X, AlertCircle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchCSMs, addCSM, updateCSM, type CSM } from '../../features/userManagement/userManagementSlice';

export function UserManagement() {
  const dispatch = useAppDispatch();
  const { csms, isLoading, error } = useAppSelector((state) => state.userManagement);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCSM, setEditingCSM] = useState<CSM | null>(null);

  useEffect(() => {
    dispatch(fetchCSMs());
  }, [dispatch]);

  return (
    <div className="h-full overflow-y-auto max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">User Management</h1>
          <p className="text-[13px] text-ink-muted mt-1">
            Add and manage the Customer Success Managers in your organisation.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-accent text-white rounded-lg text-[12px] font-bold hover:bg-accent-hover transition-all shadow-sm shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Team Member
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-[12px] text-danger p-3 bg-danger-dim rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-surface border border-line rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-[13px] text-ink-muted">Loading…</div>
        ) : csms.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-ink-muted">
            No team members yet. Add your first Customer Success Manager.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line-subtle">
                <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                  Name
                </th>
                <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                  Email
                </th>
                <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                  Status
                </th>
                <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-ink-faint text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {csms.map((csm) => (
                <CSMRow key={csm.id} csm={csm} onEdit={() => setEditingCSM(csm)} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && <AddCSMModal onClose={() => setShowAddModal(false)} />}
      {editingCSM && <EditCSMModal csm={editingCSM} onClose={() => setEditingCSM(null)} />}
    </div>
  );
}

function CSMRow({ csm, onEdit }: { csm: CSM; onEdit: () => void }) {
  const dispatch = useAppDispatch();

  return (
    <tr className="border-b border-line-subtle last:border-0 hover:bg-subtle/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <img src={csm.avatar} alt={csm.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
          <span className="text-[13px] font-semibold text-ink truncate">{csm.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-[13px] text-ink-muted">{csm.email}</td>
      <td className="px-4 py-3">
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            csm.is_active ? 'bg-success-dim text-success' : 'bg-danger-dim text-danger'
          }`}
        >
          {csm.is_active ? 'Active' : 'Deactivated'}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onEdit}
            className="px-2.5 py-1 text-[11px] font-semibold text-ink-muted hover:text-ink hover:bg-subtle rounded-md transition-all"
          >
            Edit
          </button>
          <button
            onClick={() => dispatch(updateCSM({ id: csm.id, is_active: !csm.is_active }))}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
              csm.is_active ? 'text-danger hover:bg-danger-dim' : 'text-success hover:bg-success-dim'
            }`}
          >
            {csm.is_active ? 'Deactivate' : 'Reactivate'}
          </button>
        </div>
      </td>
    </tr>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-line rounded-xl shadow-xl w-full max-w-md p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-ink">{title}</h2>
          <button onClick={onClose} className="text-ink-faint hover:text-ink transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type,
  autoFocus,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type: string;
  autoFocus?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-[12px] font-semibold text-ink-muted mb-1">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-subtle border border-line rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all"
      />
      {hint && <p className="text-[11px] text-ink-faint mt-1">{hint}</p>}
    </div>
  );
}

function ModalError({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-[12px] text-danger">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      {text}
    </div>
  );
}

function AddCSMModal({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setIsSaving(true);
    try {
      await dispatch(addCSM({ name, email, password })).unwrap();
      onClose();
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Could not add team member.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ModalShell title="Add Team Member" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Name" value={name} onChange={setName} type="text" autoFocus />
        <FormField label="Email" value={email} onChange={setEmail} type="email" />
        <FormField
          label="Temporary password"
          value={password}
          onChange={setPassword}
          type="password"
          hint="Share this with them directly — no invite email is sent."
        />
        {error && <ModalError text={error} />}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-[12px] font-semibold text-ink-muted hover:bg-subtle rounded-lg transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || !name || !email || !password}
            className="px-3.5 py-2 bg-accent text-white rounded-lg text-[12px] font-bold hover:bg-accent-hover transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Adding…' : 'Add Member'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function EditCSMModal({ csm, onClose }: { csm: CSM; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState(csm.name);
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword && newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    setIsSaving(true);
    try {
      await dispatch(
        updateCSM({ id: csm.id, name, ...(newPassword ? { password: newPassword } : {}) })
      ).unwrap();
      onClose();
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Could not update team member.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ModalShell title={`Edit ${csm.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Name" value={name} onChange={setName} type="text" autoFocus />
        <FormField
          label="Reset password (optional)"
          value={newPassword}
          onChange={setNewPassword}
          type="password"
          placeholder="Leave blank to keep current password"
          hint="Sets a new password directly — share it with them yourself."
        />
        {error && <ModalError text={error} />}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-[12px] font-semibold text-ink-muted hover:bg-subtle rounded-lg transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || !name.trim()}
            className="px-3.5 py-2 bg-accent text-white rounded-lg text-[12px] font-bold hover:bg-accent-hover transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
