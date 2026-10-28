# 🎥 Real-Time Video Conferencing Application

A full-stack, real-time, multi-party video conferencing application built with **React 19**, **Node.js / Express 5**, **WebRTC**, **Socket.IO / AWS API Gateway WebSockets** and **MongoDB (Atlas)**.

Users can register and log in, create or join a meeting with a meeting code, talk over peer-to-peer video/audio, share their screen, chat in real time, and review a history of the meetings they joined — all in a dark, glassmorphism-styled, responsive UI.

The backend runs in **two interchangeable modes** from the same codebase:

| Mode | Where it runs | Real-time transport | State kept in |
|---|---|---|---|
| **Standalone** | Local machine, Render, any VM/container | Socket.IO server (`socketManager.js`) | Server memory |
| **Serverless** | AWS Lambda + API Gateway (HTTP API **and** WebSocket API) | Native WebSocket via API Gateway (`wsHandler.js`) | MongoDB (`WsConnection`, `WsMessage`) |

The frontend auto-selects the right transport at runtime (`ws://` / `wss://` URL → API Gateway WebSocket adapter, `http(s)://` URL → Socket.IO client).

> **Frontend** is deployed on **Vercel**, **REST + signaling backend** on **AWS Lambda** (or locally / Render), **database** on **MongoDB Atlas** — designed to run on free tiers.

---

## 📑 Table of Contents

1. [Features](#-features)
2. [Tech Stack](#-tech-stack)
3. [Architecture Overview](#-architecture-overview)
4. [Project Structure](#-project-structure)
5. [Application Flow](#-application-flow)
6. [WebRTC Signaling Flow](#-webrtc-signaling-flow)
7. [Backend Deep Dive](#-backend-deep-dive)
8. [Frontend Deep Dive](#-frontend-deep-dive)
9. [Database Schema](#-database-schema)
10. [REST API Reference](#-rest-api-reference)
11. [Real-Time Protocol Reference](#-real-time-protocol-reference)
12. [Authentication & Security](#-authentication--security)
13. [Environment Configuration](#-environment-configuration)
14. [How to Run Locally](#-how-to-run-locally)
15. [Deployment](#-deployment)
16. [NPM Scripts Reference](#-npm-scripts-reference)
17. [Known Limitations & Improvement Roadmap](#-known-limitations--improvement-roadmap)
18. [Troubleshooting](#-troubleshooting)
19. [Interview Preparation Guide](#-interview-preparation-guide)
20. [Repository Housekeeping Notes](#-repository-housekeeping-notes)
21. [License](#-license)

---

## ✨ Features

| Category | Feature |
|---|---|
| **Authentication** | Register / login with bcrypt-hashed passwords (10 salt rounds) and random-token sessions stored in MongoDB. Registration logs the user in immediately. |
| **Protected routes** | `withAuth` HOC redirects unauthenticated users from `/home` to `/auth`. |
| **Video & audio calls** | Peer-to-peer media via WebRTC (`RTCPeerConnection`) with Google's public STUN server. |
| **Multi-party calls** | **Mesh topology** — every participant connects directly to every other participant. |
| **Lobby with camera preview** | Enter a display name and see your own camera before connecting. |
| **Mic / camera toggles** | Instantly mute/unmute audio or turn video on/off (toggles `track.enabled`, no renegotiation needed). |
| **Screen sharing** | `getDisplayMedia` replaces the outgoing stream and renegotiates with every peer; automatically falls back to the camera when sharing ends. |
| **Real-time chat** | In-call chat broadcast to everyone in the room; late joiners receive previous messages. |
| **Unread badge** | Chat icon shows the number of unread messages while the chat panel is closed (capped at `99+`). |
| **Black + silent fallback** | If no camera/mic is available (or permission is denied) the app sends a black canvas track + a silent audio track so the call can still be joined. |
| **Meeting history** | Every meeting joined from the Home page is logged per user in MongoDB and listed on `/history`. |
| **Guest-style joining** | The `/:url` route works without logging in (landing page has a "Join as Guest" link). |
| **Dual deployment** | Same backend runs as a classic Express + Socket.IO server **or** as AWS Lambda functions with API Gateway WebSockets. |
| **Auto-cleanup** | WebSocket mode uses MongoDB **TTL indexes** (2 hours) to purge stale connections and chat messages, and deletes a room's chat when the last person leaves. |
| **Responsive UI** | Media-query breakpoints for desktop, tablet and mobile; dark glassmorphism theme with gradient accents and entrance animations. |
| **Performance monitoring** | Vercel Speed Insights component included in the app shell. |

---

## 🛠 Tech Stack

### Frontend (`frontend/`)

| Technology | Version (package.json) | Purpose |
|---|---|---|
| **React** | ^19.2.0 | Component-based UI |
| **Vite** | ^7.2.4 | Dev server (HMR) and production bundler (Rollup) |
| **@vitejs/plugin-react** | ^5.1.1 | React Fast Refresh / JSX transform |
| **React Router DOM** | ^7.11.0 | Client-side routing (`BrowserRouter`) |
| **Material UI (MUI)** | ^7.3.6 (+ `@mui/icons-material`) | Buttons, TextField, Badge, IconButton, Snackbar, Card, theming |
| **Emotion** | ^11.14 | CSS-in-JS engine used by MUI |
| **Axios** | ^1.13.2 | REST client (`axios.create({ baseURL })`) |
| **socket.io-client** | ^4.8.3 | Socket.IO transport (standalone mode) |
| **Native `WebSocket`** | Browser API | Transport used for AWS API Gateway (wrapped by `socketAdapter.js`) |
| **WebRTC** | Browser API | `RTCPeerConnection`, `getUserMedia`, `getDisplayMedia`, `MediaStream` |
| **http-status** | ^2.1.0 | Readable HTTP status constants (`CREATED`, `OK`) |
| **@vercel/speed-insights** | ^1.3.1 | Web-vitals reporting |
| **CSS Modules + plain CSS** | — | `videoComponent.module.css` for the meeting room, `App.css` for all other pages |
| **ESLint 9** | ^9.39.1 | Linting with `react-hooks` and `react-refresh` plugins |

### Backend (`backend/`)

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** (ES Modules, `"type": "module"`) | 20.x on Lambda; Node 20.19+ / 22.12+ recommended locally (Vite 7 requirement) | Runtime |
| **Express** | ^5.2.1 | REST API and middleware |
| **Socket.IO** | ^4.8.1 | Signaling + chat (standalone mode) |
| **Mongoose** | ^8.20.1 | MongoDB ODM |
| **MongoDB Atlas** | M0 free tier | Persistent storage (users, history, WebSocket connections, chat) |
| **bcrypt** | ^6.0.0 | Password hashing |
| **Node `crypto`** (built-in) | — | `crypto.randomBytes(20)` session tokens |
| **dotenv** | ^17.2.3 | Environment variable loading |
| **cors** | ^2.8.5 | CORS middleware |
| **http-status** | ^2.1.0 | HTTP status constants |
| **serverless-http** | ^4.0.0 | Wraps the Express app as an AWS Lambda handler |
| **@aws-sdk/client-apigatewaymanagementapi** | ^3.1158.0 | `PostToConnectionCommand` — server-to-client push over API Gateway WebSockets |
| **nodemon** | ^3.1.11 | Auto-restart in development |

### Cloud / DevOps

| Component | Platform | Notes |
|---|---|---|
| Frontend hosting | **Vercel** | `frontend/vercel.json` rewrites every path to `/index.html` (SPA fallback) |
| REST API | **AWS Lambda + API Gateway HTTP API** | Handler: `src/lambda/apiHandler.js` |
| Signaling & chat | **AWS Lambda + API Gateway WebSocket API** | Handler: `src/lambda/wsHandler.js` |
| Infrastructure as Code | **Serverless Framework** (`serverless.yml`) **or** **AWS SAM** (`template.yaml`) | Runtime `nodejs20.x`, 512 MB, 29 s timeout |
| Database | **MongoDB Atlas** | Standard `mongodb+srv://` connection string |
| STUN | `stun:stun.l.google.com:19302` | Public STUN; **no TURN server is configured** |

### Application Interface

<p align="center">
  <img width="924" height="519" alt="Application Interface" src="https://github.com/user-attachments/assets/dbf133f2-8ac6-46d4-88bb-c901e54c6763" />
</p>

---

## 🏗 Architecture Overview

### Big picture

```
                        ┌──────────────────────────────────────────────┐
                        │              BROWSER (React + Vite)           │
                        │                                              │
                        │  Landing ─► Auth ─► Home ─► Meeting Room     │
                        │                                │             │
                        │        ┌───────────────────────┼──────────┐  │
                        │        │ RTCPeerConnection(s)  │ socket   │  │
                        │        │ (direct P2P media)    │ Adapter  │  │
                        │        └──────────┬────────────┴────┬─────┘  │
                        └───────────────────│─────────────────│────────┘
              P2P media (SRTP/UDP)          │                 │ signaling + chat
        ┌───────────────────────────────────┘                 │ (picked by URL scheme)
        ▼                                                     │
  Other participants'                       ┌─────────────────┴──────────────────┐
  browsers (full mesh)                      │ http(s):// → Socket.IO client      │
                                            │ ws(s)://   → API-Gateway WS client │
                                            └───────┬─────────────────┬──────────┘
                                                    │                 │
                          MODE A: STANDALONE        │                 │   MODE B: SERVERLESS (AWS)
              ┌─────────────────────────────────────▼───┐   ┌─────────▼───────────────────────────────┐
              │ Node + Express 5 (src/app.js)           │   │ API Gateway WebSocket API               │
              │  • REST  /api/v1/users/*                │   │   routes: $connect, $disconnect,        │
              │  • Socket.IO server (socketManager.js)  │   │   $default, join-call, signal,          │
              │  • rooms kept IN MEMORY                 │   │   chat-message                          │
              │  • serves frontend/dist if present      │   │        │                                │
              └───────────────┬─────────────────────────┘   │        ▼                                │
                              │                             │ Lambda: wsHandler.js (stateless)        │
                              │                             │   push to peers via PostToConnection    │
                              │                             │                                         │
                              │                             │ API Gateway HTTP API ─► Lambda:         │
                              │                             │   apiHandler.js (serverless-http+Express)│
                              │                             └───────────────┬─────────────────────────┘
                              ▼                                             ▼
                     ┌───────────────────────────────────────────────────────────┐
                     │                   MongoDB Atlas                           │
                     │ users · meetings · wsconnections (TTL 2h) · wsmessages (TTL 2h) │
                     └───────────────────────────────────────────────────────────┘

        STUN: stun.l.google.com:19302 (public-IP discovery for NAT traversal; no TURN relay)
```

### Key architectural decisions

- **Mesh topology for media.** Each participant opens one `RTCPeerConnection` per remote participant. Simple, no media server cost, works well for ~2–6 people.
- **The server never touches media.** It only relays signaling messages (SDP offers/answers, ICE candidates) and chat.
- **Transport abstraction (`socketAdapter.js`).** The meeting component talks to an object exposing `on / off / emit / disconnect / id`. For Socket.IO that is the real socket; for API Gateway it is `ApiGatewayWebSocketAdapter`, which translates `emit("join-call", …)` into JSON `{action: "join-call", …}` frames and incoming `{type: …}` frames back into `emitLocal(...)` callbacks. The UI code is identical in both modes.
- **Stateless Lambda ⇒ state lives in MongoDB.** Lambda cannot keep an in-memory room map between invocations, so every WebSocket connection is stored in `wsconnections` and every chat message in `wsmessages`.
- **Connection reuse for Lambda.** `connectDB()` caches the Mongoose connection across warm invocations; `callbackWaitsForEmptyEventLoop = false` lets the handler return without waiting for the open DB socket.
- **Opaque-token auth, not JWT.** A random 40-hex-char token is stored on the user document and looked up on each request.
- **Monorepo.** `frontend/` and `backend/` live in one repo; the backend can optionally serve `frontend/dist` (monolithic hosting).

---

## 📁 Project Structure

```
Video-Call/
├── .env                          # Local secrets (gitignored) — read by backend/src/app.js and config/db.js
├── .env.example                  # Template: DB_USER / DB_PASSWORD / DB_CLUSTER / DB_NAME or MONGO_URI, PORT
├── .gitignore                    # Ignores node_modules, dist, .serverless, .env*, interview_questions_part*.md
├── README.md                     # This file
├── swark-output/                 # Auto-generated architecture diagram + log (Swark VS Code extension, Mar 2026 — pre-dates the Lambda work)
│
├── backend/
│   ├── package.json              # Dependencies + scripts (dev, start, prod, deploy:serverless, deploy:sam)
│   ├── package-lock.json
│   ├── serverless.yml            # Serverless Framework config (HTTP API + WebSocket API + IAM)
│   ├── template.yaml             # AWS SAM template (alternative to serverless.yml)
│   ├── .env                      # Optional backend-local env file (gitignored)
│   ├── .serverless/              # Build output of `serverless deploy` (gitignored)
│   └── src/
│       ├── app.js                # Express app; starts HTTP + Socket.IO server ONLY when not on Lambda; exports `app`
│       ├── config/
│       │   └── db.js             # connectDB(): builds Atlas URI, caches the connection
│       ├── controllers/
│       │   ├── user.controller.js    # register, login, addToHistory, getuserHistory
│       │   └── socketManager.js      # Socket.IO signaling/chat with in-memory rooms (standalone mode)
│       ├── lambda/
│       │   ├── apiHandler.js         # Lambda entry for REST: serverless-http(app) + CORS + DB connect
│       │   └── wsHandler.js          # Lambda entry for WebSocket routes (connect/join/signal/chat/disconnect)
│       ├── models/
│       │   ├── user.model.js         # User   { name, username, password, token }
│       │   ├── meeting.model.js      # Meeting{ user_id, meetingCode, date }
│       │   ├── wsConnection.model.js # WsConnection { connectionId, meetingPath, username, createdAt(TTL 2h) }
│       │   └── wsMessage.model.js    # WsMessage { meetingPath, sender, data, socketIdSender, createdAt(TTL 2h) }
│       └── routes/
│           └── users.routes.js       # /login, /register, /add_to_activity, /get_all_activity
│
└── frontend/
    ├── package.json              # Dependencies + scripts (dev, build, lint, preview)
    ├── vite.config.js            # Vite + @vitejs/plugin-react
    ├── vercel.json               # SPA rewrite: /(.*) → /index.html
    ├── eslint.config.js          # ESLint flat config (react-hooks, react-refresh)
    ├── index.html                # HTML shell (title "Video Conferencing App", favicon main_logo.svg)
    ├── .env.example              # VITE_BACKEND_URL, VITE_WS_URL
    ├── README.md                 # Default Vite template README (not project-specific)
    ├── public/                   # background.jpg, group.png (landing hero), vite.svg
    ├── dist/                     # Production build (gitignored)
    └── src/
        ├── main.jsx              # createRoot(...).render(<StrictMode><App/></StrictMode>)
        ├── App.jsx               # SpeedInsights + AppTheme + Router + AuthProvider + Routes
        ├── App.css               # Styles for landing, auth, home, history, lobby (+ keyframes, media queries)
        ├── index.css             # Global reset (margin/padding 0, border-box)
        ├── environment.js        # Resolves REST base URL (`server`) and signaling URL (`ws_server`) from Vite env vars
        ├── contexts/
        │   └── AuthContext.jsx   # AuthProvider: handleRegister, handleLogin, addToUserHistory, getHistoryOfuser
        ├── utils/
        │   ├── withAuth.jsx      # HOC route guard (checks localStorage token)
        │   └── socketAdapter.js  # connectSocket(): Socket.IO client OR ApiGatewayWebSocketAdapter
        ├── shared-theme/
        │   ├── AppTheme.jsx      # MUI ThemeProvider (primary #1976d2, secondary #dc004e, light mode)
        │   └── ColorModeSelect.jsx # Placeholder icon button (not wired to anything yet)
        ├── pages/
        │   ├── landing.jsx       # Public landing page
        │   ├── authentication.jsx# Login / Register card
        │   ├── home.jsx          # Join-by-code dashboard (protected), History + Logout buttons
        │   ├── history.jsx       # Meeting history grid
        │   └── VideoMeet.jsx     # Lobby + meeting room: WebRTC, signaling, chat, controls
        ├── styles/
        │   └── videoComponent.module.css  # Scoped CSS for the meeting room
        └── assets/               # logo.png, main_logo.svg, react.svg
```

---

## 🔄 Application Flow

### Routes (`App.jsx`)

| Path | Component | Guard | Description |
|---|---|---|---|
| `/` | `LandingPage` | none | Hero page: **Join as Guest** (→ `/guestLink`), **Register**, **Sign In**, **Get Started** |
| `/auth` | `AuthenticationPage` | none | Toggle between Sign In (`formState = 0`) and Create Account (`formState = 1`) |
| `/home` | `HomeComponent` | **`withAuth`** (token in `localStorage`) | Enter a meeting code and join; buttons for **History** and **Logout** |
| `/history` | `History` | none in the UI (API needs a valid token) | List of previously joined meetings |
| `/:url` | `VideoMeetComponent` | none | Lobby + meeting room for room name `:url` |
| `*` | `<Navigate to="/" />` | — | Unknown multi-segment paths go back to landing |

> The route table is a plain `<Routes>` — protection of `/home` is applied by wrapping the component with `withAuth` at export time (`export default withAuth(HomeComponent)`), not in `App.jsx`.

### Step-by-step user journey

```
1. Landing  (/)
   └─ "Get Started" / "Sign In" / "Register"  ─►  /auth

2. Authentication  (/auth)
   ├─ Register: POST /api/v1/users/register {name, username, password}
   │     → 201 + {message, token}  → token saved in localStorage → navigate /home
   └─ Login:    POST /api/v1/users/login {username, password}
         → 200 + {message, token}  → token saved in localStorage → navigate /home
   (errors show inline in red: the server's `message`, e.g. "User not found", "Invalid credentials",
    "Username already taken")

3. Home  (/home)  [withAuth]
   └─ Enter any meeting code → "Join"
        ├─ POST /api/v1/users/add_to_activity {token, meeting_code}  (saves history)
        └─ navigate(`/${meetingCode}`)

4. Lobby  (/:url)
   ├─ On mount: getUserMedia({video:true, audio:true}) → local preview, sets availability flags
   └─ Enter display name → "Connect"

5. Meeting room
   ├─ connectSocket(ws_server || server)  → Socket.IO or API-Gateway WebSocket
   ├─ on "connect" → emit "join-call" (room = window.location.href, username)
   ├─ on "user-joined" → create RTCPeerConnection per client, joiner sends offers
   ├─ SDP answers + ICE candidates relayed via "signal"
   ├─ onaddstream → remote <video> tiles appear
   └─ Controls: camera, mic, screen share, chat, end call

6. End call → stop tracks, close peer connections, disconnect socket, reset state → /home

7. History  (/history)
   └─ GET /api/v1/users/get_all_activity?token=… → cards with meeting code + date (dd/mm/yyyy)
```

**Notes that matter in practice**

- The room identifier sent to the server is `window.location.href` (the *full URL*, including origin), not just the meeting code. Two people must open the same origin + path to meet (e.g. both on the same Vercel domain).
- History is only recorded when joining through the **Home** page. Opening `/:url` directly (guest-style) does not write history.
- All guests who click **Join as Guest** go to the same fixed room, `/guestLink`.

---

## 🔗 WebRTC Signaling Flow

WebRTC peers cannot find each other on their own. They need a *signaling channel* to exchange (1) **SDP** descriptions (codecs, media capabilities) and (2) **ICE candidates** (possible network routes). This project uses Socket.IO (or API Gateway WebSocket) for that — never for media.

```
Peer A (joiner)                  Signaling server                  Peer B (already in room)
     │                                  │                                  │
     │── join-call (room, name) ───────►│                                  │
     │                                  │── user-joined(A.id, [B,A]) ─────►│
     │◄─ user-joined(A.id, [B,A]) ──────│                                  │
     │                                  │                                  │
     │ new RTCPeerConnection per id     │      new RTCPeerConnection per id│
     │ addStream(localStream)           │      addStream(localStream)      │
     │                                  │                                  │
     │ (id === myId) → createOffer()    │                                  │
     │ setLocalDescription(offer)       │                                  │
     │── signal(B, {sdp: offer}) ──────►│── signal(A, {sdp: offer}) ──────►│
     │                                  │      setRemoteDescription(offer) │
     │                                  │      createAnswer()              │
     │                                  │      setLocalDescription(answer) │
     │◄─ signal(B, {sdp: answer}) ──────│◄─ signal(A, {sdp: answer}) ──────│
     │ setRemoteDescription(answer)     │                                  │
     │                                  │                                  │
     │◄──── signal {ice: candidate} ────┼──── signal {ice: candidate} ────►│  (both directions, many times)
     │                                  │                                  │
     │◄═══════════ direct P2P media (SRTP over UDP, DTLS-encrypted) ══════►│
```

Only the **joiner** (the peer whose id equals `socketIdRef.current` in the `user-joined` event) creates offers; existing peers answer.

### WebRTC concepts used

| Concept | Where / how |
|---|---|
| `RTCPeerConnection` | One per remote peer, stored in the module-level `connections = {}` map keyed by remote socket/connection id |
| SDP offer/answer | `createOffer` → `setLocalDescription` → `signal` → remote `setRemoteDescription` → `createAnswer` … JSON-stringified inside the `signal` payload as `{ sdp }` |
| ICE candidates | `onicecandidate` → `signal` `{ ice }` → remote `addIceCandidate(new RTCIceCandidate(...))` |
| STUN | `{ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }` |
| Media capture | `getUserMedia({video, audio})` for camera/mic; `getDisplayMedia({video:true, audio:true})` for screen share |
| Remote media | Legacy `onaddstream` / `addStream` API (deprecated in the spec but widely supported) |
| Renegotiation | After swapping the local stream (camera ↔ screen, black/silent fallback) a new offer is created for every peer |
| Placeholder tracks | `black()` = canvas `captureStream()` video track (disabled); `silence()` = zero-amplitude `AudioBufferSource` → `MediaStreamDestination` track (disabled) |
| Mesh | N participants ⇒ **N(N−1)/2** peer connections in total; each client holds **N−1** connections |

---

## ⚙ Backend Deep Dive

### `src/app.js` — Express application

1. Loads env vars twice: `dotenv.config({ path: <repo-root>/.env })`, then `dotenv.config()` (current working directory, e.g. `backend/.env`). Already-set variables are not overridden, so the root file wins.
2. Creates the Express app, port = `process.env.PORT || 8080`.
3. Middleware: `cors({ origin: "*", methods: [GET, POST, PUT, DELETE, OPTIONS], allowedHeaders: [Content-Type, Authorization, *] })`, `express.json({ limit: "40kb" })`, `express.urlencoded({ limit: "40kb", extended: true })`.
4. Routes:
   - `/api/v1/users/*` → `users.routes.js`
   - `GET /home` → `{ hello: "world", environment: "aws-lambda" | "standalone" }`
   - `GET /health` → `{ status: "ok", timestamp }`
   - Static files from `<repo-root>/frontend/dist` (monolithic hosting; **no SPA catch-all**, so deep links like `/abc123` will 404 when served this way — use Vercel's rewrite or add a fallback route).
5. **Environment detection:** `isStandalone = !process.env.AWS_LAMBDA_FUNCTION_NAME && NODE_ENV !== "test"`.
   - Standalone → create `http.Server`, attach Socket.IO via `connectToSocket(server)`, `await connectDB()`, then `listen(port, "0.0.0.0")`.
   - Lambda → do nothing at import time; `apiHandler.js` imports `{ app }` and connects to the DB per invocation.
6. Exports `app` (named and default).

### `src/config/db.js` — `connectDB()`

- Builds the connection string from **`MONGO_URI`** if provided, else from `DB_USER`, `DB_PASSWORD` (URL-encoded with `encodeURIComponent`), `DB_CLUSTER`, `DB_NAME` (default `videoConferencing`): `mongodb+srv://user:pass@cluster/dbName?retryWrites=true&w=majority`.
- Throws a descriptive error if neither is available.
- Options: `bufferCommands: false` (fail fast instead of silently queueing queries when disconnected — important on Lambda) and `serverSelectionTimeoutMS: 5000`.
- **Connection caching:** returns the cached connection if `mongoose.connection.readyState === 1`, so warm Lambda invocations reuse the connection.

### `src/controllers/socketManager.js` — Socket.IO signaling (standalone mode)

Three module-level in-memory maps:

| Variable | Shape | Purpose |
|---|---|---|
| `connections` | `{ [roomPath]: socketId[] }` | Who is in which room |
| `messages` | `{ [roomPath]: [{ sender, data, 'socket-id-sender' }] }` | Chat history for late joiners |
| `timeOnline` | `{ [socketId]: timestamp }` | Join time (cleaned on disconnect; the computed duration is currently unused) |

Event handlers (Socket.IO server created with `cors: { origin: "*", methods: ["GET","POST"] }`):

| Event | What the server does |
|---|---|
| `join-call (path)` | Create the room if needed, push `socket.id`, record join time, emit `user-joined(socket.id, allIdsInRoom)` to **every** member (including the joiner), then replay stored chat messages to the joiner only |
| `signal (toId, message)` | `io.to(toId).emit("signal", socket.id, message)` — pure relay |
| `chat-message (data, sender)` | Finds the caller's room by scanning `connections`, stores the message, emits it to all room members |
| `disconnect` | Deletes `timeOnline` entry, emits `user-left(socket.id)` to room members, removes the id; when the room becomes empty it deletes both the room and its chat history |

> Because the state is in process memory, standalone mode supports **one server instance only** (no horizontal scaling without something like the Socket.IO Redis adapter).

### `src/lambda/apiHandler.js` — REST on Lambda

- `serverless(app, { binary: ["image/*", "application/octet-stream"] })` converts API Gateway HTTP API events to Express requests.
- `context.callbackWaitsForEmptyEventLoop = false`.
- Answers `OPTIONS` pre-flight immediately (200 + CORS headers) **without touching the DB**.
- Calls `connectDB()`; on failure returns `500 { message: "Database connection failed", error }`.
- Always merges permissive CORS headers into the response.

### `src/lambda/wsHandler.js` — WebSocket on Lambda

One handler for all WebSocket routes. It calls `connectDB()`, parses `event.body` as JSON, and decides the action as `body.action || routeKey`. It builds an `ApiGatewayManagementApiClient` from `event.requestContext.domainName` + `stage` to push messages back to clients (`PostToConnectionCommand`).

`postToConnection()` returns `false` and **deletes the stale connection record** on HTTP 410 (`GoneException`).

| Action | Behaviour |
|---|---|
| `$connect` | Returns `200 "Connected"` (nothing stored yet) |
| `join-call` | Upserts `WsConnection { connectionId, meetingPath, username }` → loads all connections of that room → sends `{type:"connect", id}` to the caller → sends `{type:"user-joined", id, clients}` to every room member → replays chat from `WsMessage` (sorted ascending by `createdAt`, `limit(50)` — i.e. the oldest 50) |
| `signal` | Pushes `{type:"signal", fromId, message}` to `toId` |
| `chat-message` | Looks up the sender's room → saves a `WsMessage` → pushes `{type:"chat-message", data, sender, socketIdSender, id}` to every member of the room |
| `$disconnect` | Deletes the connection, pushes `{type:"user-left", id}` to remaining members; if the room is now empty, `WsMessage.deleteMany({meetingPath})` |
| *(anything else, incl. client `ping`)* | `200 "Default action acknowledged"` |

Errors are caught and returned as `500 "Internal server error"`.

### `src/controllers/user.controller.js`

| Function | Route | Logic |
|---|---|---|
| `register` | `POST /register` | Require `name`, `username`, `password` (400 otherwise) → reject duplicate username (**409**) → `bcrypt.hash(password, 10)` → generate token with `crypto.randomBytes(20).toString("hex")` → save user (token included, so the user is logged in immediately) → **201** `{ message, token }` |
| `login` | `POST /login` | Require `username` + `password` (400) → find user (404 if missing) → `bcrypt.compare` → on success generate a *new* token, save it, **200** `{ message, token }`; wrong password → **401** |
| `addToHistory` | `POST /add_to_activity` | Find user by `token` → create `Meeting { user_id: user.username, meetingCode }` → **201** |
| `getuserHistory` | `GET /get_all_activity?token=` | Find user by `token` → return all `Meeting` documents where `user_id === user.username` |

### `src/routes/users.routes.js`

```
POST /api/v1/users/login
POST /api/v1/users/register
POST /api/v1/users/add_to_activity
GET  /api/v1/users/get_all_activity
```

### Infrastructure files

**`serverless.yml`** (service `video-call-backend`)

- Runtime `nodejs20.x`, memory 512 MB, timeout 29 s, region `${opt:region, 'ap-southeast-2'}`, stage `${opt:stage, 'prod'}`, `useDotenv: true`.
- `httpApi.cors: true`; env vars `NODE_ENV=production`, `DB_USER`, `DB_PASSWORD`, `DB_CLUSTER`, `DB_NAME`, `MONGO_URI` (read from `.env`).
- IAM: `execute-api:ManageConnections` on `arn:aws:execute-api:*:*:*/*/@connections/*` (needed to push to WebSocket clients).
- Packaging excludes `nodemon` and `pm2`.
- Functions: `api` (`src/lambda/apiHandler.handler`, events `ANY /{proxy+}` and `ANY /`) and `websocket` (`src/lambda/wsHandler.handler`, routes `$connect`, `$disconnect`, `$default`, `join-call`, `signal`, `chat-message`).

**`template.yaml`** (AWS SAM)

- Parameters: `DbUser`, `DbPassword` (`NoEcho`), `DbCluster`, `DbName` (default `videoConferencing`). *(`MONGO_URI` is not a SAM parameter.)*
- Resources: `HttpApi` (CORS `*`), `RestApiFunction`, `WebSocketApi` (`RouteSelectionExpression: $request.body.action`), `WebSocketFunction` (+ `execute-api:ManageConnections` policy), one `AWS_PROXY` integration, six routes (`$connect`, `$disconnect`, `$default`, `join-call`, `signal`, `chat-message`), `WebSocketDeployment`, `WebSocketStage` (`prod`), `WebSocketLambdaPermission`.
- Outputs: `RestApiUrl` and `WebSocketApiUrl` (`wss://…/prod`).

---

## 🖥 Frontend Deep Dive

### Bootstrapping

- `main.jsx` → `<StrictMode><App/></StrictMode>`.
- `App.jsx` → `<SpeedInsights/>` + `<AppTheme>` (MUI theme) + `<Router>` + `<AuthProvider>` + `<Routes>`.

### `environment.js` — URL resolution

```js
const IS_PROD = import.meta.env.PROD;                       // true for `vite build`
const server    = (VITE_BACKEND_URL || (IS_PROD ? "" : "http://localhost:8080")) minus trailing "/";
const ws_server = (VITE_WS_URL      || (server || (IS_PROD ? "" : "http://localhost:8080"))) minus trailing "/";
```

- `server` is the REST base (Axios `baseURL = ${server}/api/v1/users`).
- `ws_server` is the signaling URL. If `VITE_WS_URL` is unset it **falls back to `server`**, which is correct for local/standalone (Socket.IO on the same origin) but **wrong for Lambda** — in that case both variables must be set.
- In a production build with no variables set, both are `""` (same-origin), which supports the monolithic mode where Express serves `frontend/dist`.

### `AuthContext.jsx`

`AuthProvider` exposes `{ userData, setUserData, handleRegister, handleLogin, addToUserHistory, getHistoryOfuser }` through React Context.

- `handleRegister` / `handleLogin`: POST via Axios; on `201`/`200` store `token` in `localStorage` and `navigate("/home")`. Errors are re-thrown so the page can render `err.response.data.message`.
- `addToUserHistory(meetingCode)` → `POST /add_to_activity { token, meeting_code }`.
- `getHistoryOfuser()` → `GET /get_all_activity` with `params: { token }`.

### `withAuth.jsx` — route-guard HOC

Wraps a component; in a `useEffect` it checks `localStorage.getItem("token")` and `navigate("/auth")` if absent. (Client-side check only — the real enforcement is the token lookup in the API.)

### `socketAdapter.js` — transport abstraction

`connectSocket(url, options)`:

- URL starts with `ws://` or `wss://` → `new ApiGatewayWebSocketAdapter(url)`
- otherwise → `io.connect(url, { ...options, secure: true if https })`

`ApiGatewayWebSocketAdapter` implements a minimal Socket.IO-like API:

| Member | Behaviour |
|---|---|
| `on(event, cb)` / `off` / `emitLocal` | Local listener registry |
| `emit("join-call", path, username)` | Sends `{action:"join-call", path, username}` |
| `emit("signal", toId, message)` | Sends `{action:"signal", toId, message}` |
| `emit("chat-message", data, sender)` | Sends `{action:"chat-message", data, sender}` |
| other events | `{action:event, data:args[0]}` |
| Message queue | Frames emitted before the socket is open are queued and flushed in `onopen` |
| Incoming frames | `type`: `connect` (stores `id`), `user-joined`, `signal` (→ `fromId, message`), `chat-message`, `user-left`; unknown types are forwarded as-is |
| Keep-alive | Sends `{action:"ping"}` every 5 minutes (API Gateway idles out after 10 minutes) |
| `disconnect()` | Clears the interval and closes the socket |
| Reconnection | **Not implemented** — a dropped WebSocket emits `disconnect` locally and is not re-established |

### Pages

| File | Responsibilities |
|---|---|
| `landing.jsx` | Nav (Join as Guest → `/guestLink`, Register, Sign In), hero text, "Get Started" link, hero image `/group.png` |
| `authentication.jsx` | Glass-card form with Full Name (register only), Username, Password; toggles login/register; shows server error text inline and a success `Snackbar` (4 s) after registration. *(A `validateInputs()` helper for email/password-length exists but is not currently called, and the "Forgot password" link is an empty placeholder.)* |
| `home.jsx` | Wrapped with `withAuth`. Navbar with **History** and **Logout** (removes the token, goes to `/auth`); hero text; meeting-code `TextField` + **Join** button (logs history, then navigates to `/<code>`); illustration |
| `history.jsx` | Fetches history on mount, renders a card per meeting (`meetingCode`, date formatted `dd/mm/yyyy`) or an empty state; "Back to Home" button |
| `VideoMeet.jsx` | Lobby and meeting room (details below) |

### `VideoMeet.jsx` — the core component

**State & refs**

| Name | Kind | Purpose |
|---|---|---|
| `socketRef`, `socketIdRef` | `useRef` | Transport object and my own socket/connection id (mutable, no re-render) |
| `localVideoRef` | `useRef` | `<video>` element showing my stream |
| `videoRef` | `useRef([])` | Mirror of the `videos` state used inside callbacks (avoids stale closures) |
| `showModalRef`, `hasJoinedRef` | `useRef` | Latest chat-panel visibility (for unread counting) and a guard against emitting `join-call` twice |
| `video`, `audio`, `screen` | `useState` | Current toggles |
| `videoAvailable`, `audioAvailable`, `screenAvailable` | `useState` | Device / API capability flags |
| `messages`, `message`, `newMessages`, `showModal` | `useState` | Chat list, input, unread count, chat panel open flag (open by default) |
| `askForUsername`, `username` | `useState` | `true` = show lobby, `false` = show meeting room |
| `videos` | `useState` | Remote tiles `{ socketId, stream, autoPlay, playsinline }` |
| `connections` | module-level `var` | `{ remoteId: RTCPeerConnection }` |
| `window.localStream` | global | The stream currently being sent |
| `audioCtx` | module-level | A single shared `AudioContext` (browsers cap concurrent contexts) |

**Lifecycle / functions**

| Function | What it does |
|---|---|
| `getPermissions()` | Runs on mount; `getUserMedia({video,audio})`; stores stream in `window.localStream`, previews it, detects `getDisplayMedia` support; on failure marks media unavailable |
| `connect()` | Leaves the lobby (`setaskForUsername(false)`), re-requests permissions if needed, calls `connectToSocketServer()` |
| `connectToSocketServer()` | `connectSocket(ws_server \|\| server)`; registers handlers for `signal`, `chat-message`, `user-left`, `user-joined`, `connect` |
| `on("connect")` | Saves own id (either the argument — WebSocket mode — or `socket.id` — Socket.IO mode), then emits `join-call` once with `window.location.href` and the username |
| `on("user-joined", id, clients)` | For each id: new `RTCPeerConnection`, `onicecandidate` → `signal`, `onaddstream` → add/update tile in `videos`, add local stream (or black+silent stream). If the event is about **me**, create and send an offer to everyone else |
| `gotMessageFromServer(fromId, msg)` | Parse JSON; apply `sdp` (and answer if it was an offer) or `ice` |
| `on("user-left", id)` | Remove the tile, close and delete that peer connection |
| `handleVideo()` / `handlleAudio()` | Flip state and set `track.enabled` on the current local tracks |
| `handleScreen()` + `useEffect([screen])` | When `screen` becomes true → `getDisplayMedia` → `getDisplayMediaSuccess`: stop old tracks, swap `window.localStream`, `addStream` + new offer to every peer; `track.onended` (browser "Stop sharing") restores the camera via `getPermissions()` and renegotiates |
| `getUserMedia()` / `getUserMediaSuccess()` | Re-acquire media and renegotiate; if a track ends, fall back to black + silence |
| `black()` / `silence()` | Placeholder tracks (canvas `captureStream`, zero-amplitude audio buffer) |
| `addMessage(data, sender, socketIdSender, id)` | Appends a chat message (de-duplicated by `id` when the server provides one); increments the unread counter if the message is from someone else and the panel is closed |
| `sendMessage()` | Trims and emits `chat-message(text, username \|\| "Guest")`; Enter key also sends |
| `handleEndCall()` | Stops local tracks → closes all peer connections → clears `connections` → `socket.disconnect()` → closes `AudioContext` → clears `window.localStream` → resets videos/messages/unread/input → `navigate("/home")` |

**UI**: lobby card (name input, **Connect**, live preview) → meeting room with a bottom-center control bar (camera, mic, red end-call, screen-share if supported, chat with unread `Badge`), a floating picture-in-picture local video, a flex-wrap grid of remote videos, and a slide-in glass chat panel.

### Styling & responsiveness

- `App.css` — landing, auth, home, history and lobby styles; `@keyframes fadeIn` and `slideInRight`; breakpoints at **968 px, 768 px, 600 px, 520 px, 480 px**.
- `videoComponent.module.css` — scoped meeting-room styles (`meetVideoContainer`, `meetUserVideo`, `buttonContainers`, `conferenceView`, `chatRoom`, …); breakpoints at **968 px** and **600 px**; remote tiles use `aspect-ratio: 16/9`, `object-fit: cover`, `width: clamp(280px, 45vw, 640px)`.
- Glassmorphism = translucent backgrounds + `backdrop-filter: blur(...)`; accent colors `#FF9839` → `#ff5e62` (orange→coral), `#00b4d8` → `#0077b6` (cyan→blue).
- MUI theme (`AppTheme.jsx`) defines primary `#1976d2` and secondary `#dc004e` in light mode; the dark look comes from custom CSS and `sx` overrides rather than MUI's dark palette.

---

## 🗄 Database Schema

Database name: `videoConferencing` (configurable via `DB_NAME`). Mongoose pluralizes model names to collection names.

### `users` (model `User`)

| Field | Type | Constraints |
|---|---|---|
| `name` | String | required |
| `username` | String | required, **unique** (unique index) |
| `password` | String | required — bcrypt hash |
| `token` | String | optional — current session token (overwritten on each login) |

### `meetings` (model `Meeting`)

| Field | Type | Constraints |
|---|---|---|
| `user_id` | String | holds the user's **username** (not an ObjectId reference) |
| `meetingCode` | String | required |
| `date` | Date | required, `default: Date.now` |

### `wsconnections` (model `WsConnection`) — WebSocket mode only

| Field | Type | Constraints |
|---|---|---|
| `connectionId` | String | required, **unique**, indexed — API Gateway connection id |
| `meetingPath` | String | required, indexed — room key |
| `username` | String | default `"Guest"` |
| `createdAt` | Date | default `Date.now`, **TTL `expires: 7200`** (auto-removed after 2 hours) |

### `wsmessages` (model `WsMessage`) — WebSocket mode only

| Field | Type | Constraints |
|---|---|---|
| `meetingPath` | String | required, indexed |
| `sender` | String | required — display name |
| `data` | String | required — message text |
| `socketIdSender` | String | required — sender's connection id |
| `createdAt` | Date | default `Date.now`, **TTL `expires: 7200`** |

> The WebSocket models are declared with `mongoose.models.X || mongoose.model(...)` to avoid "OverwriteModelError" when a warm Lambda re-imports the module.

---

## 📡 REST API Reference

Base path: `/api/v1/users` (full URL = `VITE_BACKEND_URL` + path). All bodies are JSON (max 40 KB).

| Method | Path | Request | Success | Errors |
|---|---|---|---|---|
| POST | `/register` | `{ name, username, password }` | **201** `{ message: "User registered successfully", token }` | **400** missing fields · **409** `Username already taken` · **500** |
| POST | `/login` | `{ username, password }` | **200** `{ message: "User logged in successfully", token }` | **400** missing fields · **404** `User not found` · **401** `Invalid credentials` · **500** |
| POST | `/add_to_activity` | `{ token, meeting_code }` | **201** `{ message: "Meeting added to history successfully" }` | invalid token → caught and returned as `200 { message: "Something went wrong: …" }` |
| GET | `/get_all_activity?token=…` | query `token` | **200** `[ { _id, user_id, meetingCode, date, __v }, … ]` | invalid token → `200 { message: "Something went wrong: …" }` |

Utility endpoints (not under `/users`):

| Method | Path | Response |
|---|---|---|
| GET | `/health` | `{ status: "ok", timestamp }` |
| GET | `/home` | `{ hello: "world", environment: "aws-lambda" \| "standalone" }` |

Example:

```bash
curl -X POST http://localhost:8080/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ayush","username":"ayush","password":"secret123"}'
# → 201 {"message":"User registered successfully","token":"9f2c…(40 hex chars)"}

curl "http://localhost:8080/api/v1/users/get_all_activity?token=9f2c…"
```

---

## 📨 Real-Time Protocol Reference

### A. Socket.IO events (standalone mode, `http(s)://` URL)

| Event | Direction | Arguments | Purpose |
|---|---|---|---|
| `join-call` | Client → Server | `path` (room = full URL) *(the client also sends `username` as a 2nd argument; the Socket.IO server currently ignores it)* | Join a room |
| `user-joined` | Server → all in room | `socketId`, `clientIds[]` | A participant joined; tells everyone the full member list |
| `user-left` | Server → all in room | `socketId` | A participant disconnected |
| `signal` | Client → Server → target | out: `toId, message` · in: `fromSocketId, message` | Relay SDP/ICE (message is a JSON string) |
| `chat-message` | Client → Server → all in room | out: `data, sender` · in: `data, sender, socketIdSender` | Chat broadcast; history replayed to late joiners |
| `connect` / `disconnect` | built-in | — | Socket.IO lifecycle |

### B. WebSocket JSON protocol (AWS mode, `ws(s)://` URL)

**Client → server** (routed by API Gateway on `$request.body.action`):

| `action` | Fields | Notes |
|---|---|---|
| `join-call` | `path`, `username` | Registers the connection in MongoDB |
| `signal` | `toId`, `message` | Relay to one peer |
| `chat-message` | `data`, `sender` | Saved and broadcast |
| `ping` | — | Keep-alive; hits `$default` and is acknowledged |

**Server → client** (`type` field):

| `type` | Fields | Adapter turns it into |
|---|---|---|
| `connect` | `id` | `connect(id)` — sets `socket.id` |
| `user-joined` | `id`, `clients[]` | `user-joined(id, clients)` |
| `user-left` | `id` | `user-left(id)` |
| `signal` | `fromId`, `message` | `signal(fromId, message)` |
| `chat-message` | `data`, `sender`, `socketIdSender`, `id` | `chat-message(data, sender, socketIdSender, id)` |

Lifecycle routes `$connect` / `$disconnect` are invoked by API Gateway itself.

---

## 🔐 Authentication & Security

### Flow

```
Register  : POST /register {name, username, password}
            → bcrypt.hash(password, 10) → store → token = randomBytes(20).hex → 201 {token}
Login     : POST /login {username, password}
            → bcrypt.compare → new token → saved on user → 200 {token}
Client    : localStorage.setItem("token", token) → navigate("/home")
Guard     : withAuth → no token in localStorage → redirect to /auth
API calls : token sent in request body (POST) or query string (GET) → User.findOne({ token })
Logout    : localStorage.removeItem("token")   (client-side only)
```

- It is **not JWT**: the token is an opaque random string; the database is the source of truth.
- Each login generates a new token, so logging in on a second device invalidates the first device's token (single active session per user).
- Passwords are never stored in plain text. bcrypt is deliberately slow (10 rounds ≈ a few tens of milliseconds per hash on typical hardware) to make brute force costly.
- WebRTC media is encrypted end-to-end between peers by the protocol itself (DTLS-SRTP).

### Security notes & hardening checklist (honest assessment)

| Area | Current state | Recommended improvement |
|---|---|---|
| CORS | `origin: "*"` on Express, Socket.IO, Lambda and SAM | Restrict to the Vercel domain(s) |
| Token transport | Token in request body / **query string** (can leak into logs and history) | `Authorization: Bearer` header |
| Token lifetime | No expiry; plaintext in DB; server-side logout absent | JWT with expiry + refresh, or hashed session tokens with TTL; `/logout` endpoint |
| Token storage | `localStorage` (readable by any XSS) | HttpOnly, Secure, SameSite cookie |
| Brute force | No rate limiting or lockout | `express-rate-limit`, per-IP and per-user throttling |
| Enumeration | `404 User not found` vs `401 Invalid credentials` reveals which usernames exist | Return a single generic message |
| Validation | Only "required" checks on the server; password length validated nowhere on the server | Schema validation (zod/joi), min length, username format |
| Headers | No `helmet` | Add `helmet()` |
| Signaling auth | Anyone can open the socket and join any room name; any connection can `signal` any id | Authenticate sockets (token on connect), validate that `toId` is in the same room |
| ICE | STUN only | Add TURN (coturn / Twilio / Xirsys) for strict NATs |
| Secrets | `.env*` are git-ignored; `.env.example` files hold placeholders only | Use AWS SSM / Secrets Manager for Lambda |

---

## 🌍 Environment Configuration

### Backend — `<repo-root>/.env` (preferred) or `backend/.env`

See `.env.example`:

| Variable | Required | Default | Description |
|---|---|---|---|
| `DB_USER` | yes* | — | MongoDB Atlas username |
| `DB_PASSWORD` | yes* | — | Atlas password (URL-encoded automatically) |
| `DB_CLUSTER` | yes* | — | Cluster host, e.g. `cluster0.xxxxx.mongodb.net` |
| `DB_NAME` | no | `videoConferencing` | Database name |
| `MONGO_URI` | alternative | — | Full connection string; **takes priority** over the four `DB_*` variables |
| `PORT` | no | `8080` | Standalone server port (Render injects its own) |
| `NODE_ENV` | no | — | Set to `production` by `serverless.yml` / SAM; `test` prevents the standalone server from starting |
| `AWS_LAMBDA_FUNCTION_NAME` | auto | — | Set by AWS; its presence switches the app to Lambda mode |

\* Either `MONGO_URI` **or** `DB_USER` + `DB_PASSWORD` + `DB_CLUSTER`.

```env
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_CLUSTER=your_cluster.mongodb.net
DB_NAME=videoConferencing
# MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/videoConferencing?retryWrites=true&w=majority
PORT=8080
```

### Frontend — `frontend/.env` (copy from `frontend/.env.example`; on Vercel set these in Project → Environment Variables)

| Variable | Description | Example |
|---|---|---|
| `VITE_BACKEND_URL` | REST base URL (no trailing slash needed) | `https://abc123.execute-api.ap-southeast-2.amazonaws.com` |
| `VITE_WS_URL` | Signaling URL. `wss://…/prod` → API Gateway adapter; `http(s)://…` → Socket.IO | `wss://def456.execute-api.ap-southeast-2.amazonaws.com/prod` |

If both are omitted: development uses `http://localhost:8080` for both; a production build uses same-origin (`""`).

> Vite only exposes variables prefixed with `VITE_` and **inlines them at build time** — change them → rebuild/redeploy.

---

## 🚀 How to Run Locally

### Prerequisites

- **Node.js 20.19+** (Vite 7 requires 20.19+ or 22.12+; the backend targets Node 20)
- A **MongoDB Atlas** cluster (free M0 is fine) with a database user, and your IP allowed under *Network Access*
- A webcam/microphone (and a **secure context**: `localhost` or HTTPS — browsers block `getUserMedia` on plain HTTP origins)

### 1. Clone and configure

```bash
git clone <repo-url>
cd Video-Call
cp .env.example .env        # then fill in your Atlas credentials (Windows: copy .env.example .env)
```

### 2. Start the backend (standalone mode)

```bash
cd backend
npm install
npm run dev        # nodemon src/app.js   (or: npm start → node src/app.js)
```

Runs at **http://localhost:8080** — verify with `http://localhost:8080/health`.

### 3. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at **http://localhost:5173** (no env file needed; it defaults to `http://localhost:8080`).

### 4. Try a call

1. Open `http://localhost:5173`, register an account, and you land on **/home**.
2. Enter a meeting code (e.g. `demo123`) → **Join** → enter a name → **Connect**.
3. Open the same URL (`http://localhost:5173/demo123`) in a **second browser/profile or another device on the same network** (a single webcam can usually only be opened by one browser at a time), enter another name and connect.

> **Windows PowerShell** blocking `npm`? Run once:
> `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

### Optional: monolithic mode (one server for everything)

```bash
cd frontend && npm run build        # creates frontend/dist
cd ../backend && npm start          # Express now also serves frontend/dist at http://localhost:8080
```

(With no `VITE_*` variables the production build calls the same origin. Caveats: Express has no SPA fallback, so refreshing on `/<meetingCode>` returns 404, and the API's `GET /home` JSON route shadows the frontend's `/home` page on a hard refresh. Navigating from the landing page works because React Router handles it client-side. For real deployments, use Vercel for the frontend.)

### Testing serverless (WebSocket) mode

There is no local emulator configured. Deploy the backend to AWS (below), then create `frontend/.env` with the `VITE_BACKEND_URL` and `VITE_WS_URL` values from the deployment output and run `npm run dev`.

### Lint / build / preview (frontend)

```bash
npm run lint       # ESLint
npm run build      # production bundle in dist/
npm run preview    # serve the built bundle locally
```

---

## 🌐 Deployment

| Component | Platform | Free-tier note |
|---|---|---|
| Frontend | **Vercel** | Static hosting, git-based CI/CD |
| Database | **MongoDB Atlas M0** | 512 MB shared cluster |
| REST API | **AWS Lambda + API Gateway HTTP API** | Within Lambda/API Gateway free allowances (limits change — check current AWS pricing) |
| Signaling & chat | **AWS API Gateway WebSocket + Lambda** | Same |

### Backend → AWS Lambda

**Prerequisites:** an AWS account, AWS credentials configured (`aws configure` or environment variables), the Atlas variables available in `backend/.env` (Serverless loads them via `useDotenv: true`), and Atlas *Network Access* allowing Lambda's outbound IPs (the free tier usually requires `0.0.0.0/0`).

**Option A — Serverless Framework**

```bash
cd backend
npm install
npx serverless deploy                      # default region ap-southeast-2, stage prod
npx serverless deploy --region us-east-1   # override region/stage with --region / --stage
```

The output lists the HTTP API URL (→ `VITE_BACKEND_URL`) and the WebSocket URL (`wss://<id>.execute-api.<region>.amazonaws.com/prod` → `VITE_WS_URL`).

**Option B — AWS SAM**

```bash
cd backend
sam build
sam deploy --guided        # prompts for DbUser, DbPassword, DbCluster, DbName
```

The stack outputs `RestApiUrl` and `WebSocketApiUrl`.

> Both options use `npm run deploy:serverless` / `npm run deploy:sam` as shortcuts.

### Frontend → Vercel

1. Push the repo to GitHub.
2. In Vercel: **Import Project** → set **Root Directory = `frontend`** (framework preset: Vite; build `npm run build`; output `dist`).
3. Add environment variables `VITE_BACKEND_URL` and `VITE_WS_URL`.
4. Deploy. `vercel.json` makes every path serve `index.html` so React Router deep links such as `/demo123` work.

### Alternative: Render / any Node host (standalone mode)

Deploy `backend/` as a Node web service (`npm install`, start command `npm start`), set the DB variables (Render sets `PORT` itself), and point `VITE_BACKEND_URL` at it; leave `VITE_WS_URL` unset (it falls back to the same URL and uses Socket.IO). This mode keeps rooms in memory, so run a single instance.

### AWS limits worth knowing (relevant to WebSocket mode)

- WebSocket connections idle out after **10 minutes** (hence the client's 5-minute ping) and are capped at **2 hours** total — which is why `WsConnection`/`WsMessage` TTLs are 2 hours.
- A Lambda invocation here is limited to 29 s (API Gateway's integration timeout is 29 s).

---

## 🧰 NPM Scripts Reference

**backend/package.json**

| Script | Command | Notes |
|---|---|---|
| `npm run dev` | `nodemon src/app.js` | Development with auto-restart |
| `npm start` | `node src/app.js` | Production start (standalone mode) |
| `npm run prod` | `pm2 src/app.js` | ⚠️ `pm2` is not a dependency, and PM2 normally needs `pm2 start src/app.js` |
| `npm run deploy:serverless` | `serverless deploy` | Requires the Serverless CLI (`npx serverless …` also works) |
| `npm run deploy:sam` | `sam build && sam deploy --guided` | Requires AWS SAM CLI |

**frontend/package.json**

| Script | Command |
|---|---|
| `npm run dev` | `vite` |
| `npm run build` | `vite build` |
| `npm run preview` | `vite preview` |
| `npm run lint` | `eslint .` |

---

## 🧩 Known Limitations & Improvement Roadmap

Knowing these (and how you'd fix them) is itself good interview material. These were identified by reading the source; they describe the code as it is today.

### Real-time / WebRTC

1. **Peer connections are re-created for already-connected peers.** On every `user-joined`, the handler loops over *all* ids in `clients` and does `connections[id] = new RTCPeerConnection(...)`, even for peers it already has. Only the new joiner sends offers, so existing pairs can end up with fresh, un-negotiated connections when a 3rd+ person joins. *Fix:* only create a connection if `!connections[id]`, or have both sides negotiate with the new peer only.
2. **No TURN server** → participants behind symmetric NATs/corporate firewalls may fail to connect.
3. **Mesh scales poorly** (upload bandwidth grows with N−1). *Fix:* SFU (mediasoup, Janus, LiveKit).
4. **Legacy APIs:** `addStream`/`onaddstream` are deprecated; modern code uses `addTrack`/`ontrack`, `replaceTrack` for screen sharing (no renegotiation), and the *perfect negotiation* pattern for glare handling.
5. **Screen-share toggle:** clicking the button to *stop* sharing doesn't revert the stream; the revert happens when the browser's own "Stop sharing" control ends the track.
6. **No auto-reconnect** in `ApiGatewayWebSocketAdapter` (Socket.IO reconnects natively).
7. **Room key is the full URL** (`window.location.href`), so identical meeting codes on different origins are different rooms; "Join as Guest" sends everyone to one shared room (`/guestLink`).
8. **Standalone chat-room lookup** scans every room (`O(rooms × members)`); storing the room on the socket (`socket.data.room`) makes it `O(1)`/`O(members)`.
9. **WebSocket mode:** broadcasts post to peers sequentially (`for … await`); `Promise.all` would cut latency. Chat replay returns the *oldest* 50 messages (ascending sort + limit). TTL cleanup means a call longer than ~2 hours loses its connection records.
10. **Standalone mode keeps state in memory** → single instance, lost on restart (Redis adapter + shared store needed to scale out).

### Backend / API

11. Errors in `addToHistory` / `getuserHistory` return **HTTP 200** with an error message — and on the History page that object would be passed to `meetings.map`, which would throw; they should return 401/500 and the client should check `Array.isArray`.
12. History stores `username` in `user_id` (not a reference) with no index on it; duplicates are allowed.
13. `express.static` has no SPA fallback (see monolithic mode), and the API's own `GET /home` JSON route shadows the frontend's `/home` page when Express serves the build.
14. `package.json` oddities: `"main": "index.js"` doesn't exist; `crypto` is listed as an npm dependency although the built-in module is what's imported; `nodemon` is a runtime dependency (should be `devDependencies`); `npm run prod` is misconfigured.
15. No automated tests, no CI, no request logging/metrics.

### Frontend

16. `frontend/package.json` contains packages the source doesn't import (`i`, `npm`, `lucide`, `lucide-react`, server-side `socket.io`) and the package name is still `my-react-app`.
17. Placeholders: `ColorModeSelect` (does nothing, not used), "Forgot password" link (empty), `validateInputs()` (unused), History error handling (`// IMPLEMENT SNACK BAR`).
18. Chat messages use array index as React `key` (an `id` is available for most messages).
19. No participant names on video tiles, no pin/spotlight/active-speaker detection, no raise-hand, recording, or host controls.

### Nice-to-have roadmap

TypeScript migration · unit/integration tests (Vitest, Jest + Supertest, Playwright with fake media devices) · GitHub Actions CI · JWT/refresh tokens + HttpOnly cookies · rate limiting + `helmet` · TURN + SFU · persistent room/meeting scheduling · participant list & names on tiles · reconnect logic · DynamoDB instead of MongoDB for the connection registry (lower latency on AWS) · infrastructure outputs wired into CI/CD.

---

## 🩺 Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `Missing MongoDB connection parameters` on startup | `.env` not found or incomplete — set `MONGO_URI` or all of `DB_USER`, `DB_PASSWORD`, `DB_CLUSTER` (the root `.env` or `backend/.env`) |
| `MongooseServerSelectionError` | Atlas *Network Access* doesn't include your IP (or Lambda → `0.0.0.0/0`); wrong credentials/cluster host |
| Camera preview is black / `NotAllowedError` | Browser permission denied, or page isn't served over HTTPS/localhost, or another app/browser tab is using the camera |
| Both participants see a black tile | Peers on different origins/URLs (different rooms), or strict NAT without TURN, or the other side has no camera (black fallback track) |
| Works locally, not on Vercel | `VITE_BACKEND_URL` / `VITE_WS_URL` not set (build-time!) or set only one of them; redeploy after changing |
| Mixed-content error in console | HTTPS site calling `http://` / `ws://` — use `https://` and `wss://` endpoints |
| CORS error from the browser | Hitting a different backend than configured, or API Gateway CORS not deployed; check `Access-Control-Allow-Origin` |
| WebSocket drops after ~10 min idle or 2 h | API Gateway limits; ping keeps idle sockets alive, 2 h is a hard cap |
| `/<code>` 404 on refresh when served by Express | No SPA fallback in monolithic mode — use Vercel, or add a catch-all route returning `index.html` |
| PowerShell: "running scripts is disabled" | `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` |
| `bcrypt` install/build error | Use a supported Node version (20+) so the prebuilt binary is downloaded |

---

## 🎓 Interview Preparation Guide

### 1. The 60-second pitch

> "I built a full-stack video conferencing app. The frontend is React 19 with Vite and Material UI; the media goes peer-to-peer over WebRTC in a mesh, and a signaling layer relays SDP and ICE. Users register and log in with bcrypt-hashed passwords and token sessions in MongoDB, can join rooms by code, share their screen, chat, and see their meeting history. What I'm proudest of is that the same backend runs two ways: as a normal Express + Socket.IO server, or serverless on AWS where API Gateway WebSockets and Lambda replace Socket.IO — since Lambda is stateless, I keep the connection registry and chat in MongoDB with TTL indexes and push messages with the API Gateway Management API. On the client, a small adapter hides which transport is in use, so the meeting component doesn't change."

### 2. Design decisions and trade-offs

| Decision | Why | Trade-off |
|---|---|---|
| Mesh WebRTC | No media server, lowest latency, zero cost | O(N²) connections; practical limit ≈ 4–6 users |
| Socket.IO → API Gateway WS adapter | Free-tier serverless hosting; no always-on server | More moving parts; manual presence tracking; no auto-reconnect |
| State in MongoDB (WS mode) | Lambda is stateless; any invocation must find the room | Extra latency per message; DynamoDB/Redis would be faster |
| TTL indexes | Self-cleaning stale connections/chat without cron jobs | TTL monitor runs ~every 60 s, so deletion isn't instant |
| Opaque token instead of JWT | Simple, revocable, trivially invalidated | DB lookup per request; no embedded claims; no expiry yet |
| Context API (no Redux) | Tiny global state (auth functions only) | Wouldn't scale to complex global state |
| `withAuth` HOC | Lightweight client-side guard | Server must still validate (it does, via token lookup) |
| Vite env vars at build time | Same code for local/Vercel/AWS | Changing URLs requires a rebuild |
| Cached DB connection + `bufferCommands:false` | Avoids reconnecting each Lambda call; fails fast | Must `await connectDB()` before every query |

### 3. Complexity cheat-sheet

- Mesh: total connections **N(N−1)/2**; each client uploads **N−1** copies of its stream. 6 users ⇒ **15** peer connections in total, **5** per client (30 directed media streams).
- SFU: each client uploads **1** stream and downloads **N−1**; server forwards. MCU: server mixes → client downloads 1, server CPU is heavy.
- Chat broadcast: O(N) per message (one `PostToConnection` / `emit` per member).
- Standalone `chat-message` room lookup: O(total members across rooms) (can be O(1) with `socket.data.room`).

### 4. Core concepts (with how they appear in this project)

**WebRTC**
- *What is it?* Browser APIs for real-time audio/video/data between peers without plugins.
- *SDP* – text blob describing codecs, media, ICE credentials; exchanged as offer/answer.
- *ICE* – gathers candidates (host, server-reflexive via STUN, relayed via TURN) and tests pairs to find the best path.
- *STUN vs TURN* – STUN tells you your public address; TURN relays the media when direct paths fail (costly bandwidth). Only STUN is configured here.
- *Signaling* – deliberately not part of WebRTC; here Socket.IO / API Gateway WebSocket.
- *Why UDP?* Real-time media tolerates loss but not latency; TCP head-of-line blocking hurts. That's also why media doesn't go through WebSockets (TCP).
- *Security* – DTLS handshake + SRTP: media is always encrypted.

**Real-time transport**
- Socket.IO vs raw WebSocket: reconnection, fallbacks, rooms, acknowledgements, event API. API Gateway WS has none of those — so the adapter and the Mongo registry exist.
- Why can't Lambda hold sockets? Functions are short-lived and don't hold the client connection; API Gateway does, and Lambda is invoked per message.

**React**
- Hooks used: `useState`, `useEffect`, `useRef`, `useContext`, `useNavigate`.
- `useRef` vs `useState`: refs for values that must not trigger re-renders and must be readable inside long-lived callbacks (socket handlers) — avoids stale closures (`videoRef`, `socketIdRef`, `showModalRef`).
- Controlled inputs, conditional rendering (lobby vs room), lifting shared logic into Context, HOC pattern, CSS Modules for scoping.
- `StrictMode` double-invokes effects in dev — one reason `hasJoinedRef` guards the `join-call` emit.

**Node / Express**
- ES modules (`"type":"module"`), reconstructing `__dirname` via `fileURLToPath(import.meta.url)`.
- Middleware pipeline, MVC split (models / controllers / routes), `serverless-http` adapter pattern (Express app reused unchanged on Lambda).
- Cold start vs warm start; module-scope caching; `callbackWaitsForEmptyEventLoop`.

**MongoDB / Mongoose**
- Schemas, `unique` indexes, TTL indexes (`expires`), `findOneAndUpdate` with `upsert`, `mongodb+srv` DNS seedlist, connection pooling, `bufferCommands`.

**Security**
- Salted adaptive hashing (bcrypt), CSPRNG tokens (`randomBytes`), CORS, XSS vs CSRF trade-offs for `localStorage` vs cookies, rate limiting, least-privilege IAM (`execute-api:ManageConnections` only).

**AWS**
- HTTP API vs REST API vs WebSocket API in API Gateway; routes & route-selection expression; `@connections` management API; 410 Gone handling; IaC with Serverless Framework / SAM / CloudFormation.

### 5. Practice questions (with concise answers)

1. **Walk me through what happens from clicking "Join" to seeing remote video.** Home logs history → navigates to `/code` → lobby gets media preview → Connect → transport chosen by URL scheme → `join-call` → server broadcasts `user-joined(id, clients)` → every client builds `RTCPeerConnection`s; the joiner creates offers → SDP/ICE relayed via `signal` → `onaddstream` fires → tile rendered.
2. **STUN vs TURN; why only STUN?** Free public STUN is enough on most home networks; TURN needs a relay server and bandwidth. Production should add TURN.
3. **Why not stream media through the server/Socket.IO?** TCP + server bandwidth + latency; WebRTC is purpose-built for UDP P2P with congestion control and encryption.
4. **What happens when a third person joins?** Everyone receives `user-joined` with all ids; the joiner opens 2 connections and sends 2 offers. (And be ready to discuss the limitation that the current handler recreates connections for existing peers — see Known Limitations #1 — and how you'd fix it.)
5. **Mesh limits? How would you reach 100+ participants?** Upload scales with N−1 → switch to an SFU (mediasoup/LiveKit/Janus), add simulcast/SVC, active-speaker selection, and horizontally scalable signaling.
6. **How did you make Socket.IO-style signaling work on Lambda?** Replaced it with API Gateway WebSocket routes + a Lambda that stores connections in MongoDB and pushes via `PostToConnection`; a client adapter translates events to JSON frames.
7. **What if a connection disappears without a clean disconnect?** `PostToConnection` returns 410 → handler deletes the record; TTL index removes anything older than 2 h as a safety net.
8. **Why a TTL index instead of a cron job?** MongoDB does the cleanup natively, no extra infrastructure.
9. **Why `callbackWaitsForEmptyEventLoop = false` and a cached connection?** The open Mongo socket would otherwise keep the event loop busy and block the response; caching avoids reconnect cost on warm invocations.
10. **Explain the offer/answer model.** Caller: `createOffer` → `setLocalDescription` → send. Callee: `setRemoteDescription(offer)` → `createAnswer` → `setLocalDescription` → send. Caller: `setRemoteDescription(answer)`. ICE candidates trickle in both directions.
11. **How does screen sharing work?** `getDisplayMedia` → stop the camera tracks → swap `window.localStream` → `addStream` to every connection and renegotiate; when the screen track ends, restore the camera and renegotiate. (Modern alternative: `RTCRtpSender.replaceTrack`.)
12. **What's `blackSilence` for?** A WebRTC offer with no tracks can behave badly; a disabled black canvas track + silent audio track lets users without devices still participate and see others.
13. **How is auth implemented? Why not JWT?** bcrypt + random DB-backed token; simpler and revocable, but needs a DB lookup and has no expiry — I'd move to JWT/refresh + HttpOnly cookies for production.
14. **Is it safe to put the token in a query string?** No – it can be logged/cached/leaked via referrers; use the `Authorization` header.
15. **How do `useRef` and `useState` differ in `VideoMeet`?** State drives UI; refs hold mutable values (socket, ids, latest panel state) accessible from callbacks created in earlier renders without causing re-renders.
16. **How does the HOC route guard work, and is it enough?** It checks for a token in `localStorage` and redirects; it's UX only — the API still validates tokens.
17. **What's the role of the Context API here?** Provides auth actions to pages without prop drilling; no Redux needed because there is little shared state.
18. **How does the frontend know which transport to use?** `connectSocket` inspects the URL scheme: `ws(s)://` → API Gateway adapter; `http(s)://` → Socket.IO.
19. **How would you test this?** Unit-test controllers with mocked models; integration-test the REST API with Supertest + in-memory Mongo; e2e with Playwright using Chromium's fake media flags (`--use-fake-device-for-media-stream`, `--use-fake-ui-for-media-stream`) to simulate two participants.
20. **How would you scale the standalone mode?** Move room state to Redis, use the Socket.IO Redis adapter with sticky sessions or a pub/sub layer, run multiple instances behind a load balancer.
21. **What are cold starts and how do you mitigate them?** First invocation initializes the runtime and your module (and DB connection); mitigate with smaller bundles, provisioned concurrency, connection reuse.
22. **Why `bufferCommands: false`?** Mongoose normally queues commands until connected; in serverless that hides connection failures and causes timeouts — failing fast is better.
23. **How would you add TURN?** Add `{ urls: "turn:host:3478", username, credential }` to `iceServers`, ideally with short-lived credentials generated by the backend.
24. **What would you do first to make this production-ready?** Fix the peer re-creation bug, add TURN, lock down CORS, move tokens to headers/cookies with expiry, add rate limiting + validation, add tests + CI, and reconnect logic.
25. **How do bcrypt rounds affect security and performance?** Cost doubles per round (2^rounds iterations); 10 is a common default balancing login latency and brute-force resistance.

### 6. "If I had more time" talking points

SFU migration · TURN · typed codebase (TypeScript) · test suite & CI/CD · observability (CloudWatch metrics, structured logs, Sentry) · participant list, names on tiles, active-speaker highlight · recording · waiting room / host controls · end-to-end encrypted chat · accessibility audit (keyboard control, ARIA labels on icon buttons).

---

## 📌 Repository Housekeeping Notes

- `frontend/README.md` is the untouched Vite template text; **this root README is the project documentation**.
- `swark-output/` holds an auto-generated Mermaid architecture diagram from March 2026 (before the AWS Lambda / WebSocket modules and models existed); regenerate or delete it if it's kept.
- `.gitignore` excludes `.env*` (except the `.env.example` files), `node_modules`, `dist`, `.serverless`, and `interview_questions_part*.md`.
- `frontend/dist/` and `backend/.serverless/` are build artifacts — don't commit them.

---

## 📄 License

ISC (as declared in `backend/package.json`). Author field: `ayush14cyber`.

---

*Built with ❤️ using React, Node.js, WebRTC, Socket.IO, AWS Lambda and MongoDB.*
