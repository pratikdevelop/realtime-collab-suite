import { Router, Request, Response } from 'express';
import multer from 'multer';
import { supabaseAdmin  as supabase} from '../lib/supabase';
import { requireAuth } from '../middleware/auth';
const router = Router();
const ALLOWED_MIME_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
  'application/zip',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max per file
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('File type not allowed'));
    }
    cb(null, true);
  },
});


// Wrap multer so its errors (file too large, disallowed type) come back as JSON
function uploadSingle(req: Request, res: Response, next: any) {
  upload.single('file')(req, res, (err: any) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}

// POST: Upload file
router.post('/upload', requireAuth, uploadSingle, async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { room_id, sender_name } = req.body;

    const fileExt = req.file.originalname.split('.').pop();
    const filePath = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

    // 1. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('collaboration-files')
      .upload(filePath, req.file.buffer, { contentType: req.file.mimetype });

    if (uploadError) throw uploadError;

    // 2. Get Public URL
    const { data: urlData } = supabase.storage.from('collaboration-files').getPublicUrl(filePath);

    // 3. Save to Database
    const { data: dbData, error: dbError } = await supabase
      .from('collaboration_files')
      .insert([{ 
        room_id, 
        file_name: req.file.originalname, 
        file_url: urlData.publicUrl, 
        sender_name 
      }])
      .select();

    if (dbError) throw dbError;

    res.json(dbData[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Fetch files for a room
router.get('/:roomId', requireAuth, async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('collaboration_files')
    .select('*')
    .eq('room_id', req.params.roomId)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;