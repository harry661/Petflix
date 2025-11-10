import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

// Test Supabase connection
router.get('/test-db', async (req, res) => {
  try {
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
      details: err.message 
    });
  }
});

export default router;

