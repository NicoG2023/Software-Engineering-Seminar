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
# Instalación de dependencias Python
# ---------------------------
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir gunicorn

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
