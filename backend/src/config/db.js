import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../../../.env") });
dotenv.config();

let cachedConnection = null;

export const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  const user = process.env.DB_USER;
  const pass = encodeURIComponent(process.env.DB_PASSWORD || "");
  const cluster = process.env.DB_CLUSTER;
  const dbName = process.env.DB_NAME || "videoConferencing";

  const uri = process.env.MONGO_URI || (
    user && cluster
      ? `mongodb+srv://${user}:${pass}@${cluster}/${dbName}?retryWrites=true&w=majority`
      : null
  );

  if (!uri) {
    throw new Error("Missing MongoDB connection parameters (MONGO_URI or DB_USER, DB_PASSWORD, DB_CLUSTER).");
  }

  try {
    cachedConnection = await mongoose.connect(uri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
    return cachedConnection;
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
};
