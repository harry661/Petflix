import { supabaseAdmin } from '../src/config/supabase';
import * as bcrypt from 'bcrypt';

interface BotAccount {
  username: string;
  email: string;
  password: string;
  bio?: string;
}

const BOT_ACCOUNTS: BotAccount[] = [
  {
    username: 'PetflixBot',
    email: 'bot@petflix.com',
    password: 'bot_password_secure_123',
    bio: 'Official Petflix bot sharing amazing pet content'
  },
  {
    username: 'DogLoverBot',
    email: 'dogbot@petflix.com',
    password: 'bot_password_secure_123',
    bio: 'Sharing the best dog videos'
  },
  {
    username: 'CatWhispererBot',
    email: 'catbot@petflix.com',
    password: 'bot_password_secure_123',
    bio: 'Curating the finest cat content'
  },
  {
    username: 'BirdWatcherBot',
    email: 'birdbot@petflix.com',
    password: 'bot_password_secure_123',
    bio: 'Featuring beautiful bird videos'
  },
  {
    username: 'SmallPetsBot',
    email: 'smallbot@petflix.com',
    password: 'bot_password_secure_123',
    bio: 'Tiny pets, big personalities'
  },
  {
    username: 'AquaticLifeBot',
    email: 'aquaticbot@petflix.com',
    password: 'bot_password_secure_123',
    bio: 'Diving into aquatic pet content'
  }
];

async function createBotAccounts() {
  console.log('Creating bot accounts...');
  
  const createdBots: any[] = [];
  
  for (const bot of BOT_ACCOUNTS) {
    try {
      // Check if bot already exists
      const { data: existing } = await supabaseAdmin!
        .from('users')
        .select('id, username')
        .eq('username', bot.username)
        .single();
      
      if (existing) {
        console.log(`Bot ${bot.username} already exists, skipping...`);
        createdBots.push(existing);
        continue;
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(bot.password, 10);
      
      // Create bot account
      const { data: newBot, error } = await supabaseAdmin!
        .from('users')
        .insert({
          username: bot.username,
          email: bot.email,
          password_hash: passwordHash,
          bio: bot.bio || null
        })
        .select('id, username, email')
        .single();
      
      if (error) {
        console.error(`Error creating bot ${bot.username}:`, error.message);
        continue;
      }
      
      console.log(`✅ Created bot: ${bot.username} (ID: ${newBot.id})`);
      createdBots.push(newBot);
    } catch (err: any) {
      console.error(`Error creating bot ${bot.username}:`, err.message);
    }
  }
  
  console.log(`\n✅ Created ${createdBots.length} bot accounts`);
  return createdBots;
}

// Run if called directly
if (require.main === module) {
  createBotAccounts()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

export { createBotAccounts, BOT_ACCOUNTS };

