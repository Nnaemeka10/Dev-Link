# Stage 1: Build the backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install all dependencies (including devDependencies for TypeScript)
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the TypeScript code (outputs to dist/)
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runner

# Use a non-root user for better security
USER node

WORKDIR /app

# Copy package*.json to install only production dependencies
COPY --chown=node:node package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy compiled JavaScript code from the builder stage
COPY --from=builder --chown=node:node /app/dist ./dist

# Expose the port the app runs on (Default 5000, but can be overridden by platforms like Cloud Run)
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]
