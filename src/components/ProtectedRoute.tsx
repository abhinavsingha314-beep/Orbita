import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { MailCheck, RefreshCw, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const {
    firebaseUser,
    userProfile,
    loading,
    isAdmin,
    emailVerificationNeeded,
    resendVerificationEmail,
    refreshVerificationAndProfile,
    logout,
  } = useAuth();
  const location = useLocation();
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090B12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#527CFF] border-t-transparent animate-spin" />
          <p className="text-sm text-[#9CA7BB]">Loading ORBITA AI workspace...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (emailVerificationNeeded) {
    return (
      <div className="min-h-screen bg-[#090B12] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl bg-[#151C2B] border border-[#252D40] p-8 space-y-5">
          <div className="w-12 h-12 rounded-xl bg-[#101522] border border-[#252D40] flex items-center justify-center text-[#527CFF]">
            <MailCheck className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-[#F7F8FC]">Verify your email address</h1>
            <p className="text-sm text-[#9CA7BB] leading-relaxed">
              We sent a verification link to <span className="text-[#F7F8FC]">{firebaseUser.email}</span>. Click the link in your inbox, then tap Refresh Status below.
            </p>
          </div>
          {notice && <p className="text-xs text-[#20B981]">{notice}</p>}
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await refreshVerificationAndProfile();
                  setNotice('Checked verification status.');
                } finally {
                  setBusy(false);
                }
              }}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-lg bg-[#527CFF] hover:bg-[#4168E8] text-white text-sm font-medium cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              I Verified My Email — Refresh Status
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await resendVerificationEmail();
                  setNotice('Verification email resent.');
                } finally {
                  setBusy(false);
                }
              }}
              className="w-full min-h-[44px] rounded-lg border border-[#252D40] bg-[#101522] hover:bg-[#1A2235] text-[#F7F8FC] text-sm font-medium cursor-pointer"
            >
              Resend Verification Email
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="w-full min-h-[40px] text-xs text-[#9CA7BB] hover:text-[#F7F8FC] cursor-pointer"
            >
              Sign out and use a different account
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (userProfile?.status === 'suspended') {
    return (
      <div className="min-h-screen bg-[#090B12] flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl bg-[#151C2B] border border-[#252D40] p-8 space-y-4">
          <div className="flex items-center gap-3 text-[#EF5350]">
            <ShieldAlert className="w-6 h-6" />
            <h1 className="text-lg font-semibold text-[#F7F8FC]">Account Suspended</h1>
          </div>
          <p className="text-sm text-[#9CA7BB]">
            Your ORBITA AI workspace access is currently suspended. Contact an administrator if you believe this is in error.
          </p>
          <button
            type="button"
            onClick={() => void logout()}
            className="w-full min-h-[44px] rounded-lg border border-[#252D40] bg-[#101522] text-[#F7F8FC] text-sm font-medium cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
