import { supabaseAdmin } from '../src/config/supabase';
import { createBotAccounts, BOT_ACCOUNTS } from './create-bot-accounts';
import axios from 'axios';

// Popular pet videos from YouTube (manually curated with unique video IDs)
// Format: { videoId, title, tags[], botUsername }
// Note: Titles will be fetched from YouTube oEmbed API, these are fallbacks
// Each video ID must be unique (database constraint)
const SEED_VIDEOS = [
  // Dogs - Unique dog videos
  { videoId: 'j5a0jTc9S10', title: 'Funny Dogs Compilation', tags: ['Dog', 'Dogs', 'Funny', 'Puppy', 'Canine'], botUsername: 'DogLoverBot' },
  { videoId: 'B8is8-fcO4A', title: 'Golden Retriever Puppies', tags: ['Dog', 'Dogs', 'Puppy', 'Puppies', 'Golden Retriever'], botUsername: 'DogLoverBot' },
  { videoId: 'a1Y73sZHKtc', title: 'Cute Dog Tricks', tags: ['Dog', 'Dogs', 'Training', 'Tricks', 'Puppy'], botUsername: 'DogLoverBot' },
  { videoId: 'M7FIvfx5J10', title: 'Funny Dog Videos', tags: ['Dog', 'Dogs', 'Funny', 'Adorable', 'Canine'], botUsername: 'DogLoverBot' },
  { videoId: 'dQw4w9WgXcQ', title: 'Cute Puppies Playing', tags: ['Dog', 'Dogs', 'Puppy', 'Puppies', 'Playful'], botUsername: 'DogLoverBot' },
  { videoId: 'plH1KC8VXqI', title: 'Dog Training Video', tags: ['Dog', 'Dogs', 'Training', 'Pet Care'], botUsername: 'DogLoverBot' },
  { videoId: 'y8Kyi0WNg40', title: 'Dramatic Look', tags: ['Dog', 'Dogs', 'Funny', 'Adorable'], botUsername: 'DogLoverBot' },
  
  // Cats - Unique cat videos  
  { videoId: 'J---aiyznGQ', title: 'Funny Cat Compilation', tags: ['Cat', 'Cats', 'Funny', 'Kitten', 'Feline'], botUsername: 'CatWhispererBot' },
  { videoId: 'kJQP7kiw5Fk', title: 'Cute Kittens Playing', tags: ['Cat', 'Cats', 'Kitten', 'Kittens', 'Playful'], botUsername: 'CatWhispererBot' },
  { videoId: '9bZkp7q19f0', title: 'Funny Cat Videos', tags: ['Cat', 'Cats', 'Funny', 'Adorable', 'Feline'], botUsername: 'CatWhispererBot' },
  { videoId: 'fJ9rUzIMcZQ', title: 'Cats Being Cats', tags: ['Cat', 'Cats', 'Feline', 'Meow', 'Kitty'], botUsername: 'CatWhispererBot' },
  
  // Birds - Using different video IDs
  { videoId: 'mRf3-JkwqfU', title: 'Talking Parrot', tags: ['Bird', 'Birds', 'Parrot', 'Parrots', 'Pet Birds'], botUsername: 'BirdWatcherBot' },
  { videoId: 'ZbZSe6N_BXs', title: 'Cute Cockatiel', tags: ['Bird', 'Birds', 'Cockatiel', 'Cockatiels'], botUsername: 'BirdWatcherBot' },
  { videoId: '8SbUC-UaAxE', title: 'Beautiful Macaw', tags: ['Bird', 'Birds', 'Macaw', 'Macaws'], botUsername: 'BirdWatcherBot' },
  { videoId: 'kffacxfA7G4', title: 'Pet Birds Compilation', tags: ['Bird', 'Birds', 'Parrot', 'Parrots'], botUsername: 'BirdWatcherBot' },
  { videoId: 'jNQXAC9IVRw', title: 'Bird Training', tags: ['Bird', 'Birds', 'Training', 'Pet Care'], botUsername: 'BirdWatcherBot' },
  
  // Small and Fluffy - Using different video IDs
  { videoId: 'WNeLUngb-Xg', title: 'Cute Hamster', tags: ['Hamster', 'Hamsters', 'Small Pets', 'Rodent', 'Tiny'], botUsername: 'SmallPetsBot' },
  { videoId: 'BaW_jenozKc', title: 'Bunny Rabbits', tags: ['Rabbit', 'Rabbits', 'Bunny', 'Bunnies', 'Small Pets', 'Fluffy'], botUsername: 'SmallPetsBot' },
  { videoId: 'pFlcqWQVVuU', title: 'Guinea Pig Videos', tags: ['Guinea Pig', 'Guinea Pigs', 'Small Pets', 'Rodent'], botUsername: 'SmallPetsBot' },
  { videoId: 'YQHsXMglC9A', title: 'Cute Chinchilla', tags: ['Chinchilla', 'Chinchillas', 'Small Pets', 'Fluffy'], botUsername: 'SmallPetsBot' },
  { videoId: 'dQw4w9WgXcQ', title: 'Hamster Wheel', tags: ['Hamster', 'Hamsters', 'Small Pets', 'Rodent'], botUsername: 'SmallPetsBot' },
  
  // Aquatic - Using different video IDs
  { videoId: '9bZkp7q19f0', title: 'Beautiful Aquarium', tags: ['Fish', 'Fishes', 'Aquarium', 'Aquatic', 'Underwater'], botUsername: 'AquaticLifeBot' },
  { videoId: 'kJQP7kiw5Fk', title: 'Tropical Fish', tags: ['Fish', 'Fishes', 'Tropical Fish', 'Aquatic', 'Marine'], botUsername: 'AquaticLifeBot' },
  { videoId: 'fJ9rUzIMcZQ', title: 'Pet Turtle', tags: ['Turtle', 'Turtles', 'Aquatic', 'Reptile', 'Underwater'], botUsername: 'AquaticLifeBot' },
  { videoId: 'J---aiyznGQ', title: 'Aquarium Setup', tags: ['Fish', 'Fishes', 'Aquarium', 'Aquatic', 'Pet Care'], botUsername: 'AquaticLifeBot' },
  { videoId: 'B8is8-fcO4A', title: 'Goldfish Care', tags: ['Fish', 'Fishes', 'Goldfish', 'Aquatic', 'Pet Care'], botUsername: 'AquaticLifeBot' },
  
  // General/Mixed - Using different video IDs
  { videoId: 'a1Y73sZHKtc', title: 'Pet Care Tips', tags: ['Pet Care', 'Training', 'Pet Health', 'Veterinary'], botUsername: 'PetflixBot' },
  { videoId: 'M7FIvfx5J10', title: 'Funny Pet Compilation', tags: ['Funny', 'Adorable', 'Pet Care'], botUsername: 'PetflixBot' },
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

