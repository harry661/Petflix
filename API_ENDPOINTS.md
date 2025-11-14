# Petflix API Endpoints Reference

All endpoints are prefixed with your backend URL. Example: `https://your-backend.vercel.app/api/v1/users/login`

## Base URL Structure
- **Root**: `/`
- **Health Check**: `/health`
- **API v1**: `/api/v1`

---

## 🔐 Authentication Endpoints

### User Registration
- **POST** `/api/v1/users/register`
- **Body**: 
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Response**: `{ "token": "string", "user": {...} }`

### User Login
- **POST** `/api/v1/users/login`
- **Body**: 
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response**: `{ "token": "string", "user": {...} }`

---

## 👤 User Endpoints

### Get Current User
- **GET** `/api/v1/users/me`
- **Auth**: Required (Bearer token)
- **Response**: `{ "id": "string", "username": "string", "email": "string", ... }`

### Update Profile
- **PUT** `/api/v1/users/me`
- **Auth**: Required
- **Body**: 
  ```json
  {
    "username": "string",
    "bio": "string",
    "avatar_url": "string"
  }
  ```

### Change Password
- **PUT** `/api/v1/users/me/password`
- **Auth**: Required
- **Body**: 
  ```json
  {
    "currentPassword": "string",
    "newPassword": "string"
  }
  ```

### Delete Account
- **DELETE** `/api/v1/users/me`
- **Auth**: Required

### Search Users
- **GET** `/api/v1/users/search?q=searchterm`
- **Auth**: Not required
- **Response**: Array of user objects

### Get User by ID
- **GET** `/api/v1/users/:userId`
- **Auth**: Not required
- **Response**: User object

### Get User Followers
- **GET** `/api/v1/users/:userId/followers`
- **Auth**: Not required
- **Response**: Array of follower objects

### Get User Following
- **GET** `/api/v1/users/:userId/following`
- **Auth**: Not required
- **Response**: Array of following objects

### Get Follow Status
- **GET** `/api/v1/users/:userId/follow-status`
- **Auth**: Optional
- **Response**: `{ "isFollowing": boolean }`

### Follow User
- **POST** `/api/v1/users/:userId/follow`
- **Auth**: Required

### Unfollow User
- **DELETE** `/api/v1/users/:userId/unfollow`
- **Auth**: Required

### Get Global Notification Preference
- **GET** `/api/v1/users/me/notification-preference`
- **Auth**: Required
- **Response**: `{ "enabled": boolean }`

### Update Global Notification Preference
- **PUT** `/api/v1/users/me/notification-preference`
- **Auth**: Required
- **Body**: `{ "enabled": boolean }`

### Get User Notification Preference
- **GET** `/api/v1/users/:userId/notification-preference`
- **Auth**: Required
- **Response**: `{ "enabled": boolean }`

### Toggle User Notification Preference
- **PUT** `/api/v1/users/:userId/notification-preference`
- **Auth**: Required
- **Body**: `{ "enabled": boolean }`

---

## 🎥 Video Endpoints

### Search Videos
- **GET** `/api/v1/videos/search?q=searchterm&limit=20&offset=0`
- **Auth**: Optional
- **Response**: Array of video objects

### Get Recent Videos
- **GET** `/api/v1/videos/recent?limit=20&offset=0`
- **Auth**: Optional
- **Response**: Array of video objects

### Get Videos by User
- **GET** `/api/v1/videos/user/:userId?limit=20&offset=0`
- **Auth**: Optional
- **Response**: Array of video objects

### Get Liked Videos
- **GET** `/api/v1/videos/liked/:userId?limit=20&offset=0`
- **Auth**: Optional
- **Response**: Array of video objects

### Share Video
- **POST** `/api/v1/videos`
- **Auth**: Required
- **Body**: 
  ```json
  {
    "youtube_video_id": "string",
    "title": "string",
    "description": "string",
    "tags": ["string"]
  }
  ```
- **Response**: Video object

### Get Feed
- **GET** `/api/v1/videos/feed?limit=20&offset=0`
- **Auth**: Required
- **Response**: Array of video objects from followed users

### Get Video by ID
- **GET** `/api/v1/videos/:id`
- **Auth**: Optional
- **Response**: Video object with comments

### Update Video
- **PUT** `/api/v1/videos/:id`
- **Auth**: Required (must be video owner)
- **Body**: 
  ```json
  {
    "title": "string",
    "description": "string",
    "tags": ["string"]
  }
  ```

### Delete Video
- **DELETE** `/api/v1/videos/:id`
- **Auth**: Required (must be video owner)

### Like Video
- **POST** `/api/v1/videos/:id/like`
- **Auth**: Required

### Unlike Video
- **DELETE** `/api/v1/videos/:id/like`
- **Auth**: Required

### Get Like Status
- **GET** `/api/v1/videos/:id/like-status`
- **Auth**: Optional
- **Response**: `{ "isLiked": boolean, "likeCount": number }`

### Can Repost Video
- **GET** `/api/v1/videos/:id/can-repost`
- **Auth**: Required
- **Response**: `{ "canRepost": boolean }`

### Repost Video
- **POST** `/api/v1/videos/:id/repost`
- **Auth**: Required
- **Response**: Video object

### Report Video
- **POST** `/api/v1/videos/:id/report`
- **Auth**: Required
- **Body**: 
  ```json
  {
    "reason": "string"
  }
  ```

### Get Search History
- **GET** `/api/v1/videos/search-history`
- **Auth**: Required
- **Response**: Array of search history objects

### Clear Search History
- **DELETE** `/api/v1/videos/search-history`
- **Auth**: Required

### Refresh All View Counts
- **POST** `/api/v1/videos/refresh-view-counts`
- **Auth**: Required (admin only)
- **Description**: Refreshes view counts for all videos with 0 views

---

## 💬 Comment Endpoints

### Get Comments by Video
- **GET** `/api/v1/comments/:videoId`
- **Auth**: Optional
- **Response**: Array of comment objects

### Create Comment
- **POST** `/api/v1/comments`
- **Auth**: Required
- **Body**: 
  ```json
  {
    "video_id": "string",
    "content": "string"
  }
  ```
- **Response**: Comment object

### Update Comment
- **PUT** `/api/v1/comments/:id`
- **Auth**: Required (must be comment owner)
- **Body**: 
  ```json
  {
    "content": "string"
  }
  ```

### Delete Comment
- **DELETE** `/api/v1/comments/:id`
- **Auth**: Required (must be comment owner)

---

## 📋 Playlist Endpoints

### Create Playlist
- **POST** `/api/v1/playlists`
- **Auth**: Required
- **Body**: 
  ```json
  {
    "name": "string",
    "description": "string"
  }
  ```
- **Response**: Playlist object

### Get User Playlists
- **GET** `/api/v1/playlists`
- **Auth**: Required
- **Response**: Array of playlist objects

### Get Playlist by ID
- **GET** `/api/v1/playlists/:id`
- **Auth**: Optional
- **Response**: Playlist object with videos

### Add Video to Playlist
- **POST** `/api/v1/playlists/:id/videos`
- **Auth**: Required (must be playlist owner)
- **Body**: 
  ```json
  {
    "video_id": "string"
  }
  ```

### Remove Video from Playlist
- **DELETE** `/api/v1/playlists/:id/videos/:videoId`
- **Auth**: Required (must be playlist owner)

### Delete Playlist
- **DELETE** `/api/v1/playlists/:id`
- **Auth**: Required (must be playlist owner)

---

## 🔔 Notification Endpoints

### Get Notifications
- **GET** `/api/v1/notifications?limit=20&offset=0`
- **Auth**: Required
- **Response**: Array of notification objects

### Mark Notification as Read
- **PUT** `/api/v1/notifications/:notificationId/read`
- **Auth**: Required

### Mark All Notifications as Read
- **PUT** `/api/v1/notifications/read-all`
- **Auth**: Required

---

## 🧪 Test & Debug Endpoints

### Simple Test Endpoint
- **ALL METHODS** `/test-simple`
- **Auth**: Not required
- **Response**: `{ "success": true, "message": "Function is working!", ... }`

### Debug Route
- **ALL METHODS** `/debug-route`
- **Auth**: Not required
- **Response**: Routing information

### Health Check
- **GET** `/health`
- **Auth**: Not required
- **Response**: `{ "status": "ok", "message": "Petflix API is running", ... }`

### Root Endpoint
- **GET** `/`
- **Auth**: Not required
- **Response**: `{ "message": "Petflix API v1", "endpoints": "/api/v1", ... }`

---

## 🔑 Authentication

Most endpoints require authentication using a Bearer token in the Authorization header:

```
Authorization: Bearer <your-token>
```

Tokens are obtained from:
- `/api/v1/users/register` (registration)
- `/api/v1/users/login` (login)

---

## 📝 Common Response Formats

### Success Response
```json
{
  "data": {...},
  "message": "string"
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Additional details (development only)"
}
```

### Pagination
Many list endpoints support pagination:
- `limit`: Number of items per page (default: 20)
- `offset`: Number of items to skip (default: 0)

---

## 🚨 Error Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request (invalid input)
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **405**: Method Not Allowed
- **500**: Internal Server Error

---

## 📌 Notes

- All timestamps are in ISO 8601 format
- All IDs are UUIDs (strings)
- Pagination defaults: `limit=20`, `offset=0`
- Protected routes require valid JWT token in Authorization header
- Optional auth routes return different data based on authentication status

