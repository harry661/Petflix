import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Navigation() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    setIsAuthenticated(!!token);
    
    if (token) {
      loadUser();
    }
  }, []);

  const loadUser = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/v1/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (err) {
      // Not logged in
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/');
  };

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

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link to="/search" style={{ color: '#36454F', textDecoration: 'none' }}>
            Search
          </Link>
          
          {isAuthenticated ? (
            <>
              <Link to="/feed" style={{ color: '#36454F', textDecoration: 'none' }}>
                Feed
              </Link>
              {user && (
                <Link to={`/user/${user.username}`} style={{ color: '#36454F', textDecoration: 'none' }}>
                  {user.username}
                </Link>
              )}
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
            <>
              <Link to="/login" style={{ color: '#36454F', textDecoration: 'none' }}>
                Login
              </Link>
              <Link to="/register" style={{
                padding: '8px 16px',
                backgroundColor: '#ADD8E6',
                color: '#36454F',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: 'bold'
              }}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

