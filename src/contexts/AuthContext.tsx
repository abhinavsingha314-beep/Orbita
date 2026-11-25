import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import {
  BOOTSTRAP_ADMIN_EMAIL,
  ensureUserProfile,
  getUserProfile,
  listAgentConfigs,
  listUserUsage,
} from '../lib/db';
import type { AgentConfigDoc, UsageRecordDoc, UserProfile } from '../lib/db';
import { getPlanLimits } from '../shared/plans';

interface AuthContextValue {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  emailVerificationNeeded: boolean;
  monthlyRequestCount: number;
  monthlyRequestLimit: number;
  agentOverrides: Record<string, AgentConfigDoc>;
  signInWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshVerificationAndProfile: () => Promise<void>;
  refreshUsage: () => Promise<void>;
  refreshAgentConfigs: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [usageRecords, setUsageRecords] = useState<UsageRecordDoc[]>([]);
  const [agentOverrides, setAgentOverrides] = useState<Record<string, AgentConfigDoc>>({});

  const loadWorkspaceMeta = useCallback(async (user: User) => {
    if (!user.emailVerified) {
      setUserProfile(null);
      setUsageRecords([]);
      return;
    }
    const profile = await ensureUserProfile(user);
    setUserProfile(profile);
    const [usage, configs] = await Promise.all([
      listUserUsage(user.uid),
      listAgentConfigs().catch(() => ({})),
    ]);
    setUsageRecords(usage);
    setAgentOverrides(configs);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setUserProfile(null);
        setUsageRecords([]);
        setAgentOverrides({});
        setLoading(false);
        return;
      }
      try {
        await loadWorkspaceMeta(user);
      } catch (err) {
        console.error('Failed to initialize user profile:', err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [loadWorkspaceMeta]);

  const signInWithGoogle = useCallback(async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    await loadWorkspaceMeta(cred.user);
  }, [loadWorkspaceMeta]);

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      await loadWorkspaceMeta(cred.user);
    },
    [loadWorkspaceMeta],
  );

  const registerWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: name.trim() });
      if (!cred.user.emailVerified) {
        await sendEmailVerification(cred.user);
      } else {
        await ensureUserProfile(cred.user, name.trim());
        await loadWorkspaceMeta(cred.user);
      }
    },
    [loadWorkspaceMeta],
  );

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      await sendEmailVerification(auth.currentUser);
    }
  }, []);

  const refreshVerificationAndProfile = useCallback(async () => {
    if (!auth.currentUser) return;
    await reload(auth.currentUser);
    const refreshed = auth.currentUser;
    setFirebaseUser(refreshed);
    if (refreshed.emailVerified) {
      const existing = await getUserProfile(refreshed.uid);
      if (!existing) {
        await ensureUserProfile(refreshed);
      }
      await loadWorkspaceMeta(refreshed);
    }
  }, [loadWorkspaceMeta]);

  const refreshUsage = useCallback(async () => {
    if (!auth.currentUser || !auth.currentUser.emailVerified) return;
    const usage = await listUserUsage(auth.currentUser.uid);
    setUsageRecords(usage);
  }, []);

  const refreshAgentConfigs = useCallback(async () => {
    if (!auth.currentUser) return;
    const configs = await listAgentConfigs().catch(() => ({}));
    setAgentOverrides(configs);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUserProfile(null);
    setUsageRecords([]);
  }, []);

  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const monthlyRequestCount = usageRecords
    .filter((u) => u.month === currentMonth)
    .reduce((acc, row) => acc + (row.requestCount || 0), 0);

  const planDef = getPlanLimits(userProfile?.plan);
  const isBootstrapAdmin =
    Boolean(firebaseUser?.emailVerified) &&
    firebaseUser?.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
  const isAdmin = Boolean(isBootstrapAdmin || userProfile?.role === 'admin');
  const emailVerificationNeeded = Boolean(firebaseUser && !firebaseUser.emailVerified);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        userProfile,
        loading,
        isAdmin,
        emailVerificationNeeded,
        monthlyRequestCount,
        monthlyRequestLimit: planDef.monthlyRequestLimit,
        agentOverrides,
        signInWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        resendVerificationEmail,
        refreshVerificationAndProfile,
        refreshUsage,
        refreshAgentConfigs,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
