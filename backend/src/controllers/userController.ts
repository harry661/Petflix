import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import {
  UserRegistrationRequest,
  UserLoginRequest,
  AuthenticationResponse,
  UserProfileResponse,
  ErrorResponse,
} from '../types';
import { validateEmail, validatePassword, validateUsername, sanitizeInput } from '../middleware/validation';

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

    const { data: existingUsersByEmail, error: emailError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
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
      res.status(409).json({ error: 'Username or email already exists' });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const { data: newUser, error: insertError } = await supabaseAdmin!
      .from('users')
      .insert({
        username,
        email,
        password_hash: passwordHash,
      })
      .select('id, username, email')
      .single();

    if (insertError || !newUser) {
      console.error('Error creating user:', insertError);
      res.status(500).json({ error: 'Failed to create user account' });
      return;
    }

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
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Login user
 * POST /api/v1/users/login
 */
export const login = async (req: Request<{}, AuthenticationResponse | ErrorResponse, UserLoginRequest>, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user by email
    const { data: user, error: userError } = await supabaseAdmin!
      .from('users')
      .select('id, username, email, password_hash')
      .eq('email', email)
      .single();

    if (userError || !user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
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

    if (!validatePassword(newPassword)) {
      res.status(400).json({ error: 'New password must be at least 8 characters with uppercase, lowercase, and number' });
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
      updates.profile_picture_url = profile_picture_url || null;
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

