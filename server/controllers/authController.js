// server/controllers/authController.js
// Handles user registration, login, and profile retrieval
// Uses bcrypt for password hashing and JWT for authentication
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth.js'; // Utility function to generate JWT tokens
import { users } from '../models/users.js'; // In-memory user store (replace with DB in production)
// Helper function to find a user by email
const findUserByEmail = (email) => users.find((user) => user.email === email);
// Registration controller to create a new user and return a JWT token  
export const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role = 'student' } = req.body; 
    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required registration fields' });
    }
    // Check if the email is already registered
    if (findUserByEmail(email)) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    // Hash the password and create a new user
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create a new user object and add it to the in-memory store  
    const newUser = {
      _id: `${Date.now()}`,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
    };

    users.push(newUser); // Add the new user to the in-memory store
    const token = generateToken(newUser); // Generate a JWT token for the new user
    // Return the token and user information (excluding the password) in the response
    res.status(201).json({ token, user: { ...newUser, password: undefined } });
  } catch (error) { // Handle any errors that occur during registration
    next(error);
  }
};
// Login controller to authenticate users and return a JWT token
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body; // Validate required fields
    // Check if the email and password are provided in the request body
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    // Find the user by email in the in-memory store and verify the password
    const existingUser = findUserByEmail(email); // Find the user by email in the in-memory store
    if (!existingUser) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // Compare the provided password with the stored hashed password using bcrypt
    const passwordMatches = await bcrypt.compare(password, existingUser.password);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // If authentication is successful, generate a JWT token and return it along with user
    // information (excluding the password)
    const token = generateToken(existingUser);
    res.json({ token, user: { ...existingUser, password: undefined } });
  } catch (error) {
    next(error);
  }
};
// Profile controller to return the authenticated user's profile information
export const profile = (req, res) => {
  const { password, ...user } = req.user;
  res.json({ user });
};
