import mongoose, { Schema } from "mongoose";

const wsConnectionSchema = new Schema({
  connectionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  meetingPath: {
    type: String,
    required: true,
    index: true,
  },
  username: {
    type: String,
    default: "Guest",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7200, // TTL index: auto expires after 2 hours
  },
});

export const WsConnection =
  mongoose.models.WsConnection || mongoose.model("WsConnection", wsConnectionSchema);
