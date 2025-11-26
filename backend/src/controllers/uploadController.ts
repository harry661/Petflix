import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { ErrorResponse } from '../types';
import multer from 'multer';
import sharp from 'sharp';

// Configure multer for memory storage (we'll upload directly to Supabase)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Middleware for single file upload
export const uploadMiddleware = upload.single('profilePicture');

/**
 * Upload profile picture
 * POST /api/v1/users/me/profile-picture
 */
export const uploadProfilePicture = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const userId = req.user.userId;
    const file = req.file;

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' });
      return;
    }

    // Process image: resize and optimize
    let processedImage: Buffer;
    try {
      processedImage = await sharp(file.buffer)
        .resize(400, 400, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 85 }) // Convert to JPEG for consistency and smaller file size
        .toBuffer();
    } catch (error) {
      console.error('Error processing image:', error);
      res.status(400).json({ error: 'Failed to process image. Please ensure the file is a valid image.' });
      return;
    }

    // Generate unique filename
    const fileExtension = 'jpg';
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const bucketName = 'profile-pictures';

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin!
      .storage
      .from(bucketName)
      .upload(fileName, processedImage, {
        contentType: 'image/jpeg',
        upsert: false, // Don't overwrite existing files
      });

    if (uploadError) {
      console.error('Error uploading to Supabase Storage:', uploadError);
      
      // If bucket doesn't exist, provide helpful error
      if (uploadError.message?.includes('Bucket not found') || uploadError.statusCode === '404') {
        res.status(500).json({ 
          error: 'Storage bucket not configured. Please create a "profile-pictures" bucket in Supabase Storage.',
          details: 'The profile-pictures bucket needs to be created in your Supabase project with public access.'
        });
        return;
      }
      
      res.status(500).json({ error: 'Failed to upload image' });
      return;
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin!
      .storage
      .from(bucketName)
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Delete old profile picture if it exists and is in our storage
    const { data: currentUser } = await supabaseAdmin!
      .from('users')
      .select('profile_picture_url')
      .eq('id', userId)
      .single();

    if (currentUser?.profile_picture_url) {
      const oldUrl = currentUser.profile_picture_url;
      // Only delete if it's from our storage bucket
      if (oldUrl.includes(bucketName) || oldUrl.includes('supabase.co/storage')) {
        try {
          // Extract filename from URL
          const urlParts = oldUrl.split('/');
          const oldFileName = urlParts[urlParts.length - 1].split('?')[0];
          const oldFilePath = `${userId}/${oldFileName}`;
          
          await supabaseAdmin!
            .storage
            .from(bucketName)
            .remove([oldFilePath]);
        } catch (deleteError) {
          // Non-critical error - log but don't fail
          console.error('Error deleting old profile picture:', deleteError);
        }
      }
    }

    // Update user profile with new URL
    const { data: updatedUser, error: updateError } = await supabaseAdmin!
      .from('users')
      .update({ profile_picture_url: publicUrl })
      .eq('id', userId)
      .select('id, username, email, profile_picture_url, bio, created_at, updated_at')
      .single();

    if (updateError || !updatedUser) {
      console.error('Error updating user profile:', updateError);
      // Try to clean up uploaded file
      await supabaseAdmin!
        .storage
        .from(bucketName)
        .remove([fileName]);
      
      res.status(500).json({ error: 'Failed to update profile' });
      return;
    }

    res.json({
      message: 'Profile picture uploaded successfully',
      profile_picture_url: updatedUser.profile_picture_url,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

