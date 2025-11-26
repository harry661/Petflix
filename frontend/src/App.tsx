import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { SearchProvider } from './context/SearchContext';
import { ToastProvider } from './components/ToastContainer';
import { ErrorBoundary } from './components/ErrorBoundary';
import Navigation from './components/Navigation';
import PWAInstallPrompt from './components/PWAInstallPrompt';

// Lazy load pages for better performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const TrendingPage = lazy(() => import('./pages/TrendingPage'));
const VideoDetailPage = lazy(() => import('./pages/VideoDetailPage'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));
const FollowersFollowingPage = lazy(() => import('./pages/FollowersFollowingPage'));
const AccountSettingsPage = lazy(() => import('./pages/AccountSettingsPage'));
const FeedPage = lazy(() => import('./pages/FeedPage'));
const PlaylistDetailPage = lazy(() => import('./pages/PlaylistDetailPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
// LoginPage and RegisterPage are not used - routes redirect to LandingPage

function AppContent() {
  const location = useLocation();
  const showNavigation = location.pathname !== '/' && 
    location.pathname !== '/login' && 
    location.pathname !== '/register' &&
    location.pathname !== '/forgot-password' &&
    location.pathname !== '/reset-password' &&
    location.pathname !== '/terms-of-service' &&
    location.pathname !== '/privacy-policy';

  return (
    <>
      {showNavigation && <Navigation />}
      <PWAInstallPrompt />
      <Suspense fallback={
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0F0F0F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <p style={{ color: '#ffffff' }}>Loading...</p>
        </div>
      }>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/popular" element={<TrendingPage />} />
          <Route path="/trending" element={<TrendingPage />} />
          <Route path="/following" element={<FeedPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/video/:id" element={<VideoDetailPage />} />
          <Route path="/user/:username" element={<UserProfilePage />} />
          <Route path="/user/:username/followers" element={<FollowersFollowingPage />} />
          <Route path="/user/:username/following" element={<FollowersFollowingPage />} />
          <Route path="/settings" element={<AccountSettingsPage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/playlist/:id" element={<PlaylistDetailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          {/* Keep login/register routes for backwards compatibility, but redirect to landing */}
          <Route path="/login" element={<LandingPage />} />
          <Route path="/register" element={<LandingPage />} />
        </Routes>
      </Suspense>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <SearchProvider>
          <Router>
            <AppContent />
          </Router>
        </SearchProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
