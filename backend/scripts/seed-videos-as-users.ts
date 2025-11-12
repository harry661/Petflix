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

// Real pet videos - use full YouTube URLs
// These will go through the same validation and processing as user uploads
const VIDEOS_TO_SHARE: VideoToShare[] = [
  // Dogs
  { youtubeUrl: 'https://www.youtube.com/watch?v=j5a0jTc9S10', tags: ['Dog', 'Dogs', 'Funny', 'Puppy', 'Canine'], botUsername: 'DogLoverBot' },
  { youtubeUrl: 'https://www.youtube.com/watch?v=B8is8-fcO4A', tags: ['Dog', 'Dogs', 'Puppy', 'Puppies', 'Golden Retriever'], botUsername: 'DogLoverBot' },
  { youtubeUrl: 'https://www.youtube.com/watch?v=a1Y73sZHKtc', tags: ['Dog', 'Dogs', 'Training', 'Tricks', 'Puppy'], botUsername: 'DogLoverBot' },
  { youtubeUrl: 'https://www.youtube.com/watch?v=plH1KC8VXqI', tags: ['Dog', 'Dogs', 'Training', 'Pet Care'], botUsername: 'DogLoverBot' },
  
  // Cats
  { youtubeUrl: 'https://www.youtube.com/watch?v=J---aiyznGQ', tags: ['Cat', 'Cats', 'Funny', 'Kitten', 'Feline'], botUsername: 'CatWhispererBot' },
  
  // Birds
  { youtubeUrl: 'https://www.youtube.com/watch?v=mRf3-JkwqfU', tags: ['Bird', 'Birds', 'Parrot', 'Parrots', 'Pet Birds'], botUsername: 'BirdWatcherBot' },
  
  // Small Pets
  { youtubeUrl: 'https://www.youtube.com/watch?v=BaW_jenozKc', tags: ['Rabbit', 'Rabbits', 'Bunny', 'Bunnies', 'Small Pets', 'Fluffy'], botUsername: 'SmallPetsBot' },
  
  // Add more videos here with real YouTube URLs
  // The backend will validate they're pet-related and available
];

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

