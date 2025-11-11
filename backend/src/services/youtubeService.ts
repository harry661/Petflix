import axios from 'axios';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeVideoData {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  viewCount?: string;
  likeCount?: string;
  commentCount?: string;
}

/**
 * Search YouTube videos
 */
export const searchYouTubeVideos = async (
  query: string,
  maxResults: number = 10,
  pageToken?: string
): Promise<{ videos: YouTubeVideoData[]; nextPageToken?: string; totalResults: number }> => {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key is not configured');
  }

  try {
    const response = await axios.get(`${YOUTUBE_API_URL}/search`, {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults,
        key: YOUTUBE_API_KEY,
        pageToken,
      },
    });

    const videos: YouTubeVideoData[] = response.data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    }));

    // Get additional stats for videos
    if (videos.length > 0) {
      const videoIds = videos.map(v => v.id).join(',');
      const statsResponse = await axios.get(`${YOUTUBE_API_URL}/videos`, {
        params: {
          part: 'statistics',
          id: videoIds,
          key: YOUTUBE_API_KEY,
        },
      });

      const statsMap = new Map();
      statsResponse.data.items.forEach((item: any) => {
        statsMap.set(item.id, {
          viewCount: item.statistics.viewCount,
          likeCount: item.statistics.likeCount,
          commentCount: item.statistics.commentCount,
        });
      });

      videos.forEach(video => {
        const stats = statsMap.get(video.id);
        if (stats) {
          video.viewCount = stats.viewCount;
          video.likeCount = stats.likeCount;
          video.commentCount = stats.commentCount;
        }
      });
    }

    return {
      videos,
      nextPageToken: response.data.nextPageToken,
      totalResults: response.data.pageInfo.totalResults,
    };
  } catch (error: any) {
    console.error('YouTube API error:', error.response?.data || error.message);
    throw new Error('Failed to search YouTube videos');
  }
};

/**
 * Get YouTube video metadata using oEmbed API (free, no quota)
 * Falls back to Data API if oEmbed fails
 */
export const getYouTubeVideoMetadata = async (videoId: string): Promise<{ title: string; description: string; thumbnail?: string } | null> => {
  try {
    // Use oEmbed API (free, no quota limits)
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await axios.get(oembedUrl, { timeout: 5000 });
    
    if (response.data) {
      return {
        title: response.data.title || `YouTube Video ${videoId}`,
        description: response.data.author_name ? `By ${response.data.author_name}` : '',
        thumbnail: response.data.thumbnail_url,
      };
    }
  } catch (error) {
    console.log('oEmbed API failed, will try Data API if available');
  }
  
  return null;
};

/**
 * Get YouTube video details by ID (uses Data API - requires quota)
 */
export const getYouTubeVideoDetails = async (videoId: string): Promise<YouTubeVideoData> => {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key is not configured');
  }

  try {
    const response = await axios.get(`${YOUTUBE_API_URL}/videos`, {
      params: {
        part: 'snippet,statistics',
        id: videoId,
        key: YOUTUBE_API_KEY,
      },
    });

    if (!response.data.items || response.data.items.length === 0) {
      throw new Error('Video not found');
    }

    const item = response.data.items[0];
    return {
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      viewCount: item.statistics.viewCount,
      likeCount: item.statistics.likeCount,
      commentCount: item.statistics.commentCount,
    };
  } catch (error: any) {
    console.error('YouTube API error:', error.response?.data || error.message);
    
    // Provide more specific error messages
    if (error.response?.data?.error) {
      const apiError = error.response.data.error;
      if (apiError.code === 403 && apiError.errors?.[0]?.reason === 'quotaExceeded') {
        throw new Error('YouTube API quota exceeded. Please try again later.');
      }
      if (apiError.code === 404 || (apiError.errors?.[0]?.reason === 'videoNotFound')) {
        throw new Error('Video not found on YouTube');
      }
      throw new Error(apiError.message || 'YouTube API error');
    }
    
    throw new Error(error.message || 'Failed to get video details');
  }
};

/**
 * Validate YouTube URL and extract video ID
 */
export const extractYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

