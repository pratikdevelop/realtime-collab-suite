// src/routes/livekit.ts (or src/routes/livekit.js)
import { Router, Response } from 'express';
import { AccessToken } from 'livekit-server-sdk';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// POST /api/livekit/token - Securely generates LiveKit JWT
router.post('/token', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { room, username } = req.body;

  if (!room || !username) {
    return res.status(400).json({ error: 'Room name and username are required' });
  }

  try {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL || 'ws://localhost:7880';

    if (!apiKey || !apiSecret) {
      return res.status(500).json({ error: 'LiveKit server credentials are not configured on the server.' });
    }

    // Generate an access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: username,
    });

    // Grant permissions for video calls
    at.addGrant({ 
      roomJoin: true, 
      room: room, 
      canPublish: true, 
      canSubscribe: true 
    });

    // Return the secure token to the client
    const token = await at.toJwt();
    res.json({ 
      token, 
      serverUrl: livekitUrl 
    });
  } catch (error: any) {
    console.error('LiveKit Token Generation Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;