import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  useEffect(() => {
    // If user is already logged in, redirect to home
    if (!authLoading && isAuthenticated) {
      navigate('/home');
      return;
    }

    // Check if tutorial was already shown in this session
    const tutorialShown = sessionStorage.getItem('petflix_tutorial_shown');
    if (!tutorialShown && !isAuthenticated) {
      setShowTutorial(true);
    }
  }, [isAuthenticated, authLoading]);

  const handleSkipTutorial = () => {
    sessionStorage.setItem('petflix_tutorial_shown', 'true');
    setShowTutorial(false);
  };

  const handleNextTutorial = () => {
    if (tutorialStep < 4) {
      setTutorialStep(tutorialStep + 1);
    } else {
      handleSkipTutorial();
    }
  };

  const tutorialSteps = [
    {
      title: 'Welcome to Petflix!',
      description: 'Discover, share, and engage with amazing pet videos from YouTube.',
    },
    {
      title: 'Search for Videos',
      description: 'Use the search bar to find pet videos by keywords. Browse trending content on the homepage.',
    },
    {
      title: 'Share & Follow',
      description: 'Share your favorite YouTube videos and follow other pet lovers to see their recommendations.',
    },
    {
      title: 'Engage & Comment',
      description: 'Like videos, leave comments, and create playlists to organize your favorite content.',
    },
    {
      title: 'Ready to Start!',
      description: 'Click "Search for Pet Videos" to begin exploring, or create an account to share your favorites.',
    },
  ];

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#F0F0DC',
      padding: '20px'
    }}>
      {/* Tutorial Overlay */}
      {showTutorial && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '12px',
            maxWidth: '500px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ color: '#36454F', marginTop: 0 }}>
              {tutorialSteps[tutorialStep].title}
            </h2>
            <p style={{ color: '#666', fontSize: '16px', marginBottom: '30px' }}>
              {tutorialSteps[tutorialStep].description}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={handleSkipTutorial}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f0f0f0',
                  color: '#36454F',
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Skip Tutorial
              </button>
              <button
                onClick={handleNextTutorial}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ADD8E6',
                  color: '#36454F',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {tutorialStep === 4 ? 'Get Started' : 'Next'}
              </button>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '5px' }}>
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: index === tutorialStep ? '#ADD8E6' : '#ddd'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Landing Page */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center',
        paddingTop: '60px'
      }}>
        <h1 style={{
          fontSize: '48px',
          color: '#36454F',
          marginBottom: '20px',
          fontWeight: 'bold'
        }}>
          🐾 Petflix
        </h1>
        <p style={{
          fontSize: '24px',
          color: '#666',
          marginBottom: '50px'
        }}>
          Discover, share, and engage with pet videos from YouTube
        </p>

        {/* Call to Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          marginBottom: '60px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => navigate('/search')}
            style={{
              padding: '15px 40px',
              fontSize: '18px',
              backgroundColor: '#ADD8E6',
              color: '#36454F',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            Search for Pet Videos
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '15px 40px',
              fontSize: '18px',
              backgroundColor: 'white',
              color: '#36454F',
              border: '2px solid #ADD8E6',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            Create Account / Sign In
          </button>
        </div>

        {/* Feature Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px',
          marginTop: '60px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#36454F', marginTop: 0 }}>🔍 Discover</h3>
            <p style={{ color: '#666' }}>
              Search through thousands of pet videos and discover new favorites from YouTube.
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#36454F', marginTop: 0 }}>📤 Share</h3>
            <p style={{ color: '#666' }}>
              Share YouTube videos with the Petflix community and build your following.
            </p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ color: '#36454F', marginTop: 0 }}>💬 Engage</h3>
            <p style={{ color: '#666' }}>
              Follow other users, comment on videos, and curate playlists.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
