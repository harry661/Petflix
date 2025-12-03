# API Call Optimization

## Overview
This document describes the optimizations made to reduce excessive API calls, particularly for `/api/v1/users/me`.

## Problems Identified

1. **Excessive `/api/v1/users/me` calls**: The network logs showed many repeated calls to this endpoint
2. **No caching**: Every component making its own API call resulted in duplicate requests
3. **No request deduplication**: Multiple components mounting simultaneously would all make separate calls
4. **Frequent polling**: The `useAuth` hook was polling every 5 seconds
5. **Direct API calls**: Some components were making direct API calls instead of using the shared auth hook

## Solutions Implemented

### 1. AuthContext with Caching
- Created `frontend/src/context/AuthContext.tsx` to provide shared authentication state
- Implements a 30-second cache (TTL) for user data
- All components now share the same user data instead of each making their own calls

### 2. Request Deduplication
- Global `pendingRequest` variable prevents multiple simultaneous calls to the same endpoint
- If a request is already in progress, subsequent calls wait for the existing request instead of creating new ones

### 3. Reduced Polling Frequency
- Changed polling interval from 5 seconds to 60 seconds
- Only checks for token changes (added/removed), not user state changes
- Cache prevents unnecessary API calls even when polling

### 4. Centralized State Management
- All components now use `useAuth()` from `AuthContext` instead of the old hook
- Components that need fresh data can call `refreshUser()` which updates the cache
- Direct API calls to `/api/v1/users/me` have been replaced with context usage

### 5. Smart Cache Invalidation
- Cache is cleared when:
  - User logs in/out
  - Auth token changes
  - `refreshUser()` is called (forces refresh)
  - `auth-changed` event is dispatched

## Files Changed

### New Files
- `frontend/src/context/AuthContext.tsx` - New context provider with caching

### Updated Files
- `frontend/src/App.tsx` - Added AuthProvider wrapper
- `frontend/src/components/Navigation.tsx` - Updated to use new context
- `frontend/src/pages/AccountSettingsPage.tsx` - Uses context instead of direct API calls
- `frontend/src/pages/UserProfilePage.tsx` - Uses context instead of direct API calls
- All pages/components using `useAuth` - Updated imports to use new context

### Deprecated Files
- `frontend/src/hooks/useAuth.ts` - Can be removed (replaced by AuthContext)

## Performance Improvements

### Before
- Multiple components each making `/api/v1/users/me` calls on mount
- Polling every 5 seconds
- No caching, every call hits the server
- Duplicate requests when multiple components mount simultaneously

### After
- Single shared state across all components
- Polling reduced to 60 seconds
- 30-second cache prevents unnecessary calls
- Request deduplication prevents duplicate simultaneous calls
- Estimated **80-90% reduction** in `/api/v1/users/me` API calls

## Usage

### Basic Usage
```typescript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Please log in</div>;
  
  return <div>Hello, {user?.username}!</div>;
}
```

### Force Refresh
```typescript
const { refreshUser } = useAuth();

// After updating profile, refresh the cache
await refreshUser();
```

## Cache Configuration

- **TTL (Time To Live)**: 30 seconds
- **Polling Interval**: 60 seconds
- **Cache Location**: In-memory (module-level variable)

## Future Improvements

1. **Persistent Cache**: Store user data in localStorage/sessionStorage for offline support
2. **Optimistic Updates**: Update UI immediately, sync with server in background
3. **Request Queue**: Queue requests when offline, send when connection restored
4. **Selective Refresh**: Only refresh specific user fields instead of entire user object

