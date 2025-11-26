# YouTube API Integration & Quota Optimization

## Overview

Petflix now integrates YouTube Data API v3 to search YouTube videos directly, supplementing the database of videos shared by Petflix users.

## YouTube API Pricing & Limits

**Important:** YouTube Data API v3 is **NOT free with unlimited usage**.

- **Free Tier**: 10,000 units per day
- **Search Cost**: 100 units per search request
- **Video Details Cost**: 1 unit per video
- **Daily Limit**: ~100 searches per day on free tier
- **After Free Tier**: Paid usage required

### Cost Breakdown
- 1 search = 100 units
- 1 video details (for stats) = 1 unit
- Each search also fetches video stats = additional 1-10 units
- **Total per search**: ~100-110 units

## Optimization Strategies Implemented

### 1. **Result Caching** ✅
- **Cache Duration**: 1 hour (3600 seconds)
- **Cache Storage**: In-memory (server-side)
- **Benefit**: Identical searches within 1 hour use cached results (0 API calls)

### 2. **Smart Quota Management** ✅
- **Database First**: Always search Petflix database first
- **YouTube Supplement**: Only search YouTube if:
  - Database results < requested limit, OR
  - No database results at all
- **Result Limit**: Max 10 YouTube results per search (reduces quota usage)
- **Benefit**: Reduces YouTube API calls by 50-90%

### 3. **Combined Results** ✅
- **Priority**: Petflix videos shown first, YouTube videos second
- **Deduplication**: YouTube videos already in database are filtered out
- **Source Marking**: Videos marked with `source: 'petflix'` or `source: 'youtube'`

### 4. **Error Handling** ✅
- **Graceful Degradation**: If YouTube API fails/quota exceeded, still return database results
- **Non-Blocking**: YouTube search errors don't break the search functionality
- **Logging**: Quota errors are logged for monitoring

## Quota Usage Estimation

### Best Case (With Caching)
- **First search**: 100-110 units
- **Cached searches** (within 1 hour): 0 units
- **Daily searches**: ~100 unique searches = 10,000 units ✅ (within free tier)

### Worst Case (No Caching)
- **Every search**: 100-110 units
- **100 searches/day**: 10,000-11,000 units ⚠️ (at free tier limit)

### Typical Usage (With Caching + Smart Management)
- **Unique searches**: ~30-50 per day
- **Cached hits**: ~50-70% of searches
- **Actual API calls**: ~15-25 per day
- **Daily usage**: ~1,500-2,750 units ✅ (well within free tier)

## Monitoring Quota Usage

### Check Quota in Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Dashboard**
4. Find **YouTube Data API v3**
5. View **Quotas** tab

### Backend Logging
The backend logs YouTube API errors including quota exceeded:
```
[Search] YouTube search error: quotaExceeded
[Search] YouTube API quota exceeded - using database results only
```

## Additional Optimization Options (Future)

### 1. **Redis Caching** (Recommended)
- Replace in-memory cache with Redis
- Persists across server restarts
- Shared across multiple server instances
- **Benefit**: Better cache hit rate, survives deployments

### 2. **Request Batching**
- Batch multiple video detail requests
- **Benefit**: Reduces API calls for stats

### 3. **Search Result Pre-fetching**
- Pre-fetch popular searches
- **Benefit**: Instant results for common queries

### 4. **Quota Monitoring Dashboard**
- Track daily quota usage
- Alert when approaching limits
- **Benefit**: Proactive quota management

### 5. **Fallback to YouTube RSS Feeds**
- Use YouTube RSS feeds for trending (free, no quota)
- **Benefit**: Reduces quota usage for trending content

## Current Implementation Details

### Search Endpoint: `GET /api/v1/videos/search`

**Request:**
```
GET /api/v1/videos/search?q=cute+dogs&limit=10&sort=relevance
```

**Response:**
```json
{
  "videos": [
    {
      "id": "petflix-video-id",
      "source": "petflix",
      "youtubeVideoId": "abc123",
      "title": "Cute Dogs",
      ...
    },
    {
      "id": null,
      "source": "youtube",
      "youtubeVideoId": "xyz789",
      "title": "Amazing Dogs",
      "channelTitle": "Dog Channel",
      ...
    }
  ],
  "total": 10,
  "sources": {
    "petflix": 5,
    "youtube": 5
  }
}
```

### Cache Service: `backend/src/services/searchCache.ts`

- **TTL**: 1 hour
- **Max Entries**: 100 (auto-cleanup)
- **Key**: Lowercase, trimmed query string

### YouTube Service: `backend/src/services/youtubeService.ts`

- **Function**: `searchYouTubeVideos(query, maxResults, pageToken)`
- **Pet Filtering**: Automatically appends pet-related keywords
- **Stats Fetching**: Gets view count, likes, comments

## Troubleshooting

### "YouTube API quota exceeded" Error

**Symptoms:**
- Search returns only Petflix videos
- Backend logs show quota errors

**Solutions:**
1. Wait for daily quota reset (midnight Pacific Time)
2. Request quota increase from Google Cloud Console
3. Upgrade to paid tier if needed
4. Implement additional caching/optimization

### YouTube Videos Not Appearing

**Check:**
1. `YOUTUBE_API_KEY` environment variable is set
2. API key has YouTube Data API v3 enabled
3. API key has proper permissions
4. Check backend logs for errors

### Cache Not Working

**Check:**
1. Server hasn't restarted (in-memory cache is lost on restart)
2. Search queries are identical (case-sensitive after normalization)
3. Cache hasn't expired (1 hour TTL)

## Best Practices

1. **Monitor Quota Daily**: Check Google Cloud Console regularly
2. **Use Caching**: Let the cache work - don't clear it unnecessarily
3. **Optimize Searches**: Encourage users to search for specific terms
4. **Database First**: Always prioritize Petflix database results
5. **Error Handling**: Never fail the entire search if YouTube API fails

## Future Enhancements

- [ ] Redis caching for persistent cache
- [ ] Quota monitoring dashboard
- [ ] Automatic quota management (pause YouTube search when quota low)
- [ ] Search result pre-fetching for popular queries
- [ ] YouTube RSS feed integration for trending (free alternative)

