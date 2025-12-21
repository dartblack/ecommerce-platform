# Build stage
FROM node:20-alpine3.20 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine3.20

# Update packages and install PostgreSQL client for database initialization
RUN apk update && apk upgrade --no-cache && apk add --no-cache postgresql-client

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (needed for development mode with volumes)
# In production, this will be overridden by the volume mount or can be optimized
RUN npm ci && npm cache clean --force

# Copy built application from builder stage (for production)
COPY --from=builder /app/dist ./dist

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port 3000
EXPOSE 3000

# Use entrypoint script
ENTRYPOINT ["docker-entrypoint.sh"]

# Start the application (default for production)
CMD ["node", "dist/main.js"]

