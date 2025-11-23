from flask import Flask, jsonify
from database import db
from dotenv import load_dotenv
from flask_cors import CORS
import os

load_dotenv()

app = Flask(__name__)

# ---------------------------
# Config DB
# ---------------------------
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

if not all([DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME]):
    raise RuntimeError("❌ Faltan variables de entorno para la base de datos.")

app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev_secret_key")

db.init_app(app)

# ---------------------------
# CORS (debe ir antes de registrar rutas)
# ---------------------------
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ---------------------------
# Import models and routes
# ---------------------------
from routes.movies import movies_bp
from routes.screenings import screenings_bp
from routes.theater_rooms import theater_rooms_bp

# Registrar blueprints
app.register_blueprint(movies_bp, url_prefix='/api')
app.register_blueprint(theater_rooms_bp, url_prefix='/api')
app.register_blueprint(screenings_bp, url_prefix='/api')


# ---------------------------
# Rutas básicas
# ---------------------------
@app.route('/')
def home():
    return jsonify({"message": "Backend Flask funcionando!", "status": "OK"})

@app.route('/health')
def health():
    return jsonify({
        "status": "healthy",
        "service": "backend-flask",
        "database_configured": bool(DB_HOST)
    })


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("✅ Database tables created successfully!")
        print(f"Connected to DB: {DB_NAME} on {DB_HOST}:{DB_PORT}")
    app.run(debug=True, host="0.0.0.0", port=5000)
