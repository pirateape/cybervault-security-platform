FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy the rest of the application
COPY frontend/ .

# Build the application
RUN npm run build

# Expose the port for the frontend
EXPOSE 8080

# Command to run the application
CMD ["npm", "run", "dev"]