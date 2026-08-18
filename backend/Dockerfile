# Step 1: Base Runtime
FROM node:20-alpine AS base
WORKDIR /app

# Step 2: Install Dependencies (Layer Caching)
# Copy package files first so npm install runs only when packages change
COPY package*.json ./
RUN npm ci --only=production

# Step 3: Copy Application Source Code
COPY . .

# Step 4: Environment & Port
ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# Step 5: Run as non-root user for security
USER node

# Step 6: Start Application
CMD ["node", "src/server.js"]