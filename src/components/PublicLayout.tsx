import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { firebaseUser } = useAuth();
  const location = useLocation();

  const navLinks = [
    { to: '/features', label: 'Features' },
    { to: '/agents', label: 'AI Agents' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  const primaryCtaTo = firebaseUser ? '/dashboard' : '/register';
  const primaryCtaLabel = firebaseUser ? 'Open Workspace' : 'Get Started';

  return (
    <div className="min-h-screen bg-[#090B12] text-[#F7F8FC] flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 h-14 md:h-16 bg-[#090B12]/90 backdrop-blur-md border-b border-[#252D40]">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <Link
            to="/"
            className="font-display text-lg font-bold tracking-tight text-[#F7F8FC] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#527CFF] rounded"
          >
            ORBITA AI
          </Link>

          {/* Zone 2: 5 concise single-line text nav links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#9CA7BB]">
            {navLinks.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`whitespace-nowrap shrink-0 transition-colors hover:text-[#F7F8FC] hover:underline underline-offset-4 ${
                    active ? 'text-[#F7F8FC]' : ''
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action + Mobile Menu Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to={primaryCtaTo}
              className="hidden sm:inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-[40px] rounded-lg bg-[#527CFF] hover:bg-[#4168E8] text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0"
            >
              <span>{primaryCtaLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-[#252D40] bg-[#101522] text-[#F7F8FC] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-14 z-30 bg-[#101522] border-b border-[#252D40] px-4 py-4 space-y-1 shadow-2xl">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-3 min-h-[44px] rounded-lg text-base font-medium transition-colors ${
                location.pathname === link.to
                  ? 'bg-[#151C2B] text-[#F7F8FC]'
                  : 'text-[#9CA7BB] hover:text-[#F7F8FC] hover:bg-[#151C2B]'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 mt-3 border-t border-[#252D40] flex flex-col gap-2">
            {!firebaseUser && (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full min-h-[44px] flex items-center justify-center rounded-lg border border-[#252D40] bg-[#151C2B] text-[#F7F8FC] text-sm font-medium"
              >
                Sign In
              </Link>
            )}
            <Link
              to={primaryCtaTo}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-lg bg-[#527CFF] text-white text-sm font-medium"
            >
              <span>{primaryCtaLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      <main className="flex-1">{children}</main>

      {/* Quiet Enterprise Footer */}
      <footer className="bg-[#090B12] border-t border-[#252D40]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1 space-y-3">
              <Link to="/" className="font-display text-lg font-bold text-[#F7F8FC]">
                ORBITA AI
              </Link>
              <p className="text-sm text-[#9CA7BB] leading-relaxed">
                Your AI Workforce. One Command Center. Built for founders, operators, agencies, and growing enterprises.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#F7F8FC]">Platform</h3>
              <ul className="space-y-2 text-sm text-[#9CA7BB]">
                <li><Link to="/features" className="hover:text-[#F7F8FC] transition-colors">Features</Link></li>
                <li><Link to="/agents" className="hover:text-[#F7F8FC] transition-colors">AI Agents</Link></li>
                <li><Link to="/pricing" className="hover:text-[#F7F8FC] transition-colors">Pricing</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#F7F8FC]">Company</h3>
              <ul className="space-y-2 text-sm text-[#9CA7BB]">
                <li><Link to="/about" className="hover:text-[#F7F8FC] transition-colors">About</Link></li>
                <li><Link to="/contact" className="hover:text-[#F7F8FC] transition-colors">Contact</Link></li>
                <li><Link to="/login" className="hover:text-[#F7F8FC] transition-colors">Sign In</Link></li>
                <li><Link to="/register" className="hover:text-[#F7F8FC] transition-colors">Create Account</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-[#F7F8FC]">Legal</h3>
              <ul className="space-y-2 text-sm text-[#9CA7BB]">
                <li><Link to="/privacy" className="hover:text-[#F7F8FC] transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-[#F7F8FC] transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-[#252D40] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#9CA7BB]">
            <span>© {new Date().getFullYear()} ORBITA AI. All rights reserved.</span>
            <span>India-first AI workforce operating system · Expanding globally</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
