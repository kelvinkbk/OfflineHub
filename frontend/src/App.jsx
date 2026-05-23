import React, { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [messages, setMessages] = useState([])
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [messageInput, setMessageInput] = useState('')

  useEffect(() => {
    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Register service worker for offline support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(() => console.log('Service worker registered'))
        .catch(err => console.log('Service worker registration failed:', err))
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!messageInput.trim()) return

    const newMessage = {
      id: Date.now(),
      text: messageInput,
      timestamp: new Date().toLocaleTimeString(),
      sender: 'You',
      synced: isOnline
    }

    setMessages([...messages, newMessage])
    setMessageInput('')

    // TODO: Send to backend or WebRTC peer
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>OfflineHub 📱</h1>
        <div className={`status ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? '🟢 Online' : '🔴 Offline'}
        </div>
      </header>

      <main className="app-main">
        <div className="messages-container">
          <h2>Messages</h2>
          <div className="messages-list">
            {messages.length === 0 ? (
              <p className="empty-state">No messages yet. Start chatting!</p>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className="message">
                  <strong>{msg.sender}</strong>
                  <p>{msg.text}</p>
                  <small>
                    {msg.timestamp} 
                    {msg.synced ? ' ✓' : ' (pending sync)'}
                  </small>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="features">
          <h2>Features</h2>
          <div className="feature-grid">
            <div className="feature-card">
              <span>💬</span>
              <p>Local Chat</p>
            </div>
            <div className="feature-card">
              <span>🎙️</span>
              <p>Walkie-Talkie</p>
            </div>
            <div className="feature-card">
              <span>📁</span>
              <p>File Sharing</p>
            </div>
            <div className="feature-card">
              <span>📡</span>
              <p>P2P Network</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <form onSubmit={handleSendMessage}>
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message..."
            disabled={!isOnline && messages.length === 0}
          />
          <button type="submit">Send</button>
        </form>
      </footer>
    </div>
  )
}

export default App
