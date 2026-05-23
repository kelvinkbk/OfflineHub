# Build stage
FROM node:26-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Build frontend
RUN npm --workspace=frontend run build

# Runtime stage
FROM node:26-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy built frontend from builder
COPY --from=builder /app/frontend/dist ./frontend/dist

# Copy backend
COPY backend ./backend

# Expose ports
EXPOSE 3000 5000

# Set environment
ENV NODE_ENV=production

# Start backend
CMD ["npm", "--workspace=backend", "start"]
