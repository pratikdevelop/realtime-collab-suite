import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { requireAuth } from '../middleware/auth';

// Extend Express Request interface to include the authenticated user object from your middleware
interface AuthenticatedRequest extends Request {
  user?: any; 
}

const router = Router();

/**
 * 1. Password Signup
 * Creates a user inside Supabase Auth
 */
router.post('/signup', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabaseAdmin.auth.signUp({ email, password });
    if (error) throw error;
    res.status(201).json({ message: 'User registered successfully!', data });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * 2. Password Login
 * Authenticates user and passes back tokens & user data
 */
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    res.status(200).json({
      token: data.session?.access_token,
      user: data.user
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * 3. User Data Sync Endpoint
 * Triggered by frontend after successful Google OAuth login
 * Uses Supabase's elegant 'upsert' functionality to save or update the profile
 */
router.post('/sync', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { supabase_id, email, name, avatar } = req.body;

  try {
    // We target your public database table: 'users' or 'profiles'
    // .upsert() acts exactly like: INSERT ... ON CONFLICT DO UPDATE
    const { data, error } = await supabaseAdmin
      .from('users') 
      .upsert(
        { 
          id: supabase_id, 
          email: email, 
          name: name, 
          avatar_url: avatar 
        }, 
        { onConflict: 'id' } // Target column to monitor duplicates
      );

    if (error) throw error;

    res.status(200).json({ message: 'User profile synced successfully', data });
  } catch (error: any) {
    console.error('Error syncing user profile:', error);
    res.status(500).json({ error: error.message || 'Failed to sync user data' });
  }
});

export default router;