ARG BUILD_FROM
FROM ${BUILD_FROM}

# Cache bust - change this to force rebuild
ARG CACHE_BUST=1

# Install Node.js and build dependencies
RUN apk add --no-cache nodejs npm python3 make g++

WORKDIR /app

# Copy package files
COPY package.json ./

# Install all dependencies (including dev for building)
RUN npm install

# Copy source files
COPY . .

# Build the React app
RUN npm run build

# Remove dev dependencies to slim down
RUN npm prune --production

# Set environment variables for HA addon
ENV DATA_DIR=/config
ENV PORT=3000

# Expose the port
EXPOSE 3000

# Run the server
CMD ["node", "--no-deprecation", "server/index.js"]
