import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import {
  AboutPage,
  AgentsShowcasePage,
  ContactPage,
  FeaturesPage,
  PricingPage,
  PrivacyPage,
  TermsPage,
} from './pages/PublicInfoPages';
import { ForgotPasswordPage, LoginPage, RegisterPage } from './pages/AuthPages';
import { DashboardPage } from './pages/DashboardPage';
import { AgentMarketplacePage } from './pages/AgentMarketplacePage';
import { AgentWorkspacePage } from './pages/AgentWorkspacePage';
import { HistoryPage } from './pages/HistoryPage';
import { SavedOutputsPage } from './pages/SavedOutputsPage';
import { PromptLibraryPage } from './pages/PromptLibraryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { HelpCenterPage, ProfilePage, SettingsPage } from './pages/AccountPages';
import { AdminPage } from './pages/AdminPage';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/agents" element={<AgentsShowcasePage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />

            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Authenticated Workspace Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workspace"
              element={
                <ProtectedRoute>
                  <AgentMarketplacePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workspace/:agentId"
              element={
                <ProtectedRoute>
                  <AgentWorkspacePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <HistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/saved"
              element={
                <ProtectedRoute>
                  <SavedOutputsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/prompts"
              element={
                <ProtectedRoute>
                  <PromptLibraryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/help"
              element={
                <ProtectedRoute>
                  <HelpCenterPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Console Route */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
