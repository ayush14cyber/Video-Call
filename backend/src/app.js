import path from "path";
import express from "express";
import { createServer } from "node:http";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../../.env") });
dotenv.config();

import userRoutes from "./routes/users.routes.js";
import { connectDB } from "./config/db.js";
import { connectToSocket } from "./controllers/socketManager.js";

const app = express();

app.set("port", process.env.PORT || 8080);
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "*"],
}));
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// REST API routes
app.use("/api/v1/users", userRoutes);

app.get("/home", (req, res) => {
  return res.json({ hello: "world", environment: process.env.AWS_LAMBDA_FUNCTION_NAME ? "aws-lambda" : "standalone" });
});

app.get("/health", (req, res) => {
  return res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve frontend build if dist folder exists (for monolithic hosting)
const distPath = path.join(__dirname, "../../frontend/dist");
app.use(express.static(distPath));

// Only start HTTP & Socket.IO server if not running in AWS Lambda
const isStandalone = !process.env.AWS_LAMBDA_FUNCTION_NAME && process.env.NODE_ENV !== "test";

if (isStandalone) {
  const server = createServer(app);
  connectToSocket(server);

  connectDB()
    .then(() => {
      const port = app.get("port");
      server.listen(port, "0.0.0.0", () => {
        console.log(`Server is running on port ${port} (Standalone/Render mode)`);
      });
    })
    .catch((err) => {
      console.error("Failed to start server:", err);
    });
}

export { app };
export default app;