import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSearch } from '../context/SearchContext';
import { Search, Bell, ChevronDown, X, UserPlus, Video, Heart, MessageCircle } from 'lucide-react';
import PawLogo from '../assets/Paw.svg';
import PetflixLogo from '../assets/PETFLIX.svg';

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout, loading } = useAuth();
  const { isSearchOpen, searchQuery, openSearch, closeSearch, setSearchQuery, setSearchResults, setIsLoading } = useSearch();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsMenuRef = useRef<HTMLDivElement>(null);
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
    gap: '8px',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none',
    pointerEvents: 'auto'
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowProfileMenu(false);
  };

  // Load notifications
  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    if (!isAuthenticated) return;
    
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/notifications?limit=10`, {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      // Error loading notifications - silently fail
    }
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(event.target as Node)) {
        setShowNotificationsMenu(false);
      }
    };

    if (showProfileMenu || showNotificationsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu, showNotificationsMenu]);

  // Update ref whenever searchQuery changes
  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  // Track scroll position for navbar fade effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
            <img src={PawLogo} alt="" style={{ width: '32px', height: '28px', userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'auto' }} />
            <img src={PetflixLogo} alt="" style={{ height: '20px', width: 'auto', userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'auto' }} />
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
                <img src={PawLogo} alt="" style={{ width: '32px', height: '28px', userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'auto' }} />
                <img src={PetflixLogo} alt="" style={{ height: '20px', width: 'auto', userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'auto' }} />
              </Link>
              <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontSize: '14px' }}>
                Sign In
              </Link>
        </div>
      </nav>
    );
  }

  const isActive = (path: string) => location.pathname === path;
  const isHomePage = location.pathname === '/home' || location.pathname === '/popular';

  // Calculate navbar background based on scroll position
  // Only fade on home page - transparent at top (scrollY < 50), fully opaque when scrolled
  // On other pages, always opaque
  const navbarBackground = isHomePage && scrollY < 50 
    ? 'transparent' 
    : 'rgba(0, 0, 0, 1)'; // Fully opaque black when scrolled or on other pages

  return (
    <nav style={{
      backgroundColor: navbarBackground,
      padding: '15px 40px',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backdropFilter: (isHomePage && scrollY > 50) || !isHomePage ? 'blur(10px)' : 'none',
      transition: 'background-color 0.3s ease, backdrop-filter 0.3s ease',
      marginBottom: 0
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
          <img src={PawLogo} alt="" style={{ width: '32px', height: '28px', userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'auto' }} />
          <img src={PetflixLogo} alt="" style={{ height: '20px', width: 'auto', userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'auto' }} />
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

          {/* Notification Bell Icon with Dropdown */}
          <div
            ref={notificationsMenuRef}
            style={{ position: 'relative' }}
            onMouseEnter={() => setShowNotificationsMenu(true)}
            onMouseLeave={() => setShowNotificationsMenu(false)}
          >
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
            >
              <Bell size={20} />
              {/* Status dot for unread notifications */}
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  backgroundColor: '#3B82F6',
                  borderRadius: '50%',
                  width: '8px',
                  height: '8px',
                  border: '2px solid rgba(0, 0, 0, 0.95)'
                }} />
              )}
            </div>

            {/* Notifications Dropdown */}
            {showNotificationsMenu && (
              <div
                onMouseEnter={() => setShowNotificationsMenu(true)}
                onMouseLeave={() => setShowNotificationsMenu(false)}
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.95)',
                  borderRadius: '8px',
                  minWidth: '320px',
                  maxWidth: '400px',
                  maxHeight: '500px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  overflow: 'hidden',
                  zIndex: 1001,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* Header */}
                <div style={{
                  padding: '16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h3 style={{ color: '#fff', margin: 0, fontSize: '16px', fontWeight: '600' }}>
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={async () => {
                        const token = localStorage.getItem('auth_token');
                        if (token) {
                          try {
                            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/notifications/read-all`, {
                              method: 'PUT',
                              headers: { 'Authorization': `Bearer ${token}` },
                            });
                            loadNotifications();
                          } catch (err) {
                            // Error
                          }
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ADD8E6',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: '4px 8px'
                      }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div style={{
                  overflowY: 'auto',
                  maxHeight: '400px'
                }}>
                  {notifications.length === 0 ? (
                    <div style={{
                      padding: '40px 20px',
                      textAlign: 'center',
                      color: 'rgba(255, 255, 255, 0.6)'
                    }}>
                      <p style={{ margin: 0 }}>No notifications yet</p>
                      <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                        You'll see notifications here when users you follow share videos
                      </p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={async () => {
                          if (notification.related_video_id) {
                            navigate(`/video/${notification.related_video_id}`);
                          } else if (notification.related_user_id) {
                            navigate(`/user/${notification.related_user?.username}`);
                          }
                          // Mark as read
                          if (!notification.read) {
                            const token = localStorage.getItem('auth_token');
                            if (token) {
                              try {
                                await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/notifications/${notification.id}/read`, {
                                  method: 'PUT',
                                  headers: { 'Authorization': `Bearer ${token}` },
                                });
                                loadNotifications();
                              } catch (err) {
                                // Error
                              }
                            }
                          }
                        }}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          cursor: 'pointer',
                          backgroundColor: notification.read ? 'transparent' : 'rgba(173, 216, 230, 0.1)',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notification.read ? 'transparent' : 'rgba(173, 216, 230, 0.1)'}
                      >
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          {/* Profile Picture or Icon */}
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            {notification.related_user?.profile_picture_url ? (
                              <img
                                src={notification.related_user.profile_picture_url}
                                alt={notification.related_user.username}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  objectFit: 'cover'
                                }}
                              />
                            ) : (
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: '#ADD8E6',
                                color: '#0F0F0F',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '16px'
                              }}>
                                {notification.related_user?.username?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            )}
                            {/* Notification type icon overlay */}
                            <div style={{
                              position: 'absolute',
                              bottom: '-2px',
                              right: '-2px',
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              backgroundColor: '#0F0F0F',
                              border: '2px solid #0F0F0F',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {notification.type === 'follow' && <UserPlus size={10} color="#ADD8E6" />}
                              {notification.type === 'video_shared' && <Video size={10} color="#ADD8E6" />}
                              {notification.type === 'like' && <Heart size={10} color="#ADD8E6" />}
                              {notification.type === 'comment' && <MessageCircle size={10} color="#ADD8E6" />}
                            </div>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                              color: '#fff',
                              margin: 0,
                              fontSize: '14px',
                              fontWeight: notification.read ? '400' : '600',
                              marginBottom: '4px',
                              lineHeight: '1.4'
                            }}>
                              {notification.title}
                            </p>
                            <p style={{
                              color: 'rgba(255, 255, 255, 0.7)',
                              margin: 0,
                              fontSize: '12px',
                              lineHeight: '1.4',
                              marginBottom: '4px'
                            }}>
                              {notification.message}
                            </p>
                            <p style={{
                              color: 'rgba(255, 255, 255, 0.5)',
                              margin: 0,
                              fontSize: '11px'
                            }}>
                              {(() => {
                                const date = new Date(notification.created_at);
                                const now = new Date();
                                const diffMs = now.getTime() - date.getTime();
                                const diffMins = Math.floor(diffMs / (1000 * 60));
                                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                
                                if (diffMins < 1) return 'Just now';
                                if (diffMins < 60) return `${diffMins}m ago`;
                                if (diffHours < 24) return `${diffHours}h ago`;
                                if (diffDays < 7) return `${diffDays}d ago`;
                                return date.toLocaleDateString();
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Picture with Dropdown */}
          <div 
            ref={profileMenuRef} 
            style={{ position: 'relative' }}
            onMouseEnter={() => setShowProfileMenu(true)}
            onMouseLeave={() => setShowProfileMenu(false)}
          >
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
                  color: '#0F0F0F',
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
              <div 
                onMouseEnter={() => setShowProfileMenu(true)}
                onMouseLeave={() => setShowProfileMenu(false)}
                style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '0px', // No gap - menu connects directly to prevent closing
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

