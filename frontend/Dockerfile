# =========================================================
# STAGE 1: Build static assets using Node.js
# =========================================================
FROM node:20-alpine AS builder
WORKDIR /app

# Receive build-time arguments from docker-compose
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build for production
COPY . .
RUN npm run build

# =========================================================
# STAGE 2: Serve static bundle with lightweight Nginx
# =========================================================
FROM nginx:alpine AS runner

# Remove default Nginx site configuration
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy custom Nginx routing configuration (handles SPA client-side routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static HTML/JS/CSS bundle from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]