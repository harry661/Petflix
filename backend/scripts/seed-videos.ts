import { supabaseAdmin } from '../src/config/supabase';
import { createBotAccounts, BOT_ACCOUNTS } from './create-bot-accounts';
import axios from 'axios';

// Popular pet videos from YouTube - Real, working video IDs
// Format: { videoId, title, tags[], botUsername }
// 
// IMPORTANT: 
// - Each video ID must be unique (database constraint)
// - Videos are validated to ensure they're pet-related before sharing
// - Titles are fetched from YouTube oEmbed API (these are fallbacks)
// - Videos are checked for availability before being added
interface SeedVideo {
  videoId: string;
  title: string;
  tags: string[];
  botUsername: string;
}

// IMPORTANT: Only use UNIQUE video IDs that are REAL pet videos
// To find real pet video IDs:
// 1. Go to YouTube and search for pet videos
// 2. Copy the video ID from the URL (e.g., youtube.com/watch?v=VIDEO_ID)
// 3. Verify it's a pet video before adding
// 4. Each video ID must be unique (no duplicates)
const SEED_VIDEOS: SeedVideo[] = [
  // Dogs - Real dog videos (currently working videos from database)
  // Add more unique dog video IDs here
  // { videoId: 'UNIQUE_VIDEO_ID', title: 'Video Title', tags: ['Dog', 'Dogs', 'Puppy'], botUsername: 'DogLoverBot' },
  
  // Cats - Real cat videos
  // { videoId: 'UNIQUE_VIDEO_ID', title: 'Video Title', tags: ['Cat', 'Cats', 'Kitten'], botUsername: 'CatWhispererBot' },
  
  // Birds - Real bird videos (need more!)
  // { videoId: 'UNIQUE_VIDEO_ID', title: 'Video Title', tags: ['Bird', 'Birds', 'Parrot'], botUsername: 'BirdWatcherBot' },
  
  // Small and Fluffy - Real small pet videos
  // { videoId: 'UNIQUE_VIDEO_ID', title: 'Video Title', tags: ['Hamster', 'Rabbit', 'Small Pets'], botUsername: 'SmallPetsBot' },
  
  // Aquatic - Real aquatic pet videos (need more!)
  // { videoId: 'UNIQUE_VIDEO_ID', title: 'Video Title', tags: ['Fish', 'Aquarium', 'Aquatic'], botUsername: 'AquaticLifeBot' },
  
  // General Pet Care - Real pet care videos
  // { videoId: 'UNIQUE_VIDEO_ID', title: 'Video Title', tags: ['Pet Care', 'Training', 'Pet Health'], botUsername: 'PetflixBot' },
];

// Get video metadata from oEmbed (free, no quota)
async function getVideoMetadata(videoId: string): Promise<{ title: string; description: string } | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await axios.get(oembedUrl, { timeout: 5000 });
    
    if (response.data) {
      return {
        title: response.data.title || `YouTube Video ${videoId}`,
        description: response.data.author_name ? `By ${response.data.author_name}` : ''
      };
    }
  } catch (error) {
    console.log(`Could not fetch metadata for video ${videoId}`);
  }
  
  return null;
}

async function seedVideos() {
  console.log('Starting video seeding...\n');
  
  // First, ensure bot accounts exist
  const bots = await createBotAccounts();
  const botMap = new Map(bots.map(bot => [bot.username, bot.id]));
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (const video of SEED_VIDEOS) {
    try {
      const botId = botMap.get(video.botUsername);
      if (!botId) {
        console.error(`Bot ${video.botUsername} not found, skipping video ${video.videoId}`);
        errorCount++;
        continue;
      }
      
      // Check if video already exists (by any user - unique constraint on youtube_video_id)
      const { data: existing } = await supabaseAdmin!
        .from('videos')
        .select('id, user_id')
        .eq('youtube_video_id', video.videoId)
        .single();
      
      if (existing) {
        console.log(`⏭️  Video ${video.videoId} already shared, skipping...`);
        skipCount++;
        continue;
      }
      
      // Get video metadata and validate it's pet-related and available
      const metadata = await getVideoMetadata(video.videoId);
      if (!metadata) {
        console.log(`⚠️  Video ${video.videoId} is unavailable or doesn't exist, skipping...`);
        skipCount++;
        continue;
      }
      
      const title = metadata.title || video.title;
      const description = metadata.description || '';
      
      // Basic validation: check if title/description contains pet-related keywords
      const petKeywords = ['pet', 'dog', 'cat', 'bird', 'puppy', 'kitten', 'hamster', 'rabbit', 'fish', 'turtle', 'animal', 'puppies', 'kittens', 'parrot', 'aquarium', 'guinea pig', 'chinchilla'];
      const titleLower = title.toLowerCase();
      const descLower = description.toLowerCase();
      const isPetRelated = petKeywords.some(keyword => titleLower.includes(keyword) || descLower.includes(keyword));
      
      if (!isPetRelated) {
        console.log(`⚠️  Video "${title.substring(0, 50)}" doesn't appear to be pet-related, skipping...`);
        skipCount++;
        continue;
      }
      
      // Create video
      const { data: newVideo, error: videoError } = await supabaseAdmin!
        .from('videos')
        .insert({
          youtube_video_id: video.videoId,
          title: title,
          description: description,
          user_id: botId,
          view_count: Math.floor(Math.random() * 1000000) + 1000 // Random view count for variety
        })
        .select('id')
        .single();
      
      if (videoError || !newVideo) {
        console.error(`❌ Error creating video ${video.videoId}:`, videoError?.message);
        errorCount++;
        continue;
      }
      
      // Add tags
      if (video.tags && video.tags.length > 0) {
        const tagInserts = video.tags.map(tag => ({
          video_id: newVideo.id,
          tag_name: tag
        }));
        
        const { error: tagsError } = await supabaseAdmin!
          .from('video_tags_direct')
          .insert(tagInserts);
        
        if (tagsError) {
          console.error(`⚠️  Error adding tags for video ${video.videoId}:`, tagsError.message);
        }
      }
      
      console.log(`✅ Shared video: ${title.substring(0, 50)}... (${video.tags.join(', ')})`);
      successCount++;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (err: any) {
      console.error(`❌ Error processing video ${video.videoId}:`, err.message);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Seeding complete:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
}

// Run if called directly
if (require.main === module) {
  seedVideos()
    .then(() => {
      console.log('\nDone!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

export { seedVideos };

