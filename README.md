# OfflineHub 📱

**An offline-first social app** that works with or without internet connection. Share messages, files, voice messages (walkie-talkie), and collaborate locally or globally.

## ✨ Features

### Core Features
- 💬 **Local Chat** - Real-time messaging between devices on same network or offline
- 🎙️ **Walkie-Talkie** - Push-to-talk voice communication (WebRTC)
- 📁 **File Sharing** - Share documents, images, media locally and globally
- 🌐 **Offline-First** - Works seamlessly without internet using service workers
- 📡 **Peer-to-Peer** - Direct device-to-device communication
- 🔄 **Auto-Sync** - Syncs data when connection returns
- 👥 **Local Network Discovery** - Auto-discover nearby users
- 🔒 **Encrypted Messages** - End-to-end encryption for privacy
- 📍 **Location Sharing** - Optional location sharing between trusted contacts
- ⏰ **Message Queue** - Messages stored locally, delivered when online

### Additional Features
- User profiles & avatars
- Group chat rooms
- Message search & history
- Audio/video call support
- File upload & media gallery
- Settings & privacy controls
- Dark/Light theme

## 🏗️ Architecture

```
OfflineHub/
├── frontend/              # React web app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/      # API & local storage
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── App.jsx
│   ├── public/
│   │   └── service-worker.js
│   └── package.json
├── backend/               # Node.js/Express server
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── services/
│   │   └── server.js
│   └── package.json
├── shared/                # Shared types & utilities
│   ├── src/
│   │   ├── types.ts
│   │   ├── constants.ts
│   │   └── utils.ts
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Yarn or npm
- Modern browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/OfflineHub.git
cd OfflineHub

# Install dependencies
yarn install-all

# Start development server
yarn dev
```

### Development Server
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📚 Project Structure

### Frontend (`frontend/`)
React-based web application with:
- Service Worker for offline support
- IndexedDB for local data persistence
- WebRTC for peer-to-peer communication
- Socket.io for real-time updates
- Redux/Context API for state management

### Backend (`backend/`)
Node.js/Express server providing:
- REST API for user management
- WebSocket server for real-time messaging
- File upload & storage
- User authentication & authorization
- Synchronization logic for offline data

### Shared (`shared/`)
TypeScript types and utilities:
- Message & User interfaces
- Constants & enums
- Validation functions
- Encryption utilities

## 🔧 Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, TailwindCSS, Socket.io |
| Backend | Node.js, Express, MongoDB, WebSocket |
| Real-time | Socket.io, WebRTC |
| Offline | Service Workers, IndexedDB, Sync API |
| Security | JWT, bcrypt, TLS/SSL |
| DevOps | Docker, GitHub Actions |

## 📋 Feature Roadmap

- [ ] Phase 1: Basic chat & local discovery
- [ ] Phase 2: File sharing & walkie-talkie
- [ ] Phase 3: Group chats & channels
- [ ] Phase 4: Voice/video calls
- [ ] Phase 5: Mobile app (React Native)
- [ ] Phase 6: End-to-end encryption
- [ ] Phase 7: Cloud backup & sync
- [ ] Phase 8: AI-powered features

## 🔐 Security Considerations

- Messages encrypted with AES-256 in transit
- JWT tokens for authentication
- Rate limiting on API endpoints
- CORS protection
- Input validation & sanitization
- Secure WebRTC connections

## 📱 Device Support

- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Tablet (iPad, Android tablets)
- ✅ Mobile Web (iPhone, Android)
- 🔄 Mobile Apps (planned)

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 👥 Authors

- Your Name (@github-username)

## 📞 Support

Have questions? Open an issue or contact us via GitHub.

---

**Built with ❤️ for offline collaboration**
