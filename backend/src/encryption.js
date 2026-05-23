/**
 * Encryption Module
 * Handles message encryption/decryption for end-to-end encryption
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // For AES, this is always 16
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const ITERATIONS = 100000; // PBKDF2 iterations

/**
 * Derive encryption key from password
 */
export function deriveKey(password, salt = null) {
  const useSalt = salt || crypto.randomBytes(SALT_LENGTH);
  const key = crypto.pbkdf2Sync(password, useSalt, ITERATIONS, 32, "sha256");
  return { key, salt: useSalt };
}

/**
 * Encrypt message
 */
export function encryptMessage(message, password) {
  try {
    // Derive key and salt
    const { key, salt } = deriveKey(password);

    // Generate IV
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt message
    let encrypted = cipher.update(message, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Return salt + IV + authTag + encrypted message (all hex encoded)
    return {
      salt: salt.toString("hex"),
      iv: iv.toString("hex"),
      authTag: authTag.toString("hex"),
      encrypted,
    };
  } catch (error) {
    console.error("Encryption error:", error);
    return null;
  }
}

/**
 * Decrypt message
 */
export function decryptMessage(encryptedData, password) {
  try {
    // Extract components
    const salt = Buffer.from(encryptedData.salt, "hex");
    const iv = Buffer.from(encryptedData.iv, "hex");
    const authTag = Buffer.from(encryptedData.authTag, "hex");
    const encrypted = encryptedData.encrypted;

    // Derive key using same salt
    const { key } = deriveKey(password, salt);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt message
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
}

/**
 * Generate random encryption key
 */
export function generateRandomKey() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash data (for integrity checking)
 */
export function hashData(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Verify hash
 */
export function verifyHash(data, hash) {
  return hashData(data) === hash;
}

export default {
  encryptMessage,
  decryptMessage,
  deriveKey,
  generateRandomKey,
  hashData,
  verifyHash,
};
