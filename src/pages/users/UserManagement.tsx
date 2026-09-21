import { useEffect, useId, useState, type FormEvent } from 'react';
import { Plus, X, AlertCircle, Trash2, ShieldCheck } from 'lucide-react';
import { FUNCTION_LABELS } from '../../features/auth/authSlice';
import type { UserFunction } from '../../features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { ConfirmDialog } from '../../components/organizations/ConfirmDialog';
import {
  addMember,
  addRole,
  clearUserManagementError,
  deleteRole,
  fetchCapabilities,
  fetchMembers,
  fetchRoles,
  updateMember,
  updateRole,
  type Member,
  type Role,
} from '../../features/userManagement/userManagementSlice';
import type { Capability } from '../../features/auth/authSlice';
import { AccessTab } from './AccessTab';

// Settings > Users. Reachable only with the `manage_users` capability
// (see RequireCapability in App.tsx and the Sidebar's own gate), which
// the backend enforces independently on every endpoint here.
//
// Three tabs: **Members** is every person in the organisation — admins
// included — with their role editable inline; **Roles** is where an admin
// creates and maintains those roles and the capabilities each one grants;
// **Access** is who is asking to join, who has been invited, and which
// email domains route people here (see AccessTab.tsx).
export function UserManagement() {
  const dispatch = useAppDispatch();
  const { members, roles, isLoading, error } = useAppSelector((state) => state.userManagement);
  const [tab, setTab] = useState<'members' | 'roles' | 'access'>('members');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  useEffect(() => {
    dispatch(fetchMembers());
    dispatch(fetchRoles());
    dispatch(fetchCapabilities());
  }, [dispatch]);

  return (
    <div className="h-full overflow-y-auto max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">User Management</h1>
          <p className="text-[13px] text-ink-muted mt-1">
            Manage the people in your organisation and what each role is allowed to do.
          </p>
        </div>
        {tab === 'members' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-accent text-white rounded-lg text-[12px] font-bold hover:bg-accent-hover transition-all shadow-sm shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Team Member
          </button>
        )}
      </div>

      <div className="flex bg-subtle/50 p-0.5 rounded-lg border border-line-subtle w-fit">
        {(['members', 'roles', 'access'] as const).map((name) => (
          <button
            key={name}
            onClick={() => {
              setTab(name);
              dispatch(clearUserManagementError());
            }}
            className={`px-3 py-1 rounded-md text-[12px] font-semibold capitalize transition-all ${
              tab === name
                ? 'bg-surface text-accent shadow-sm border border-line-subtle'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-[12px] text-danger p-3 bg-danger-dim rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {tab === 'members' && (
        <MembersTab
          members={members}
          roles={roles}
          isLoading={isLoading}
          onEdit={setEditingMember}
        />
      )}
      {tab === 'roles' && <RolesTab />}
      {tab === 'access' && <AccessTab roles={roles} />}

      {showAddModal && <AddMemberModal roles={roles} onClose={() => setShowAddModal(false)} />}
      {editingMember && (
        <EditMemberModal member={editingMember} onClose={() => setEditingMember(null)} />
      )}
    </div>
  );
}

function MembersTab({
  members,
  roles,
  isLoading,
  onEdit,
}: {
  members: Member[];
  roles: Role[];
  isLoading: boolean;
  onEdit: (member: Member) => void;
}) {
  return (
    <div className="bg-surface border border-line rounded-xl overflow-hidden">
      {isLoading ? (
        <div className="p-8 text-center text-[13px] text-ink-muted">Loading…</div>
      ) : members.length === 0 ? (
        <div className="p-8 text-center text-[13px] text-ink-muted">No team members yet.</div>
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
                Role
              </th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                Function
              </th>
              <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                Manager
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
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                roles={roles}
                members={members}
                onEdit={() => onEdit(member)}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function MemberRow({
  member,
  roles,
  members,
  onEdit,
}: {
  member: Member;
  roles: Role[];
  members: Member[];
  onEdit: () => void;
}) {
  const dispatch = useAppDispatch();

  return (
    <tr className="border-b border-line-subtle last:border-0 hover:bg-subtle/50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <img
            src={member.avatar}
            alt={member.name}
            className="w-7 h-7 rounded-full object-cover shrink-0"
          />
          <span className="text-[13px] font-semibold text-ink truncate">{member.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-[13px] text-ink-muted">{member.email}</td>
      <td className="px-4 py-3">
        {/* Inline so reassigning somebody is one click, not a modal. The
            backend refuses to strip the last person who can manage users
            (see EditOrgUserSerializer) — that failure lands in the page
            banner above. */}
        <select
          value={member.role_id ?? ''}
          aria-label={`Role for ${member.name}`}
          onChange={(e) => dispatch(updateMember({ id: member.id, role_id: Number(e.target.value) }))}
          className="px-2 py-1 bg-subtle border border-line rounded-md text-[12px] text-ink focus:outline-none focus:border-accent"
        >
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        {/* Which part of the company they work in — stamps their
            contributions on accounts and is what "the responsible
            person" is looked up by. Not a permission. */}
        <select
          value={member.function}
          aria-label={`Function for ${member.name}`}
          onChange={(e) => dispatch(updateMember({ id: member.id, function: e.target.value as UserFunction }))}
          className="px-2 py-1 bg-subtle border border-line rounded-md text-[12px] text-ink focus:outline-none focus:border-accent"
        >
          {(Object.keys(FUNCTION_LABELS) as UserFunction[]).map((key) => (
            <option key={key} value={key}>
              {FUNCTION_LABELS[key]}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        {/* The org chart. What a person may see of what others say —
            contributions, questions, chat — is read from it. The backend
            refuses a loop. */}
        <select
          value={member.reports_to?.id ?? ''}
          aria-label={`Manager for ${member.name}`}
          onChange={(e) => dispatch(updateMember({ id: member.id, reports_to_id: e.target.value ? Number(e.target.value) : null }))}
          className="px-2 py-1 bg-subtle border border-line rounded-md text-[12px] text-ink focus:outline-none focus:border-accent max-w-[160px]"
        >
          <option value="">Nobody</option>
          {members.filter((m) => m.id !== member.id).map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            member.is_active ? 'bg-success-dim text-success' : 'bg-danger-dim text-danger'
          }`}
        >
          {member.is_active ? 'Active' : 'Deactivated'}
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
            onClick={() => dispatch(updateMember({ id: member.id, is_active: !member.is_active }))}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
              member.is_active
                ? 'text-danger hover:bg-danger-dim'
                : 'text-success hover:bg-success-dim'
            }`}
          >
            {member.is_active ? 'Deactivate' : 'Reactivate'}
          </button>
        </div>
      </td>
    </tr>
  );
}

function RolesTab() {
  const dispatch = useAppDispatch();
  const { roles, capabilities } = useAppSelector((state) => state.userManagement);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPermissions, setNewPermissions] = useState<Capability[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  function resetForm() {
    setShowAddForm(false);
    setNewName('');
    setNewPermissions([]);
    setAddError(null);
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setAddError(null);
    setIsSaving(true);
    try {
      await dispatch(addRole({ name: newName, permissions: newPermissions })).unwrap();
      resetForm();
    } catch (err) {
      setAddError(typeof err === 'string' ? err : 'Could not create this role.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[12.5px] text-ink-muted">
          A role grants a set of permissions. The built-in Admin and CSM roles can't be changed.
        </p>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 bg-accent text-white rounded-lg text-[12px] font-bold hover:bg-accent-hover transition-all shadow-sm shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          New Role
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleAdd}
          className="bg-surface border border-line rounded-xl p-5 space-y-4"
        >
          <FormField label="Role name" value={newName} onChange={setNewName} type="text" autoFocus />
          <CapabilityCheckboxes
            capabilities={capabilities}
            selected={newPermissions}
            onChange={setNewPermissions}
          />
          {addError && <ModalError text={addError} />}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-3.5 py-2 text-[12px] font-semibold text-ink-muted hover:bg-subtle rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !newName.trim()}
              className="px-3.5 py-2 bg-accent text-white rounded-lg text-[12px] font-bold hover:bg-accent-hover transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Creating…' : 'Create Role'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {roles.map((role) => (
          <RoleCard
            key={role.id}
            role={role}
            capabilities={capabilities}
            onDelete={() => setDeleteTarget(role)}
          />
        ))}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title={`Delete the "${deleteTarget.name}" role?`}
          message="This can't be undone. Anyone still holding it must be moved to another role first."
          confirmLabel="Delete"
          danger
          onConfirm={async () => {
            await dispatch(deleteRole(deleteTarget.id)).unwrap();
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function RoleCard({
  role,
  capabilities,
  onDelete,
}: {
  role: Role;
  capabilities: { key: Capability; label: string }[];
  onDelete: () => void;
}) {
  const dispatch = useAppDispatch();

  function toggle(capability: Capability, checked: boolean) {
    const next = checked
      ? [...role.permissions, capability]
      : role.permissions.filter((c) => c !== capability);
    dispatch(updateRole({ id: role.id, permissions: next }));
  }

  return (
    <div className="bg-surface border border-line rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[13.5px] font-bold text-ink">{role.name}</span>
          {role.is_system && (
            <span className="flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-subtle text-ink-faint">
              <ShieldCheck className="w-3 h-3" />
              Built-in
            </span>
          )}
          <span className="text-[11.5px] text-ink-faint">
            {role.users_count} {role.users_count === 1 ? 'person' : 'people'}
          </span>
        </div>
        {!role.is_system && (
          <button
            onClick={onDelete}
            aria-label={`Delete ${role.name}`}
            className="p-1.5 hover:bg-subtle rounded-md text-ink-faint hover:text-danger transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <CapabilityCheckboxes
        capabilities={capabilities}
        selected={role.permissions}
        onChange={() => {}}
        onToggle={role.is_system ? undefined : toggle}
        disabled={role.is_system}
      />
    </div>
  );
}

function CapabilityCheckboxes({
  capabilities,
  selected,
  onChange,
  onToggle,
  disabled,
}: {
  capabilities: { key: Capability; label: string }[];
  selected: Capability[];
  onChange: (next: Capability[]) => void;
  /** Provided when each tick should save immediately (an existing
   * role); otherwise the parent form collects them and submits once. */
  onToggle?: (capability: Capability, checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
      {capabilities.map((capability) => (
        <label
          key={capability.key}
          className={`flex items-center gap-2 text-[12.5px] ${
            disabled ? 'text-ink-faint cursor-not-allowed' : 'text-ink-muted cursor-pointer'
          }`}
        >
          <input
            type="checkbox"
            disabled={disabled}
            checked={selected.includes(capability.key)}
            onChange={(e) => {
              if (onToggle) {
                onToggle(capability.key, e.target.checked);
                return;
              }
              onChange(
                e.target.checked
                  ? [...selected, capability.key]
                  : selected.filter((c) => c !== capability.key)
              );
            }}
          />
          {capability.label}
        </label>
      ))}
    </div>
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

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-[12px] font-semibold text-ink-muted mb-1">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-subtle border border-line rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all"
      >
        {children}
      </select>
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

function AddMemberModal({ roles, onClose }: { roles: Role[]; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [fn, setFn] = useState<UserFunction>('cs');
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
      await dispatch(
        addMember({ name, email, password, function: fn, ...(roleId ? { role_id: Number(roleId) } : {}) })
      ).unwrap();
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
        <SelectField label="Function" value={fn} onChange={(v) => setFn(v as UserFunction)}>
          {(Object.keys(FUNCTION_LABELS) as UserFunction[]).map((key) => (
            <option key={key} value={key}>
              {FUNCTION_LABELS[key]}
            </option>
          ))}
        </SelectField>
        <SelectField label="Role" value={roleId} onChange={setRoleId}>
          <option value="">CSM (default)</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </SelectField>
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

function EditMemberModal({ member, onClose }: { member: Member; onClose: () => void }) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState(member.name);
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
        updateMember({ id: member.id, name, ...(newPassword ? { password: newPassword } : {}) })
      ).unwrap();
      onClose();
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Could not update team member.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ModalShell title={`Edit ${member.name}`} onClose={onClose}>
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
