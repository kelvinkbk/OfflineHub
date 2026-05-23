// Message type definition
export interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  type: 'text' | 'file' | 'voice' | 'location'
  timestamp: Date
  synced: boolean
  recipients?: string[]
}

// User type definition
export interface User {
  id: string
  name: string
  avatar?: string
  status: 'online' | 'away' | 'offline' | 'busy'
  lastSeen?: Date
  location?: {
    latitude: number
    longitude: number
  }
}

// File metadata
export interface FileMetadata {
  id: string
  name: string
  type: string
  size: number
  sender: string
  timestamp: Date
  path?: string
}

// Chat room
export interface ChatRoom {
  id: string
  name: string
  members: string[]
  createdAt: Date
  updatedAt: Date
}
