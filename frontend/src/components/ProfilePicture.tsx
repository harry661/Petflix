import { useState, useEffect } from 'react';

interface ProfilePictureProps {
  src: string | null | undefined;
  alt: string;
  size?: number;
  style?: React.CSSProperties;
  fallbackChar?: string;
}

export default function ProfilePicture({ 
  src, 
  alt, 
  size = 120, 
  style,
  fallbackChar 
}: ProfilePictureProps) {
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null | undefined>(src);
  const [retryAttempted, setRetryAttempted] = useState(false);

  // Reset state when src changes
  useEffect(() => {
    setCurrentSrc(src);
    setImageError(false);
    setRetryAttempted(false);
  }, [src]);

  // Normalize Unsplash URLs - try simpler format if complex URL fails
  const normalizeUnsplashUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      // If it's an Unsplash URL, try a simpler version
      if (urlObj.hostname.includes('unsplash.com')) {
        // Extract photo ID from pathname (format: /photo-{id})
        const photoMatch = urlObj.pathname.match(/\/photo-([^?]+)/);
        if (photoMatch) {
          const photoId = photoMatch[1];
          // Return simpler URL with just essential params for profile picture size
          return `https://images.unsplash.com/photo-${photoId}?w=${size * 2}&h=${size * 2}&fit=crop&auto=format&q=80`;
        }
      }
      return url;
    } catch {
      return url;
    }
  };

  // If no src or image error, show fallback
  if (!currentSrc || imageError) {
    const char = fallbackChar || alt.charAt(0).toUpperCase();
    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          backgroundColor: '#ADD8E6',
          color: '#0F0F0F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${size * 0.4}px`,
          fontWeight: 'bold',
          ...style
        }}
      >
        {char}
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        const originalSrc = target.src;
        
        // If it's an Unsplash URL and we haven't retried yet, try a normalized/simpler version
        if (originalSrc.includes('unsplash.com') && !retryAttempted) {
          const normalizedUrl = normalizeUnsplashUrl(originalSrc);
          if (normalizedUrl !== originalSrc) {
            // Try the normalized URL
            setRetryAttempted(true);
            setImageError(false); // Reset error state for retry
            setCurrentSrc(normalizedUrl);
            return;
          }
        }
        
        // If all attempts fail, show fallback
        setImageError(true);
      }}
      onLoad={() => {
        // Reset retry flag on successful load
        if (retryAttempted) {
          setRetryAttempted(false);
        }
      }}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        objectFit: 'cover',
        ...style
      }}
    />
  );
}

