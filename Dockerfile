# ---------- FRONTEND BUILD ----------
FROM node:20-alpine AS frontend_builder
WORKDIR /app/frontend

COPY frontend/package.json .
COPY frontend/package-lock.json .
RUN npm install

COPY frontend .
RUN npm run build


# ---------- BACKEND BUILD ----------
FROM node:20-alpine AS backend_builder
WORKDIR /app/backend

COPY backend/package.json .
COPY backend/package-lock.json .
RUN npm install

COPY backend .
RUN npm run build


# ---------- FINAL IMAGE ----------
FROM node:20-alpine
WORKDIR /app

# Copy backend build output
COPY --from=backend_builder /app/backend/dist ./backend/dist
COPY --from=backend_builder /app/backend/node_modules ./backend/node_modules
COPY backend/package.json ./backend/package.json

# Copy frontend build output
COPY --from=frontend_builder /app/frontend/dist ./frontend/dist

# Expose Express port (adjust if needed)
EXPOSE 3000

CMD ["node", "backend/dist/index.js"]
