
import "dotenv/config";
import process from "node:process";
import { createServer } from "node:http";
import { Server } from "socket.io";

import app from "./app.js";
import { connectDB } from "./utils/db.js";
import { registerSockets } from "./sockets/index.js";
import "./utils/models.js";

const port = Number(process.env.PORT) || 8001;

// Create an HTTP server for Express and Socket.IO
const httpServer = createServer(app);

// Configure Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Make Socket.IO available to Express controllers
app.set("io", io);

// Register authenticated chat and notification events
registerSockets(io);

async function main() {
  await connectDB();

  httpServer.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log("Socket.IO server ready");
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
