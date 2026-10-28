import io from "socket.io-client";

/**
 * Universal Socket Adapter supporting:
 * 1. AWS API Gateway WebSocket (wss:// or ws://)
 * 2. Traditional Socket.IO (https:// or http://)
 */
class ApiGatewayWebSocketAdapter {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.id = null;
    this.listeners = {};
    this.messageQueue = [];
    this.isExplicitDisconnect = false;
    this.pingInterval = null;

    this.connect();
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log("WebSocket connected to AWS API Gateway");
        // Start keepalive ping every 5 minutes (well within AWS 10min idle timeout)
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ action: "ping" }));
          }
        }, 300000);

        // Notify local listeners that the WebSocket connection is open
        this.emitLocal("connect");

        // Flush any queued messages
        while (this.messageQueue.length > 0) {
          const msg = this.messageQueue.shift();
          this.ws.send(JSON.stringify(msg));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const type = payload.type || payload.action;

          switch (type) {
            case "connect":
              this.id = payload.id;
              this.emitLocal("connect", payload.id);
              break;

            case "user-joined":
              this.emitLocal("user-joined", payload.id, payload.clients);
              break;

            case "signal":
              this.emitLocal("signal", payload.fromId, payload.message);
              break;

            case "chat-message":
              this.emitLocal("chat-message", payload.data, payload.sender, payload.socketIdSender);
              break;

            case "user-left":
              this.emitLocal("user-left", payload.id);
              break;

            default:
              if (type) {
                this.emitLocal(type, payload.data || payload);
              }
              break;
          }
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e, event.data);
        }
      };

      this.ws.onclose = () => {
        if (this.pingInterval) clearInterval(this.pingInterval);
        console.log("WebSocket closed");
        this.emitLocal("disconnect");
      };

      this.ws.onerror = (err) => {
        console.error("WebSocket error:", err);
      };
    } catch (err) {
      console.error("Error creating WebSocket:", err);
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
  }

  emitLocal(event, ...args) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => {
        try {
          cb(...args);
        } catch (e) {
          console.error(`Error in event listener for ${event}:`, e);
        }
      });
    }
  }

  emit(event, ...args) {
    let payload = null;

    if (event === "join-call") {
      payload = { action: "join-call", path: args[0], username: args[1] || "Guest" };
    } else if (event === "signal") {
      payload = { action: "signal", toId: args[0], message: args[1] };
    } else if (event === "chat-message") {
      payload = { action: "chat-message", data: args[0], sender: args[1] };
    } else {
      payload = { action: event, data: args[0] };
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    } else {
      this.messageQueue.push(payload);
    }
  }

  disconnect() {
    this.isExplicitDisconnect = true;
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.ws) {
      this.ws.close();
    }
  }
}

/**
 * Connect to socket server
 * Detects whether the URL is a WebSocket (ws:// or wss://) or HTTP/HTTPS (Socket.IO)
 */
export const connectSocket = (url, options = {}) => {
  if (url.startsWith("ws://") || url.startsWith("wss://")) {
    return new ApiGatewayWebSocketAdapter(url);
  }

  // Socket.IO client for standard servers (Render, local, etc.)
  const isHttps = url.startsWith("https");
  return io.connect(url, {
    ...options,
    ...(isHttps ? { secure: true } : {})
  });
};

export default connectSocket;
