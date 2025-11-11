import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navigation from './components/Navigation';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import VideoDetailPage from './pages/VideoDetailPage';
import UserProfilePage from './pages/UserProfilePage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import FeedPage from './pages/FeedPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function AppContent() {
  const location = useLocation();
  const showNavigation = location.pathname !== '/' && location.pathname !== '/login' && location.pathname !== '/register';

  return (
    <>
      {showNavigation && <Navigation />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/video/:id" element={<VideoDetailPage />} />
        <Route path="/user/:username" element={<UserProfilePage />} />
        <Route path="/settings" element={<AccountSettingsPage />} />
        <Route path="/feed" element={<FeedPage />} />
        {/* Keep login/register routes for backwards compatibility, but redirect to landing */}
        <Route path="/login" element={<LandingPage />} />
        <Route path="/register" element={<LandingPage />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
