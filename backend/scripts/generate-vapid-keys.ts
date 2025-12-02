/**
 * Script to generate VAPID keys for push notifications
 * 
 * Run with: npx ts-node backend/scripts/generate-vapid-keys.ts
 */

import webpush from 'web-push';

console.log('Generating VAPID keys for push notifications...\n');

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log('✅ VAPID keys generated successfully!\n');
console.log('Add these to your Vercel environment variables:\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('VAPID_SUBJECT=mailto:admin@petflix.app');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📝 Instructions:');
console.log('1. Copy the values above');
console.log('2. Go to your Vercel project settings');
console.log('3. Navigate to Environment Variables');
console.log('4. Add each variable (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT)');
console.log('5. Redeploy your application\n');
console.log('⚠️  Keep VAPID_PRIVATE_KEY secret - never commit it to git!');

