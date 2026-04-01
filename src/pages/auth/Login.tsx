import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, KeyRound, Info } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { login, clearError } from '../../features/auth/authSlice';
import { loginSchema } from '../../features/auth/loginSchema';
import './Login.css';

export function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, isLoading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [toast, setToast] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  // Clear redux error when component unmounts or inputs change
  useEffect(() => {
    if (error) dispatch(clearError());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password]);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Validate with Zod
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const errors: { email?: string; password?: string } = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as 'email' | 'password';
        if (!errors[field]) errors[field] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    dispatch(login({ email, password }));
  }

  return (
    <div className="login-container">
      {/* Toast */}
      {toast && (
        <div className="toast-notification">
          <Info className="w-4 h-4" />
          {toast}
        </div>
      )}

      {/* Left Panel — Geometric Art */}
      <div className="login-left">
        <div className="geo-shape geo-shape-1" />
        <div className="geo-shape geo-shape-2" />
        <div className="geo-shape geo-shape-3" />
        <div className="geo-shape geo-shape-4" />
        <div className="geo-shape geo-shape-5" />
        <div className="geo-shape geo-shape-6" />

        <div className="login-left-content">
          <h1>
            <em>One platform,</em>
            <br />
            <strong>limitless Success</strong>
          </h1>
          <p>
            Decrease churn. Nail operational cadence. Grow revenue. But most of all, set up your customers for success!
          </p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="login-right">
        <div className="login-form-wrapper">
          <h2>Welcome Back!</h2>

          {/* Server error */}
          {error && (
            <div className="server-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="form-group">
              <label htmlFor="login-email">Username</label>
              <div className="form-input-wrapper">
                <input
                  id="login-email"
                  type="email"
                  className={`form-input ${fieldErrors.email ? 'has-error' : ''}`}
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {fieldErrors.email && (
                <div className="field-error">
                  <AlertCircle className="w-3 h-3" />
                  {fieldErrors.email}
                </div>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <div className="password-header">
                <label htmlFor="login-password">Password</label>
                <button
                  type="button"
                  className="show-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPassword ? 'Hide Password' : 'Show Password'}
                </button>
              </div>
              <div className="form-input-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input ${fieldErrors.password ? 'has-error' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              {fieldErrors.password && (
                <div className="field-error">
                  <AlertCircle className="w-3 h-3" />
                  {fieldErrors.password}
                </div>
              )}
            </div>

            {/* Forgot password */}
            <button
              type="button"
              className="forgot-password"
              onClick={() => showToast('🚧 Password reset is coming soon!')}
            >
              Forgot your password?
            </button>

            {/* Submit */}
            <button
              type="submit"
              className="login-btn login-btn-primary"
              disabled={isLoading}
            >
              {isLoading ? <div className="spinner" /> : 'Log In'}
            </button>

            {/* SSO */}
            <button
              type="button"
              className="login-btn login-btn-sso"
              onClick={() => showToast('🔐 SSO login is coming soon!')}
            >
              <KeyRound className="w-4 h-4" />
              Log In with SSO
            </button>
          </form>

          <div className="login-footer">
            By logging in, you agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}
