/**
 * Script to set up storage policies for profile-pictures bucket
 * 
 * Run with: npx ts-node backend/scripts/setup-storage-policies.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const policies = [
  {
    name: 'Public can view profile pictures',
    sql: `
      CREATE POLICY IF NOT EXISTS "Public can view profile pictures"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'profile-pictures');
    `,
  },
  {
    name: 'Users can upload their own profile pictures',
    sql: `
      CREATE POLICY IF NOT EXISTS "Users can upload their own profile pictures"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'profile-pictures' AND
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
        bucket_id = 'profile-pictures' AND
        (storage.foldername(name))[1] = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = 'profile-pictures' AND
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
        bucket_id = 'profile-pictures' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
    `,
  },
];

async function setupPolicies() {
  console.log('🔐 Setting up storage policies...\n');

  try {
    // Execute each policy
    for (const policy of policies) {
      console.log(`📝 Creating policy: ${policy.name}...`);
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql: policy.sql.trim() 
      });

      if (error) {
        // If exec_sql doesn't exist, we need to use the SQL editor
        console.log('⚠️  Cannot execute SQL directly. Please run this SQL in Supabase SQL Editor:\n');
        console.log('─'.repeat(60));
        policies.forEach((p, index) => {
          console.log(`\n-- Policy ${index + 1}: ${p.name}`);
          console.log(p.sql.trim());
        });
        console.log('\n' + '─'.repeat(60));
        console.log('\n💡 Go to: Supabase Dashboard → SQL Editor → New query → Paste SQL → Run');
        return;
      }
      
      console.log(`✅ Policy created: ${policy.name}`);
    }

    console.log('\n✅ All policies set up successfully!');
    console.log('🎉 You can now upload profile pictures!');
  } catch (error: any) {
    console.error('\n❌ Error setting up policies:', error.message);
    console.log('\n💡 Please run the SQL manually in Supabase SQL Editor.');
    console.log('   See backend/migrations/014_setup_profile_pictures_storage.sql');
  }
}

setupPolicies()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

