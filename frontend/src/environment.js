// Vite sets import.meta.env.PROD automatically: true for `vite build`, false for `vite dev`
const IS_PROD = import.meta.env.PROD;

// REST API Base URL (AWS Lambda via API Gateway HTTP API or Function URL)
const server =
  import.meta.env.VITE_BACKEND_URL ||
  (IS_PROD
    ? "https://YOUR_API_GATEWAY_HTTP_URL.execute-api.us-east-1.amazonaws.com"
    : "http://localhost:8080");

// WebSocket URL for WebRTC signaling (AWS API Gateway WebSocket API or local ws://)
const ws_server =
  import.meta.env.VITE_WS_URL ||
  (IS_PROD
    ? "wss://YOUR_API_GATEWAY_WS_URL.execute-api.us-east-1.amazonaws.com/prod"
    : "http://localhost:8080");

export { IS_PROD, server, ws_server };
