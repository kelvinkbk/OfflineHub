import express from 'express'
import cors from 'cors'
import { Server } from 'socket.io'
import http from 'http'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'OfflineHub backend is running' })
})

app.get('/api/info', (req, res) => {
  res.json({
    name: 'OfflineHub API',
    version: '1.0.0',
    description: 'Backend API for offline-first social app',
    features: ['chat', 'file-sharing', 'walkie-talkie', 'p2p-network']
  })
})

// Socket.io connection handling
const connectedUsers = new Map()

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`)

  // Store user connection
  socket.on('user-joined', (userData) => {
    connectedUsers.set(socket.id, {
      id: socket.id,
      ...userData,
      timestamp: new Date()
    })
    
    // Broadcast user list to all clients
    io.emit('users-list', Array.from(connectedUsers.values()))
    socket.broadcast.emit('user-joined', userData)
  })

  // Handle messages
  socket.on('send-message', (message) => {
    const user = connectedUsers.get(socket.id)
    const fullMessage = {
      ...message,
      senderId: socket.id,
      senderName: user?.name || 'Anonymous',
      timestamp: new Date()
    }
    
    io.emit('receive-message', fullMessage)
  })

  // Handle file upload notification
  socket.on('file-shared', (fileInfo) => {
    const user = connectedUsers.get(socket.id)
    io.emit('file-available', {
      ...fileInfo,
      senderName: user?.name || 'Anonymous',
      timestamp: new Date()
    })
  })

  // Handle typing indicator
  socket.on('user-typing', (data) => {
    socket.broadcast.emit('user-typing', {
      userId: socket.id,
      isTyping: data.isTyping
    })
  })

  // Handle disconnect
  socket.on('disconnect', () => {
    connectedUsers.delete(socket.id)
    io.emit('users-list', Array.from(connectedUsers.values()))
    console.log(`User disconnected: ${socket.id}`)
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Start server
server.listen(PORT, () => {
  console.log(`🚀 OfflineHub backend running on http://localhost:${PORT}`)
  console.log(`📡 WebSocket server ready for connections`)
})

export { server, io }
