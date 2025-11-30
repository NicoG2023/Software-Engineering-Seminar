# Backend/Python/Dockerfile
FROM python:3.12-slim

# ---------------------------
# Variables de entorno
# ---------------------------
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# ---------------------------
# Dependencias del sistema
# ---------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
 && rm -rf /var/lib/apt/lists/*

# ---------------------------
# Directorio de trabajo
# ---------------------------
WORKDIR /app

# ---------------------------
# Python dependencies via pyproject.toml
# ---------------------------
COPY pyproject.toml /app/pyproject.toml
RUN pip install --no-cache-dir .

# ---------------------------
# Copia del código de la app
# ---------------------------
COPY . /app

# ---------------------------
# Puerto expuesto
# ---------------------------
EXPOSE 5000

# ---------------------------
# Comando por defecto
# ---------------------------
# Usa gunicorn apuntando al objeto 'app' de tu módulo principal 'app.py'
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]
