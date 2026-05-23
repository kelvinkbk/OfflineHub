// Validation utilities
export function validateMessage(message) {
  if (!message) return false;
  if (!message.content || typeof message.content !== "string") return false;
  if (message.content.trim().length === 0) return false;
  if (message.content.length > 5000) return false;
  return true;
}

export function validateUser(user) {
  if (!user) return false;
  if (!user.name || typeof user.name !== "string") return false;
  if (user.name.trim().length === 0) return false;
  if (user.name.length > 100) return false;
  return true;
}

// Formatting utilities
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export function formatTimestamp(date) {
  return new Date(date).toLocaleTimeString();
}

// Error utilities
export function createError(code, message) {
  return { code, message };
}

// UUID generator
export function generateId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default {
  validateMessage,
  validateUser,
  formatFileSize,
  formatTimestamp,
  createError,
  generateId,
};
