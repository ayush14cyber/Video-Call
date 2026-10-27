import mongoose, { Schema } from "mongoose";

const wsMessageSchema = new Schema({
  meetingPath: {
    type: String,
    required: true,
    index: true,
  },
  sender: {
    type: String,
    required: true,
  },
  data: {
    type: String,
    required: true,
  },
  socketIdSender: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7200, // TTL index: messages auto expire after 2 hours
  },
});

export const WsMessage =
  mongoose.models.WsMessage || mongoose.model("WsMessage", wsMessageSchema);
