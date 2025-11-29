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
    """
    Crea una app Flask de prueba con SQLite en memoria y registra el blueprint de movies.
    """
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
    """
    Cliente de pruebas de Flask.
    """
    return app.test_client()


# =========================================================
#                POST /api/movies
# =========================================================

def test_create_movie_success(client, app):
    """
    Debe crear una película correctamente cuando se envían todos los campos requeridos.
    También verifica que se guarda en la BD con el género asociado.
    """
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
    assert data["duration"] == 148

    # Verificar que se guardó en la BD
    with app.app_context():
        movie = Movie.query.filter_by(title="Inception").first()
        assert movie is not None
        assert movie.duration_minutes == 148
        assert movie.genre.name == "Sci-Fi"


def test_create_movie_missing_fields_returns_400(client):
    """
    Si faltan campos requeridos (title, duration o genre), debe devolver 400.
    """
    # Falta duration y genre
    payload = {
        "title": "No Duration"
    }

    resp = client.post("/api/movies", json=payload)

    assert resp.status_code == 400
    data = resp.get_json()
    assert "error" in data
    assert "Missing required fields" in data["error"]


def test_create_movie_uses_existing_genre_when_already_created(client, app):
    """
    Si el género ya existe, create_movie debe reutilizarlo y no crear uno nuevo.
    """
    with app.app_context():
        existing_genre = Genre(name="Drama")
        db.session.add(existing_genre)
        db.session.commit()
        existing_genre_id = existing_genre.id_genre

    payload = {
        "title": "Some Drama",
        "duration": 100,
        "genre": "Drama"
    }

    resp = client.post("/api/movies", json=payload)
    assert resp.status_code == 201

    with app.app_context():
        movie = Movie.query.filter_by(title="Some Drama").first()
        assert movie is not None
        # Debe usar el mismo género, no uno nuevo
        assert movie.genre.id_genre == existing_genre_id
        # Solo debe haber un género "Drama"
        dramas = Genre.query.filter_by(name="Drama").all()
        assert len(dramas) == 1


def test_create_movie_creates_new_genre_if_not_exists(client, app):
    """
    Si el género no existe, create_movie debe crear un nuevo registro Genre.
    """
    payload = {
        "title": "New Genre Movie",
        "duration": 90,
        "genre": "Fantasy"
    }

    resp = client.post("/api/movies", json=payload)
    assert resp.status_code == 201

    with app.app_context():
        movie = Movie.query.filter_by(title="New Genre Movie").first()
        assert movie is not None
        assert movie.genre is not None
        assert movie.genre.name == "Fantasy"


# =========================================================
#                GET /api/movies (list)
# =========================================================

def test_list_movies_returns_all_non_deleted(client, app):
    """
    Debe listar solo las películas que NO estén soft-deleted (is_deleted=False).
    """
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
    """
    Debe aplicar filtros por género y título de forma case-insensitive y parcial.
    """
    with app.app_context():
        g1 = Genre(name="Action")
        g2 = Genre(name="Comedy")
        db.session.add_all([g1, g2])

        m1 = Movie(title="Fast & Furious", duration_minutes=110, genre=g1, is_deleted=False)
        m2 = Movie(title="Funny Movie", duration_minutes=90, genre=g2, is_deleted=False)
        db.session.add_all([m1, m2])
        db.session.commit()

    # Filtro por genre=action
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


def test_list_movies_returns_empty_list_when_no_movies(client):
    """
    Si no hay películas en la BD, debe devolver una lista vacía y 200.
    """
    resp = client.get("/api/movies")
    assert resp.status_code == 200
    data = resp.get_json()
    assert isinstance(data, list)
    assert len(data) == 0


# =========================================================
#                GET /api/movies/<id>
# =========================================================

def test_get_movie_returns_movie_data(client, app):
    """
    Debe devolver los datos de la película cuando existe y no está soft-deleted.
    """
    with app.app_context():
        genre = Genre(name="Sci-Fi")
        db.session.add(genre)
        movie = Movie(title="Blade Runner", duration_minutes=117, genre=genre, is_deleted=False)
        db.session.add(movie)
        db.session.commit()
        movie_id = movie.id_movie

    resp = client.get(f"/api/movies/{movie_id}")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["id"] == movie_id
    assert data["title"] == "Blade Runner"
    assert data["genre"] == "Sci-Fi"
    assert data["duration"] == 117


def test_get_movie_not_found_when_soft_deleted(client, app):
    """
    Si la película está soft-deleted, get_movie debe devolver 404.
    """
    with app.app_context():
        genre = Genre(name="Drama")
        db.session.add(genre)
        movie = Movie(title="Old Movie", duration_minutes=90, genre=genre, is_deleted=True)
        db.session.add(movie)
        db.session.commit()
        movie_id = movie.id_movie

    resp = client.get(f"/api/movies/{movie_id}")
    assert resp.status_code == 404
    data = resp.get_json()
    assert "error" in data
    assert data["error"] == "Movie not found"


def test_get_movie_not_found_invalid_id(client):
    """
    Si el ID no existe, debe devolver 404 con el mensaje apropiado.
    """
    resp = client.get("/api/movies/9999")
    assert resp.status_code == 404
    data = resp.get_json()
    assert "error" in data
    assert data["error"] == "Movie not found"


# =========================================================
#                PUT /api/movies/<id>
# =========================================================

def test_update_movie_updates_title_duration_and_genre(client, app):
    """
    Debe actualizar título, duración y género cuando se envían los tres campos.
    Si el género no existe aún, debe crearse.
    """
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
        updated = db.session.get(Movie, movie_id)
        assert updated.title == "New Title"
        assert updated.duration_minutes == 150
        assert updated.genre.name == "Sci-Fi"  # género nuevo creado


def test_update_movie_partial_update_keeps_existing_fields(client, app):
    """
    Si se envía solo parte de los campos (p.ej. solo título),
    debe mantener los demás (duración, género) sin cambios.
    """
    with app.app_context():
        genre = Genre(name="Comedy")
        db.session.add(genre)
        movie = Movie(title="Original Title", duration_minutes=90, genre=genre, is_deleted=False)
        db.session.add(movie)
        db.session.commit()
        movie_id = movie.id_movie

    payload = {
        "title": "Updated Only Title"
    }

    resp = client.put(f"/api/movies/{movie_id}", json=payload)
    assert resp.status_code == 200

    with app.app_context():
        updated = db.session.get(Movie, movie_id)
        assert updated.title == "Updated Only Title"
        assert updated.duration_minutes == 90  # sin cambios
        assert updated.genre.name == "Comedy"  # sin cambios


def test_update_movie_returns_404_when_not_found(client):
    """
    Si se intenta actualizar una película que no existe, get_or_404 debe devolver 404.
    (La respuesta será HTML, pero solo nos interesa el status code en este caso).
    """
    payload = {
        "title": "Does Not Matter",
        "duration": 120,
        "genre": "Action"
    }

    resp = client.put("/api/movies/9999", json=payload)
    assert resp.status_code == 404


# =========================================================
#                DELETE /api/movies/<id>
# =========================================================

def test_delete_movie_soft_delete_flag(client, app):
    """
    DELETE /api/movies/<id> debe marcar la película como is_deleted=True (soft delete).
    """
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
        deleted = db.session.get(Movie, movie_id)
        assert deleted.is_deleted is True


def test_delete_movie_returns_404_when_not_found(client):
    """
    Si se intenta borrar una película que no existe, debe devolver 404.
    (La respuesta será HTML por get_or_404, pero nos basta con el status code).
    """
    resp = client.delete("/api/movies/9999")
    assert resp.status_code == 404


# =========================================================
#                GET /api/genres
# =========================================================

def test_list_genres_returns_all_ordered_by_name(client, app):
    """
    GET /api/genres debe devolver todos los géneros ordenados alfabéticamente por name.
    """
    with app.app_context():
        g1 = Genre(name="Sci-Fi")
        g2 = Genre(name="Action")
        g3 = Genre(name="Drama")
        db.session.add_all([g1, g2, g3])
        db.session.commit()

    resp = client.get("/api/genres")
    assert resp.status_code == 200
    data = resp.get_json()
    names = [g["name"] for g in data]

    # Debe estar ordenado alfabéticamente
    assert names == sorted(names)
    # Y contener exactamente estos géneros
    assert set(names) == {"Sci-Fi", "Action", "Drama"}


def test_list_genres_returns_empty_list_when_no_genres(client):
    """
    Si no hay géneros en la BD, /api/genres debe devolver una lista vacía.
    """
    resp = client.get("/api/genres")
    assert resp.status_code == 200
    data = resp.get_json()
    assert isinstance(data, list)
    assert len(data) == 0
