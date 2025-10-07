# Backend/Python/Dockerfile
FROM python:3.12-slim

# Evita buffering y crea usuario no root
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Instala dependencias del sistema (ej. psycopg)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiamos SOLO requirements primero para cachear
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt \
 && pip install --no-cache-dir gunicorn

# Copiamos el resto del código (NO el venv)
COPY . /app

# Expón el puerto donde servirá Flask/Gunicorn
EXPOSE 5000

# Cambia 'app:app' por el módulo y objeto WSGI reales (p.ej. main:app)
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]
