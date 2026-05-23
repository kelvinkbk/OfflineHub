// Message type
export const MessageType = {
  TEXT: 'text',
  FILE: 'file',
  VOICE: 'voice',
  LOCATION: 'location',
  SYSTEM: 'system'
}

// User status
export const UserStatus = {
  ONLINE: 'online',
  AWAY: 'away',
  OFFLINE: 'offline',
  BUSY: 'busy'
}

// Socket events
export const SocketEvents = {
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  SEND_MESSAGE: 'send-message',
  RECEIVE_MESSAGE: 'receive-message',
  USER_TYPING: 'user-typing',
  FILE_SHARED: 'file-shared',
  FILE_AVAILABLE: 'file-available',
  CALL_INITIATED: 'call-initiated',
  CALL_ACCEPTED: 'call-accepted',
  CALL_ENDED: 'call-ended'
}

// Error codes
export const ErrorCodes = {
  INVALID_MESSAGE: 'INVALID_MESSAGE',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  SERVER_ERROR: 'SERVER_ERROR'
}
