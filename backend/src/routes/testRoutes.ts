import { Router } from 'express';

const router = Router();

// Debug endpoint to check environment variables (doesn't import supabase config)
router.get('/debug-env', (req, res) => {
  res.json({
    environment: process.env.NODE_ENV,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
    hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasCorsOrigin: !!process.env.CORS_ORIGIN,
    hasYoutubeApiKey: !!process.env.YOUTUBE_API_KEY,
    // Show first few chars to verify they're set (but not full values for security)
    supabaseUrlPrefix: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 20) + '...' : 'NOT SET',
    supabaseAnonKeyPrefix: process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'NOT SET',
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE') || key.includes('JWT') || key.includes('CORS') || key.includes('YOUTUBE')),
  });
});

// Test Supabase connection
router.get('/test-db', async (req, res) => {
  try {
    // Import at runtime to avoid module load errors
    const { supabaseAdmin } = await import('../config/supabase.js');
    
    if (!supabaseAdmin) {
      return res.status(500).json({ 
        error: 'Supabase admin client not initialized',
        env: {
          hasUrl: !!process.env.SUPABASE_URL,
          hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        }
      });
    }

    // Test query
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      return res.status(500).json({ 
        error: 'Database query failed',
        details: error.message,
        code: error.code,
        hint: error.hint,
      });
    }

    res.json({ 
      success: true,
      message: 'Database connection successful',
      data: data
    });
  } catch (err: any) {
    res.status(500).json({ 
      error: 'Database test failed',
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
});

// Test email endpoint - sends a test security alert email
router.post('/test-email', async (req, res) => {
  try {
    const { email, type = 'signup' } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Import email service
    const { sendSignupAttemptEmail, sendLoginAttemptEmail } = await import('../services/emailService.js');
    
    if (type === 'signup') {
      await sendSignupAttemptEmail(
        email,
        'TestUser',
        email,
        'TestAttacker'
      );
      res.json({ 
        success: true, 
        message: 'Signup attempt email sent successfully',
        email: email
      });
    } else if (type === 'login') {
      await sendLoginAttemptEmail(
        email,
        'TestUser',
        email
      );
      res.json({ 
        success: true, 
        message: 'Login attempt email sent successfully',
        email: email
      });
    } else {
      res.status(400).json({ error: 'Invalid type. Use "signup" or "login"' });
    }
  } catch (err: any) {
    console.error('Test email error:', err);
    res.status(500).json({ 
      error: 'Failed to send test email',
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
});

export default router;

