
import "dotenv/config";
import process from "node:process";
import { createServer } from "node:http";
import { Server } from "socket.io";

import app from "./app.js";
import { connectDB } from "./utils/db.js";
import { registerSockets } from "./sockets/index.js";
import { startReminderJob } from "./services/reminderJob.js";
import "./utils/models.js";

const port = Number(process.env.PORT) || 8001;

async function main() {
  // Connect to MongoDB
  await connectDB();

  // Create HTTP server
  const httpServer = createServer(app);

  // Set up Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  // Register authenticated socket connections
  registerSockets(io);

  // Make Socket.IO available to API controllers
  app.set("io", io);

  // Start automatic assignment deadline reminders
  startReminderJob(io);

  // Start backend server
  httpServer.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log("Notification system initialized");
    console.log("Real-time notifications enabled");
    console.log("Automatic reminder scheduler started");
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
