import { supabaseAdmin } from '../src/config/supabase';
import axios from 'axios';

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
    return null;
  }
  
  return null;
}

async function cleanupNonPetVideos() {
  console.log('Scanning videos for non-pet content...\n');
  
  // Get all videos
  const { data: videos, error } = await supabaseAdmin!
    .from('videos')
    .select('id, youtube_video_id, title');
  
  if (error) {
    console.error('Error fetching videos:', error);
    return;
  }
  
  if (!videos || videos.length === 0) {
    console.log('No videos found.');
    return;
  }
  
  const petKeywords = [
    'pet', 'pets', 'dog', 'dogs', 'puppy', 'puppies', 'canine',
    'cat', 'cats', 'kitten', 'kittens', 'feline', 'kitty',
    'bird', 'birds', 'parrot', 'parrots', 'cockatiel', 'macaw',
    'hamster', 'hamsters', 'rabbit', 'rabbits', 'bunny', 'bunnies',
    'guinea pig', 'guinea pigs', 'chinchilla', 'chinchillas',
    'fish', 'fishes', 'aquarium', 'turtle', 'turtles',
    'animal', 'animals', 'pet care', 'pet training', 'veterinary', 'vet'
  ];
  
  let deletedCount = 0;
  let keptCount = 0;
  
  for (const video of videos) {
    // Get fresh metadata
    const metadata = await getVideoMetadata(video.youtube_video_id);
    const title = metadata?.title || video.title || '';
    const description = metadata?.description || '';
    
    const titleLower = title.toLowerCase();
    const descLower = description.toLowerCase();
    const isPetRelated = petKeywords.some(keyword => 
      titleLower.includes(keyword) || descLower.includes(keyword)
    );
    
    if (!isPetRelated) {
      console.log(`❌ Deleting non-pet video: "${title.substring(0, 60)}" (${video.youtube_video_id})`);
      
      // Delete associated tags first
      await supabaseAdmin!
        .from('video_tags_direct')
        .delete()
        .eq('video_id', video.id);
      
      // Delete video
      const { error: deleteError } = await supabaseAdmin!
        .from('videos')
        .delete()
        .eq('id', video.id);
      
      if (deleteError) {
        console.error(`  Error deleting: ${deleteError.message}`);
      } else {
        deletedCount++;
      }
    } else {
      console.log(`✅ Keeping pet video: "${title.substring(0, 60)}"`);
      keptCount++;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\n📊 Cleanup complete:`);
  console.log(`   ✅ Kept: ${keptCount}`);
  console.log(`   ❌ Deleted: ${deletedCount}`);
}

// Run if called directly
if (require.main === module) {
  cleanupNonPetVideos()
    .then(() => {
      console.log('\nDone!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

export { cleanupNonPetVideos };

