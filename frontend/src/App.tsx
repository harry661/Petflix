import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { SearchProvider } from './context/SearchContext';
import Navigation from './components/Navigation';

// Lazy load pages for better performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const VideoDetailPage = lazy(() => import('./pages/VideoDetailPage'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));
const AccountSettingsPage = lazy(() => import('./pages/AccountSettingsPage'));
const FeedPage = lazy(() => import('./pages/FeedPage'));

function AppContent() {
  const location = useLocation();
  const showNavigation = location.pathname !== '/' && location.pathname !== '/login' && location.pathname !== '/register';

  return (
    <>
      {showNavigation && <Navigation />}
      <Suspense fallback={
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#1E1E1E',
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
          <Route path="/popular" element={<HomePage />} />
          <Route path="/favourites" element={<FeedPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/video/:id" element={<VideoDetailPage />} />
          <Route path="/user/:username" element={<UserProfilePage />} />
          <Route path="/settings" element={<AccountSettingsPage />} />
          <Route path="/feed" element={<FeedPage />} />
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
    <SearchProvider>
      <Router>
        <AppContent />
      </Router>
    </SearchProvider>
  );
}

export default App;
