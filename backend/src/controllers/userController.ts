import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { hashPassword, comparePassword, generateToken, generateTokenWithExpiration } from '../utils/auth';
import {
  UserRegistrationRequest,
  UserLoginRequest,
  AuthenticationResponse,
  UserProfileResponse,
  ErrorResponse,
} from '../types';
import { validateEmail, validatePassword, validateUsername, sanitizeInput } from '../middleware/validation';
import { sendSignupAttemptEmail, sendLoginAttemptEmail, sendPasswordResetEmail } from '../services/emailService';

/**
 * Register a new user
 * POST /api/v1/users/register
 */
export const register = async (req: Request<{}, AuthenticationResponse | ErrorResponse, UserRegistrationRequest>, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email, and password are required' });
      return;
    }

    if (!validateUsername(username)) {
      res.status(400).json({ error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores' });
      return;
    }

    if (!validateEmail(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    if (!validatePassword(password)) {
      res.status(400).json({ error: 'Password must be at least 8 characters with uppercase, lowercase, and number' });
      return;
    }

    // Check if Supabase admin client is available
    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized');
      res.status(500).json({ error: 'Database configuration error' });
      return;
    }

    // Check if user already exists
    const { data: existingUsersByUsername, error: usernameError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', username)
      .limit(1);

    // Normalize email for comparison (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim();
    
    const { data: existingUsersByEmail, error: emailError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .limit(1);

    if (usernameError) {
      console.error('Error checking username:', usernameError);
      res.status(500).json({ error: 'Failed to check user existence', details: usernameError.message });
      return;
    }

    if (emailError) {
      console.error('Error checking email:', emailError);
      res.status(500).json({ error: 'Failed to check user existence', details: emailError.message });
      return;
    }

    const existingUsers = [...(existingUsersByUsername || []), ...(existingUsersByEmail || [])];

    if (existingUsers && existingUsers.length > 0) {
      // Check if email exists and send notification
      if (existingUsersByEmail && existingUsersByEmail.length > 0) {
        // Get the existing user's details
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('id, username, email')
          .eq('email', normalizedEmail)
          .single();

        if (existingUser) {
          console.log('[Register] Existing user found, sending email notification...');
          console.log('[Register] Existing user email:', existingUser.email);
          console.log('[Register] Existing user username:', existingUser.username);
          
          // Send email notification to the existing user
          // Call the function directly to start the promise immediately
          // Don't await - let it run in background
          console.log('[Register] Initiating email send...');
          
          // Call the function directly - this starts the promise immediately
          sendSignupAttemptEmail(
            existingUser.email,
            existingUser.username,
            normalizedEmail,
            username
          ).then(() => {
            console.log('[Register] ✅ Email sent successfully');
          }).catch((err: any) => {
            console.error('[Register] ❌ Error sending email notification:', err);
            console.error('[Register] Error details:', {
              message: err?.message,
              code: err?.code,
              response: err?.response,
              stack: err?.stack,
            });
          });
          
          console.log('[Register] Email promise created and executing in background');
        } else {
          console.log('[Register] Existing user not found after query');
        }
      }

      // Always return generic error message to prevent email enumeration
      res.status(400).json({ error: 'Unable to create account. Please try again or use a different email address.' });
      return;
    }

    // Hash password
    let passwordHash;
    try {
      passwordHash = await hashPassword(password);
      console.log('[Register] Password hashed successfully');
    } catch (hashError: any) {
      console.error('[Register] Error hashing password:', hashError);
      res.status(500).json({ error: 'Failed to process password', details: hashError?.message });
      return;
    }

    // Create user (store normalized email)
    console.log('[Register] Attempting to create user in database...');
    const { data: newUser, error: insertError } = await supabaseAdmin!
      .from('users')
      .insert({
        username,
        email: normalizedEmail, // Store normalized email
        password_hash: passwordHash,
      })
      .select('id, username, email')
      .single();

    if (insertError) {
      console.error('[Register] Database insert error:', insertError);
      console.error('[Register] Error code:', insertError.code);
      console.error('[Register] Error message:', insertError.message);
      console.error('[Register] Error details:', insertError.details);
      res.status(500).json({ 
        error: 'Failed to create user account',
        details: process.env.NODE_ENV === 'development' ? insertError.message : undefined
      });
      return;
    }

    if (!newUser) {
      console.error('[Register] User creation returned no data');
      res.status(500).json({ error: 'Failed to create user account' });
      return;
    }

    console.log('[Register] User created successfully:', newUser.id);

    // Generate token
    const token = generateToken({
      userId: newUser.id,
      email: newUser.email,
      username: newUser.username,
    });

    // Create notification preferences
    await supabaseAdmin!
      .from('user_notification_preferences')
      .insert({
        user_id: newUser.id,
        notifications_enabled: true,
      });

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error: any) {
    console.error('[Register] ❌ Unexpected registration error:', error);
    console.error('[Register] Error stack:', error?.stack);
    console.error('[Register] Error message:', error?.message);
    console.error('[Register] Error name:', error?.name);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    });
  }
};

/**
 * Login user
 * POST /api/v1/users/login
 */
export const login = async (req: Request<{}, AuthenticationResponse | ErrorResponse, UserLoginRequest>, res: Response) => {
  try {
    const { email, password } = req.body;

    console.log('[LOGIN] Attempting login for email:', email ? email.substring(0, 5) + '***' : 'MISSING');

    if (!email || !password) {
      console.log('[LOGIN] Missing email or password');
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Check if supabaseAdmin is initialized
    if (!supabaseAdmin) {
      console.error('[LOGIN] Supabase admin client not initialized');
      res.status(500).json({ error: 'Database connection error. Please try again later.' });
      return;
    }

    // Find user by email
    console.log('[LOGIN] Querying database for user with email:', email);
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, username, email, password_hash')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (userError) {
      console.error('[LOGIN] Database error:', userError);
      // Don't reveal if user exists or not for security
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!user) {
      console.log('[LOGIN] User not found for email:', email);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    console.log('[LOGIN] User found:', { id: user.id, username: user.username, hasPasswordHash: !!user.password_hash });

    // Verify password
    if (!user.password_hash) {
      console.error('[LOGIN] User has no password hash');
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    console.log('[LOGIN] Comparing password...');
    const isValidPassword = await comparePassword(password, user.password_hash);
    
    if (!isValidPassword) {
      console.log('[LOGIN] Password comparison failed');
      
      // Send email notification to the user about failed login attempt
      sendLoginAttemptEmail(
        user.email,
        user.username,
        email.toLowerCase().trim()
      ).catch(err => console.error('[Login] Error sending email notification:', err));
      
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    console.log('[LOGIN] Password valid, generating token...');

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    console.log('[LOGIN] Login successful for user:', user.username);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('[LOGIN] Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get current user profile
 * GET /api/v1/users/me
 */
export const getCurrentUser = async (req: Request, res: Response<UserProfileResponse | ErrorResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!supabaseAdmin) {
      res.status(500).json({ error: 'Database configuration error' });
      return;
    }

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, username, email, profile_picture_url, bio, created_at, updated_at')
      .eq('id', req.user.userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user data', details: error.message });
      return;
    }

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      profile_picture_url: user.profile_picture_url,
      bio: user.bio,
      created_at: user.created_at,
      updated_at: user.updated_at,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Search users by username
 * GET /api/v1/users/search?username=...
 */
export const searchUsers = async (
  req: Request<{}, any, {}, { username?: string }>,
  res: Response
) => {
  try {
    const { username } = req.query;

    if (!username) {
      res.status(400).json({ error: 'Username query parameter is required' });
      return;
    }

    const { data: users, error } = await supabaseAdmin!
      .from('users')
      .select('id, username, email, profile_picture_url, bio, created_at, updated_at')
      .ilike('username', `%${username}%`)
      .limit(10);

    if (error) {
      res.status(500).json({ error: 'Failed to search users' });
      return;
    }

    res.json({ users: users || [] });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Change user password
 * PUT /api/v1/users/me/password
 */
export const changePassword = async (
  req: Request<{}, { success: boolean } | ErrorResponse, { currentPassword: string; newPassword: string }>,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters' });
      return;
    }

    // Get current user with password hash
    const { data: user, error: userError } = await supabaseAdmin!
      .from('users')
      .select('password_hash')
      .eq('id', req.user.userId)
      .single();

    if (userError || !user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    const { error: updateError } = await supabaseAdmin!
      .from('users')
      .update({ password_hash: newPasswordHash })
      .eq('id', req.user.userId);

    if (updateError) {
      console.error('Error updating password:', updateError);
      res.status(500).json({ error: 'Failed to change password' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete user account
 * DELETE /api/v1/users/me
 */
export const deleteAccount = async (
  req: Request,
  res: Response<{ success: boolean } | ErrorResponse>
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Delete user (CASCADE will handle related data)
    const { error } = await supabaseAdmin!
      .from('users')
      .delete()
      .eq('id', req.user.userId);

    if (error) {
      console.error('Error deleting account:', error);
      res.status(500).json({ error: 'Failed to delete account' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get user's global notification preferences
 * GET /api/v1/users/me/notification-preference
 */
export const getGlobalNotificationPreference = async (
  req: Request,
  res: Response<{ notificationsEnabled: boolean } | ErrorResponse>
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { data, error } = await supabaseAdmin!
      .from('user_notification_preferences')
      .select('notifications_enabled')
      .eq('user_id', req.user.userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching notification preference:', error);
      res.status(500).json({ error: 'Failed to fetch notification preference' });
      return;
    }

    // Default to true if no preference exists
    res.json({
      notificationsEnabled: data?.notifications_enabled ?? true,
    });
  } catch (error) {
    console.error('Get global notification preference error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update user's global notification preferences
 * PUT /api/v1/users/me/notification-preference
 */
export const updateGlobalNotificationPreference = async (
  req: Request<{}, { notificationsEnabled: boolean } | ErrorResponse, { enabled: boolean }>,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { enabled } = req.body;

    const { data, error } = await supabaseAdmin!
      .from('user_notification_preferences')
      .upsert({
        user_id: req.user.userId,
        notifications_enabled: enabled,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })
      .select('notifications_enabled')
      .single();

    if (error) {
      console.error('Error updating notification preference:', error);
      res.status(500).json({ error: 'Failed to update notification preference' });
      return;
    }

    res.json({
      notificationsEnabled: data.notifications_enabled,
    });
  } catch (error) {
    console.error('Update global notification preference error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get user profile by ID
 * GET /api/v1/users/:userId
 */
export const getUserById = async (req: Request<{ userId: string }>, res: Response<UserProfileResponse | ErrorResponse>) => {
  try {
    const { userId } = req.params;

    const { data: user, error } = await supabaseAdmin!
      .from('users')
      .select('id, username, email, profile_picture_url, bio, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      profile_picture_url: user.profile_picture_url,
      bio: user.bio,
      created_at: user.created_at,
      updated_at: user.updated_at,
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update user profile
 * PUT /api/v1/users/me
 */
export const updateProfile = async (req: Request, res: Response<UserProfileResponse | ErrorResponse>) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { profile_picture_url, bio } = req.body;

    const updates: any = {};

    if (profile_picture_url !== undefined) {
      // Validate URL if provided
      if (profile_picture_url && profile_picture_url.trim() !== '') {
        try {
          const url = new URL(profile_picture_url.trim());
          // Only allow http and https protocols
          if (url.protocol !== 'http:' && url.protocol !== 'https:') {
            res.status(400).json({ error: 'Profile picture URL must use http:// or https://' });
            return;
          }
          
          // Check for common non-image URLs (search pages, HTML pages)
          const pathname = url.pathname.toLowerCase();
          const hostname = url.hostname.toLowerCase();
          
          // Detect Unsplash Plus premium URLs (may require authentication)
          if (hostname.includes('plus.unsplash.com')) {
            res.status(400).json({ 
              error: 'Unsplash Plus URLs may not work as direct image links. Please use a regular Unsplash image URL (starting with images.unsplash.com).' 
            });
            return;
          }
          
          // Detect Unsplash search pages
          if (hostname.includes('unsplash.com') && pathname.includes('/s/')) {
            res.status(400).json({ 
              error: 'This is a search page, not an image. Please use a direct image URL. Right-click on an image and select "Copy image address".' 
            });
            return;
          }
          
          // Detect other common search/HTML pages
          if ((pathname.includes('/search') || pathname.includes('/s/') || (pathname.includes('/photos/') && !pathname.match(/\.(jpg|jpeg|png|gif|webp)$/i)))) {
            res.status(400).json({ 
              error: 'This appears to be a search or gallery page, not a direct image URL. Please use a direct link to an image file.' 
            });
            return;
          }
          
          updates.profile_picture_url = profile_picture_url.trim();
        } catch (error) {
          res.status(400).json({ error: 'Invalid profile picture URL format' });
          return;
        }
      } else {
        updates.profile_picture_url = null;
      }
    }

    if (bio !== undefined) {
      if (bio && bio.length > 255) {
        res.status(400).json({ error: 'Bio must be 255 characters or less' });
        return;
      }
      // Sanitize bio to prevent XSS
      updates.bio = bio ? sanitizeInput(bio) : null;
    }

    const { data: updatedUser, error } = await supabaseAdmin!
      .from('users')
      .update(updates)
      .eq('id', req.user.userId)
      .select('id, username, email, profile_picture_url, bio, created_at, updated_at')
      .single();

    if (error || !updatedUser) {
      res.status(500).json({ error: 'Failed to update profile' });
      return;
    }

    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      profile_picture_url: updatedUser.profile_picture_url,
      bio: updatedUser.bio,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Request password reset
 * POST /api/v1/users/forgot-password
 */
export const forgotPassword = async (
  req: Request<{}, { message: string } | ErrorResponse, { email: string }>,
  res: Response
) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      res.status(400).json({ error: 'Valid email is required' });
      return;
    }

    // Find user by email (normalized)
    const normalizedEmail = email.toLowerCase().trim();
    const { data: user, error: userError } = await supabaseAdmin!
      .from('users')
      .select('id, email, username')
      .eq('email', normalizedEmail)
      .single();

    // Always return success message to prevent email enumeration
    // But only send email if user exists
    if (!userError && user) {
      // Generate reset token (JWT with 1 hour expiration)
      const resetToken = generateTokenWithExpiration(
        { userId: user.id, type: 'password_reset' },
        '1h'
      );

      // Store reset token in database (or use a password_reset_tokens table)
      // For simplicity, we'll use a JWT that expires in 1 hour
      // In production, you'd want to store this in a separate table with expiration

      // Send email with reset link
      const resetUrl = `${process.env.FRONTEND_URL || 'https://petflix-weld.vercel.app'}/reset-password?token=${resetToken}`;
      
      console.log('[Password Reset] Token generated for user:', user.email);
      console.log('[Password Reset] Reset URL:', resetUrl);
      
      // Send password reset email (PRD requirement)
      // Fire and forget, but ensure the promise is created and started immediately
      console.log('[Password Reset] Initiating email send...');
      
      // Start the email promise immediately
      sendPasswordResetEmail(user.email, user.username, resetUrl)
        .then(() => {
          console.log('[Password Reset] ✅ Email sent successfully');
        })
        .catch((emailError: any) => {
          console.error('[Password Reset] ❌ Failed to send email:', emailError);
          console.error('[Password Reset] Error details:', {
            message: emailError?.message,
            code: emailError?.code,
            response: emailError?.response,
            stack: emailError?.stack,
          });
        });
    }

    // Always return success to prevent email enumeration
    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Reset password with token
 * POST /api/v1/users/reset-password
 */
export const resetPassword = async (
  req: Request<{}, { success: boolean } | ErrorResponse, { token: string; newPassword: string }>,
  res: Response
) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token and new password are required' });
      return;
    }

    if (!validatePassword(newPassword)) {
      res.status(400).json({ error: 'Password must be at least 8 characters with uppercase, lowercase, and number' });
      return;
    }

    // Verify token
    let decoded: any;
    try {
      const jwt = require('jsonwebtoken');
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // Check if token is for password reset
      if (decoded.type !== 'password_reset') {
        res.status(400).json({ error: 'Invalid token type' });
        return;
      }
    } catch (tokenError) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    const { error: updateError } = await supabaseAdmin!
      .from('users')
      .update({ password_hash: newPasswordHash })
      .eq('id', decoded.userId);

    if (updateError) {
      console.error('Error updating password:', updateError);
      res.status(500).json({ error: 'Failed to reset password' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get most popular user this week (by followers gained in last 7 days, or total followers)
 * GET /api/v1/users/most-popular-this-week
 */
export const getMostPopularUserThisWeek = async (req: Request, res: Response) => {
  try {
    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get all users and calculate followers gained in last 7 days
    const { data: allUsers, error: usersError } = await supabaseAdmin!
      .from('users')
      .select(`
        id,
        username,
        email,
        profile_picture_url,
        bio,
        created_at
      `);

    if (usersError || !allUsers) {
      console.error('Error fetching users:', usersError);
      res.status(500).json({ error: 'Failed to load users' });
      return;
    }

    // For each user, count followers gained in last 7 days
    const usersWithFollowers = await Promise.all(
      allUsers.map(async (user) => {
        // Get total followers
        const { count: totalFollowers } = await supabaseAdmin!
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id);

        // Get followers gained in last 7 days
        const { count: newFollowers } = await supabaseAdmin!
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id)
          .gte('created_at', sevenDaysAgo.toISOString());

        return {
          ...user,
          totalFollowers: totalFollowers || 0,
          newFollowers: newFollowers || 0,
        };
      })
    );

    // Sort by new followers first, then by total followers
    usersWithFollowers.sort((a, b) => {
      if (b.newFollowers !== a.newFollowers) {
        return b.newFollowers - a.newFollowers;
      }
      return b.totalFollowers - a.totalFollowers;
    });

    // Get the top user
    const topUser = usersWithFollowers[0];

    if (!topUser) {
      res.status(404).json({ error: 'No users found' });
      return;
    }

    res.json({
      user: {
        id: topUser.id,
        username: topUser.username,
        email: topUser.email,
        profile_picture_url: topUser.profile_picture_url,
        bio: topUser.bio,
        created_at: topUser.created_at,
        totalFollowers: topUser.totalFollowers,
        newFollowers: topUser.newFollowers,
      },
    });
  } catch (error) {
    console.error('Get most popular user this week error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

