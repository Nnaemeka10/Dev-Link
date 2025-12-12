# -------------------------------------------------
# 1. Build stage
# -------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Install root dependencies (if any)
COPY package.json ./

# Copy backend and frontend package files
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install backend deps
RUN npm install --prefix backend

# Install frontend deps
RUN npm install --prefix frontend

# Copy everything
COPY . .

# Build frontend → outputs to frontend/dist
RUN npm run build --prefix frontend

# Build backend → outputs to backend/dist
RUN npm run build --prefix backend

# -------------------------------------------------
# 2. Production stage
# -------------------------------------------------
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

# Copy only built backend + frontend
COPY backend/package.json ./backend/package.json
COPY backend/node_modules ./backend/node_modules
COPY backend/dist ./backend/dist

# Copy built frontend dist folder
COPY frontend/dist ./frontend/dist

# Expose API port (match your Express app)
EXPOSE 3000

# Start backend (which also serves frontend)
CMD ["node", "backend/dist/server.js"]
