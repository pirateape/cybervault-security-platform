# syntax=docker/dockerfile:1

# --- Build stage ---
FROM python:3.10-slim AS builder
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*

# Install pipenv or poetry if used, else use requirements.txt
COPY apps/ai_risk_service/requirements.txt ./
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copy source code from project root
COPY apps/ai_risk_service/ ./apps/ai_risk_service/
COPY apps/__init__.py ./apps/

# --- Final stage ---
FROM python:3.10-slim
WORKDIR /app

# Install runtime dependencies
COPY apps/ai_risk_service/requirements.txt ./
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copy source code from project root
COPY apps/ai_risk_service/ ./apps/ai_risk_service/
COPY apps/__init__.py ./apps/

# Ensure Python can find the 'apps' package
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8001

# Set entrypoint for production: multiple workers, proxy headers
CMD ["uvicorn", "apps.ai_risk_service.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "4", "--proxy-headers"]
