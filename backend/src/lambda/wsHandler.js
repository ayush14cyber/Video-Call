import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from "@aws-sdk/client-apigatewaymanagementapi";
import { connectDB } from "../config/db.js";
import { WsConnection } from "../models/wsConnection.model.js";
import { WsMessage } from "../models/wsMessage.model.js";

const getApiClient = (event) => {
  const domainName = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  const endpoint = `https://${domainName}/${stage}`;
  return new ApiGatewayManagementApiClient({ endpoint });
};

const postToConnection = async (apiClient, connectionId, payload) => {
  try {
    await apiClient.send(
      new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: Buffer.from(JSON.stringify(payload)),
      })
    );
    return true;
  } catch (err) {
    // 410 GoneException: connection has disconnected or closed
    if (err.statusCode === 410 || err.name === "GoneException") {
      console.log(`Connection ${connectionId} is gone. Removing from database.`);
      await WsConnection.deleteOne({ connectionId });
    } else {
      console.error(`Error sending message to ${connectionId}:`, err.message);
    }
    return false;
  }
};

export const handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  await connectDB();

  const connectionId = event.requestContext?.connectionId;
  const routeKey = event.requestContext?.routeKey || "";

  let body = {};
  if (event.body) {
    try {
      body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    } catch (e) {
      body = {};
    }
  }

  // Determine action from routeKey ($connect, $disconnect) or body.action
  const action = body.action || routeKey;

  console.log(`WS Event: [routeKey: ${routeKey}, action: ${action}, connectionId: ${connectionId}]`);

  const apiClient = getApiClient(event);

  try {
    switch (action) {
      case "$connect": {
        // Client established WebSocket connection with API Gateway
        return { statusCode: 200, body: "Connected" };
      }

      case "join-call": {
        const path = body.path || "default";
        const username = body.username || "Guest";

        // Upsert connection in MongoDB
        await WsConnection.findOneAndUpdate(
          { connectionId },
          { connectionId, meetingPath: path, username, createdAt: new Date() },
          { upsert: true, new: true }
        );

        // Fetch all participants currently in this meeting room
        const roomConnections = await WsConnection.find({ meetingPath: path });
        const clientIds = roomConnections.map((c) => c.connectionId);

        // 1. Confirm connection ID to caller
        await postToConnection(apiClient, connectionId, {
          type: "connect",
          id: connectionId,
        });

        // 2. Broadcast user-joined to all users in this room (including caller)
        for (const clientId of clientIds) {
          await postToConnection(apiClient, clientId, {
            type: "user-joined",
            id: connectionId,
            clients: clientIds,
          });
        }

        // 3. Send past chat messages to newly joined participant
        const pastMessages = await WsMessage.find({ meetingPath: path })
          .sort({ createdAt: 1 })
          .limit(50);

        for (const msg of pastMessages) {
          await postToConnection(apiClient, connectionId, {
            type: "chat-message",
            data: msg.data,
            sender: msg.sender,
            socketIdSender: msg.socketIdSender,
          });
        }

        return { statusCode: 200, body: "Joined" };
      }

      case "signal": {
        const toId = body.toId;
        const message = body.message;

        if (toId) {
          await postToConnection(apiClient, toId, {
            type: "signal",
            fromId: connectionId,
            message: message,
          });
        }

        return { statusCode: 200, body: "Signaled" };
      }

      case "chat-message": {
        const data = body.data;
        const sender = body.sender || "Guest";

        // Find room for this connection
        const userConn = await WsConnection.findOne({ connectionId });
        if (userConn) {
          const path = userConn.meetingPath;

          // Save message in MongoDB
          await WsMessage.create({
            meetingPath: path,
            sender: sender,
            data: data,
            socketIdSender: connectionId,
          });

          // Broadcast to all participants in this room
          const roomConnections = await WsConnection.find({ meetingPath: path });
          for (const peer of roomConnections) {
            await postToConnection(apiClient, peer.connectionId, {
              type: "chat-message",
              data: data,
              sender: sender,
              socketIdSender: connectionId,
            });
          }
        }

        return { statusCode: 200, body: "Message broadcasted" };
      }

      case "$disconnect": {
        const userConn = await WsConnection.findOne({ connectionId });
        if (userConn) {
          const path = userConn.meetingPath;
          await WsConnection.deleteOne({ connectionId });

          // Notify other participants in the room that user left
          const remainingConnections = await WsConnection.find({ meetingPath: path });
          for (const peer of remainingConnections) {
            await postToConnection(apiClient, peer.connectionId, {
              type: "user-left",
              id: connectionId,
            });
          }

          // If room is empty, clean up messages
          if (remainingConnections.length === 0) {
            await WsMessage.deleteMany({ meetingPath: path });
          }
        } else {
          await WsConnection.deleteOne({ connectionId });
        }

        return { statusCode: 200, body: "Disconnected" };
      }

      default: {
        return { statusCode: 200, body: "Default action acknowledged" };
      }
    }
  } catch (err) {
    console.error("Error processing WebSocket event:", err);
    return { statusCode: 500, body: "Internal server error" };
  }
};
