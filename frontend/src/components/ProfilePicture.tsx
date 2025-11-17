import { useState } from 'react';

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

  // If no src or image error, show fallback
  if (!src || imageError) {
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
      src={src}
      alt={alt}
      onError={() => {
        setImageError(true);
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

