# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Install Expo CLI globally
RUN npm install -g @expo/cli

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port for Expo development server
EXPOSE 8081

# Expose port for Expo web
EXPOSE 19006

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8081/ || exit 1

# Start Expo development server
CMD ["npx", "expo", "start", "--web", "--host", "0.0.0.0"]

