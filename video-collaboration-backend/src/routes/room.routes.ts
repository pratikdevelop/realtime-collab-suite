import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Retrieve environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables');
}

/**
 * Helper to dynamically create a user-scoped Supabase client.
 * This forwards the user's JWT to PostgreSQL, satisfying RLS checks like auth.uid() = user_id.
 */
const getUserSupabaseClient = (req: AuthenticatedRequest) => {
  const authHeader = req.headers.authorization;
  const jwt = authHeader && authHeader.split(' ')[1]; // Extract "Bearer <TOKEN>"

  if (!jwt) {
    throw new Error('Authorization token is missing in request headers');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    },
    auth: {
      persistSession: false,
    }
  });
};

// GET /api/rooms/recent - Fetch user's recent rooms
router.get('/recent', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.id;
    
    // Create a client scoped to the authenticated user
    const userSupabase = getUserSupabaseClient(req);

    const { data, error } = await userSupabase
      .from('recent_rooms')
      .select('room_name, last_accessed_at')
      .eq('user_id', userId)
      .order('last_accessed_at', { ascending: false })
      .limit(5);

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching recent rooms:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/rooms/recent - Add or Update active room (with upsert)
router.post('/recent', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { room_name } = req.body;
  try {
    const userId = req.user.id;
    
    // Create a client scoped to the authenticated user
    const userSupabase = getUserSupabaseClient(req);

    const { data, error } = await userSupabase
      .from('recent_rooms')
      .upsert(
        { 
          user_id: userId, 
          room_name: room_name, 
          last_accessed_at: new Date().toISOString() 
        },
        { 
          onConflict: 'user_id,room_name'
        }
      )
      .select();

    if (error) throw error;
    
    res.json({ message: 'Room updated successfully', data });
  } catch (error: any) {
    console.error('Error upserting recent room:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;