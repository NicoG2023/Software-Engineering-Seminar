# tests/test_screening.py

import os
import sys
from datetime import date, datetime, timedelta

import pytest
from flask import Flask

# Asegurar que la carpeta raíz (Backend/python) esté en el path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from database import db  # noqa: E402
from models import Movie, TheaterRoom, Screening, Genre  # noqa: E402
from routes.movies import movies_bp  # noqa: E402
from routes.screenings import screenings_bp  # noqa: E402


# -------------------------------------------------------------------
# Fixtures de aplicación y cliente de prueba
# -------------------------------------------------------------------
@pytest.fixture
def app():
    app = Flask("test_screening")

    # BD en memoria para tests
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["TESTING"] = True

    db.init_app(app)

    # Registrar blueprints con prefijo /api (igual que en app.py real)
    app.register_blueprint(movies_bp, url_prefix="/api")
    app.register_blueprint(screenings_bp, url_prefix="/api")

    with app.app_context():
        db.create_all()

    yield app

    # Limpieza opcional
    with app.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


# -------------------------------------------------------------------
# Helper: crear un género, película y sala y devolver sus IDs
# -------------------------------------------------------------------
def create_basic_movie_and_room(app):
    """Crea un género, una película y una sala; devuelve (movie_id, room_id)."""
    with app.app_context():
        genre = Genre(name="Action")
        movie = Movie(title="Matrix", duration_minutes=120, genre=genre)
        room = TheaterRoom(name="Room 1", capacity=100, location="1st floor")

        db.session.add_all([genre, movie, room])
        db.session.commit()

        return movie.id_movie, room.id_room


# -------------------------------------------------------------------
# Tests create_screening
# -------------------------------------------------------------------
def test_create_screening_success(client, app):
    movie_id, room_id = create_basic_movie_and_room(app)

    future_date = (date.today() + timedelta(days=1)).strftime("%Y-%m-%d")

    payload = {
        "movie_id": movie_id,
        "room_id": room_id,
        "date": future_date,
        "time": "19:30",
    }

    resp = client.post("/api/screenings", json=payload)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["message"] == "Screening created successfully"

    # Verificar que se insertó en BD
    with app.app_context():
        screenings = Screening.query.all()
        assert len(screenings) == 1
        s = screenings[0]
        assert s.movie_id == movie_id
        assert s.room_id == room_id
        assert s.is_deleted is False


def test_create_screening_invalid_movie_or_room_returns_400(client, app):
    future_date = (date.today() + timedelta(days=1)).strftime("%Y-%m-%d")

    payload = {
        "movie_id": 999,  # no existe
        "room_id": 999,   # no existe
        "date": future_date,
        "time": "19:30",
    }

    resp = client.post("/api/screenings", json=payload)
    assert resp.status_code == 400
    data = resp.get_json()
    assert "Invalid movie or room" in data["error"]


def test_create_screening_in_the_past_returns_400(client, app):
    movie_id, room_id = create_basic_movie_and_room(app)

    past_date = (date.today() - timedelta(days=1)).strftime("%Y-%m-%d")

    payload = {
        "movie_id": movie_id,
        "room_id": room_id,
        "date": past_date,
        "time": "19:30",
    }

    resp = client.post("/api/screenings", json=payload)
    assert resp.status_code == 400
    data = resp.get_json()
    assert "Cannot schedule screenings in the past" in data["error"]


def test_create_screening_conflict_returns_400(client, app):
    movie_id, room_id = create_basic_movie_and_room(app)
    future_date = date.today() + timedelta(days=2)

    with app.app_context():
        # Primera screening ya existente en esa sala, fecha y hora
        s = Screening(
            movie_id=movie_id,
            room_id=room_id,
            date=future_date,
            time=datetime.strptime("20:00", "%H:%M").time(),
            is_deleted=False,
        )
        db.session.add(s)
        db.session.commit()

    payload = {
        "movie_id": movie_id,
        "room_id": room_id,
        "date": future_date.strftime("%Y-%m-%d"),
        "time": "20:00",  # misma sala, fecha y hora
    }

    resp = client.post("/api/screenings", json=payload)
    assert resp.status_code == 400
    data = resp.get_json()
    assert "Scheduling conflict detected" in data["error"]


# -------------------------------------------------------------------
# Tests get_screenings_by_movie
# -------------------------------------------------------------------
def test_get_screenings_by_movie_returns_only_non_deleted(client, app):
    movie_id, room_id = create_basic_movie_and_room(app)
    future_date = date.today() + timedelta(days=3)

    with app.app_context():
        # no borrada
        s1 = Screening(
            movie_id=movie_id,
            room_id=room_id,
            date=future_date,
            time=datetime.strptime("18:00", "%H:%M").time(),
            is_deleted=False,
        )
        # borrada
        s2 = Screening(
            movie_id=movie_id,
            room_id=room_id,
            date=future_date,
            time=datetime.strptime("19:00", "%H:%M").time(),
            is_deleted=True,
        )
        db.session.add_all([s1, s2])
        db.session.commit()

    resp = client.get(f"/api/screenings/{movie_id}")
    assert resp.status_code == 200
    data = resp.get_json()

    # Solo debe regresar la no borrada
    assert len(data) == 1
    assert data[0]["time"] == "18:00"


# -------------------------------------------------------------------
# Tests delete_screening
# -------------------------------------------------------------------
def test_delete_screening_soft_delete_flag(client, app):
    movie_id, room_id = create_basic_movie_and_room(app)
    future_date = date.today() + timedelta(days=4)

    with app.app_context():
        s = Screening(
            movie_id=movie_id,
            room_id=room_id,
            date=future_date,
            time=datetime.strptime("17:00", "%H:%M").time(),
            is_deleted=False,
        )
        db.session.add(s)
        db.session.commit()
        screening_id = s.id_screening

    resp = client.delete(f"/api/screenings/{screening_id}")
    assert resp.status_code == 200
    data = resp.get_json()
    assert "Screening deleted (soft delete)" in data["message"]

    with app.app_context():
        deleted = Screening.query.get(screening_id)
        assert deleted.is_deleted is True
