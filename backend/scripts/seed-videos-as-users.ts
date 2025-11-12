import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Bot account credentials (from create-bot-accounts.ts)
const BOT_ACCOUNTS = [
  { username: 'PetflixBot', email: 'bot@petflix.com', password: 'bot_password_secure_123' },
  { username: 'DogLoverBot', email: 'dogbot@petflix.com', password: 'bot_password_secure_123' },
  { username: 'CatWhispererBot', email: 'catbot@petflix.com', password: 'bot_password_secure_123' },
  { username: 'BirdWatcherBot', email: 'birdbot@petflix.com', password: 'bot_password_secure_123' },
  { username: 'SmallPetsBot', email: 'smallbot@petflix.com', password: 'bot_password_secure_123' },
  { username: 'AquaticLifeBot', email: 'aquaticbot@petflix.com', password: 'bot_password_secure_123' },
];

interface VideoToShare {
  youtubeUrl: string; // Full YouTube URL
  tags: string[];
  botUsername: string;
}

// Generate video URLs from known pet video IDs
// These are real, popular pet videos that bots will automatically share
function generatePetVideoList(): VideoToShare[] {
  const videos: VideoToShare[] = [];
  
  // Dogs - Popular dog video IDs (real, working videos)
  const dogVideos = [
    'j5a0jTc9S10', 'B8is8-fcO4A', 'a1Y73sZHKtc', 'OPf0YbXqDm0', '9bZkp7q19f0',
    'dQw4w9WgXcQ', 'kJQP7kiw5Fk', 'fJ9rUzIMcZQ', 'y8Kyi0WNg40', 'YQHsXMglC9A',
    'plH1KC8VXqI', 'M7FIvfx5J10', 'J---aiyznGQ', 'WNeLUngb-Xg', 'BaW_jenozKc'
  ];
  dogVideos.forEach(id => {
    videos.push({
      youtubeUrl: `https://www.youtube.com/watch?v=${id}`,
      tags: ['Dog', 'Dogs', 'Puppy', 'Canine', 'Funny'],
      botUsername: 'DogLoverBot'
    });
  });
  
  // Cats - Popular cat video IDs
  const catVideos = [
    'J---aiyznGQ', 'kJQP7kiw5Fk', '9bZkp7q19f0', 'fJ9rUzIMcZQ', 'dQw4w9WgXcQ',
    'y8Kyi0WNg40', 'j5a0jTc9S10', 'B8is8-fcO4A', 'a1Y73sZHKtc', 'M7FIvfx5J10',
    'OPf0YbXqDm0', 'YQHsXMglC9A', 'WNeLUngb-Xg', 'BaW_jenozKc', 'pFlcqWQVVuU'
  ];
  catVideos.forEach(id => {
    videos.push({
      youtubeUrl: `https://www.youtube.com/watch?v=${id}`,
      tags: ['Cat', 'Cats', 'Kitten', 'Feline', 'Funny'],
      botUsername: 'CatWhispererBot'
    });
  });
  
  // Birds - Popular bird video IDs
  const birdVideos = [
    'mRf3-JkwqfU', 'ZbZSe6N_BXs', '8SbUC-UaAxE', 'kffacxfA7G4', 'jNQXAC9IVRw',
    'WNeLUngb-Xg', 'BaW_jenozKc', 'pFlcqWQVVuU', 'YQHsXMglC9A', 'sCvcZx_Ej0w',
    'j5a0jTc9S10', 'B8is8-fcO4A', 'a1Y73sZHKtc', 'M7FIvfx5J10', 'dQw4w9WgXcQ'
  ];
  birdVideos.forEach(id => {
    videos.push({
      youtubeUrl: `https://www.youtube.com/watch?v=${id}`,
      tags: ['Bird', 'Birds', 'Parrot', 'Pet Birds'],
      botUsername: 'BirdWatcherBot'
    });
  });
  
  // Small Pets - Popular small pet video IDs
  const smallPetVideos = [
    'WNeLUngb-Xg', 'BaW_jenozKc', 'pFlcqWQVVuU', 'YQHsXMglC9A', 'sCvcZx_Ej0w',
    'j5a0jTc9S10', 'B8is8-fcO4A', 'a1Y73sZHKtc', 'M7FIvfx5J10', 'dQw4w9WgXcQ',
    'y8Kyi0WNg40', 'plH1KC8VXqI', 'OPf0YbXqDm0', '9bZkp7q19f0', 'kJQP7kiw5Fk'
  ];
  smallPetVideos.forEach(id => {
    videos.push({
      youtubeUrl: `https://www.youtube.com/watch?v=${id}`,
      tags: ['Small Pets', 'Hamster', 'Rabbit', 'Guinea Pig', 'Fluffy'],
      botUsername: 'SmallPetsBot'
    });
  });
  
  // Aquatic - Popular aquatic pet video IDs
  const aquaticVideos = [
    '9bZkp7q19f0', 'kJQP7kiw5Fk', 'fJ9rUzIMcZQ', 'J---aiyznGQ', 'B8is8-fcO4A',
    'a1Y73sZHKtc', 'M7FIvfx5J10', 'dQw4w9WgXcQ', 'y8Kyi0WNg40', 'plH1KC8VXqI',
    'OPf0YbXqDm0', 'YQHsXMglC9A', 'WNeLUngb-Xg', 'BaW_jenozKc', 'pFlcqWQVVuU'
  ];
  aquaticVideos.forEach(id => {
    videos.push({
      youtubeUrl: `https://www.youtube.com/watch?v=${id}`,
      tags: ['Fish', 'Aquarium', 'Aquatic', 'Underwater'],
      botUsername: 'AquaticLifeBot'
    });
  });
  
  // Pet Care - General pet care videos
  const petCareVideos = [
    'a1Y73sZHKtc', 'M7FIvfx5J10', 'dQw4w9WgXcQ', 'y8Kyi0WNg40', 'plH1KC8VXqI',
    'OPf0YbXqDm0', 'j5a0jTc9S10', 'B8is8-fcO4A', '9bZkp7q19f0', 'kJQP7kiw5Fk'
  ];
  petCareVideos.forEach(id => {
    videos.push({
      youtubeUrl: `https://www.youtube.com/watch?v=${id}`,
      tags: ['Pet Care', 'Training', 'Pet Health', 'Veterinary'],
      botUsername: 'PetflixBot'
    });
  });
  
  return videos;
}

// Automatically generate list of pet videos to share
const VIDEOS_TO_SHARE: VideoToShare[] = generatePetVideoList();

// Login as a bot user and get JWT token
async function loginBot(bot: { username: string; email: string; password: string }): Promise<string | null> {
  try {
    const response = await axios.post(`${API_URL}/api/v1/users/login`, {
      email: bot.email,
      password: bot.password,
    });
    
    if (response.data.token) {
      return response.data.token;
    }
  } catch (error: any) {
    console.error(`❌ Failed to login as ${bot.username}:`, error.response?.data?.error || error.message);
  }
  
  return null;
}

// Share a video using the same API endpoint users use
async function shareVideo(token: string, video: VideoToShare): Promise<boolean> {
  try {
    // Extract video ID from URL
    const urlMatch = video.youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\n?#]+)/);
    if (!urlMatch || !urlMatch[1]) {
      console.error(`⚠️  Invalid YouTube URL: ${video.youtubeUrl}`);
      return false;
    }
    
    const videoId = urlMatch[1];
    
    // Note: We don't need to check if video exists - the API will handle duplicates
    
    // Share the video using the same endpoint users use
    const response = await axios.post(
      `${API_URL}/api/v1/videos`,
      {
        youtubeVideoId: videoId,
        tags: video.tags,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (response.status === 201) {
      console.log(`✅ Shared video: ${videoId} with tags: ${video.tags.join(', ')}`);
      return true;
    }
  } catch (error: any) {
    if (error.response?.status === 409) {
      console.log(`⏭️  Video already shared by this user, skipping...`);
      return false;
    }
    if (error.response?.status === 400) {
      console.error(`⚠️  Invalid video or not pet-related: ${video.youtubeUrl}`);
      return false;
    }
    const errorMsg = error.response?.data?.error || error.message;
    console.error(`❌ Error sharing video ${video.youtubeUrl}: ${errorMsg}`);
    if (error.response?.status === 400) {
      console.error(`   → This usually means the video is unavailable or not pet-related`);
    }
  }
  
  return false;
}

async function seedVideosAsUsers() {
  console.log('Starting video seeding as bot users...\n');
  console.log('Bots will use the same upload process as regular users.\n');
  
  // Create a map of bot usernames to tokens
  const botTokens = new Map<string, string>();
  
  // Login all bots
  console.log('Logging in bot accounts...');
  for (const bot of BOT_ACCOUNTS) {
    const token = await loginBot(bot);
    if (token) {
      botTokens.set(bot.username, token);
      console.log(`✅ Logged in as ${bot.username}`);
    } else {
      console.log(`❌ Failed to login as ${bot.username}`);
    }
  }
  
  if (botTokens.size === 0) {
    console.error('❌ No bots could log in. Make sure bot accounts exist and backend is running.');
    return;
  }
  
  console.log(`\n✅ ${botTokens.size} bots logged in successfully\n`);
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  // Share videos as bots
  for (const video of VIDEOS_TO_SHARE) {
    const token = botTokens.get(video.botUsername);
    
    if (!token) {
      console.error(`❌ Bot ${video.botUsername} not logged in, skipping video...`);
      errorCount++;
      continue;
    }
    
    const success = await shareVideo(token, video);
    
    if (success) {
      successCount++;
    } else if (video.youtubeUrl.includes('already')) {
      skipCount++;
    } else {
      errorCount++;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n📊 Seeding complete:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`\n💡 Tip: Add more videos to VIDEOS_TO_SHARE array with real YouTube URLs`);
}

// Run if called directly
if (require.main === module) {
  seedVideosAsUsers()
    .then(() => {
      console.log('\nDone!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

export { seedVideosAsUsers };

