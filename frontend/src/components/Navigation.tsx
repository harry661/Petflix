import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Search, Bell, ChevronDown } from 'lucide-react';

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout, loading } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowProfileMenu(false);
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  // Show minimal nav while loading
  if (loading) {
    return (
      <nav style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '15px 40px',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          maxWidth: '100%',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link to="/" style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#3B82F6',
            textDecoration: 'none',
            letterSpacing: '0.5px'
          }}>
            Petflix
          </Link>
          <div style={{ color: '#fff', fontSize: '14px' }}>Loading...</div>
        </div>
      </nav>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <nav style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '15px 40px',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{
          maxWidth: '100%',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link to="/" style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#ADD8E6',
            textDecoration: 'none'
          }}>
            🐾 Petflix
          </Link>
          <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontSize: '14px' }}>
            Sign In
          </Link>
        </div>
      </nav>
    );
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav style={{
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: '15px 40px',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{
        maxWidth: '100%',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        gap: '40px'
      }}>
        {/* Logo */}
        <Link to="/home" style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#3B82F6',
          textDecoration: 'none',
          marginRight: '20px',
          letterSpacing: '0.5px'
        }}>
          Petflix
        </Link>

        {/* Navigation Links */}
        <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
          <Link
            to="/home"
            style={{
              color: isActive('/home') ? '#fff' : '#ccc',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: isActive('/home') ? 'bold' : 'normal',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = isActive('/home') ? '#fff' : '#ccc'}
          >
            Home
          </Link>
          <Link
            to="/popular"
            style={{
              color: isActive('/popular') ? '#fff' : '#ccc',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: isActive('/popular') ? 'bold' : 'normal',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = isActive('/popular') ? '#fff' : '#ccc'}
          >
            Popular
          </Link>
          <Link
            to="/favourites"
            style={{
              color: isActive('/favourites') ? '#fff' : '#ccc',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: isActive('/favourites') ? 'bold' : 'normal',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = isActive('/favourites') ? '#fff' : '#ccc'}
          >
            Favourites
          </Link>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Right Side Icons */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          {/* Search Icon */}
          <Link
            to="/search"
            style={{
              color: '#fff',
              textDecoration: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Search size={20} />
          </Link>

          {/* Notification Bell Icon */}
          <div
            style={{
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              position: 'relative',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onClick={() => {
              // TODO: Implement notifications
              alert('Notifications coming soon!');
            }}
          >
            <Bell size={20} />
            {/* Notification badge - can be added when notifications are implemented */}
            {/* <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              backgroundColor: '#3B82F6',
              color: '#fff',
              borderRadius: '50%',
              width: '8px',
              height: '8px',
              fontSize: '0'
            }} /> */}
          </div>

          {/* Profile Picture with Dropdown */}
          <div ref={profileMenuRef} style={{ position: 'relative' }}>
            <div
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {user.profile_picture_url ? (
                <img
                  src={user.profile_picture_url}
                  alt={user.username}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '4px',
                    objectFit: 'cover',
                    border: '2px solid #fff'
                  }}
                />
              ) : (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '4px',
                  backgroundColor: '#ADD8E6',
                  color: '#36454F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  border: '2px solid #fff'
                }}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
              <ChevronDown size={16} color="#fff" />
            </div>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                borderRadius: '4px',
                minWidth: '200px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '8px 0',
                zIndex: 1001
              }}>
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  marginBottom: '4px'
                }}>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                    {user.username}
                  </div>
                  <div style={{ color: '#ccc', fontSize: '12px' }}>
                    {user.email}
                  </div>
                </div>
                <Link
                  to={`/user/${user.username}`}
                  onClick={() => setShowProfileMenu(false)}
                  style={{
                    display: 'block',
                    padding: '12px 16px',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: '14px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  My Profile
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setShowProfileMenu(false)}
                  style={{
                    display: 'block',
                    padding: '12px 16px',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: '14px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Account Settings
                </Link>
                <div
                  style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    marginTop: '4px',
                    paddingTop: '4px'
                  }}
                />
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 16px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

