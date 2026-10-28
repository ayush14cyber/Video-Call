import serverless from "serverless-http";
import { app } from "../app.js";
import { connectDB } from "../config/db.js";

const serverlessApp = serverless(app, {
  binary: ["image/*", "application/octet-stream"],
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Requested-With,*",
};

export const handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const method = event.requestContext?.http?.method || event.httpMethod;

  // Handle CORS preflight immediately without touching DB
  if (method === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  try {
    await connectDB();
  } catch (err) {
    console.error("Database connection error in Lambda:", err);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
      body: JSON.stringify({ message: "Database connection failed", error: err.message }),
    };
  }

  const response = await serverlessApp(event, context);

  // Ensure CORS headers are always attached
  response.headers = {
    ...corsHeaders,
    ...(response.headers || {}),
  };

  return response;
};
