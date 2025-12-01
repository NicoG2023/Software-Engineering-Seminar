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
# Install Python dependencies using pip and pyproject.toml
# (copy only dependency file first to leverage Docker cache)
# ---------------------------
COPY pyproject.toml /app/pyproject.toml
RUN pip install --no-cache-dir .

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
