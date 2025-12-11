# Backend/python/Dockerfile
FROM python:3.12-slim

# ---------------------------
# Environment variables
# ---------------------------
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# ---------------------------
# System dependencies
# ---------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
 && rm -rf /var/lib/apt/lists/*

# ---------------------------
# Working directory
# ---------------------------
WORKDIR /app

# ---------------------------
# Poetry configuration
# ---------------------------
ARG POETRY_VERSION=1.8.4

ENV POETRY_VERSION=${POETRY_VERSION} \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_CACHE_DIR=/tmp/poetry-cache

# ---------------------------
# Install Poetry
# ---------------------------
RUN pip install --no-cache-dir "poetry==${POETRY_VERSION}"

# ---------------------------
# Install Python dependencies with Poetry
# (copy only dependency files first to leverage Docker cache)
# ---------------------------
COPY pyproject.toml poetry.lock* /app/

RUN poetry lock --no-update \
 && poetry install --no-root \
 && rm -rf "$POETRY_CACHE_DIR"

# ---------------------------
# Copy application code
# ---------------------------
COPY . /app

# ---------------------------
# Exposed port
# ---------------------------
EXPOSE 5000

# ---------------------------
# Default command
# ---------------------------
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]
