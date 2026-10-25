// server/controllers/authController.js
// Handles user registration, login, and profile retrieval
// Uses bcrypt for password hashing and JWT for authentication

import bcrypt from "bcryptjs";
import process from "node:process";
import { generateToken } from "../middleware/auth.js"; // JWT generator
import { saveUsers, users } from "../models/users.js";
import sendEmail from "../utils/sendEmail.js"; // Email utility

// Helper function to find a user by email
const findUserByEmail = (email) =>
  users.find((user) => user.email === email.trim().toLowerCase());


// REGISTER USER
export const register = async (req, res, next) => {
  try {
    const { password, firstName, lastName } = req.body;
    const normalizedEmail = typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";

    // Validate required fields
    if (!normalizedEmail || !password || !firstName || !lastName) {
      return res
        .status(400)
        .json({ error: "Missing required registration fields" });
    }

    // Check if email already exists
    if (findUserByEmail(normalizedEmail)) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user object
    const newUser = {
      _id: `${Date.now()}`,
      email: normalizedEmail,
      password: hashedPassword,
      firstName,
      lastName,
      role: "student",
    };

    // Save user
    users.push(newUser);
    try {
      saveUsers();
    } catch (error) {
      users.pop();
      throw error;
    }

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await sendEmail(
        normalizedEmail,
        "Welcome to Student Portal",
        `Hello ${firstName}, your account was successfully created.`
      );
    }

    // Generate JWT
    const token = generateToken(newUser);

    // Return response
    res.status(201).json({
      token,
      user: { ...newUser, password: undefined },
    });
  } catch (error) {
    next(error);
  }
};


// LOGIN USER
export const login = async (req, res, next) => {
  try {
    const { password } = req.body;
    const email = typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existingUser = findUserByEmail(email);

    if (!existingUser) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare password
    const passwordMatches = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(existingUser);

    res.json({
      token,
      user: { ...existingUser, password: undefined },
    });
  } catch (error) {
    next(error);
  }
};


// USER PROFILE
export const profile = (req, res) => {
  const user = { ...req.user };
  delete user.password;
  res.json({ user });
};