import serverless from "serverless-http";
import { app } from "../app.js";
import { connectDB } from "../config/db.js";

const serverlessApp = serverless(app, {
  // Support binary types if needed
  binary: ["image/*", "application/octet-stream"],
});

export const handler = async (event, context) => {
  // Ensure the Lambda function freezes immediately after returning response
  // rather than waiting for MongoDB socket background timers
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    await connectDB();
  } catch (err) {
    console.error("Database connection error in Lambda:", err);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "Database connection failed", error: err.message }),
    };
  }

  return await serverlessApp(event, context);
};
