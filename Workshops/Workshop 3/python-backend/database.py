# database.py
from flask_sqlalchemy import SQLAlchemy
from flask import Flask
from dotenv import load_dotenv
import os

# Cargar variables del archivo .env (si existe)
load_dotenv()

db = SQLAlchemy()

def init_db(app: Flask):
    # Construir la URI de conexión a PostgreSQL
    user = os.getenv("DB_USER", "postgres")
    password = os.getenv("DB_PASSWORD", "enlaceprueba")
    host = os.getenv("DB_HOST", "host.docker.internal")  # importante si corres en Docker
    port = os.getenv("DB_PORT", "5432")
    name = os.getenv("DB_NAME", "moviedb")

    # SQLAlchemy connection string
    app.config["SQLALCHEMY_DATABASE_URI"] = f"postgresql://{user}:{password}@{host}:{port}/{name}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Inicializa la extensión
    db.init_app(app)
