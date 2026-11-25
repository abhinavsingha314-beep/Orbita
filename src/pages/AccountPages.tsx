import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Download, HelpCircle, Send, Trash2, User } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import {
  createFeedback,
  deleteAllUserWorkspaceData,
  listSavedOutputs,
  listUserConversations,
  listUserFeedback,
  updateUserProfileDetails,
} from '../lib/db';
import type { FeedbackDoc } from '../lib/db';
import { PLAN_CATALOG } from '../shared/plans';

export function ProfilePage() {
  const { firebaseUser, userProfile, refreshVerificationAndProfile } = useAuth();

  const [name, setName] = useState(userProfile?.name ?? '');
  const [company, setCompany] = useState(userProfile?.company ?? '');
  const [jobTitle, setJobTitle] = useState(userProfile?.jobTitle ?? '');
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name);
      setCompany(userProfile.company ?? '');
      setJobTitle(userProfile.jobTitle ?? '');
      setPhotoURL(userProfile.photoURL ?? '');
    }
  }, [userProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setSaving(true);
    setSaved(false);
    try {
      await updateUserProfileDetails(firebaseUser.uid, {
        name,
        company,
        jobTitle,
        photoURL,
      });
      await refreshVerificationAndProfile();
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="User Profile">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="rounded-xl bg-[#151C2B] border border-[#252D40] p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#101522] border border-[#252D40] flex items-center justify-center overflow-hidden shrink-0">
            {userProfile?.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt={userProfile.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-[#527CFF]" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold text-[#F7F8FC] truncate">
              {userProfile?.name}
            </h2>
            <p className="text-xs text-[#9CA7BB] truncate">
              {userProfile?.email} · <span className="capitalize">{userProfile?.plan ?? 'free'}</span> plan ·{' '}
              <span className="capitalize">{userProfile?.role ?? 'user'}</span>
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSave}
          className="rounded-xl bg-[#151C2B] border border-[#252D40] p-6 space-y-4"
        >
          <h3 className="font-display text-base font-semibold text-[#F7F8FC]">Profile Details</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#9CA7BB]">Full Name</label>
              <input
                type="text"
                required
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-[44px] rounded-lg bg-[#090B12] border border-[#252D40] px-3.5 text-sm text-[#F7F8FC] focus:outline-none focus:border-[#527CFF]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#9CA7BB]">Email Address</label>
              <input
                type="email"
                disabled
                value={userProfile?.email ?? ''}
                className="w-full min-h-[44px] rounded-lg bg-[#090B12]/60 border border-[#252D40] px-3.5 text-sm text-[#9CA7BB]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#9CA7BB]">Company / Team</label>
              <input
                type="text"
                maxLength={120}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Optional"
                className="w-full min-h-[44px] rounded-lg bg-[#090B12] border border-[#252D40] px-3.5 text-sm text-[#F7F8FC] focus:outline-none focus:border-[#527CFF]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#9CA7BB]">Role / Title</label>
              <input
                type="text"
                maxLength={120}
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Founder, Growth Lead, etc."
                className="w-full min-h-[44px] rounded-lg bg-[#090B12] border border-[#252D40] px-3.5 text-sm text-[#F7F8FC] focus:outline-none focus:border-[#527CFF]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 min-h-[42px] rounded-lg bg-[#527CFF] hover:bg-[#4168E8] text-white text-sm font-medium cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-xs text-[#20B981]">
                <Check className="w-4 h-4" /> Profile updated
              </span>
            )}
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

export function SettingsPage() {
  const { firebaseUser, userProfile, monthlyRequestCount, monthlyRequestLimit, logout } = useAuth();
  const navigate = useNavigate();

  const [exporting, setExporting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const currentPlan = PLAN_CATALOG[userProfile?.plan ?? 'free'];

  const handleExport = async () => {
    if (!firebaseUser) return;
    setExporting(true);
    try {
      const [conversations, savedOutputs] = await Promise.all([
        listUserConversations(firebaseUser.uid),
        listSavedOutputs(firebaseUser.uid),
      ]);
      const blob = new Blob(
        [
          JSON.stringify(
            {
              exportedAt: new Date().toISOString(),
              profile: userProfile,
              conversations,
              savedOutputs,
            },
            null,
            2,
          ),
        ],
        { type: 'application/json' },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orbita-ai-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (!firebaseUser) return;
    setDeleting(true);
    try {
      await deleteAllUserWorkspaceData(firebaseUser.uid);
      await logout();
      navigate('/');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout title="Account Settings">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Subscription Plan */}
        <div className="rounded-xl bg-[#151C2B] border border-[#252D40] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#F7F8FC]">
                Subscription Tier: {currentPlan.name}
              </h2>
              <p className="text-xs text-[#9CA7BB] mt-1">{currentPlan.summary}</p>
            </div>
            <Link
              to="/contact"
              className="px-4 min-h-[40px] inline-flex items-center justify-center rounded-lg border border-[#252D40] bg-[#101522] hover:bg-[#1B2438] text-xs font-medium text-[#F7F8FC] whitespace-nowrap"
            >
              Request Plan Upgrade
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#252D40] text-xs">
            <div className="rounded-lg bg-[#101522] border border-[#252D40] p-3">
              <p className="text-[#9CA7BB]">Monthly Requests</p>
              <p className="font-mono tabular-nums text-base font-semibold text-[#F7F8FC] mt-1">
                {monthlyRequestCount} / {monthlyRequestLimit}
              </p>
            </div>
            <div className="rounded-lg bg-[#101522] border border-[#252D40] p-3">
              <p className="text-[#9CA7BB]">Saved Outputs Limit</p>
              <p className="font-mono tabular-nums text-base font-semibold text-[#F7F8FC] mt-1">
                {currentPlan.savedOutputLimit.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-[#101522] border border-[#252D40] p-3">
              <p className="text-[#9CA7BB]">History Retention</p>
              <p className="text-base font-semibold text-[#F7F8FC] mt-1">
                {currentPlan.historyRetentionLabel}
              </p>
            </div>
          </div>

          <p className="text-xs text-[#9CA7BB]">
            Note: Automated online billing checkout is not active yet. Plans are provisioned via Contact or Admin governance.
          </p>
        </div>

        {/* Data Export */}
        <div className="rounded-xl bg-[#151C2B] border border-[#252D40] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-display text-base font-semibold text-[#F7F8FC]">Export Workspace Data</h3>
            <p className="text-xs text-[#9CA7BB]">
              Download a JSON archive of your profile, conversation headers, and saved outputs.
            </p>
          </div>
          <button
            type="button"
            disabled={exporting}
            onClick={() => void handleExport()}
            className="px-4 min-h-[42px] inline-flex items-center justify-center gap-2 rounded-lg bg-[#101522] hover:bg-[#1B2438] border border-[#252D40] text-xs font-medium text-[#F7F8FC] shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#527CFF]" />
            <span>{exporting ? 'Exporting...' : 'Download JSON'}</span>
          </button>
        </div>

        {/* User-Controlled Data Deletion */}
        <div className="rounded-xl bg-[#151C2B] border border-[#EF5350]/40 p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="font-display text-base font-semibold text-[#EF5350]">
              Delete Workspace Data
            </h3>
            <p className="text-xs text-[#9CA7BB] leading-relaxed">
              Permanently erase your conversations, messages, saved outputs, usage records, custom prompts, and user profile from ORBITA AI. This action cannot be undone.
            </p>
          </div>

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="px-4 min-h-[42px] inline-flex items-center gap-2 rounded-lg border border-[#EF5350]/50 bg-[#EF5350]/10 hover:bg-[#EF5350]/20 text-xs font-medium text-[#EF5350] cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete All My Data</span>
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleDeleteAllData()}
                className="px-4 min-h-[42px] rounded-lg bg-[#EF5350] hover:bg-[#DC423F] text-white text-xs font-semibold cursor-pointer"
              >
                {deleting ? 'Deleting data...' : 'Confirm Permanent Deletion'}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmDelete(false)}
                className="px-4 min-h-[42px] rounded-lg border border-[#252D40] text-xs text-[#9CA7BB] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export function HelpCenterPage() {
  const { firebaseUser } = useAuth();
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'agent_quality' | 'general'>('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [myFeedback, setMyFeedback] = useState<FeedbackDoc[]>([]);

  useEffect(() => {
    if (!firebaseUser) return;
    listUserFeedback(firebaseUser.uid).then(setMyFeedback);
  }, [firebaseUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setSubmitting(true);
    setSent(false);
    try {
      const created = await createFeedback({
        userId: firebaseUser.uid,
        userEmail: firebaseUser.email || 'user@orbita.ai',
        feedbackType,
        subject,
        message,
      });
      setMyFeedback((prev) => [created, ...prev]);
      setSubject('');
      setMessage('');
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout title="Help Center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: 'Starting Multi-Turn Tasks',
              body: 'Open any of the six agents, type your objective or tap a suggested prompt, and refine across follow-up replies. History saves automatically.',
            },
            {
              title: 'Saving & Reusing Outputs',
              body: 'Tap "Save Output" below any AI reply to store it in your Saved Outputs vault for instant search and copying.',
            },
            {
              title: 'Using the Prompt Library',
              body: 'Browse curated templates or create your own. Clicking "Use Prompt" opens the matching agent pre-filled with your template.',
            },
            {
              title: 'Research & Finance Guardrails',
              body: 'ORBITA Research distinguishes facts, assumptions, and estimates. ORBITA Finance shows calculation steps and non-regulated disclaimers.',
            },
          ].map((guide) => (
            <div key={guide.title} className="rounded-xl bg-[#151C2B] border border-[#252D40] p-5 space-y-2">
              <div className="flex items-center gap-2 text-[#527CFF]">
                <HelpCircle className="w-4 h-4 shrink-0" />
                <h3 className="font-display text-sm font-semibold text-[#F7F8FC]">{guide.title}</h3>
              </div>
              <p className="text-xs text-[#9CA7BB] leading-relaxed">{guide.body}</p>
            </div>
          ))}
        </div>

        {/* Submit Feedback */}
        <form
          onSubmit={handleSubmit}
          className="rounded-xl bg-[#151C2B] border border-[#252D40] p-6 space-y-4"
        >
          <div>
            <h3 className="font-display text-base font-semibold text-[#F7F8FC]">Send Product Feedback</h3>
            <p className="text-xs text-[#9CA7BB] mt-0.5">
              Report bugs, request capabilities, or rate agent output quality.
            </p>
          </div>

          {sent && (
            <div className="rounded-lg bg-[#20B981]/10 border border-[#20B981]/40 px-4 py-2.5 text-xs text-[#20B981]">
              Feedback submitted. Thank you for helping improve ORBITA AI.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#9CA7BB]">Category</label>
              <select
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value as typeof feedbackType)}
                className="w-full min-h-[44px] rounded-lg bg-[#090B12] border border-[#252D40] px-3 text-sm text-[#F7F8FC] focus:outline-none focus:border-[#527CFF]"
              >
                <option value="general">General Feedback</option>
                <option value="feature">Feature Request</option>
                <option value="agent_quality">Agent Output Quality</option>
                <option value="bug">Bug Report</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#9CA7BB]">Subject</label>
              <input
                type="text"
                required
                maxLength={160}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary..."
                className="w-full min-h-[44px] rounded-lg bg-[#090B12] border border-[#252D40] px-3.5 text-sm text-[#F7F8FC] focus:outline-none focus:border-[#527CFF]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#9CA7BB]">Details</label>
            <textarea
              rows={4}
              required
              maxLength={3000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share details..."
              className="w-full rounded-lg bg-[#090B12] border border-[#252D40] p-3.5 text-sm text-[#F7F8FC] focus:outline-none focus:border-[#527CFF]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 min-h-[42px] rounded-lg bg-[#527CFF] hover:bg-[#4168E8] text-white text-xs font-medium cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Submitting...' : 'Submit Feedback'}</span>
          </button>
        </form>

        {/* User's Feedback History */}
        {myFeedback.length > 0 && (
          <div className="rounded-xl bg-[#151C2B] border border-[#252D40] p-5 space-y-3">
            <h3 className="font-display text-sm font-semibold text-[#F7F8FC]">Your Submitted Feedback</h3>
            <div className="divide-y divide-[#252D40]">
              {myFeedback.map((fb) => (
                <div key={fb.feedbackId} className="py-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#F7F8FC]">{fb.subject}</p>
                    <p className="text-xs text-[#9CA7BB] mt-0.5">{fb.message}</p>
                  </div>
                  <span
                    className={`text-xs font-medium capitalize shrink-0 ${
                      fb.status === 'resolved'
                        ? 'text-[#20B981]'
                        : fb.status === 'in_review'
                          ? 'text-[#F5B942]'
                          : 'text-[#527CFF]'
                    }`}
                  >
                    {fb.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
