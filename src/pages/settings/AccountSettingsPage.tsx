import { useEffect, useState, type FormEvent } from 'react';
import { Globe, Loader2, Eye, EyeOff, ShieldCheck, Copy } from 'lucide-react';
import QRCode from 'qrcode';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { setTheme } from '../../features/settings/settingsSlice';
import { updateProfile, changePassword, setupMfa, confirmMfa, disableMfa } from '../../features/auth/authSlice';
import { ProviderLogo } from '../auth/ProviderLogo';

/**
 * Account settings.
 *
 * The name fields write through `updateProfile` to `PATCH /auth/me/`, which is
 * the only profile write the backend accepts. Email is shown read-only for the
 * same reason: that endpoint does not take an address, so an editable field
 * would be a promise the API cannot keep. Changing the sign-in address needs an
 * admin on the Users page.
 *
 * Password lives here, not on the old Profile page, and only for people who
 * have one: `has_password` is false for someone who only ever signed in with
 * Google or Microsoft, and asking them for a "current password" would be a
 * question with no answer. They see how they sign in instead.
 */

/** The three localStorage keys the session lives in; see `authSlice`. */
const SESSION_KEYS = ['revenact_access_token', 'revenact_refresh_token', 'revenact_user'];

export function AccountSettingsPage() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const theme = useAppSelector((state) => state.settings.theme);

  const storedName = currentUser?.name ?? '';
  const nameParts = storedName.trim().split(/\s+/);
  const [firstName, setFirstName] = useState(nameParts[0] ?? '');
  const [lastName, setLastName] = useState(nameParts.slice(1).join(' '));
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [clearedNotice, setClearedNotice] = useState(false);

  const email = currentUser?.email ?? '';
  // Undefined on a cached user from before this field existed: assume a
  // password rather than hide the form from someone who has one.
  const hasPassword = currentUser?.has_password ?? true;
  const providers = currentUser?.sign_in_providers ?? [];
  const nextName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
  const isDirty = nextName !== storedName;
  const canSave = isDirty && nextName.length > 0 && status !== 'saving';

  // The avatar shows the person, so it follows what they are typing rather
  // than what is saved.
  const initial = (firstName.trim().charAt(0) || email.charAt(0) || '?').toUpperCase();

  const handleSave = async () => {
    setStatus('saving');
    setError(null);
    try {
      await dispatch(updateProfile({ name: nextName })).unwrap();
      setStatus('saved');
      window.setTimeout(() => setStatus('idle'), 2500);
    } catch (err) {
      setStatus('idle');
      setError(typeof err === 'string' ? err : 'Could not save your profile.');
    }
  };

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const canChangePassword =
    passwordStatus !== 'saving' && currentPassword.length > 0 && newPassword.length > 0 && confirmPassword.length > 0;

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    // The backend runs Django's validators (12+ characters, not common, not
    // like your name); this only catches what it can before a round trip.
    if (newPassword.length < 12) {
      setPasswordError('Use at least 12 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('The new passwords do not match.');
      return;
    }
    setPasswordStatus('saving');
    try {
      await dispatch(changePassword({ currentPassword, newPassword })).unwrap();
      setPasswordStatus('saved');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      window.setTimeout(() => setPasswordStatus('idle'), 2500);
    } catch (err) {
      setPasswordStatus('idle');
      setPasswordError(typeof err === 'string' ? err : 'Could not change your password.');
    }
  };

  /**
   * Clears cached site data without signing the person out.
   *
   * The card promises the account is unaffected, so the three session keys are
   * put back. Clearing them outright would end the session, which is not what
   * "clear local data" means to anyone reading it.
   */
  const handleClearData = () => {
    try {
      const preserved = SESSION_KEYS.map((key) => [key, localStorage.getItem(key)] as const);
      localStorage.clear();
      for (const [key, value] of preserved) {
        if (value !== null) localStorage.setItem(key, value);
      }
      sessionStorage.clear();
    } catch {
      // Private windows and blocked site data throw on access. Nothing cached
      // means nothing to clear, so the message below is still true.
    }
    setClearedNotice(true);
    window.setTimeout(() => setClearedNotice(false), 2500);
  };

  return (
    <div className="flex flex-col gap-3.5">
      <h1 className="text-[13px] font-medium text-[var(--rv-text)]">Account</h1>

      {/* Profile */}
      <section className="rv-card p-5 flex flex-col gap-3.5" aria-labelledby="profile-heading">
        <div>
          <h2 id="profile-heading" className="text-[14px] font-bold text-[var(--rv-text)]">
            Profile
          </h2>
          <p className="text-[12px] text-[var(--rv-text-muted)] mt-0.5">
            Your personal details and preferences.
          </p>
        </div>

        <div className="h-px bg-[var(--rv-card-border)] -mx-5 my-0.5" />

        <div className="flex items-start gap-4 pt-1">
          <div
            className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center text-xl font-bold shrink-0 select-none"
            aria-hidden="true"
          >
            {initial}
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="first-name" className="text-[11.5px] text-[var(--rv-text-muted)]">
                First name
              </label>
              <input
                id="first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="rv-input text-[12.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="last-name" className="text-[11.5px] text-[var(--rv-text-muted)]">
                Last name
              </label>
              <input
                id="last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="rv-input text-[12.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1 mt-1">
          <label htmlFor="account-email" className="text-[11.5px] text-[var(--rv-text-muted)]">
            Email
          </label>
          <input
            id="account-email"
            type="email"
            value={email}
            readOnly
            aria-describedby="email-hint"
            className="rv-input text-[12.5px] opacity-70 cursor-not-allowed"
          />
          <p id="email-hint" className="text-[11px] text-[var(--rv-text-muted)]">
            Your sign-in address. An admin can change it on the Users page.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="rv-pill-primary disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            {status === 'saving' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                Saving
              </>
            ) : (
              'Save changes'
            )}
          </button>
          {status === 'saved' && (
            <span role="status" className="text-[11.5px] font-medium text-success">
              Profile saved.
            </span>
          )}
          {error && (
            <span role="alert" className="text-[11.5px] font-medium text-danger">
              {error}
            </span>
          )}
        </div>
      </section>

      {/* Sign-in */}
      <section className="rv-card p-5 flex flex-col gap-3.5" aria-labelledby="signin-heading">
        <div>
          <h2 id="signin-heading" className="text-[14px] font-bold text-[var(--rv-text)]">
            {hasPassword ? 'Password' : 'How you sign in'}
          </h2>
          <p className="text-[12px] text-[var(--rv-text-muted)] mt-0.5">
            {hasPassword
              ? 'Change the password you sign in with. You stay signed in here.'
              : 'You sign in through your identity provider. There is no separate password to manage.'}
          </p>
        </div>

        <div className="h-px bg-[var(--rv-card-border)] -mx-5 my-0.5" />

        {hasPassword ? (
          <form onSubmit={handlePasswordSubmit} noValidate className="flex flex-col gap-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(
                [
                  ['current-password', 'Current password', currentPassword, setCurrentPassword, 'current-password'],
                  ['new-password', 'New password', newPassword, setNewPassword, 'new-password'],
                  ['confirm-password', 'Confirm new password', confirmPassword, setConfirmPassword, 'new-password'],
                ] as const
              ).map(([id, label, value, setValue, autoComplete]) => (
                <div key={id} className="flex flex-col gap-1">
                  <label htmlFor={id} className="text-[11.5px] text-[var(--rv-text-muted)]">
                    {label}
                  </label>
                  <input
                    id={id}
                    type={showPasswords ? 'text' : 'password'}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    autoComplete={autoComplete}
                    className="rv-input text-[12.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={!canChangePassword}
                className="rv-pill-primary disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                {passwordStatus === 'saving' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    Changing
                  </>
                ) : (
                  'Change password'
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowPasswords((shown) => !shown)}
                className="inline-flex items-center gap-1.5 text-[11.5px] text-[var(--rv-text-muted)] hover:text-[var(--rv-text)] transition-colors"
                aria-pressed={showPasswords}
              >
                {showPasswords ? <EyeOff className="w-3.5 h-3.5" aria-hidden="true" /> : <Eye className="w-3.5 h-3.5" aria-hidden="true" />}
                {showPasswords ? 'Hide' : 'Show'}
              </button>
              {passwordStatus === 'saved' && (
                <span role="status" className="text-[11.5px] font-medium text-success">
                  Password changed.
                </span>
              )}
              {passwordError && (
                <span role="alert" className="text-[11.5px] font-medium text-danger">
                  {passwordError}
                </span>
              )}
            </div>
          </form>
        ) : (
          <ul className="flex flex-wrap gap-2 pt-1" aria-label="Sign-in methods">
            {(providers.length > 0 ? providers : ['provider']).map((key) => (
              <li
                key={key}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--rv-input-bg)] border border-[var(--rv-input-border)] text-[12px] font-medium text-[var(--rv-text)]"
              >
                <ProviderLogo provider={key} className="w-4 h-4" />
                {key === 'google' ? 'Google' : key === 'microsoft' ? 'Microsoft' : 'Identity provider'}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Two-factor */}
      <TwoFactorSection enrolled={currentUser?.mfa_enrolled === true} isStaff={currentUser?.is_superuser === true} />

      {/* Appearance */}
      <section className="rv-card p-5 flex flex-col gap-3" aria-labelledby="appearance-heading">
        <div>
          <h2 id="appearance-heading" className="text-[14px] font-bold text-[var(--rv-text)]">
            Appearance
          </h2>
          <p className="text-[12px] text-[var(--rv-text-muted)] mt-0.5">
            Choose how Revenact looks to you.
          </p>
        </div>

        <div className="pt-0.5">
          <div
            role="radiogroup"
            aria-labelledby="appearance-heading"
            className="inline-flex bg-[var(--rv-pill-secondary-bg)] p-1 rounded-lg border border-[var(--rv-card-border)]"
          >
            {(['light', 'dark', 'system'] as const).map((mode) => {
              const active = theme === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => dispatch(setTheme(mode))}
                  className={`px-3 py-1 rounded-md text-[11.5px] font-medium transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    active
                      ? 'bg-[var(--rv-pill-primary-bg)] text-[var(--rv-pill-primary-text)] font-semibold'
                      : 'text-[var(--rv-text-muted)] hover:text-[var(--rv-text)]'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timezone */}
      <section className="rv-card p-5 flex flex-col gap-3" aria-labelledby="timezone-heading">
        <div>
          <h2 id="timezone-heading" className="text-[14px] font-bold text-[var(--rv-text)]">
            Timezone
          </h2>
          <p className="text-[12px] text-[var(--rv-text-muted)] mt-0.5">
            The timezone your calendar displays. Automatic follows your device.
          </p>
        </div>

        <div className="pt-0.5 flex items-center gap-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--rv-input-bg)] border border-[var(--rv-input-border)] text-[12px] font-medium text-[var(--rv-text)]">
            <Globe className="w-3.5 h-3.5 text-[var(--rv-text-muted)]" aria-hidden="true" />
            {/* Read from the browser rather than hardcoded, so it is true on
                every machine that opens this page. */}
            <span>Automatic &middot; {Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
          </div>
        </div>
      </section>

      {/* Data & Storage */}
      <section className="rv-card p-5 flex flex-col gap-3" aria-labelledby="data-heading">
        <div>
          <h2 id="data-heading" className="text-[14px] font-bold text-[var(--rv-text)]">
            Data and storage
          </h2>
          <p className="text-[12px] text-[var(--rv-text-muted)] mt-0.5">
            Clear cached site data. You stay signed in, and nothing on the server is affected.
          </p>
        </div>

        <div className="pt-0.5 flex items-center gap-3">
          <button
            type="button"
            onClick={handleClearData}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--rv-input-bg)] hover:bg-[var(--rv-pill-secondary-bg)] border border-[var(--rv-input-border)] text-[12px] font-medium text-[var(--rv-text)] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Clear cached data
          </button>

          {clearedNotice && (
            <span role="status" className="text-[11px] text-success font-medium">
              Cached data cleared.
            </span>
          )}
        </div>
      </section>
    </div>
  );
}

/**
 * Two-factor authentication with an authenticator app.
 *
 * Enrolment is three steps and nothing is on until the last one: the server
 * hands out a secret, the app scans it, and a correct code proves the app
 * works. Recovery codes come back with that proof and are shown exactly
 * once, so the screen says so and offers to copy them. Turning it off needs
 * a current code: a signed-in session alone must not be enough.
 *
 * `mfa_enrolled` may be missing on a user cached before the field existed;
 * the page then reads the server's answer on its next profile refresh.
 */
function TwoFactorSection({ enrolled, isStaff }: { enrolled: boolean; isStaff: boolean }) {
  const dispatch = useAppDispatch();
  const [stage, setStage] = useState<'idle' | 'scan' | 'codes' | 'disable'>('idle');
  const [secret, setSecret] = useState('');
  const [qr, setQr] = useState('');
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // The QR is drawn from the otpauth URI the server returned; nothing about
  // the secret is decided here.
  const [otpauth, setOtpauth] = useState('');
  useEffect(() => {
    if (!otpauth) return;
    QRCode.toDataURL(otpauth, { margin: 1, width: 176 })
      .then(setQr)
      .catch(() => setQr(''));
  }, [otpauth]);

  async function begin() {
    setError(null);
    setBusy(true);
    try {
      const data = await dispatch(setupMfa()).unwrap();
      setSecret(data.secret);
      setOtpauth(data.otpauth_uri);
      setCode('');
      setStage('scan');
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Could not start two-factor setup.');
    } finally {
      setBusy(false);
    }
  }

  async function confirm(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const data = await dispatch(confirmMfa(code.trim())).unwrap();
      setRecoveryCodes(data.recovery_codes);
      setStage('codes');
    } catch (err) {
      setError(typeof err === 'string' ? err : 'That code is not right.');
    } finally {
      setBusy(false);
    }
  }

  async function turnOff(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await dispatch(disableMfa(code.trim())).unwrap();
      setStage('idle');
      setCode('');
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Could not turn two-factor authentication off.');
    } finally {
      setBusy(false);
    }
  }

  async function copyCodes() {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be denied; the codes are on screen regardless.
    }
  }

  return (
    <section className="rv-card p-5 flex flex-col gap-3.5" aria-labelledby="mfa-heading">
      <div>
        <h2 id="mfa-heading" className="text-[14px] font-bold text-[var(--rv-text)] flex items-center gap-2">
          Two-factor authentication
          {enrolled && stage !== 'codes' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success-dim text-success text-[11px] font-semibold">
              <ShieldCheck className="w-3 h-3" aria-hidden="true" />
              On
            </span>
          )}
        </h2>
        <p className="text-[12px] text-[var(--rv-text-muted)] mt-0.5">
          {isStaff
            ? 'Required for the Revenact platform portal. A code from your authenticator app at every sign-in.'
            : 'A code from your authenticator app at every sign-in, on top of your password.'}
        </p>
      </div>

      <div className="h-px bg-[var(--rv-card-border)] -mx-5 my-0.5" />

      {error && (
        <p role="alert" className="text-[11.5px] font-medium text-danger">
          {error}
        </p>
      )}

      {stage === 'idle' && !enrolled && (
        <div>
          <button type="button" onClick={begin} disabled={busy} className="rv-pill-primary disabled:opacity-40">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : null}
            Set up an authenticator app
          </button>
        </div>
      )}

      {stage === 'idle' && enrolled && (
        <div>
          <button type="button" onClick={() => { setCode(''); setStage('disable'); }} className="rv-pill-secondary">
            Turn off
          </button>
        </div>
      )}

      {stage === 'scan' && (
        <form onSubmit={confirm} noValidate className="flex flex-col sm:flex-row gap-4 items-start">
          {qr ? (
            <img src={qr} alt="QR code for your authenticator app" width={176} height={176} className="rounded-lg border border-[var(--rv-card-border)] bg-white p-1" />
          ) : (
            <div className="w-[176px] h-[176px] rounded-lg bg-[var(--rv-input-bg)]" aria-hidden="true" />
          )}
          <div className="flex-1 flex flex-col gap-2.5">
            <p className="text-[12px] text-[var(--rv-text-muted)]">
              Scan with Google Authenticator, 1Password, Authy or any TOTP app. Or enter the key by hand:
            </p>
            <code className="font-mono-brand text-[11.5px] text-[var(--rv-text)] bg-[var(--rv-input-bg)] border border-[var(--rv-input-border)] rounded px-2 py-1 break-all">
              {secret}
            </code>
            <label htmlFor="mfa-confirm-code" className="text-[11.5px] text-[var(--rv-text-muted)] mt-1">
              Then enter the six-digit code the app shows
            </label>
            <div className="flex items-center gap-2">
              <input
                id="mfa-confirm-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="rv-input text-[13px] font-mono-brand tracking-[0.2em] max-w-[160px]"
              />
              <button type="submit" disabled={busy || code.trim().length < 6} className="rv-pill-primary disabled:opacity-40">
                Turn on
              </button>
              <button type="button" onClick={() => setStage('idle')} className="rv-pill-secondary">
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {stage === 'codes' && (
        <div className="flex flex-col gap-2.5">
          <p className="text-[12.5px] font-medium text-[var(--rv-text)]">
            Two-factor authentication is on. Save these recovery codes somewhere safe; each works once, and they will not be shown again.
          </p>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono-brand text-[12px] text-[var(--rv-text)]" aria-label="Recovery codes">
            {recoveryCodes.map((c) => (
              <li key={c} className="bg-[var(--rv-input-bg)] border border-[var(--rv-input-border)] rounded px-2 py-1 text-center">
                {c}
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <button type="button" onClick={copyCodes} className="rv-pill-secondary">
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              {copied ? 'Copied' : 'Copy codes'}
            </button>
            <button type="button" onClick={() => setStage('idle')} className="rv-pill-primary">
              I have saved them
            </button>
          </div>
        </div>
      )}

      {stage === 'disable' && (
        <form onSubmit={turnOff} noValidate className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="mfa-disable-code" className="text-[11.5px] text-[var(--rv-text-muted)]">
              A current code, to confirm it is you
            </label>
            <input
              id="mfa-disable-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="rv-input text-[13px] font-mono-brand tracking-[0.2em] max-w-[160px]"
            />
          </div>
          <button type="submit" disabled={busy || !code.trim()} className="rv-pill-primary disabled:opacity-40">
            Turn off two-factor
          </button>
          <button type="button" onClick={() => setStage('idle')} className="rv-pill-secondary">
            Keep it on
          </button>
        </form>
      )}
    </section>
  );
}
