import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bookmark,
  Bot,
  HelpCircle,
  History,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PRIMARY_NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/workspace', label: 'AI Agents', icon: Bot },
  { to: '/history', label: 'Chat History', icon: History },
  { to: '/saved', label: 'Saved Outputs', icon: Bookmark },
  { to: '/prompts', label: 'Prompt Library', icon: Library },
  { to: '/analytics', label: 'Usage Analytics', icon: BarChart3 },
];

const SECONDARY_NAV: NavItem[] = [
  { to: '/profile', label: 'Profile', icon: UserIcon },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/help', label: 'Help Center', icon: HelpCircle },
];

export function AppLayout({
  title,
  actions,
  children,
  hideMobilePadding = false,
}: {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  hideMobilePadding?: boolean;
}) {
  const { userProfile, isAdmin, monthlyRequestCount, monthlyRequestLimit, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const isPathActive = (to: string) =>
    location.pathname === to || (to === '/workspace' && location.pathname.startsWith('/workspace/'));

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const quotaPct = Math.min(100, Math.round((monthlyRequestCount / Math.max(1, monthlyRequestLimit)) * 100));

  return (
    <div className="min-h-screen bg-[#090B12] text-[#F7F8FC] flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-[260px] lg:flex-col lg:fixed lg:inset-y-0 bg-[#101522] border-r border-[#252D40] z-30">
        <div className="h-16 px-6 flex items-center justify-between border-b border-[#252D40]">
          <Link to="/dashboard" className="font-display text-lg font-bold tracking-tight text-[#F7F8FC]">
            ORBITA AI
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div className="space-y-1">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon;
              const active = isPathActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#151C2B] text-[#F7F8FC] border border-[#252D40]'
                      : 'text-[#9CA7BB] hover:text-[#F7F8FC] hover:bg-[#151C2B]/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#527CFF]' : 'text-[#9CA7BB]'}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-4 border-t border-[#252D40] space-y-1">
            {SECONDARY_NAV.map((item) => {
              const Icon = item.icon;
              const active = isPathActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#151C2B] text-[#F7F8FC] border border-[#252D40]'
                      : 'text-[#9CA7BB] hover:text-[#F7F8FC] hover:bg-[#151C2B]/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#527CFF]' : 'text-[#9CA7BB]'}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isPathActive('/admin')
                    ? 'bg-[#151C2B] text-[#F7F8FC] border border-[#252D40]'
                    : 'text-[#9CA7BB] hover:text-[#F7F8FC] hover:bg-[#151C2B]/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4 shrink-0 text-[#8666FF]" />
                <span className="truncate">Admin Console</span>
              </Link>
            )}
          </div>
        </nav>

        {/* Usage & User Footer */}
        <div className="p-4 border-t border-[#252D40] space-y-3 bg-[#090B12]/40">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#9CA7BB] capitalize">{userProfile?.plan ?? 'free'} plan</span>
              <span className="font-mono tabular-nums text-[#F7F8FC]">
                {monthlyRequestCount}/{monthlyRequestLimit}
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#151C2B] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#527CFF] transition-all"
                style={{ width: `${quotaPct}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <Link to="/profile" className="min-w-0 flex-1 group">
              <p className="text-sm font-medium text-[#F7F8FC] truncate group-hover:text-[#527CFF] transition-colors">
                {userProfile?.name ?? 'User'}
              </p>
              <p className="text-xs text-[#9CA7BB] truncate">{userProfile?.email}</p>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              aria-label="Sign out"
              className="p-2 rounded-lg text-[#9CA7BB] hover:text-[#EF5350] hover:bg-[#151C2B] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 lg:pl-[260px] flex flex-col min-w-0">
        {/* Compact Sticky Top Bar (<= 56px on mobile for 15% sticky cap) */}
        <header className="sticky top-0 z-20 h-14 bg-[#090B12]/90 backdrop-blur-md border-b border-[#252D40] px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/dashboard"
              className="lg:hidden font-display text-sm font-bold text-[#527CFF] whitespace-nowrap shrink-0"
            >
              ORBITA
            </Link>
            <span className="lg:hidden text-[#252D40]">/</span>
            <h1 className="text-sm sm:text-base font-semibold text-[#F7F8FC] truncate">{title}</h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {actions}
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-label="Open workspace menu"
              className="lg:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg border border-[#252D40] bg-[#101522] text-[#F7F8FC] cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Body */}
        <main className={`flex-1 ${hideMobilePadding ? 'pb-16 lg:pb-0' : 'pb-20 lg:pb-8'}`}>
          {children}
        </main>
      </div>

      {/* Mobile Fixed Bottom Tab Bar (44px+ hitboxes, compact height) */}
      <nav
        aria-label="Mobile workspace navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-14 bg-[#101522]/95 backdrop-blur-md border-t border-[#252D40] grid grid-cols-5 items-center"
      >
        {[
          { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
          { to: '/workspace', label: 'Agents', icon: Bot },
          { to: '/history', label: 'History', icon: History },
          { to: '/saved', label: 'Saved', icon: Bookmark },
        ].map((item) => {
          const Icon = item.icon;
          const active = isPathActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                active ? 'text-[#527CFF]' : 'text-[#9CA7BB]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={`h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium cursor-pointer ${
            moreOpen ? 'text-[#527CFF]' : 'text-[#9CA7BB]'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile "More" Bottom Sheet */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end">
          <div className="w-full bg-[#101522] border-t border-[#252D40] rounded-t-2xl p-5 pb-8 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#F7F8FC]">{userProfile?.name}</p>
                <p className="text-xs text-[#9CA7BB]">{userProfile?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Close menu"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-[#252D40] bg-[#151C2B] text-[#F7F8FC]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#151C2B] border border-[#252D40] rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#9CA7BB] capitalize">{userProfile?.plan ?? 'free'} plan usage</span>
                <span className="font-mono tabular-nums text-[#F7F8FC]">
                  {monthlyRequestCount} / {monthlyRequestLimit}
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#090B12] rounded-full overflow-hidden">
                <div className="h-full bg-[#527CFF]" style={{ width: `${quotaPct}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-1">
              {[...PRIMARY_NAV.slice(4), ...SECONDARY_NAV].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-3 px-3 min-h-[44px] rounded-lg text-sm font-medium text-[#F7F8FC] hover:bg-[#151C2B]"
                  >
                    <Icon className="w-4 h-4 text-[#527CFF]" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 px-3 min-h-[44px] rounded-lg text-sm font-medium text-[#F7F8FC] hover:bg-[#151C2B]"
                >
                  <ShieldCheck className="w-4 h-4 text-[#8666FF]" />
                  <span>Admin Console</span>
                </Link>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 min-h-[44px] rounded-lg text-sm font-medium text-[#EF5350] hover:bg-[#151C2B] text-left cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
