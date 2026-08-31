import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchMe, updateProfile, changePassword } from '../../features/auth/authSlice';

type Message = { type: 'success' | 'error'; text: string } | null;

function errorText(err: unknown, fallback: string): string {
  return typeof err === 'string' ? err : fallback;
}

export function Profile() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const [name, setName] = useState(user?.name ?? '');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMessage, setNameMessage] = useState<Message>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<Message>(null);

  // Refresh from the server — localStorage's cached copy could be stale
  // (e.g. an admin changed something about this account elsewhere).
  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  // Keep the name field in sync once the fresh profile arrives.
  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  async function handleNameSubmit(e: FormEvent) {
    e.preventDefault();
    setNameSaving(true);
    setNameMessage(null);
    try {
      await dispatch(updateProfile({ name })).unwrap();
      setNameMessage({ type: 'success', text: 'Profile updated.' });
    } catch (err) {
      setNameMessage({ type: 'error', text: errorText(err, 'Could not update your profile.') });
    } finally {
      setNameSaving(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordSaving(true);
    try {
      await dispatch(changePassword({ currentPassword, newPassword })).unwrap();
      setPasswordMessage({ type: 'success', text: 'Password changed.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMessage({ type: 'error', text: errorText(err, 'Could not change your password.') });
    } finally {
      setPasswordSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">My Profile</h1>
        <p className="text-[13px] text-ink-muted mt-1">Your account details and organisation.</p>
      </div>

      <div className="flex items-center gap-4 p-5 bg-surface border border-line rounded-xl">
        <img
          src={user.avatar}
          alt={user.name}
          className="w-16 h-16 rounded-full object-cover shadow-sm shrink-0"
        />
        <div className="min-w-0">
          <div className="text-[15px] font-bold text-ink truncate">{user.name}</div>
          <div className="text-[13px] text-ink-muted truncate">{user.email}</div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-accent-dim text-accent">
              {user.role === 'admin' ? 'Organisation Admin' : 'Customer Success Manager'}
            </span>
            <span className="text-[11px] text-ink-faint truncate">{user.organisation.name}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <form onSubmit={handleNameSubmit} className="p-5 bg-surface border border-line rounded-xl space-y-4">
          <h2 className="text-[14px] font-bold text-ink">Edit Profile</h2>

          <div>
            <label htmlFor="profile-name" className="block text-[12px] font-semibold text-ink-muted mb-1">
              Name
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-subtle border border-line rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all"
            />
          </div>

          <div>
            <label htmlFor="profile-email" className="block text-[12px] font-semibold text-ink-muted mb-1">
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              value={user.email}
              disabled
              className="w-full px-3 py-2 bg-subtle border border-line rounded-lg text-[13px] text-ink-faint cursor-not-allowed"
            />
          </div>

          {nameMessage && <StatusMessage message={nameMessage} />}

          <button
            type="submit"
            disabled={nameSaving || name.trim() === ''}
            className="px-4 py-2 bg-accent text-white rounded-lg text-[12px] font-bold hover:bg-accent-hover transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {nameSaving ? 'Saving…' : 'Save changes'}
          </button>
        </form>

        <form onSubmit={handlePasswordSubmit} className="p-5 bg-surface border border-line rounded-xl space-y-4">
          <h2 className="text-[14px] font-bold text-ink">Change Password</h2>

          <PasswordField
            id="current-password"
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
          />
          <PasswordField
            id="new-password"
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
          />
          <PasswordField
            id="confirm-password"
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />

          {passwordMessage && <StatusMessage message={passwordMessage} />}

          <button
            type="submit"
            disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
            className="px-4 py-2 bg-accent text-white rounded-lg text-[12px] font-bold hover:bg-accent-hover transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {passwordSaving ? 'Changing…' : 'Change password'}
          </button>
        </form>
      </div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[12px] font-semibold text-ink-muted mb-1">
        {label}
      </label>
      <input
        id={id}
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="w-full px-3 py-2 bg-subtle border border-line rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-accent transition-all"
      />
    </div>
  );
}

function StatusMessage({ message }: { message: NonNullable<Message> }) {
  const Icon = message.type === 'success' ? CheckCircle2 : AlertCircle;
  return (
    <div
      className={`flex items-center gap-2 text-[12px] ${message.type === 'success' ? 'text-success' : 'text-danger'}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {message.text}
    </div>
  );
}
