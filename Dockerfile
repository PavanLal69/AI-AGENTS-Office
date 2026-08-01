# Production Dockerfile for Pixel Office AI Agents & Algorand AlgoKit System
FROM node:20-slim

# Install Python 3, pip, and system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files & install dependencies
COPY package*.json ./
RUN npm install --production

# Copy Python requirements & install FastAPI uvicorn
COPY python_backend/requirements.txt ./python_backend/
RUN pip install --no-cache-dir --break-system-packages -r python_backend/requirements.txt || pip install --no-cache-dir --break-system-packages fastapi uvicorn requests pyteal algokit-utils

# Copy application source code
COPY . .

# Expose ports: 3000 (Main Dashboard), 3005 (Preview Server), 8000 (FastAPI Gateway)
EXPOSE 3000 3005 8000

# Environment variables
ENV PORT=3000
ENV HOST=0.0.0.0

# Start command running Node.js Server & Python FastAPI in background
CMD ["sh", "-c", "python3 python_backend/main.py & node server/server.js"]
