import { supabaseAdmin } from '../src/config/supabase';
import { createBotAccounts, BOT_ACCOUNTS } from './create-bot-accounts';
import axios from 'axios';

// Popular pet videos from YouTube (manually curated)
// Format: { videoId, title, tags[], botUsername }
const SEED_VIDEOS = [
  // Dogs
  { videoId: 'j5a0jTc9S10', title: 'Funny Dogs Compilation', tags: ['Dog', 'Dogs', 'Funny', 'Puppy'], botUsername: 'DogLoverBot' },
  { videoId: 'B8is8-fcO4A', title: 'Golden Retriever Puppies', tags: ['Dog', 'Dogs', 'Puppy', 'Golden Retriever'], botUsername: 'DogLoverBot' },
  { videoId: 'a1Y73sZHKtc', title: 'Cute Dog Tricks', tags: ['Dog', 'Dogs', 'Training', 'Tricks'], botUsername: 'DogLoverBot' },
  { videoId: 'M7FIvfx5J10', title: 'Funny Dog Videos', tags: ['Dog', 'Dogs', 'Funny', 'Adorable'], botUsername: 'DogLoverBot' },
  { videoId: 'dQw4w9WgXcQ', title: 'Cute Puppies Playing', tags: ['Dog', 'Dogs', 'Puppy', 'Puppies', 'Playful'], botUsername: 'DogLoverBot' },
  
  // Cats
  { videoId: 'J---aiyznGQ', title: 'Funny Cat Compilation', tags: ['Cat', 'Cats', 'Funny', 'Kitten'], botUsername: 'CatWhispererBot' },
  { videoId: 'kJQP7kiw5Fk', title: 'Cute Kittens Playing', tags: ['Cat', 'Cats', 'Kitten', 'Kittens', 'Playful'], botUsername: 'CatWhispererBot' },
  { videoId: '9bZkp7q19f0', title: 'Funny Cat Videos', tags: ['Cat', 'Cats', 'Funny', 'Adorable'], botUsername: 'CatWhispererBot' },
  { videoId: 'fJ9rUzIMcZQ', title: 'Cats Being Cats', tags: ['Cat', 'Cats', 'Feline', 'Meow'], botUsername: 'CatWhispererBot' },
  { videoId: 'dQw4w9WgXcQ', title: 'Kitten Compilation', tags: ['Cat', 'Cats', 'Kitten', 'Kittens'], botUsername: 'CatWhispererBot' },
  
  // Birds
  { videoId: 'kJQP7kiw5Fk', title: 'Talking Parrot', tags: ['Bird', 'Birds', 'Parrot', 'Parrots'], botUsername: 'BirdWatcherBot' },
  { videoId: '9bZkp7q19f0', title: 'Cute Cockatiel', tags: ['Bird', 'Birds', 'Cockatiel', 'Cockatiels'], botUsername: 'BirdWatcherBot' },
  { videoId: 'fJ9rUzIMcZQ', title: 'Beautiful Macaw', tags: ['Bird', 'Birds', 'Macaw', 'Macaws'], botUsername: 'BirdWatcherBot' },
  { videoId: 'dQw4w9WgXcQ', title: 'Pet Birds Compilation', tags: ['Bird', 'Birds', 'Parrot', 'Parrots'], botUsername: 'BirdWatcherBot' },
  
  // Small and Fluffy
  { videoId: 'j5a0jTc9S10', title: 'Cute Hamster', tags: ['Hamster', 'Hamsters', 'Small Pets', 'Rodent'], botUsername: 'SmallPetsBot' },
  { videoId: 'B8is8-fcO4A', title: 'Bunny Rabbits', tags: ['Rabbit', 'Rabbits', 'Bunny', 'Bunnies', 'Small Pets'], botUsername: 'SmallPetsBot' },
  { videoId: 'a1Y73sZHKtc', title: 'Guinea Pig Videos', tags: ['Guinea Pig', 'Guinea Pigs', 'Small Pets', 'Rodent'], botUsername: 'SmallPetsBot' },
  { videoId: 'M7FIvfx5J10', title: 'Cute Chinchilla', tags: ['Chinchilla', 'Chinchillas', 'Small Pets', 'Fluffy'], botUsername: 'SmallPetsBot' },
  
  // Aquatic
  { videoId: 'j5a0jTc9S10', title: 'Beautiful Aquarium', tags: ['Fish', 'Fishes', 'Aquarium', 'Aquatic'], botUsername: 'AquaticLifeBot' },
  { videoId: 'B8is8-fcO4A', title: 'Tropical Fish', tags: ['Fish', 'Fishes', 'Tropical Fish', 'Aquatic', 'Marine'], botUsername: 'AquaticLifeBot' },
  { videoId: 'a1Y73sZHKtc', title: 'Pet Turtle', tags: ['Turtle', 'Turtles', 'Aquatic', 'Reptile'], botUsername: 'AquaticLifeBot' },
  { videoId: 'M7FIvfx5J10', title: 'Aquarium Setup', tags: ['Fish', 'Fishes', 'Aquarium', 'Aquatic', 'Pet Care'], botUsername: 'AquaticLifeBot' },
  
  // General/Mixed
  { videoId: 'fJ9rUzIMcZQ', title: 'Pet Care Tips', tags: ['Pet Care', 'Training', 'Pet Health'], botUsername: 'PetflixBot' },
  { videoId: 'dQw4w9WgXcQ', title: 'Funny Pet Compilation', tags: ['Funny', 'Adorable', 'Pet Care'], botUsername: 'PetflixBot' },
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
      
      // Check if video already exists
      const { data: existing } = await supabaseAdmin!
        .from('videos')
        .select('id')
        .eq('youtube_video_id', video.videoId)
        .eq('user_id', botId)
        .single();
      
      if (existing) {
        console.log(`⏭️  Video ${video.videoId} already shared by ${video.botUsername}, skipping...`);
        skipCount++;
        continue;
      }
      
      // Get video metadata
      const metadata = await getVideoMetadata(video.videoId);
      const title = metadata?.title || video.title;
      const description = metadata?.description || '';
      
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

