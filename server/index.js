// server/index.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import logger from "./middleware/logger.js";

import authRouter from "./routers/auth.js";
import assignmentRouter from "./routers/assignments.js";
import userRouter from "./routers/users.js";
import announcementRoutes from "./routers/announcements.js";
import analyticsRouter from "./routers/analytics.js"; 
import messageRouter from "./routers/messages.js";
import notificationRouter from "./routers/notifications.js";
import { registerSockets } from "./sockets/index.js";
import { startReminderJob } from "./services/reminderJob.js";


import { notFound, errorHandler } from "./middleware/errorHandler.js";

import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();

// Create HTTP server for Socket.IO
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

app.set("io", io);
app.use(cors());
app.use("/api/messages", messageRouter);
app.use("/api/notifications", notificationRouter);
app.use(express.json());
app.use(logger);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Student Assignment Tracker API" });
});

// Existing routes
app.use("/api/auth", authRouter);
app.use("/api/assignments", assignmentRouter);
app.use("/api/users", userRouter);

// New announcements route
app.use("/api/announcements", announcementRoutes);
app.use("/api/analytics", analyticsRouter);


// Error handlers
app.use(notFound);
app.use(errorHandler);

// Socket connection
registerSockets(io);

const port = process.env.PORT || 8001;

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

startReminderJob(io);
