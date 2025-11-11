import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout, loading } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Show minimal nav while loading
  if (loading) {
    return (
      <nav style={{
        backgroundColor: 'white',
        padding: '15px 20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link to="/" style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#36454F',
            textDecoration: 'none'
          }}>
            🐾 Petflix
          </Link>
          <div style={{ color: '#666', fontSize: '14px' }}>Loading...</div>
        </div>
      </nav>
    );
  }
  
  console.log('🧭 Navigation render - isAuthenticated:', isAuthenticated, 'user:', user?.username);

  return (
    <nav style={{
      backgroundColor: 'white',
      padding: '15px 20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Link to={isAuthenticated ? "/home" : "/"} style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#36454F',
          textDecoration: 'none'
        }}>
          🐾 Petflix
        </Link>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {isAuthenticated && user ? (
            <>
              <Link to="/search" style={{ color: '#36454F', textDecoration: 'none' }}>
                Search
              </Link>
            <>
              <Link to="/home" style={{ color: '#36454F', textDecoration: 'none' }}>
                Home
              </Link>
              <Link to="/feed" style={{ color: '#36454F', textDecoration: 'none' }}>
                Feed
              </Link>
              <Link to={`/user/${user.username}`} style={{ color: '#36454F', textDecoration: 'none', fontWeight: 'bold' }}>
                {user.username}
              </Link>
              <Link to="/settings" style={{ color: '#36454F', textDecoration: 'none' }}>
                Settings
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f0f0f0',
                  color: '#36454F',
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/" style={{ color: '#36454F', textDecoration: 'none' }}>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

