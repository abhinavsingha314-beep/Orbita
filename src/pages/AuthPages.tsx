import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Mail } from 'lucide-react';
import { PublicLayout } from '../components/PublicLayout';
import { useAuth } from '../contexts/AuthContext';

function formatAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  const msg = err instanceof Error ? err.message : String(err);
  if (code === 'auth/operation-not-allowed') {
    return 'Email/Password sign-in is not enabled in the Firebase Console yet. Use "Continue with Google" below, or enable Email/Password under Firebase Console → Authentication → Sign-in method.';
  }
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Invalid email or password. Please verify your credentials or try Google Sign-In.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email already exists. Please sign in instead.';
  }
  if (code === 'auth/weak-password') {
    return 'Please choose a stronger password (at least 6 characters).';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Sign-in popup was closed before completion.';
  }
  return msg || 'Authentication failed. Please try again.';
}

function GoogleButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-full min-h-[44px] flex items-center justify-center gap-3 rounded-lg bg-[#101522] hover:bg-[#1A2235] border border-[#252D40] text-sm font-medium text-[#F7F8FC] transition-colors disabled:opacity-60 cursor-pointer"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
        />
        <path
          fill="#FBBC05"
          d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
        />
      </svg>
      <span>{label}</span>
    </button>
  );
}

export function LoginPage() {
  const { firebaseUser, signInWithGoogle, loginWithEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (firebaseUser) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await loginWithEmail(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-xl bg-[#151C2B] border border-[#252D40] p-6 sm:p-8 space-y-6">
          <div className="space-y-1.5">
            <h1 className="font-display text-2xl font-bold text-[#F7F8FC]">Sign in to ORBITA AI</h1>
            <p className="text-sm text-[#9CA7BB]">Access your specialized AI workforce command center.</p>
          </div>

          {error && (
            <div className="rounded-lg bg-[#EF5350]/10 border border-[#EF5350]/40 px-4 py-3 text-xs text-[#EF5350] leading-relaxed">
              {error}
            </div>
          )}

          <GoogleButton label="Continue with Google" onClick={handleGoogle} disabled={busy} />

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-[#252D40]" />
            <span className="shrink mx-3 text-xs text-[#9CA7BB]">or with email</span>
            <div className="flex-grow border-t border-[#252D40]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-xs font-medium text-[#9CA7BB]">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full min-h-[44px] rounded-lg bg-[#090B12] border border-[#252D40] px-3.5 text-sm text-[#F7F8FC] placeholder-[#9CA7BB]/50 focus:outline-none focus:border-[#527CFF]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="block text-xs font-medium text-[#9CA7BB]">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-[#527CFF] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full min-h-[44px] rounded-lg bg-[#090B12] border border-[#252D40] px-3.5 text-sm text-[#F7F8FC] placeholder-[#9CA7BB]/50 focus:outline-none focus:border-[#527CFF]"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-lg bg-[#527CFF] hover:bg-[#4168E8] disabled:opacity-60 text-white text-sm font-medium transition-colors cursor-pointer"
            >
              <span>{busy ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-xs text-[#9CA7BB]">
            New to ORBITA AI?{' '}
            <Link to="/register" className="text-[#527CFF] hover:underline font-medium">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}

export function RegisterPage() {
  const { firebaseUser, signInWithGoogle, registerWithEmail } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (firebaseUser) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      await registerWithEmail(name, email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-xl bg-[#151C2B] border border-[#252D40] p-6 sm:p-8 space-y-6">
          <div className="space-y-1.5">
            <h1 className="font-display text-2xl font-bold text-[#F7F8FC]">Create your workspace</h1>
            <p className="text-sm text-[#9CA7BB]">Start free with access to all six specialized AI agents.</p>
          </div>

          {error && (
            <div className="rounded-lg bg-[#EF5350]/10 border border-[#EF5350]/40 px-4 py-3 text-xs text-[#EF5350] leading-relaxed">
              {error}
            </div>
          )}

          <GoogleButton label="Continue with Google" onClick={handleGoogle} disabled={busy} />

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-[#252D40]" />
            <span className="shrink mx-3 text-xs text-[#9CA7BB]">or register with email</span>
            <div className="flex-grow border-t border-[#252D40]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="reg-name" className="block text-xs font-medium text-[#9CA7BB]">
                Full name
              </label>
              <input
                id="reg-name"
                type="text"
                required
                minLength={2}
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Priya Sharma"
                className="w-full min-h-[44px] rounded-lg bg-[#090B12] border border-[#252D40] px-3.5 text-sm text-[#F7F8FC] placeholder-[#9CA7BB]/50 focus:outline-none focus:border-[#527CFF]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reg-email" className="block text-xs font-medium text-[#9CA7BB]">
                Email address
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="priya@startup.in"
                className="w-full min-h-[44px] rounded-lg bg-[#090B12] border border-[#252D40] px-3.5 text-sm text-[#F7F8FC] placeholder-[#9CA7BB]/50 focus:outline-none focus:border-[#527CFF]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reg-password" className="block text-xs font-medium text-[#9CA7BB]">
                Password (min. 6 characters)
              </label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full min-h-[44px] rounded-lg bg-[#090B12] border border-[#252D40] px-3.5 text-sm text-[#F7F8FC] placeholder-[#9CA7BB]/50 focus:outline-none focus:border-[#527CFF]"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-lg bg-[#527CFF] hover:bg-[#4168E8] disabled:opacity-60 text-white text-sm font-medium transition-colors cursor-pointer"
            >
              <span>{busy ? 'Creating workspace...' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-xs text-[#9CA7BB]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#527CFF] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-xl bg-[#151C2B] border border-[#252D40] p-6 sm:p-8 space-y-6">
          <div className="space-y-1.5">
            <h1 className="font-display text-2xl font-bold text-[#F7F8FC]">Reset password</h1>
            <p className="text-sm text-[#9CA7BB]">
              Enter the email linked to your account and we will send a password reset link.
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-[#EF5350]/10 border border-[#EF5350]/40 px-4 py-3 text-xs text-[#EF5350]">
              {error}
            </div>
          )}

          {sent ? (
            <div className="rounded-lg bg-[#20B981]/10 border border-[#20B981]/40 p-4 space-y-2 text-sm text-[#20B981]">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Reset email sent</span>
              </div>
              <p className="text-xs text-[#9CA7BB]">
                Check your inbox at <span className="text-[#F7F8FC]">{email}</span> and follow the link to set a new password.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="reset-email" className="block text-xs font-medium text-[#9CA7BB]">
                  Email address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full min-h-[44px] rounded-lg bg-[#090B12] border border-[#252D40] px-3.5 text-sm text-[#F7F8FC] placeholder-[#9CA7BB]/50 focus:outline-none focus:border-[#527CFF]"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-lg bg-[#527CFF] hover:bg-[#4168E8] disabled:opacity-60 text-white text-sm font-medium transition-colors cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>{busy ? 'Sending link...' : 'Send Reset Link'}</span>
              </button>
            </form>
          )}

          <p className="text-center text-xs text-[#9CA7BB]">
            Remembered your password?{' '}
            <Link to="/login" className="text-[#527CFF] hover:underline font-medium">
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
