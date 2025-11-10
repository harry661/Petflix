import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import SearchPage from './pages/SearchPage';
import VideoDetailPage from './pages/VideoDetailPage';
import UserProfilePage from './pages/UserProfilePage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import FeedPage from './pages/FeedPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/video/:id" element={<VideoDetailPage />} />
        <Route path="/user/:username" element={<UserProfilePage />} />
        <Route path="/settings" element={<AccountSettingsPage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </Router>
  );
}

export default App;
