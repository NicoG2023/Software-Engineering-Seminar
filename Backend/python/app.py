from flask import Flask
from database import db
from dotenv import load_dotenv
import os

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

# ---------------------------
# Initialize SQLAlchemy
# ---------------------------
db.init_app(app)

# ---------------------------
# Import models and blueprints
# ---------------------------
from models import Movie
from routes.movies import movies_bp

# Register routes
app.register_blueprint(movies_bp)

# ---------------------------
# Entry point
# ---------------------------
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("✅ Database tables created successfully!")
    app.run(debug=True)
