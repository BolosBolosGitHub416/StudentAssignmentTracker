import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { fileURLToPath } from "node:url";
import authRouter from "./routers/auth.js";
import assignmentRouter from "./routers/assignments.js";
import userRouter from "./routers/users.js";
import analyticsRouter from "./routers/analytics.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

dotenv.config({ path: fileURLToPath(new URL("./.env", import.meta.url)) });

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Student Assignment Tracker API" });
});

app.use("/api/auth", authRouter);
app.use("/api/assignments", assignmentRouter);
app.use("/api/users", userRouter);

app.use("/api/analytics", analyticsRouter);


app.use(notFound);
app.use(errorHandler);

export default app;
