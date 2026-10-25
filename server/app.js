// server/app.js
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRouter from "./routers/auth.js";
import assignmentRouter from "./routers/assignments.js";
import userRouter from "./routers/users.js";
import analyticsRouter from "./routers/analytics.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import logger from "./middleware/logger.js";

dotenv.config({ path: fileURLToPath(new URL("./.env", import.meta.url)) });

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || true, credentials: true }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Too many authentication attempts, try again later." },
});

app.use(express.json({ limit: "100kb" }));
app.use(logger);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Student Assignment Tracker API" });
});

app.use("/api/auth", authLimiter, authRouter);
app.use("/api/assignments", assignmentRouter);
app.use("/api/users", userRouter);
app.use("/api/analytics", analyticsRouter);

// Kaynaan's routes (announcements / notifications / messages) can be added later

app.use(notFound);
app.use(errorHandler);

export default app;
