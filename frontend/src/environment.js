// Vite sets import.meta.env.PROD automatically: true for `vite build`, false for `vite dev`
const IS_PROD = import.meta.env.PROD;

// REST API Base URL (AWS Lambda via API Gateway HTTP API, Render, or local server)
const rawServer =
  import.meta.env.VITE_BACKEND_URL ||
  (IS_PROD ? "" : "http://localhost:8080");

const server = rawServer ? rawServer.replace(/\/+$/, "") : "";

// WebSocket URL for WebRTC signaling:
// 1. AWS API Gateway WebSocket (e.g. wss://xxx.execute-api.us-east-1.amazonaws.com/prod via VITE_WS_URL)
// 2. Standard server / Socket.IO (defaults to server URL)
// 3. Local dev fallback (http://localhost:8080)
const rawWsServer =
  import.meta.env.VITE_WS_URL ||
  (server || (IS_PROD ? "" : "http://localhost:8080"));

const ws_server = rawWsServer ? rawWsServer.replace(/\/+$/, "") : "";

export { IS_PROD, server, ws_server };
