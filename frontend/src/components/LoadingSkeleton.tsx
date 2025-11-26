/**
 * Loading skeleton components for better loading states
 */

export function VideoCardSkeleton() {
  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      borderRadius: '8px',
      overflow: 'hidden',
      aspectRatio: '16/9',
      position: 'relative',
    }}>
      {/* Thumbnail skeleton */}
      <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#2a2a2a',
        animation: 'pulse 1.5s ease-in-out infinite',
      }} />
      
      {/* Title skeleton */}
      <div style={{
        padding: '12px',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
      }}>
        <div style={{
          height: '16px',
          backgroundColor: '#2a2a2a',
          borderRadius: '4px',
          marginBottom: '8px',
          width: '80%',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
        <div style={{
          height: '14px',
          backgroundColor: '#2a2a2a',
          borderRadius: '4px',
          width: '60%',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

export function VideoGridSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '20px',
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <VideoCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function TextSkeleton({ width = '100%', height = '16px' }: { width?: string; height?: string }) {
  return (
    <div style={{
      width,
      height,
      backgroundColor: '#2a2a2a',
      borderRadius: '4px',
      animation: 'pulse 1.5s ease-in-out infinite',
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '20px',
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        backgroundColor: '#2a2a2a',
        animation: 'pulse 1.5s ease-in-out infinite',
      }} />
      <div style={{ flex: 1 }}>
        <TextSkeleton width="60%" height="20px" />
        <div style={{ marginTop: '8px' }}>
          <TextSkeleton width="40%" height="16px" />
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

