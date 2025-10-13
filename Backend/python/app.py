from flask import Flask
from database import db
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# ---------------------------
# Database configuration
# ---------------------------
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")

# Initialize SQLAlchemy
db.init_app(app)

# Import models after db init
from models import *

# ---------------------------
# App entry point
# ---------------------------
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("✅ Database tables created successfully!")
    app.run(debug=True)
