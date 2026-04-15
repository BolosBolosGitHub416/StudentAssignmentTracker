// server/index.js
// Import necessary modules, and middleware
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import logger from './middleware/logger.js';
import authRouter from './routers/auth.js';
import assignmentRouter from './routers/assignments.js';
import userRouter from './routers/users.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

dotenv.config(); // Load environment variables from .env file

const app = express(); // Create an Express application

app.use(cors()); // Enable CORS for all routes (configure as needed for production)
app.use(express.json()); // Middleware to parse JSON request bodies
app.use(logger); // Custom middleware to log request details
// Health check endpoint to verify the server is running
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Student Assignment Tracker API' });
});

app.use('/api/auth', authRouter); // Routes for authentication (register, login, profile)
app.use('/api/assignments', assignmentRouter); // Routes for assignment management (CRUD operations)
app.use('/api/users', userRouter); // Routes for user management (admin-only access)

app.use(notFound); // Middleware to handle 404 Not Found errors
app.use(errorHandler); // Middleware to handle general errors and send appropriate responses

const port = process.env.PORT || 5000; // Use PORT from environment variables or default to 5000
// Start the server and listen on the specified port
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
