import { useState } from 'react';
import { X, CheckCircle2, Video, Heart, Share2, Search, UserPlus, Play } from 'lucide-react';
import PawLogo from '../assets/Paw.svg';

import { API_URL } from '../config/api';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export default function OnboardingModal({ isOpen, onClose, username }: OnboardingModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleGetStarted = async () => {
    if (dontShowAgain) {
      setSaving(true);
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          await fetch(`${API_URL}/api/v1/users/me/onboarding-preference`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ show_onboarding: false }),
          });
        } catch (err) {
          console.error('Error saving onboarding preference:', err);
        }
      }
      setSaving(false);
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100002,
        animation: 'fadeIn 0.3s ease'
      }}
      onClick={(e) => {
        // Don't close on click outside - user must click Get Started
        e.stopPropagation();
      }}
    >
      <div
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '20px',
          padding: '0',
          maxWidth: '520px',
          width: '90%',
          maxHeight: '85vh',
          overflow: 'hidden',
          boxShadow: '0 8px 48px rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(173, 216, 230, 0.2)',
          animation: 'scaleIn 0.4s ease',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient background */}
        <div style={{
          background: 'linear-gradient(135deg, #ADD8E6 0%, #87CEEB 100%)',
          padding: '24px 32px 20px',
          textAlign: 'center',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          position: 'relative'
        }}>
          <img 
            src={PawLogo} 
            alt="Petflix" 
            style={{ 
              width: '40px', 
              height: '40px', 
              marginBottom: '12px',
              filter: 'brightness(0) saturate(100%)'
            }} 
          />
          <h1 style={{
            margin: '0 0 6px',
            color: '#0F0F0F',
            fontSize: '24px',
            fontWeight: '700',
            fontFamily: 'inherit'
          }}>
            Welcome to Petflix!
          </h1>
          <p style={{
            margin: 0,
            color: '#0F0F0F',
            fontSize: '14px',
            opacity: 0.9,
            fontFamily: 'inherit'
          }}>
            Hi {username}! Let's get you started.
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 32px', maxHeight: 'calc(90vh - 200px)', overflow: 'hidden' }}>
          <p style={{
            margin: '0 0 20px',
            color: '#ffffff',
            fontSize: '14px',
            lineHeight: '1.5',
            textAlign: 'center'
          }}>
            Discover and share amazing pet videos. Here's what you can do:
          </p>

          {/* Features Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            marginBottom: '20px'
          }}>
            {/* Feature 1: Watch Videos */}
            <div style={{
              backgroundColor: 'rgba(173, 216, 230, 0.1)',
              border: '1px solid rgba(173, 216, 230, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                backgroundColor: 'rgba(173, 216, 230, 0.2)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px'
              }}>
                <Play size={18} color="#ADD8E6" />
              </div>
              <h3 style={{
                margin: '0 0 4px',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '600'
              }}>
                Watch Videos
              </h3>
              <p style={{
                margin: 0,
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '11px',
                lineHeight: '1.4'
              }}>
                Discover trending videos
              </p>
            </div>

            {/* Feature 2: Share & Repost */}
            <div style={{
              backgroundColor: 'rgba(173, 216, 230, 0.1)',
              border: '1px solid rgba(173, 216, 230, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                backgroundColor: 'rgba(173, 216, 230, 0.2)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px'
              }}>
                <Share2 size={18} color="#ADD8E6" />
              </div>
              <h3 style={{
                margin: '0 0 4px',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '600'
              }}>
                Share & Repost
              </h3>
              <p style={{
                margin: 0,
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '11px',
                lineHeight: '1.4'
              }}>
                Share YouTube videos
              </p>
            </div>

            {/* Feature 3: Like & Comment */}
            <div style={{
              backgroundColor: 'rgba(173, 216, 230, 0.1)',
              border: '1px solid rgba(173, 216, 230, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                backgroundColor: 'rgba(173, 216, 230, 0.2)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px'
              }}>
                <Heart size={18} color="#ADD8E6" />
              </div>
              <h3 style={{
                margin: '0 0 4px',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '600'
              }}>
                Like & Comment
              </h3>
              <p style={{
                margin: 0,
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '11px',
                lineHeight: '1.4'
              }}>
                Engage with videos
              </p>
            </div>

            {/* Feature 4: Follow Users */}
            <div style={{
              backgroundColor: 'rgba(173, 216, 230, 0.1)',
              border: '1px solid rgba(173, 216, 230, 0.2)',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                backgroundColor: 'rgba(173, 216, 230, 0.2)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px'
              }}>
                <UserPlus size={18} color="#ADD8E6" />
              </div>
              <h3 style={{
                margin: '0 0 4px',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '600'
              }}>
                Follow Users
              </h3>
              <p style={{
                margin: 0,
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '11px',
                lineHeight: '1.4'
              }}>
                Follow creators
              </p>
            </div>
          </div>

          {/* Don't show again checkbox */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '16px',
            padding: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <input
              type="checkbox"
              id="dontShowAgain"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                accentColor: '#ADD8E6'
              }}
            />
            <label
              htmlFor="dontShowAgain"
              style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '13px',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              Don't show this again
            </label>
          </div>

          {/* Get Started Button */}
          <button
            onClick={handleGetStarted}
            disabled={saving}
            style={{
              width: '100%',
              padding: '12px 24px',
              backgroundColor: '#ADD8E6',
              color: '#0F0F0F',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: saving ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.backgroundColor = '#87CEEB';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(173, 216, 230, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!saving) {
                e.currentTarget.style.backgroundColor = '#ADD8E6';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {saving ? 'Saving...' : (
              <>
                Get Started
                <CheckCircle2 size={20} />
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.9);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

