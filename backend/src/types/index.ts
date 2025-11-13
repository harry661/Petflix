// TypeScript types based on PRD models

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash?: string; // Only included in certain contexts
  profile_picture_url?: string | null;
  bio?: string | null;
  email_updated_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRegistrationRequest {
  username: string;
  email: string;
  password: string;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
}

export interface AuthenticationResponse {
  token: string;
  user: UserResponse;
}

export interface UserProfileResponse {
  id: string;
  username: string;
  email: string;
  profile_picture_url?: string | null;
  bio?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  youtube_video_id: string;
  title: string;
  description?: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface VideoCreationRequest {
  youtubeVideoId: string;
  title: string;
  description?: string;
  tags?: string[];
}

export interface VideoResponse {
  id: string;
  youtubeVideoId: string;
  title: string;
  description?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoDetailsResponse extends VideoResponse {
  user?: UserProfileResponse | null;
  originalUser?: UserProfileResponse | null; // For reposted videos, credits the original sharer
  likeCount?: number;
  isLiked?: boolean;
}

export interface VideoSearchResponse {
  videos: VideoResponse[];
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface FollowResponse {
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface UserListResponse {
  users: UserProfileResponse[];
}

export interface Comment {
  id: string;
  video_id: string;
  user_id: string;
  text: string;
  parent_comment_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommentCreationRequest {
  videoId: string;
  text: string;
  parentCommentId?: string;
}

export interface CommentResponse {
  id: string;
  videoId: string;
  userId: string;
  text: string;
  parentCommentId?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: UserProfileResponse; // Include user info when fetching comments
}

export interface CommentListResponse {
  comments: CommentResponse[];
}

export interface Playlist {
  id: string;
  name: string;
  description?: string | null;
  user_id: string;
  visibility: 'public' | 'private';
  created_at: string;
  updated_at: string;
}

export interface PlaylistCreationRequest {
  name: string;
  description?: string;
  visibility?: 'public' | 'private';
}

export interface PlaylistResponse {
  id: string;
  name: string;
  description?: string | null;
  userId: string;
  visibility: 'public' | 'private';
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistDetailsResponse extends PlaylistResponse {
  user: UserProfileResponse;
  videos: VideoResponse[];
}

export interface PlaylistVideoRequest {
  videoId: string;
}

export interface PlaylistVideoResponse {
  playlistId: string;
  videoId: string;
  createdAt: string;
}

export interface PushSubscriptionRequest {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushSubscriptionResponse {
  userId: string;
  endpoint: string;
  createdAt: string;
}

// YouTube API types
export interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
    channelTitle: string;
    publishedAt: string;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
}

export interface YouTubeSearchResponse {
  items: YouTubeVideo[];
  nextPageToken?: string;
  prevPageToken?: string;
  totalResults: number;
}

// Error response type
export interface ErrorResponse {
  error: string;
  message?: string;
  details?: any;
}

