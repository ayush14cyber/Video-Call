# 🎥 Real-Time Video Conferencing Application

A full-stack, real-time video conferencing application built with **React**, **Node.js**, **WebRTC**, **Socket.IO**, and **MongoDB**. It enables users to register, authenticate, create/join video meetings with multiple participants, share screens, and chat in real time — all within a modern, dark-themed responsive UI.

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture Overview](#-architecture-overview)
- [Project Structure](#-project-structure)
- [Application Flow](#-application-flow)
- [WebRTC Signaling Flow](#-webrtc-signaling-flow)
- [Backend Deep Dive](#-backend-deep-dive)
- [Frontend Deep Dive](#-frontend-deep-dive)
- [Database Schema](#-database-schema)
- [API Endpoints](#-api-endpoints)
- [Socket.IO Events](#-socketio-events)
- [Authentication Mechanism](#-authentication-mechanism)
- [Environment Configuration](#-environment-configuration)
- [How to Run](#-how-to-run)
- [Deployment](#-deployment)
- [Key Concepts & Interview Topics](#-key-concepts--interview-topics)

---

## ✨ Features

| Category | Feature |
|---|---|
| **Authentication** | User registration & login with bcrypt password hashing and token-based sessions |
| **Video Calling** | Peer-to-peer video/audio via WebRTC with STUN server (Google) |
| **Multi-party Calls** | Mesh topology — each participant connects to every other participant |
| **Screen Sharing** | Share entire screen or application window via `getDisplayMedia` API |
| **Real-time Chat** | In-call text messaging broadcast to all room participants via Socket.IO |
| **Meeting History** | Persistent log of all meetings a user has joined (stored in MongoDB) |
| **Unread Badge** | Live notification badge on chat icon showing unread message count |
| **Responsive UI** | Fully responsive across desktop, tablet, and mobile breakpoints |
| **Modern Design** | Dark glassmorphism theme with gradient accents and micro-animations |

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | Component-based UI library |
| **Vite 7** | Build tool & dev server with HMR (Hot Module Replacement) |
| **React Router DOM v7** | Client-side routing & navigation |
| **Material UI (MUI) v7** | Pre-built UI components (TextField, Button, Badge, IconButton, Snackbar) |
| **Emotion** | CSS-in-JS engine used by MUI (`@emotion/react`, `@emotion/styled`) |
| **Axios** | Promise-based HTTP client for REST API calls |
| **Socket.IO Client** | WebSocket client for real-time bidirectional communication |
| **WebRTC (Browser API)** | Peer-to-peer media streaming (video, audio, screen share) |
| **CSS Modules** | Scoped CSS for the video meeting component |
| **Vanilla CSS** | Global styles for all other pages |
| **Vercel Speed Insights** | Performance monitoring in production |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | JavaScript runtime for server-side logic |
| **Express 5** | Web framework for REST API routing & middleware |
| **Socket.IO** | WebSocket server for real-time signaling & chat |
| **MongoDB Atlas** | Cloud-hosted NoSQL database |
| **Mongoose 8** | ODM (Object Data Modeling) for MongoDB schema & queries |
| **bcrypt** | Password hashing with salt rounds (10 rounds) |
| **crypto** | Node.js built-in module for generating random session tokens |
| **dotenv** | Environment variable management from `.env` file |
| **CORS** | Cross-Origin Resource Sharing middleware |
| **http-status** | HTTP status code constants for clean response handling |
| **nodemon** | Auto-restart dev server on file changes |


### Application Interface 
<p align="center">
  <img width="924" height="519" alt="Application Interface" src="https://github.com/user-attachments/assets/dbf133f2-8ac6-46d4-88bb-c901e54c6763" />
</p>
---

## 🏗 Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                      CLIENT (React + Vite)               │
│                                                          │
│  Landing ──► Auth ──► Home ──► Video Meeting Room        │
│                                   │                      │
│              ┌────────────────────┼──────────────┐       │
│              │  WebRTC Peer       │  Socket.IO   │       │
│              │  Connections       │  Client      │       │
│              │  (P2P Media)       │  (Signaling  │       │
│              │                    │   + Chat)    │       │
│              └────────┬───────────┼──────────────┘       │
└───────────────────────│───────────│───────────────────────┘
                        │           │
            Media Streams (P2P)     │ WebSocket
                        │           │
                        │    ┌──────▼──────────────────────┐
                        │    │   SERVER (Node + Express)    │
                        │    │                              │
                        │    │  REST API ◄──► MongoDB Atlas │
                        │    │  (Auth, History)             │
                        │    │                              │
                        │    │  Socket.IO Server            │
                        │    │  (Signaling + Chat Relay)    │
                        │    └─────────────────────────────┘
                        │
              ┌─────────▼─────────┐
              │  STUN Server      │
              │  (Google Public)  │
              │  stun.l.google.   │
              │  com:19302        │
              └───────────────────┘
```

**Key Architectural Decisions:**
- **Mesh Topology** for WebRTC: Every peer connects directly to every other peer. Suitable for small-to-medium group calls (2–6 participants).
- **Socket.IO as Signaling Server**: Handles SDP offer/answer exchange and ICE candidate relay — not for media transfer.
- **Token-based Authentication**: No JWT — uses `crypto.randomBytes()` to generate a random hex token stored in the database.
- **Monorepo Structure**: Frontend and backend live in the same repository with a shared `.env` file at the root.

---

## 📁 Project Structure

```
video-conferencing/
├── .env                          # Environment variables (DB credentials)
├── .gitignore
├── README.md
│
├── backend/
│   ├── package.json              # Backend dependencies & scripts
│   └── src/
│       ├── app.js                # Express server entry point, MongoDB connection, Socket.IO init
│       ├── controllers/
│       │   ├── user.controller.js    # Auth logic: login, register, history CRUD
│       │   └── socketManager.js      # Socket.IO event handlers (signaling, chat, room mgmt)
│       ├── models/
│       │   ├── user.model.js         # Mongoose User schema (name, username, password, token)
│       │   └── meeting.model.js      # Mongoose Meeting schema (user_id, meetingCode, date)
│       └── routes/
│           └── users.routes.js       # REST API route definitions
│
└── frontend/
    ├── package.json              # Frontend dependencies & scripts
    ├── vite.config.js            # Vite build configuration
    ├── index.html                # HTML entry point
    ├── public/                   # Static assets (background.jpg, group.png)
    └── src/
        ├── main.jsx              # React DOM render entry point (StrictMode)
        ├── App.jsx               # Root component: Router, AuthProvider, AppTheme, Routes
        ├── App.css               # Global styles for all pages (landing, auth, home, history, lobby)
        ├── index.css             # CSS reset (margin, padding, box-sizing)
        ├── environment.js        # Server URL toggle (production vs localhost)
        ├── contexts/
        │   └── AuthContext.jsx   # React Context for auth state & API methods
        ├── utils/
        │   └── withAuth.jsx      # HOC (Higher-Order Component) for route protection
        ├── shared-theme/
        │   └── AppTheme.jsx      # MUI ThemeProvider with custom palette
        ├── pages/
        │   ├── landing.jsx       # Public landing page
        │   ├── authentication.jsx # Login/Register form
        │   ├── home.jsx          # Dashboard: enter meeting code to join
        │   ├── history.jsx       # View past meeting history
        │   └── VideoMeet.jsx     # Core video meeting: WebRTC, Socket.IO, chat, controls
        ├── styles/
        │   └── videoComponent.module.css  # CSS Module for video meeting room
        └── assets/
            ├── logo.png          # App logo image
            └── react.svg         # React logo
```

---

## 🔄 Application Flow

### User Journey (Step-by-Step)

```
1. Landing Page (/)
   │  User sees hero section with "Get Started" CTA
   │
   ├──► "Sign In" / "Register" / "Get Started"
   │
2. Authentication Page (/auth)
   │  Toggle between Sign In (formState=0) and Sign Up (formState=1)
   │  ├── Register: POST /api/v1/users/register → bcrypt hash → save to MongoDB
   │  └── Login: POST /api/v1/users/login → bcrypt compare → generate token → save to DB
   │       └── Token stored in localStorage("token")
   │
3. Home Page (/home)  [Protected by withAuth HOC]
   │  User enters a meeting code (any string) and clicks "Join"
   │  ├── POST /api/v1/users/add_to_activity → saves meeting to history
   │  └── Navigate to /:meetingCode
   │
4. Video Meeting Room (/:url)
   │  ├── Lobby: Enter display name → click "Connect"
   │  │   └── Camera preview shown via getUserMedia()
   │  │
   │  └── Meeting Room:
   │      ├── Socket.IO connects → emits "join-call" with room URL
   │      ├── WebRTC peer connections created for each participant
   │      ├── SDP offer/answer exchanged via Socket.IO signaling
   │      ├── ICE candidates exchanged for NAT traversal
   │      ├── Media streams rendered in video elements
   │      ├── Controls: Toggle video, audio, screen share, end call
   │      └── Chat: Real-time messaging via Socket.IO broadcast
   │
5. History Page (/history)  [No auth guard — but data requires valid token]
   │  GET /api/v1/users/get_all_activity?token=xxx
   │  └── Displays all past meetings with code + date
```

---

## 🔗 WebRTC Signaling Flow

This is the most critical and interview-relevant section. WebRTC requires a signaling mechanism to exchange connection metadata before peers can communicate directly.

### Step-by-Step Peer Connection

```
Peer A (Joiner)                    Server (Socket.IO)                 Peer B (Existing)
     │                                    │                                   │
     │──── "join-call" (room URL) ───────►│                                   │
     │                                    │──── "user-joined" (A.id, all) ───►│
     │                                    │◄─── "user-joined" (A.id, all) ────│
     │◄─── "user-joined" (A.id, all) ─────│                                   │
     │                                    │                                   │
     │  [Create RTCPeerConnection for B]  │  [Create RTCPeerConnection for A] │
     │  [Add local stream to connection]  │  [Add local stream to connection] │
     │                                    │                                   │
     │── createOffer() ──►                │                                   │
     │── setLocalDescription(offer) ──►   │                                   │
     │── "signal" (B.id, {sdp: offer}) ──►│                                   │
     │                                    │── "signal" (A.id, {sdp: offer}) ─►│
     │                                    │                                   │
     │                                    │  [setRemoteDescription(offer)]    │
     │                                    │  [createAnswer()]                 │
     │                                    │  [setLocalDescription(answer)]    │
     │                                    │◄─ "signal" (A.id, {sdp: answer}) ─│
     │◄── "signal" (B.id, {sdp: answer}) ─│                                   │
     │                                    │                                   │
     │  [setRemoteDescription(answer)]    │                                   │
     │                                    │                                   │
     │── "signal" (B.id, {ice: cand}) ───►│── "signal" (A.id, {ice: cand}) ─►│
     │◄── "signal" (B.id, {ice: cand}) ───│◄─ "signal" (A.id, {ice: cand}) ──│
     │                                    │                                   │
     │◄══════════ Direct P2P Media Stream (Video/Audio) ═════════════════════►│
```

### Key WebRTC Concepts Used

| Concept | Implementation |
|---|---|
| **RTCPeerConnection** | Created per remote peer in `connections{}` object |
| **SDP (Session Description Protocol)** | Exchanged as JSON via Socket.IO `"signal"` event |
| **ICE Candidates** | Gathered via `onicecandidate` callback, relayed through server |
| **STUN Server** | Google's public STUN: `stun:stun.l.google.com:19302` — discovers public IP for NAT traversal |
| **MediaStream API** | `getUserMedia()` for camera/mic, `getDisplayMedia()` for screen share |
| **Black Silence Fallback** | When no media available, creates a black video canvas + silent audio track as placeholder |
| **Mesh Topology** | Each peer has a direct connection to every other peer (N×(N-1)/2 connections) |

---

## ⚙ Backend Deep Dive

### Entry Point: `app.js`

1. Loads environment variables from root `.env` via `dotenv`
2. Creates Express app with CORS, JSON body parser (40KB limit)
3. Creates HTTP server and attaches Socket.IO with `connectToSocket()`
4. Mounts REST routes at `/api/v1/users`
5. Connects to MongoDB Atlas using connection string from env vars
6. Starts server on port 8080

### Socket Manager: `socketManager.js`

Manages three in-memory data structures:
- **`connections{}`**: Maps room URL → array of socket IDs (tracks who is in which room)
- **`messages{}`**: Maps room URL → array of chat messages (persists chat for late joiners)
- **`timeOnline{}`**: Maps socket ID → connection timestamp (tracks session duration)

**Events handled:**
| Event | Direction | Purpose |
|---|---|---|
| `join-call` | Client → Server | Add socket to room, notify all peers, send existing chat history |
| `signal` | Client → Server → Client | Relay SDP/ICE to target peer |
| `chat-message` | Client → Server → All Clients | Broadcast chat message to room |
| `disconnect` | Automatic | Remove socket from room, notify peers, cleanup |

### User Controller: `user.controller.js`

| Function | Method | Endpoint | Logic |
|---|---|---|---|
| `register` | POST | `/register` | Validate fields → check duplicate username → hash password (bcrypt, 10 rounds) → save to DB |
| `login` | POST | `/login` | Find user → bcrypt.compare password → generate 20-byte hex token → save token → return token |
| `addToHistory` | POST | `/add_to_activity` | Find user by token → create Meeting document → save |
| `getuserHistory` | GET | `/get_all_activity` | Find user by token → find all meetings by username → return |

---

## 🖥 Frontend Deep Dive

### Routing (`App.jsx`)

| Path | Component | Protected | Description |
|---|---|---|---|
| `/` | `LandingPage` | No | Public marketing/landing page |
| `/auth` | `AuthenticationPage` | No | Login & registration form |
| `/home` | `HomeComponent` | **Yes** (`withAuth`) | Dashboard to join meetings |
| `/history` | `History` | No (data protected) | View past meeting history |
| `/:url` | `VideoMeetComponent` | No | Video meeting room (dynamic route) |

### State Management

- **React Context API** (`AuthContext`): Provides `handleLogin`, `handleRegister`, `addToUserHistory`, `getHistoryOfuser` to all child components
- **localStorage**: Stores authentication token (`"token"` key)
- **Component-level `useState`**: Used extensively for form state, media toggles, chat messages, video streams

### Higher-Order Component: `withAuth`

```javascript
// Pattern: HOC (Higher-Order Component) for route protection
const withAuth = (WrappedComponent) => {
    const AuthComponent = (props) => {
        // Check localStorage for token
        // If absent → redirect to /auth
        // If present → render WrappedComponent
    }
    return AuthComponent;
}
```

This is a classic React pattern for protecting routes without middleware. It wraps `HomeComponent` to ensure only authenticated users access the dashboard.

### MUI Theming (`AppTheme.jsx`)

Uses MUI's `createTheme` + `ThemeProvider` to define a custom palette:
- Primary: `#1976d2` (blue)
- Secondary: `#dc004e` (pink)
- Mode: `light` (default)

The dark theme is achieved through custom CSS rather than MUI's dark mode.

### Video Meeting Component (`VideoMeet.jsx`)

The most complex component. Key lifecycle:

1. **Mount**: `getPermissions()` → requests camera, mic, screen share permissions
2. **Lobby**: Shows username input + video preview
3. **Connect**: `connect()` → `getMedia()` → `connectToSocketServer()`
4. **Socket Events**: Listens for `user-joined`, `user-left`, `signal`, `chat-message`
5. **Peer Connections**: Creates `RTCPeerConnection` for each peer, exchanges SDP/ICE
6. **Media Controls**: Toggle video/audio/screen with state → `useEffect` triggers `getUserMedia`/`getDisplayMedia`
7. **Chat**: Sends via socket, receives via listener, displays with unread badge
8. **Cleanup**: `handleEndCall()` stops all tracks, navigates to `/home`

---

## 🗄 Database Schema

### User Collection
```javascript
{
  name:     { type: String, required: true },          // Display name
  username: { type: String, required: true, unique: true }, // Login identifier
  password: { type: String, required: true },          // bcrypt hashed
  token:    { type: String }                           // Session token (nullable)
}
```

### Meeting Collection
```javascript
{
  user_id:     { type: String },                       // Username of the participant
  meetingCode: { type: String, required: true },       // Room identifier
  date:        { type: Date, default: Date.now, required: true } // Auto-timestamped
}
```

---

## 📡 API Endpoints

| Method | Endpoint | Body / Query | Response | Description |
|---|---|---|---|---|
| POST | `/api/v1/users/register` | `{ name, username, password }` | `201 Created` | Register new user |
| POST | `/api/v1/users/login` | `{ username, password }` | `200 OK` + `{ token }` | Authenticate user |
| POST | `/api/v1/users/add_to_activity` | `{ token, meeting_code }` | `201 Created` | Log meeting to history |
| GET | `/api/v1/users/get_all_activity` | `?token=xxx` | `200 OK` + `[meetings]` | Fetch user's meeting history |

---

## 📨 Socket.IO Events

| Event | Direction | Payload | Purpose |
|---|---|---|---|
| `join-call` | Client → Server | `path` (room URL) | Join a meeting room |
| `user-joined` | Server → All Clients | `socketId, clientsList` | Notify room of new participant |
| `user-left` | Server → All Clients | `socketId` | Notify room of departure |
| `signal` | Client ↔ Server ↔ Client | `toId, message` (JSON SDP/ICE) | WebRTC signaling relay |
| `chat-message` | Client → Server → All | `data, sender` | Broadcast chat message |

---

## 🔐 Authentication Mechanism

```
Register Flow:
Client → POST /register { name, username, password }
Server → Check if username exists → bcrypt.hash(password, 10) → Save User → 201

Login Flow:
Client → POST /login { username, password }
Server → Find user → bcrypt.compare(password, hash) → crypto.randomBytes(20).toString('hex')
       → Save token to user document → Return { token }
Client → localStorage.setItem("token", token) → Navigate to /home

Protected Route Access:
withAuth HOC → Check localStorage.getItem("token") → If null → redirect /auth

API Authorization:
Client sends token in request body/query → Server finds user by token → Performs action
```

**Note**: This is NOT JWT-based. The token is a random string stored in the database. Each login generates a new token, effectively invalidating previous sessions.

---

## 🌍 Environment Configuration

### `.env` (Root level — shared by backend)
```env
DB_USER=<mongodb_atlas_username>
DB_PASSWORD=<mongodb_atlas_password>
DB_CLUSTER=<cluster_hostname>   # e.g., cluster0.xxxxx.mongodb.net
DB_NAME=<database_name>
```

### `frontend/src/environment.js`
```javascript
let IS_PROD = false;  // Toggle for production/development

const server = IS_PROD
  ? "https://your-production-url.com"
  : "http://localhost:8080";
```

---

## 🚀 How to Run

### Prerequisites
- **Node.js** v18+ installed
- **MongoDB Atlas** account with a cluster and database user configured
- **Git** (optional)

### 1. Clone & Configure
```bash
git clone <repo-url>
cd "video conferencing"
```

Create a `.env` file in the project root:
```env
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_CLUSTER=cluster0.xxxxx.mongodb.net
DB_NAME=myDatabase
```

### 2. Start Backend
```bash
cd backend
npm install
node src/app.js        # or: npx nodemon src/app.js
```
Backend runs on **http://localhost:8080**

### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on **http://localhost:5173**

### 4. Open in Browser
Navigate to `http://localhost:5173` — you'll see the landing page.

> **Note (Windows)**: If you get a PowerShell execution policy error, run:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```

---

## 🌐 Deployment Architecture

The application is architected for **zero-cost hosting on generous free tiers**:

| Component | Platform | Free Tier Allowance | Details |
|---|---|---|---|
| **Frontend** | **Vercel** | Unlimited static hosting | React + Vite single page application with automatic CI/CD |
| **Database** | **MongoDB Atlas** | 512 MB storage (M0 Cluster) | Free forever cloud database with connection pooling |
| **Backend REST API** | **AWS Lambda** + **API Gateway** | 1 Million requests/month + 3.2M sec compute | Express app wrapped via `serverless-http` (`apiHandler.js`) |
| **WebRTC Signaling & Chat** | **AWS API Gateway WebSocket** + **Lambda** | 1 Million messages/month + 1M connection minutes | Native serverless WebSockets with room management in MongoDB |

---

### 🚀 Deploying Backend to AWS Lambda (Free Tier)

#### Prerequisites
1. [AWS Account](https://aws.amazon.com/) (Free Tier)
2. AWS CLI configured locally (`aws configure`) or AWS Access Key & Secret

#### Option A: Deploy using Serverless Framework (Recommended)
From the `backend` directory:
```bash
# 1. Install dependencies
npm install

# 2. Deploy to AWS
npx serverless deploy
```

Once deployment completes, Serverless will output:
- `httpApi`: `https://<api-id>.execute-api.us-east-1.amazonaws.com` (Your REST API URL)
- `wss`: `wss://<api-id>.execute-api.us-east-1.amazonaws.com/prod` (Your WebSocket URL)

#### Option B: Deploy using AWS SAM
From the `backend` directory:
```bash
sam build
sam deploy --guided
```

---

### 🚀 Deploying Frontend to Vercel

1. Push your repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/):
   - Import your GitHub repository.
   - Set **Root Directory** to `frontend`.
   - Add the following **Environment Variables**:
     - `VITE_BACKEND_URL`: Your AWS HTTP API URL (e.g., `https://<api-id>.execute-api.us-east-1.amazonaws.com`)
     - `VITE_WS_URL`: Your AWS WebSocket API URL (e.g., `wss://<api-id>.execute-api.us-east-1.amazonaws.com/prod`)
3. Click **Deploy**.

---

### 💻 Local Development

You can still run the backend and frontend locally without any cloud setup:
```bash
# Terminal 1: Backend (Express + local Socket.IO on port 8080)
cd backend
npm run dev

# Terminal 2: Frontend (Vite on port 5173)
cd frontend
npm run dev
```

---

## 🎓 Key Concepts & Interview Topics

### WebRTC
- **What is WebRTC?** Browser API for peer-to-peer real-time communication (video, audio, data) without plugins.
- **What is SDP?** Session Description Protocol — describes media capabilities, codecs, and connection info exchanged between peers.
- **What is ICE?** Interactive Connectivity Establishment — framework for finding the best path between peers (direct, STUN, TURN).
- **STUN vs TURN**: STUN discovers public IP (lightweight). TURN relays media through server when direct connection fails (bandwidth-heavy).
- **Mesh vs SFU vs MCU**: This project uses **Mesh** (peer-to-peer). SFU (Selective Forwarding Unit) routes streams through a server. MCU mixes streams server-side.
- **Why does mesh not scale?** Each peer needs N-1 upload streams. For 6 users = 30 connections total. SFU solves this.
- **`onicecandidate`**: Fired when the ICE agent finds a new candidate. Must be relayed to the remote peer.
- **`onaddstream`** (deprecated but used): Fired when a remote peer adds a media stream to the connection.
- **Offer/Answer Model**: Caller creates offer → sets local description → sends to callee → callee sets remote description → creates answer → sends back.

### Socket.IO
- **Why Socket.IO over raw WebSockets?** Automatic reconnection, fallback to HTTP long-polling, room/namespace support, event-based API.
- **Why not use Socket.IO for media?** WebSocket is TCP-based (reliable but slow). WebRTC uses UDP (fast, tolerates packet loss) — critical for real-time media.
- **Rooms**: This project uses the meeting URL as a room identifier in the `connections{}` map.

### React Patterns
- **Context API**: Global state without prop drilling. Used for auth state across all components.
- **Higher-Order Components (HOC)**: `withAuth` wraps components to add auth checking. Classic pattern before hooks.
- **Controlled Components**: All form inputs use `value` + `onChange` pattern (controlled by React state).
- **`useRef`**: Used for Socket.IO ref, video elements, and mutable values that shouldn't trigger re-renders.
- **`useEffect` with dependencies**: Media toggles (`audio`, `video`, `screen`) trigger effects to call `getUserMedia`/`getDisplayMedia`.
- **CSS Modules**: `videoComponent.module.css` provides scoped class names (e.g., `styles.meetVideoContainer`) to avoid global CSS collisions.

### Node.js / Express
- **ES Modules**: Backend uses `"type": "module"` with `import/export` syntax instead of CommonJS `require()`.
- **`__dirname` in ES Modules**: Not available natively — reconstructed using `fileURLToPath(import.meta.url)`.
- **Middleware chain**: `cors()` → `express.json()` → `express.urlencoded()` → route handlers.
- **MVC Pattern**: Models (Mongoose schemas) → Controllers (business logic) → Routes (endpoint mapping).

### MongoDB / Mongoose
- **ODM**: Mongoose maps JavaScript objects to MongoDB documents with schema validation.
- **`unique: true`**: Enforces uniqueness at the database level (creates a unique index on `username`).
- **`default: Date.now`**: Auto-populates the `date` field when a meeting document is created.
- **Atlas Connection String**: Uses SRV record format (`mongodb+srv://`) for DNS-based cluster discovery.

### Security
- **bcrypt**: Adaptive hashing with salt. 10 rounds = ~10 hashes/sec (intentionally slow to resist brute force).
- **crypto.randomBytes**: Cryptographically secure random token generation (20 bytes = 40 hex chars).
- **CORS**: Configured with `origin: "*"` (permissive — should be restricted in production).
- **Input Validation**: Server-side checks for required fields before database operations.
- **No JWT**: Simpler token approach — token is stored in DB and looked up per request.

### CSS / Design
- **Glassmorphism**: Semi-transparent backgrounds + `backdrop-filter: blur()` for frosted glass effect.
- **CSS `clamp()`**: Fluid typography that scales between a min and max value based on viewport width.
- **CSS Modules vs Global CSS**: Modules for component-scoped styles (video room), global CSS for page layouts.
- **`@keyframes`**: `fadeIn` and `slideInRight` entrance animations used across all pages.
- **Media Queries**: Breakpoints at 968px (tablet), 768px/600px (mobile), 480px (small mobile).
- **`transform: scaleX(-1)`**: Mirrors the local video for a natural selfie-cam experience.

### Build Tooling
- **Vite**: Uses native ES modules in development for instant HMR. Rollup for production bundling.
- **nodemon**: Watches for file changes and auto-restarts the Node.js server during development.
- **ESLint**: Configured with React hooks and React Refresh plugins for code quality.

---

## 📋 Potential Interview Questions

1. **Explain the complete flow from a user clicking "Join" to seeing remote video.**
2. **What is the difference between STUN and TURN servers? Why do you only use STUN?**
3. **Why can't you use Socket.IO for video streaming directly?**
4. **What happens when a third user joins an existing 2-person call?**
5. **How does the mesh topology work and what are its limitations?**
6. **How is the authentication implemented? Why not JWT?**
7. **What is the purpose of the `blackSilence()` function?**
8. **How does screen sharing work under the hood?**
9. **What is the role of ICE candidates in establishing a WebRTC connection?**
10. **How would you scale this app to support 100+ participants?** (Answer: Replace mesh with SFU like mediasoup/Janus)
11. **What is `onicecandidate` and why is it important?**
12. **Explain the SDP offer/answer model.**
13. **What is the purpose of `useRef` vs `useState` in the video component?**
14. **How does the HOC pattern (`withAuth`) work for route protection?**
15. **What is the Context API and how is it used here instead of Redux?**

---

## 📄 License

ISC

---

*Built with ❤️ using React, Node.js, WebRTC, and Socket.IO*
