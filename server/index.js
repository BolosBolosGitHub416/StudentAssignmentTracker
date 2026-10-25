// server/index.js
import 'dotenv/config';
import process from 'node:process';
import http from 'node:http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './utils/db.js';
import { registerSockets } from './sockets/index.js';
import { startReminderJob } from './services/reminderJob.js';
// Ensure models are registered
import './utils/models.js';

const port = Number(process.env.PORT) || 8001;

async function main() {
  await connectDB();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || true,
      credentials: true,
    },
  });

  app.set('io', io);
  registerSockets(io);
  startReminderJob(io);

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
