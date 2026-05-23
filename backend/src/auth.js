/**
 * Authentication Module
 * Handles user authentication, JWT tokens, and password hashing
 */

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRY = "24h";

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token
 */
export function generateToken(userId, username) {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return null;
  }
}

/**
 * Middleware to check authentication
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }

  req.user = decoded;
  next();
}

/**
 * Create user object (for database storage)
 */
export async function createUser(username, password, email) {
  const hashedPassword = await hashPassword(password);
  return {
    id: `user-${Date.now()}`,
    username,
    email,
    password: hashedPassword,
    createdAt: new Date(),
  };
}

export default {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  authenticateToken,
  createUser,
};
