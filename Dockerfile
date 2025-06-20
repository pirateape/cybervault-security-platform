# Stage 1: Use an official Node.js image for a stable installation.
FROM node:20-slim as builder

WORKDIR /app

# Copy package files and install dependencies cleanly.
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy the rest of the application code.
COPY . .

# Create a symbolic link for node, because Nx looks for it in /usr/bin/node
RUN ln -s /usr/local/bin/node /usr/bin/node

# Stage 2: Use the official Playwright image that matches your project's version.
FROM mcr.microsoft.com/playwright:v1.53.0-jammy

WORKDIR /app

# Copy the pre-installed node_modules from the builder stage.
COPY --from=builder /app/node_modules ./node_modules

# Copy the application code.
COPY . .

# The final image now has a stable Node.js installation and all Playwright browsers.

# By default, when the container runs, it will execute the command provided
# in the `docker run` command line. For example, `npx nx e2e web2-e2e`.
# No explicit CMD or ENTRYPOINT is needed here for this use case. 