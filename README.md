# 🤝 Realtime Collab Suite

> A full-stack collaboration platform combining video conferencing, screen sharing, file sharing, a shared whiteboard, and authenticated team rooms.

## Overview
Realtime Collab Suite uses React on the frontend and Express + TypeScript on the backend, with LiveKit and Supabase providing realtime, authentication, database, and storage infrastructure.

## Core Features
- 🎥 Multi-user video conferencing
- 🖥️ Screen sharing
- 📁 File sharing
- 🎨 Collaborative whiteboard
- 🔐 Email/password and Google OAuth
- 🪪 JWT-protected backend routes
- 💾 Persistent room and whiteboard data
- ⚡ Realtime room updates

## Architecture
```text
React + Vite + Bun
        │
        ├── Supabase Auth
        │
        ▼
Express + TypeScript API
        │
        ├── Auth / profile sync
        ├── Rooms
        ├── LiveKit token service
        ├── Files
        └── Whiteboard
        │
        ├──────────────► Supabase
        │                 ├── Postgres
        │                 ├── Auth
        │                 └── Storage
        │
        └──────────────► LiveKit
                          ├── video
                          ├── audio
                          └── screen sharing
```

Socket.io is also used for realtime whiteboard relay in the current implementation.

## Tech Stack
**Frontend:** React 19, Vite, Bun, Tailwind CSS, React Router, LiveKit, Supabase

**Backend:** Node.js, Express, TypeScript, Socket.io, Supabase, PostgreSQL, LiveKit Server SDK, Multer

## Realtime Design
Video, audio, and screen sharing are handled through LiveKit rather than a custom WebRTC media layer.

The backend is responsible for authentication and authorization, room APIs, short-lived LiveKit room tokens, file handling, whiteboard persistence, and room-scoped operations.

## Security Notes
- Keep service-role keys and other secrets on the backend only.
- Do not commit .env or .env.local files.
- Use environment variables for deployment-specific configuration.
- Never place backend secrets such as service-role keys or LiveKit secrets in frontend bundles.
- Rotate credentials immediately if they were ever exposed in source control.

## Local Setup
### Backend
```bash
cd video-collaboration-backend
npm install
cp .env.example .env
npm run dev
```

### Frontend
```bash
cd video-collaboration-app
bun install
cp .env.local.example .env.local
bun run dev
```

Typical local endpoints:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Engineering Highlights
- Third-party realtime media integration through LiveKit
- JWT-protected Express APIs
- Supabase-backed persistence and storage
- Collaborative whiteboard synchronization
- Environment-based API configuration
- Frontend/backend credential separation

## Project Structure
```text
realtime-collab-suite/
├── video-collaboration-app/
│   └── src/
│       ├── pages/
│       ├── components/
│       └── lib/
└── video-collaboration-backend/
    └── src/
        ├── routes/
        ├── middleware/
        ├── sockets/
        ├── lib/
        └── config/
```