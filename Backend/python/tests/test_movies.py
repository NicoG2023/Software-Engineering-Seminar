import os
import sys

# Añadir la carpeta raíz (Backend/python) al sys.path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from flask import Flask
from database import db
from models import Movie, Genre
from routes.movies import movies_bp
import pytest


@pytest.fixture
def app():
    """Flask app de prueba con SQLite en memoria."""
    app = Flask(__name__)
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    app.register_blueprint(movies_bp, url_prefix="/api")

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Cliente de pruebas de Flask."""
    return app.test_client()


# ---------- POST /api/movies ----------

def test_create_movie_success(client, app):
    payload = {
        "title": "Inception",
        "duration": 148,
        "genre": "Sci-Fi"
    }

    resp = client.post("/api/movies", json=payload)

    assert resp.status_code == 201
    data = resp.get_json()
    assert data["message"] == "Movie created successfully"
    assert data["title"] == "Inception"
    assert data["genre"] == "Sci-Fi"

    # Verificar que se guardó en la BD
    with app.app_context():
        movie = Movie.query.filter_by(title="Inception").first()
        assert movie is not None
        assert movie.duration_minutes == 148
        assert movie.genre.name == "Sci-Fi"


def test_create_movie_missing_fields_returns_400(client):
    # Falta duration y genre
    payload = {
        "title": "No Duration"
    }

    resp = client.post("/api/movies", json=payload)

    assert resp.status_code == 400
    data = resp.get_json()
    assert "error" in data
    assert "Missing required fields" in data["error"]


# ---------- GET /api/movies ----------

def test_list_movies_returns_all_non_deleted(client, app):
    with app.app_context():
        genre = Genre(name="Drama")
        db.session.add(genre)
        movie1 = Movie(title="Movie 1", duration_minutes=100, genre=genre, is_deleted=False)
        movie2 = Movie(title="Movie 2", duration_minutes=120, genre=genre, is_deleted=True)  # borrada
        db.session.add_all([movie1, movie2])
        db.session.commit()

    resp = client.get("/api/movies")

    assert resp.status_code == 200
    data = resp.get_json()
    # solo debería aparecer la no borrada
    assert len(data) == 1
    assert data[0]["title"] == "Movie 1"


def test_list_movies_with_filters(client, app):
    with app.app_context():
        g1 = Genre(name="Action")
        g2 = Genre(name="Comedy")
        db.session.add_all([g1, g2])

        m1 = Movie(title="Fast & Furious", duration_minutes=110, genre=g1, is_deleted=False)
        m2 = Movie(title="Funny Movie", duration_minutes=90, genre=g2, is_deleted=False)
        db.session.add_all([m1, m2])
        db.session.commit()

    # Filtro por genre=Action
    resp = client.get("/api/movies?genre=action")
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data) == 1
    assert data[0]["title"] == "Fast & Furious"

    # Filtro por title=funny
    resp = client.get("/api/movies?title=funny")
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data) == 1
    assert data[0]["title"] == "Funny Movie"


# ---------- PUT /api/movies/<id> ----------

def test_update_movie_updates_title_duration_and_genre(client, app):
    with app.app_context():
        old_genre = Genre(name="Action")
        db.session.add(old_genre)
        movie = Movie(title="Old Title", duration_minutes=100, genre=old_genre, is_deleted=False)
        db.session.add(movie)
        db.session.commit()
        movie_id = movie.id_movie

    payload = {
        "title": "New Title",
        "duration": 150,
        "genre": "Sci-Fi"
    }

    resp = client.put(f"/api/movies/{movie_id}", json=payload)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["message"] == "Movie updated successfully"

    with app.app_context():
        updated = Movie.query.get(movie_id)
        assert updated.title == "New Title"
        assert updated.duration_minutes == 150
        assert updated.genre.name == "Sci-Fi"  # género nuevo creado


# ---------- DELETE /api/movies/<id> ----------

def test_delete_movie_soft_delete_flag(client, app):
    with app.app_context():
        genre = Genre(name="Sci-Fi")
        db.session.add(genre)
        movie = Movie(title="To Delete", duration_minutes=90, genre=genre, is_deleted=False)
        db.session.add(movie)
        db.session.commit()
        movie_id = movie.id_movie

    resp = client.delete(f"/api/movies/{movie_id}")

    assert resp.status_code == 200
    data = resp.get_json()
    assert data["message"] == "Movie deleted (soft delete)"

    with app.app_context():
        deleted = Movie.query.get(movie_id)
        assert deleted.is_deleted is True
