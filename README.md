# Realtime Collab Suite

A video conferencing + collaboration tool built with React (Vite + Bun) on the frontend and Express + Supabase on the backend. Supports multi-user video calls, screen sharing, file sharing, a shared whiteboard, and JWT-based authentication.

Repo: [github.com/pratikdevelop/realtime-collab-suite](https://github.com/pratikdevelop/realtime-collab-suite.git)

## Tech Stack

**Frontend** (`video-collaboration-app/`)
- React 19 + Vite (bundled with Bun)
- [LiveKit](https://livekit.io/) (`livekit-client`, `@livekit/components-react`) for WebRTC video/audio/screen-share
- Supabase JS client for auth (email/password + Google OAuth)
- Tailwind CSS, React Router

**Backend** (`video-collaboration-backend/`)
- Express + TypeScript
- Supabase (Postgres + Auth + Storage) via `@supabase/supabase-js` and `pg`
- `livekit-server-sdk` for minting short-lived room access tokens
- Socket.io (currently used only for whiteboard stroke relay / a legacy raw-WebRTC signaling path — see **Known Issues**)
- Multer for in-memory file upload handling before pushing to Supabase Storage

## Architecture

```
video-collaboration-app (frontend, port 5173)
        │
        ├── Supabase Auth  ──────────► Supabase (Auth, Postgres, Storage)
        │        ▲
        │        │ JWT (access_token)
        │        ▼
        └── Express API (backend, port 5000)
                 │
                 ├── /api/auth       → signup / login / OAuth profile sync
                 ├── /api/rooms      → recent rooms (user-scoped, RLS-protected)
                 ├── /api/livekit    → mints LiveKit room-join tokens
                 ├── /api/files      → upload/list files (Supabase Storage)
                 ├── /api/whiteboard → persist/load/clear whiteboard strokes
                 └── Socket.io       → real-time whiteboard stroke broadcast

LiveKit Cloud/Server ◄── video/audio/screen-share media, plus low-latency
                          data-channel messages (whiteboard strokes, file
                          share notifications) between participants
```

Video, audio, and screen sharing all run through **LiveKit** (a dedicated WebRTC SFU), not through a hand-rolled peer-to-peer signaling layer. The whiteboard and file-share events piggyback on LiveKit's data channel for instant delivery, and are also persisted to Supabase so they survive reloads and are visible to users who join later.

## Features

- **Multi-user video calls** — LiveKit `VideoConference` component, auto-managed grid layout
- **Screen sharing** — built into LiveKit's `VideoConference` toolbar
- **File sharing** — upload to Supabase Storage, metadata stored in Postgres, live-broadcast to the room via LiveKit data messages
- **Whiteboard** — canvas-based drawing, strokes broadcast live and persisted to Postgres so history reloads on join
- **Authentication** — Supabase Auth (email/password + Google OAuth), backend validates the Supabase JWT on protected routes
- **Data encryption** — WebRTC media is encrypted in transit via DTLS-SRTP (handled by LiveKit); the app itself talks to Supabase and the backend over HTTPS/WSS in production

## Getting Started

### Clone

```bash
git clone https://github.com/pratikdevelop/realtime-collab-suite.git
cd realtime-collab-suite
```

### Prerequisites
- [Bun](https://bun.sh/) (frontend) and Node.js 18+ (backend)
- A [Supabase](https://supabase.com/) project
- A [LiveKit](https://livekit.io/) project (Cloud or self-hosted)

### Backend setup

```bash
cd video-collaboration-backend
npm install
cp .env.example .env   # fill in your own values, see below
npm run dev
```

Required backend environment variables (`.env`):

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
PORT=5000
CLIENT_URL=http://localhost:5173
```

### Frontend setup

```bash
cd video-collaboration-app
bun install
cp .env.local.example .env.local   # fill in your own values, see below
bun run dev
```

Required frontend environment variables (`.env.local`):

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_API_BASE_URL=http://localhost:5000/api
```

> The frontend only needs the Supabase **URL** and **publishable/anon key**. It must never hold `LIVEKIT_API_SECRET` or the Supabase **service role** key — those belong only in the backend `.env`.

## ⚠️ Before you push this to a repo

Your uploaded project has **live secrets committed to disk in plaintext** (`.env` in the backend, `.env.local` in the frontend), including:
- Supabase service role key (full admin access to your database, bypasses Row-Level Security)
- Your Postgres database password, in `DATABASE_URL`
- LiveKit API key/secret

**Do this before pushing:**
1. Rotate every one of these keys/passwords right now, in Supabase and LiveKit dashboards — treat the ones in your zip as burned.
2. Add a root-level `.gitignore` (see below) and a `.env.example` / `.env.local.example` with empty placeholders, so collaborators know what to fill in without secrets ever touching git history.
3. If this was already pushed anywhere (even a private repo), rotating keys is mandatory — removing the file from a later commit does not remove it from git history.

## Fixes Applied

All issues found in the initial review have been fixed in this codebase:

### Security
1. ✅ Added root-level `.gitignore` (see below) — backend previously had none.
2. ✅ Removed the hardcoded Supabase anon-key fallback in `room.routes.ts`; it now throws a clear error at startup if `SUPABASE_URL`/`SUPABASE_ANON_KEY` are missing instead of silently using a stale key.
3. ✅ Removed `livekit-server-sdk` from the frontend's `package.json` — it's a server-only package and doesn't belong on the client.
4. ✅ Added `requireAuth` to previously-open routes: `GET /api/files/:roomId`, `POST /api/files/upload`, `GET /api/whiteboard/:roomId`, `POST /api/whiteboard/stroke`, `POST /api/whiteboard/clear`.
5. ✅ Added Multer `fileFilter` (allow-list of MIME types) and a 20MB `fileSize` limit to file uploads, plus a wrapper so Multer's own errors return clean JSON instead of an HTML error page.

### Bugs
6. ✅ Renamed `Signup.jsx` → `SignUp.jsx` to match the import in `App.jsx` (was breaking builds on case-sensitive filesystems, i.e. Linux/most CI).
7. ✅ `handleLogout` in `Dashboard.jsx` now calls `supabase.auth.signOut()` and clears both `authToken` and `user` from `localStorage`.
8. ✅ `AuthCallback.jsx` now calls `POST /api/auth/sync` after a successful Google OAuth login, so OAuth users get upserted into the `users` table (previously only existed in Supabase's internal `auth.users`). Also removed the commented-out dead error-handling code and wired up real error handling.
9. ✅ Replaced hardcoded `http://localhost:5000/api` in `RoomContainer.jsx`, `SignUp.jsx`, and `Login.jsx` with `import.meta.env.VITE_API_BASE_URL`, matching the pattern already used correctly elsewhere.
10. ✅ Google OAuth redirect URL in `Login.jsx` now uses `${window.location.origin}/auth/callback` instead of a hardcoded `localhost:5173` URL, so it works after deployment. **Remember to add your deployed URL's `/auth/callback` to Supabase's allowed redirect URLs** (Authentication → URL Configuration) once you deploy.

### Dead / redundant code
11. ✅ Removed the unused raw-WebRTC signaling handlers (`webrtc-offer`/`webrtc-answer`/`ice-candidate`) from `roomHandler.ts` — the frontend never uses `socket.io-client` for signaling, only LiveKit. Left `join-room`/`draw-stroke`/`disconnect` in place with a comment explaining they're currently unused too, in case you want to build on them later.
12. ✅ Deleted the empty, unrouted `src/pages/Home.tsx`.
13. ✅ Removed the large block of commented-out duplicate `drawOnCanvas`/`clearCanvas` code in `Room.jsx`.

### Still worth doing yourself
- **Rotate every credential that was in your original `.env` files** (Supabase service role key, DB password, LiveKit secret) — they were sitting in plaintext in the zip you shared, and any key that's been exposed should be treated as compromised regardless of what you do with it going forward.
- Consider adding `zod` (or similar) request-body validation on the POST routes.
- Add rate-limiting to `/api/auth/login` and `/api/auth/signup`.
- Document, in your assignment write-up, that encryption is handled via LiveKit's DTLS-SRTP for media and HTTPS/WSS for signaling/API traffic, rather than app-level encryption.

## Suggested root `.gitignore`

```
node_modules/
dist/
dist-ssr/
.env
.env.local
.env.*.local
*.log
.DS_Store
```

## Project Structure

```
realtime-collab-suite/
├── video-collaboration-app/      # React frontend (Bun + Vite)
│   └── src/
│       ├── pages/                # Login, SignUp, Dashboard, Room, LandingPage
│       ├── components/           # AuthCallback, RoomContainer
│       └── lib/                  # Supabase client
└── video-collaboration-backend/  # Express + TypeScript backend
    └── src/
        ├── routes/                # auth, rooms, livekit, files, whiteboard
        ├── middleware/            # requireAuth (Supabase JWT validation)
        ├── sockets/               # Socket.io handlers (whiteboard relay)
        ├── lib/                   # Supabase admin client
        └── config/                # DB schema bootstrap
```