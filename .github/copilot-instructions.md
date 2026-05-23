# OfflineHub Development Guidelines

## Project Overview
OfflineHub is an offline-first social app with web support featuring:
- Real-time messaging (chat, walkie-talkie)
- File sharing capabilities
- Peer-to-peer communication
- Service worker-based offline support

## Architecture Principles
- **Monorepo**: Using Yarn workspaces for frontend, backend, and shared libraries
- **Offline-First**: Service workers and IndexedDB for local-first development
- **Real-Time**: WebSocket/Socket.io for instant updates
- **P2P**: WebRTC for direct device communication

## Development Standards
- Use TypeScript for type safety
- Follow ESLint rules
- Write tests for new features
- Keep components small and focused
- Use proper error handling

## Key Directories
- `frontend/`: React web app
- `backend/`: Node.js/Express API
- `shared/`: Shared types and utilities

## Common Commands
- `yarn install-all` - Install all dependencies
- `yarn dev` - Start development servers
- `yarn build` - Build for production
- `yarn test` - Run tests

## Before Starting
Ensure all workspace packages are installed and dependencies are up to date.
