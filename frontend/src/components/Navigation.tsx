import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSearch } from '../context/SearchContext';
import { Search, Bell, ChevronDown, X } from 'lucide-react';
import PawLogo from '../assets/Paw.svg';
import PetflixLogo from '../assets/PETFLIX.svg';

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout, loading } = useAuth();
  const { isSearchOpen, searchQuery, openSearch, closeSearch, setSearchQuery, setSearchResults, setIsLoading } = useSearch();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchQueryRef = useRef<string>(searchQuery); // Ref to track current search query

  const logoStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#ADD8E6',
    textDecoration: 'none',
    letterSpacing: '0.5px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

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

  // Update ref whenever searchQuery changes
  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  // Close search when clicking outside (only if search query is empty)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSearchOpen &&
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        // Check the ref value (always current) - only close if search query is empty
        const currentQuery = searchQueryRef.current;
        if (!currentQuery || currentQuery.trim().length === 0) {
          closeSearch();
        }
        // If there's text, do nothing - search stays open
      }
    };

    // Only add the listener if search is open
    if (isSearchOpen) {
      // Small delay to allow the click that opened search to complete
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
    
    // If search is not open, make sure listener is removed
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen, closeSearch]); // Removed searchQuery from deps - using ref instead

  // Auto-search with debounce when search is open and query changes
  useEffect(() => {
    if (!isSearchOpen || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const searchTimer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${API_URL}/api/v1/videos/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
        const data = await response.json();
        
        if (response.ok) {
          setSearchResults(data.videos || []);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        // Search error - silently fail
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(searchTimer);
  }, [searchQuery, isSearchOpen, setSearchResults, setIsLoading]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled automatically by useEffect with debounce
  };

  // Focus search input when opened and handle Escape key
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        closeSearch();
      }
    };

    if (isSearchOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isSearchOpen, closeSearch]);

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
          <Link to="/" style={logoStyle}>
            <img src={PawLogo} alt="Petflix" style={{ width: '32px', height: '28px' }} />
            <img src={PetflixLogo} alt="Petflix" style={{ height: '20px', width: 'auto' }} />
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
          <Link to="/" style={logoStyle}>
            <img src={PawLogo} alt="Petflix" style={{ width: '32px', height: '28px' }} />
            <img src={PetflixLogo} alt="Petflix" style={{ height: '20px', width: 'auto' }} />
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
        <Link to="/home" style={{ ...logoStyle, marginRight: '20px' }}>
          <img src={PawLogo} alt="Petflix" style={{ width: '32px', height: '28px' }} />
          <img src={PetflixLogo} alt="Petflix" style={{ height: '20px', width: 'auto' }} />
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
          {/* Expandable Search */}
          <div 
            ref={searchContainerRef}
            style={{ 
              display: 'flex', 
              alignItems: 'center',
              position: 'relative'
            }}
          >
            {!isSearchOpen ? (
              <div
                onClick={openSearch}
                style={{
                  color: '#fff',
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
              </div>
            ) : (
              <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  minWidth: '300px',
                  transition: 'all 0.3s ease'
                }}>
                  <Search size={18} color="#fff" style={{ marginRight: '8px', flexShrink: 0 }} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Titles, people, genres"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      flex: 1,
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                      padding: '4px 0'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        closeSearch();
                      }
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                        searchInputRef.current?.focus();
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#fff',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

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

