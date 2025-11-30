# Backend/python/Dockerfile
FROM python:3.12-slim

# ---------------------------
# Environment variables
# ---------------------------
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VERSION=1.8.3 \
    POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_CACHE_DIR=/tmp/poetry-cache

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
# Install Poetry
# ---------------------------
RUN pip install --no-cache-dir "poetry==$POETRY_VERSION"

# ---------------------------
# Install Python dependencies with Poetry
# (copy only dependency files first to leverage Docker cache)
# ---------------------------
COPY pyproject.toml poetry.lock* /app/

# Install only main dependencies (no dev tools like behave)
RUN poetry install --no-root --only main \
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
# Uses gunicorn, pointing to the 'app' object in main module 'app.py'
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]
