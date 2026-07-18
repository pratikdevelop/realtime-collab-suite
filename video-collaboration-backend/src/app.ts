import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Auth from './routes/auth.routes'
import Room from './routes/room.routes'
import livekitRouter from './routes/livekit'; // Import the new router
import fileRouter from './routes/files';
import WhiteBoard from './routes/Whiteboard'
dotenv.config();

// Add this route
const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
}));
app.use(express.json());
app.use('/api/files', fileRouter);
app.use("/api/auth", Auth);
app.use("/api/rooms", Room);
app.use('/api/livekit', livekitRouter);
app.use("/api/whiteboard", WhiteBoard)


// Basic health-check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

export default app;