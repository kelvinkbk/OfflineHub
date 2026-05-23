# Backend API Routes

## Health & Info
- `GET /api/health` - Check server status
- `GET /api/info` - Get API information

## WebSocket Events

### Connection
- `user-joined` - User joins the network
- `users-list` - Broadcast list of connected users
- `user-joined` - Notify others of new user

### Messaging
- `send-message` - Send a message
- `receive-message` - Receive a message
- `user-typing` - Typing indicator

### Files
- `file-shared` - Notify file upload
- `file-available` - Broadcast file availability

### Disconnection
- `disconnect` - User leaves the network

## File Structure
- `server.js` - Main server and socket.io setup
- `routes/` - API endpoints
- `controllers/` - Business logic
- `models/` - Data models
- `middleware/` - Custom middleware
- `services/` - Service layer
