import { supabaseAdmin } from '../src/config/supabase';
import bcrypt from 'bcrypt';

interface TestUser {
  username: string;
  email: string;
  password: string;
  profilePictureUrl: string;
  bio?: string;
}

const testUsers: TestUser[] = [
  {
    username: 'CatWhisperer',
    email: 'catwhisperer@petflix.test',
    password: 'test123',
    profilePictureUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop',
    bio: 'Cat enthusiast and content creator'
  },
  {
    username: 'DogLoverMax',
    email: 'doglovermax@petflix.test',
    password: 'test123',
    profilePictureUrl: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=400&h=400&fit=crop',
    bio: 'Sharing the best dog moments'
  },
  {
    username: 'BirdWatcher',
    email: 'birdwatcher@petflix.test',
    password: 'test123',
    profilePictureUrl: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=400&h=400&fit=crop',
    bio: 'Avian adventures and bird content'
  },
  {
    username: 'AquaticPets',
    email: 'aquaticpets@petflix.test',
    password: 'test123',
    profilePictureUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop',
    bio: 'Underwater pet content'
  },
  {
    username: 'SmallFurry',
    email: 'smallfurry@petflix.test',
    password: 'test123',
    profilePictureUrl: 'https://images.unsplash.com/photo-1511275539165-cc46a1ee89bf?w=400&h=400&fit=crop',
    bio: 'Hamsters, rabbits, and more!'
  },
  {
    username: 'PetVideosDaily',
    email: 'petvideosdaily@petflix.test',
    password: 'test123',
    profilePictureUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=400&fit=crop',
    bio: 'Daily dose of pet content'
  },
  {
    username: 'CutePetsOnly',
    email: 'cutepetsonly@petflix.test',
    password: 'test123',
    profilePictureUrl: 'https://images.unsplash.com/photo-1551717743-49959800b1f6?w=400&h=400&fit=crop',
    bio: 'Only the cutest pet moments'
  },
  {
    username: 'PetCareExpert',
    email: 'petcareexpert@petflix.test',
    password: 'test123',
    profilePictureUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop',
    bio: 'Pet care tips and advice'
  },
  {
    username: 'FurryFriends',
    email: 'furryfriends@petflix.test',
    password: 'test123',
    profilePictureUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=400&fit=crop',
    bio: 'Celebrating our furry friends'
  },
  {
    username: 'PetLife',
    email: 'petlife@petflix.test',
    password: 'test123',
    profilePictureUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=400&fit=crop',
    bio: 'Living the pet life'
  }
];

async function createTestUsers() {
  console.log('Creating 10 test user accounts...\n');

  const createdUsers: Array<{ username: string; email: string; password: string }> = [];

  for (const user of testUsers) {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin!
        .from('users')
        .select('id, username, email')
        .or(`username.eq.${user.username},email.eq.${user.email}`)
        .limit(1)
        .single();

      if (existingUser) {
        console.log(`⚠️  User ${user.username} already exists, skipping...`);
        continue;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(user.password, 10);

      // Create user
      const { data: newUser, error: insertError } = await supabaseAdmin!
        .from('users')
        .insert({
          username: user.username,
          email: user.email,
          password_hash: passwordHash,
          profile_picture_url: user.profilePictureUrl,
          bio: user.bio,
        })
        .select('id, username, email')
        .single();

      if (insertError || !newUser) {
        console.error(`❌ Failed to create ${user.username}:`, insertError?.message);
        continue;
      }

      // Create notification preferences
      await supabaseAdmin!
        .from('user_notification_preferences')
        .insert({
          user_id: newUser.id,
          notifications_enabled: true,
        });

      createdUsers.push({
        username: user.username,
        email: user.email,
        password: user.password,
      });

      console.log(`✅ Created: ${user.username} (${user.email})`);
    } catch (error: any) {
      console.error(`❌ Error creating ${user.username}:`, error.message);
    }
  }

  console.log(`\n✨ Created ${createdUsers.length} user accounts!\n`);
  console.log('Login credentials (all use password: test123):');
  console.log('==========================================');
  createdUsers.forEach((user, index) => {
    console.log(`${index + 1}. Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${user.password}\n`);
  });
}

// Run the script
createTestUsers()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script error:', error);
    process.exit(1);
  });

