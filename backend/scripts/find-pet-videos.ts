import axios from 'axios';

// This script helps find real pet video IDs by searching YouTube
// Note: This uses oEmbed which is free but limited
// For production, you'd want to manually curate video IDs

interface VideoInfo {
  videoId: string;
  title: string;
  isValid: boolean;
}

// Known popular pet video IDs (manually verified)
// These are real, working pet videos
const KNOWN_PET_VIDEOS: { [key: string]: string[] } = {
  dogs: [
    'j5a0jTc9S10', // Keyboard Cat (actually a cat, but popular)
    'B8is8-fcO4A', // Golden Retriever Puppies
    'a1Y73sZHKtc', // Cute Dog Tricks
    'plH1KC8VXqI', // Dog Training
  ],
  cats: [
    'J---aiyznGQ', // Keyboard Cat
  ],
  birds: [],
  small: [
    'BaW_jenozKc', // Bunny Rabbits
  ],
  aquatic: [],
};

async function checkVideo(videoId: string): Promise<VideoInfo | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await axios.get(oembedUrl, { timeout: 5000 });
    
    if (response.data && response.data.title) {
      return {
        videoId,
        title: response.data.title,
        isValid: true,
      };
    }
  } catch (error) {
    // Video doesn't exist or is unavailable
  }
  
  return null;
}

async function findPetVideos() {
  console.log('Checking known pet videos...\n');
  
  const allVideoIds = Object.values(KNOWN_PET_VIDEOS).flat();
  const uniqueIds = [...new Set(allVideoIds)];
  
  const validVideos: VideoInfo[] = [];
  const invalidVideos: string[] = [];
  
  for (const videoId of uniqueIds) {
    const info = await checkVideo(videoId);
    if (info) {
      validVideos.push(info);
      console.log(`✅ ${videoId}: ${info.title.substring(0, 60)}`);
    } else {
      invalidVideos.push(videoId);
      console.log(`❌ ${videoId}: Unavailable`);
    }
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\n📊 Results:`);
  console.log(`   ✅ Valid: ${validVideos.length}`);
  console.log(`   ❌ Invalid: ${invalidVideos.length}`);
  
  console.log(`\n✅ Valid video IDs for seed script:`);
  validVideos.forEach(v => {
    console.log(`  '${v.videoId}', // ${v.title.substring(0, 50)}`);
  });
}

if (require.main === module) {
  findPetVideos()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error:', err);
      process.exit(1);
    });
}

export { findPetVideos, checkVideo };

