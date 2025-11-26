/**
 * Script to automatically set up the profile-pictures storage bucket in Supabase
 * 
 * Run with: npx ts-node backend/scripts/setup-profile-pictures-bucket.ts
 * Or: npm run setup-profile-pictures-bucket (if added to package.json)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  console.error('\nPlease set these in your .env file or environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const BUCKET_NAME = 'profile-pictures';

async function setupBucket() {
  console.log('🚀 Setting up profile-pictures storage bucket...\n');

  try {
    // Check if bucket already exists
    console.log('📦 Checking if bucket exists...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      throw listError;
    }

    const existingBucket = buckets?.find(b => b.name === BUCKET_NAME);

    if (existingBucket) {
      console.log(`✅ Bucket "${BUCKET_NAME}" already exists!`);
      console.log('   Name:', existingBucket.name);
      console.log('   ID:', existingBucket.id);
      console.log('\n⚠️  Note: Please verify in Supabase Dashboard that the bucket is set to "Public"');
      console.log('   If not public, images may not be accessible.');
    } else {
      // Create the bucket
      console.log(`📝 Creating bucket "${BUCKET_NAME}"...`);
      
      const { data: bucket, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 5242880, // 5MB in bytes
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      });

      if (createError) {
        console.error('❌ Error creating bucket:', createError);
        
        // Check if it's a permission error
        if (createError.message?.includes('permission') || createError.message?.includes('403')) {
          console.error('\n⚠️  Permission denied. This might be because:');
          console.error('   1. The service role key doesn\'t have storage admin permissions');
          console.error('   2. Storage API is not enabled in your Supabase project');
          console.error('\n💡 You may need to create the bucket manually in the Supabase Dashboard:');
          console.error('   - Go to Storage → New bucket');
          console.error('   - Name: "profile-pictures"');
          console.error('   - Public: Yes');
          console.error('   - File size limit: 5MB');
        }
        
        throw createError;
      }

      console.log('✅ Bucket created successfully!');
      console.log('   Name:', bucket?.name || BUCKET_NAME);
      console.log('   ID:', (bucket as any)?.id || 'N/A');
    }

    // Set up storage policies
    console.log('\n🔐 Setting up storage policies...');
    
    const policies = [
      {
        name: 'Public can view profile pictures',
        sql: `
          CREATE POLICY IF NOT EXISTS "Public can view profile pictures"
          ON storage.objects FOR SELECT
          TO public
          USING (bucket_id = '${BUCKET_NAME}');
        `,
      },
      {
        name: 'Users can upload their own profile pictures',
        sql: `
          CREATE POLICY IF NOT EXISTS "Users can upload their own profile pictures"
          ON storage.objects FOR INSERT
          TO authenticated
          WITH CHECK (
            bucket_id = '${BUCKET_NAME}' AND
            (storage.foldername(name))[1] = auth.uid()::text
          );
        `,
      },
      {
        name: 'Users can update their own profile pictures',
        sql: `
          CREATE POLICY IF NOT EXISTS "Users can update their own profile pictures"
          ON storage.objects FOR UPDATE
          TO authenticated
          USING (
            bucket_id = '${BUCKET_NAME}' AND
            (storage.foldername(name))[1] = auth.uid()::text
          )
          WITH CHECK (
            bucket_id = '${BUCKET_NAME}' AND
            (storage.foldername(name))[1] = auth.uid()::text
          );
        `,
      },
      {
        name: 'Users can delete their own profile pictures',
        sql: `
          CREATE POLICY IF NOT EXISTS "Users can delete their own profile pictures"
          ON storage.objects FOR DELETE
          TO authenticated
          USING (
            bucket_id = '${BUCKET_NAME}' AND
            (storage.foldername(name))[1] = auth.uid()::text
          );
        `,
      },
    ];

    // Note: We can't create policies via the Storage API, they need to be created via SQL
    // So we'll provide the SQL for the user to run
    console.log('\n📋 Storage policies need to be created via SQL.');
    console.log('   Run this SQL in your Supabase SQL Editor:\n');
    console.log('─'.repeat(60));
    policies.forEach((policy, index) => {
      console.log(`\n-- Policy ${index + 1}: ${policy.name}`);
      console.log(policy.sql.trim());
    });
    console.log('\n' + '─'.repeat(60));

    console.log('\n✅ Setup complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Copy the SQL above');
    console.log('   2. Go to Supabase Dashboard → SQL Editor');
    console.log('   3. Paste and run the SQL');
    console.log('   4. Try uploading a profile picture in your app!');

  } catch (error: any) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\n💡 If bucket creation failed, you can create it manually:');
    console.error('   1. Go to Supabase Dashboard → Storage');
    console.error('   2. Click "New bucket"');
    console.error('   3. Name: "profile-pictures"');
    console.error('   4. Public: Yes');
    console.error('   5. File size limit: 5MB');
    process.exit(1);
  }
}

// Run the setup
setupBucket()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });

