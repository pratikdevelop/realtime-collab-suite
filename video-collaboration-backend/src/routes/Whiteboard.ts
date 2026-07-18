import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase'; // Using your admin client
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET: Fetch all strokes for a room
router.get('/:roomId', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('whiteboard_strokes')
    .select('*')
    .eq('room_id', req.params.roomId)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST: Save a single stroke
router.post('/stroke', requireAuth, async (req, res) => {
  const { room_id, x0, y0, x1, y1, color } = req.body;
  const { data, error } = await supabaseAdmin
    .from('whiteboard_strokes')
    .insert([{ room_id, x0, y0, x1, y1, color }]);
    
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// POST: Clear board (Delete all strokes)
router.post('/clear', requireAuth, async (req, res) => {
  const { room_id } = req.body;
  await supabaseAdmin.from('whiteboard_strokes').delete().eq('room_id', room_id);
  res.status(200).json({ success: true });
});

export default router;