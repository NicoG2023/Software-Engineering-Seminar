import os
import sys
from datetime import date, datetime, timedelta

import pytest
from flask import Flask

# -------------------------------------------------------------------
# Ensure project root (Backend/python) is in sys.path
# -------------------------------------------------------------------
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from database import db  # noqa: E402
from models import Movie, TheaterRoom, Screening, Genre  # noqa: E402
from routes.movies import movies_bp  # noqa: E402
from routes.screenings import screenings_bp  # noqa: E402


# -------------------------------------------------------------------
# App and client fixtures
# -------------------------------------------------------------------
@pytest.fixture
def app():
    """
    Creates a Flask app with:
      - In-memory SQLite DB
      - Movies and screenings blueprints registered under /api
    Tables are created before the tests and dropped at the end.
    """
    app = Flask("test_screening")

    # In-memory DB for tests
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["TESTING"] = True
    # Avoid expiring objects on commit so we can safely inspect them later
    app.config["SQLALCHEMY_EXPIRE_ON_COMMIT"] = False

    db.init_app(app)

    # Register blueprints with /api prefix (same as real app)
    app.register_blueprint(movies_bp, url_prefix="/api")
    app.register_blueprint(screenings_bp, url_prefix="/api")

    with app.app_context():
        db.create_all()

    yield app

    # Optional cleanup
    with app.app_context():
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """
    Returns a Flask test client bound to the app fixture.
    """
    return app.test_client()


# -------------------------------------------------------------------
# Helper functions
# -------------------------------------------------------------------
def create_basic_movie_and_room(app, *, movie_deleted=False, room_active=True):
    """
    Creates in the DB:
      - one Genre ("Action") (reused if already exists)
      - one Movie ("Matrix"), optionally soft-deleted
      - one TheaterRoom ("Room 1"), optionally active/inactive

    Returns (movie_id, room_id).
    """
    with app.app_context():
        genre = Genre.query.filter_by(name="Action").first()
        if genre is None:
            genre = Genre(name="Action")
            db.session.add(genre)
            db.session.flush()  # ensure genre has an ID

        movie = Movie(
            title="Matrix",
            duration_minutes=120,
            genre=genre,
            is_deleted=movie_deleted,
        )
        room = TheaterRoom(
            name="Room 1",
            capacity=100,
            location="1st floor",
            is_active=room_active,
        )

        db.session.add_all([movie, room])
        db.session.commit()

        return movie.id_movie, room.id_room


def create_screening_in_db(app, movie_id, room_id, d, t, *, is_deleted=False, price=None, seats=None):
    """
    Creates a Screening in the DB with the given parameters and returns its ID.
      - d: date object
      - t: time object
      - is_deleted: soft-delete flag
      - price: optional
      - seats: optional available_seats (if None, defaults to 100)
    """
    with app.app_context():
        screening = Screening(
            movie_id=movie_id,
            room_id=room_id,
            date=d,
            time=t,
            is_deleted=is_deleted,
            price=price,
            available_seats=seats if seats is not None else 100,
        )
        db.session.add(screening)
        db.session.commit()
        return screening.id_screening


# =========================================================
#          POST /api/screenings  (create_screening)
# =========================================================

def test_create_screening_success(client, app):
    """
    Happy path:
      - valid movie and room
      - future date
      - no price (price optional)
    Must create the screening and return 201.
    """
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
    assert "id" in data

    # Verify it was inserted in the DB
    with app.app_context():
        screenings = Screening.query.all()
        assert len(screenings) == 1
        s = screenings[0]
        assert s.movie_id == movie_id
        assert s.room_id == room_id
        assert s.is_deleted is False
        assert s.price is None
        # available_seats must match the room capacity (100 in helper)
        assert s.available_seats == 100


def test_create_screening_with_price(client, app):
    """
    Should accept a numeric price field and store it correctly.
    """
    movie_id, room_id = create_basic_movie_and_room(app)
    future_date = (date.today() + timedelta(days=2)).strftime("%Y-%m-%d")

    payload = {
        "movie_id": movie_id,
        "room_id": room_id,
        "date": future_date,
        "time": "20:00",
        "price": 25000.5,
    }

    resp = client.post("/api/screenings", json=payload)
    assert resp.status_code == 201

    with app.app_context():
        s = Screening.query.first()
        assert float(s.price) == pytest.approx(25000.5)


def test_create_screening_invalid_price_returns_400(client, app):
    """
    If price is not convertible to float, must return 400 with 'Invalid price'.
    """
    movie_id, room_id = create_basic_movie_and_room(app)
    future_date = (date.today() + timedelta(days=3)).strftime("%Y-%m-%d")

    payload = {
        "movie_id": movie_id,
        "room_id": room_id,
        "date": future_date,
        "time": "21:00",
        "price": "not-a-number",
    }

    resp = client.post("/api/screenings", json=payload)
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["error"] == "Invalid price"


def test_create_screening_missing_required_fields_returns_400(client, app):
    """
    If any of the required fields is missing:
      - movie_id
      - room_id
      - date
      - time
    must return 400 'Missing required fields'.
    """
    movie_id, room_id = create_basic_movie_and_room(app)
    future_date = (date.today() + timedelta(days=1)).strftime("%Y-%m-%d")

    # Missing movie_id
    payload1 = {
        "room_id": room_id,
        "date": future_date,
        "time": "19:30",
    }
    resp1 = client.post("/api/screenings", json=payload1)
    assert resp1.status_code == 400
    assert resp1.get_json()["error"] == "Missing required fields"

    # Missing room_id
    payload2 = {
        "movie_id": movie_id,
        "date": future_date,
        "time": "19:30",
    }
    resp2 = client.post("/api/screenings", json=payload2)
    assert resp2.status_code == 400
    assert resp2.get_json()["error"] == "Missing required fields"

    # Missing date
    payload3 = {
        "movie_id": movie_id,
        "room_id": room_id,
        "time": "19:30",
    }
    resp3 = client.post("/api/screenings", json=payload3)
    assert resp3.status_code == 400
    assert resp3.get_json()["error"] == "Missing required fields"

    # Missing time
    payload4 = {
        "movie_id": movie_id,
        "room_id": room_id,
        "date": future_date,
    }
    resp4 = client.post("/api/screenings", json=payload4)
    assert resp4.status_code == 400
    assert resp4.get_json()["error"] == "Missing required fields"


def test_create_screening_invalid_movie_or_room_returns_400(client, app):
    """
    If movie or room do not exist, must return 400 'Invalid movie or room'.
    """
    future_date = (date.today() + timedelta(days=1)).strftime("%Y-%m-%d")

    payload = {
        "movie_id": 999,  # does not exist
        "room_id": 999,   # does not exist
        "date": future_date,
        "time": "19:30",
    }

    resp = client.post("/api/screenings", json=payload)
    assert resp.status_code == 400
    data = resp.get_json()
    assert "Invalid movie or room" in data["error"]


def test_create_screening_movie_or_room_not_available_returns_400(client, app):
    """
    If the movie is soft-deleted or the room is inactive, must return
    400 'Movie or room not available'.
    """
    # Case 1: movie is_deleted=True
    movie_id, room_id = create_basic_movie_and_room(app, movie_deleted=True, room_active=True)
    future_date = (date.today() + timedelta(days=1)).strftime("%Y-%m-%d")

    payload1 = {
        "movie_id": movie_id,
        "room_id": room_id,
        "date": future_date,
        "time": "19:30",
    }
    resp1 = client.post("/api/screenings", json=payload1)
    assert resp1.status_code == 400
    assert resp1.get_json()["error"] == "Movie or room not available"

    # Case 2: room inactive
    movie_id2, room_id2 = create_basic_movie_and_room(app, movie_deleted=False, room_active=False)
    payload2 = {
        "movie_id": movie_id2,
        "room_id": room_id2,
        "date": future_date,
        "time": "19:30",
    }
    resp2 = client.post("/api/screenings", json=payload2)
    assert resp2.status_code == 400
    assert resp2.get_json()["error"] == "Movie or room not available"


def test_create_screening_invalid_date_format_returns_400(client, app):
    """
    If date format is not YYYY-MM-DD, must return 400 with the proper message.
    """
    movie_id, room_id = create_basic_movie_and_room(app)
    payload = {
        "movie_id": movie_id,
        "room_id": room_id,
        "date": "01-12-2025",  # wrong format
        "time": "19:30",
    }

    resp = client.post("/api/screenings", json=payload)
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "Invalid date format, expected YYYY-MM-DD"


def test_create_screening_invalid_time_format_returns_400(client, app):
    """
    If time format is not HH:MM, must return 400 with the proper message.
    """
    movie_id, room_id = create_basic_movie_and_room(app)
    future_date = (date.today() + timedelta(days=1)).strftime("%Y-%m-%d")

    payload = {
        "movie_id": movie_id,
        "room_id": room_id,
        "date": future_date,
        "time": "7pm",  # wrong format
    }

    resp = client.post("/api/screenings", json=payload)
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "Invalid time format, expected HH:MM"


def test_create_screening_in_the_past_returns_400(client, app):
    """
    If date is strictly in the past, must return 400.
    """
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
    """
    If there is already a screening in the same room/date/time (not deleted),
    must return 400 'Scheduling conflict detected'.
    """
    movie_id, room_id = create_basic_movie_and_room(app)
    future_date = date.today() + timedelta(days=2)
    time_20 = datetime.strptime("20:00", "%H:%M").time()

    # First screening already existing at that slot
    create_screening_in_db(app, movie_id, room_id, future_date, time_20, is_deleted=False)

    payload = {
        "movie_id": movie_id,
        "room_id": room_id,
        "date": future_date.strftime("%Y-%m-%d"),
        "time": "20:00",  # same room, date and time
    }

    resp = client.post("/api/screenings", json=payload)
    assert resp.status_code == 400
    data = resp.get_json()
    assert "Scheduling conflict detected" in data["error"]


def test_create_screening_ignores_deleted_conflicts(client, app):
    """
    If the existing screening is soft-deleted, it MUST NOT be considered a conflict.
    """
    movie_id, room_id = create_basic_movie_and_room(app)
    future_date = date.today() + timedelta(days=3)
    time_20 = datetime.strptime("20:00", "%H:%M").time()

    # Screening at the same slot but soft-deleted
    create_screening_in_db(app, movie_id, room_id, future_date, time_20, is_deleted=True)

    payload = {
        "movie_id": movie_id,
        "room_id": room_id,
        "date": future_date.strftime("%Y-%m-%d"),
        "time": "20:00",
    }

    resp = client.post("/api/screenings", json=payload)
    assert resp.status_code == 201


# =========================================================
#        GET /api/screenings/<movie_id> (by movie)
# =========================================================

def test_get_screenings_by_movie_returns_only_non_deleted(client, app):
    """
    Must return only screenings with is_deleted=False for that movie.
    """
    movie_id, room_id = create_basic_movie_and_room(app)
    future_date = date.today() + timedelta(days=3)

    with app.app_context():
        # non-deleted screening
        s1 = Screening(
            movie_id=movie_id,
            room_id=room_id,
            date=future_date,
            time=datetime.strptime("18:00", "%H:%M").time(),
            is_deleted=False,
        )
        # deleted screening
        s2 = Screening(
            movie_id=movie_id,
            room_id=room_id,
            date=future_date,
            time=datetime.strptime("19:00", "%H:%M").time(),
            is_deleted=True,
        )
        db.session.add_all([s1, s2])
        db.session.commit()
        s1_id = s1.id_screening

    resp = client.get(f"/api/screenings/{movie_id}")
    assert resp.status_code == 200
    data = resp.get_json()

    # Only the non-deleted one must be returned
    assert len(data) == 1
    assert data[0]["time"] == "18:00"

    # Re-open context and fetch s1 again to avoid detached instance issues
    with app.app_context():
        s1_db = db.session.get(Screening, s1_id)
        expected_seats = s1_db.available_seats

    assert data[0]["available_seats"] == expected_seats


def test_get_screenings_by_movie_returns_empty_list_when_none(client, app):
    """
    If there are no screenings for that movie, must return an empty list.
    """
    movie_id, _ = create_basic_movie_and_room(app)

    resp = client.get(f"/api/screenings/{movie_id}")
    assert resp.status_code == 200
    data = resp.get_json()
    assert isinstance(data, list)
    assert len(data) == 0


# =========================================================
#      GET /api/screenings/id/<id> (get_screening by ID)
# =========================================================

def test_get_single_screening_success(client, app):
    """
    Must return a non-deleted screening with all expected fields.
    """
    movie_id, room_id = create_basic_movie_and_room(app)
    future_date = date.today() + timedelta(days=5)
    time_17 = datetime.strptime("17:00", "%H:%M").time()

    screening_id = create_screening_in_db(
        app,
        movie_id,
        room_id,
        future_date,
        time_17,
        is_deleted=False,
        price=15000.0,
        seats=80,
    )

    resp = client.get(f"/api/screenings/id/{screening_id}")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["id"] == screening_id
    assert data["movie_id"] == movie_id
    assert data["room_id"] == room_id
    assert data["date"] == future_date.isoformat()
    assert data["time"] == "17:00"
    assert data["price"] == 15000.0
    assert data["available_seats"] == 80
    assert data["room"] == "Room 1"


def test_get_single_screening_not_found_when_deleted_or_missing(client, app):
    """
    Must return 404:
      - if the screening does not exist
      - if it exists but is_deleted=True
    """
    # Case 1: non-existent ID
    resp1 = client.get("/api/screenings/id/9999")
    assert resp1.status_code == 404
    assert resp1.get_json()["error"] == "Screening not found"

    # Case 2: screening soft-deleted
    movie_id, room_id = create_basic_movie_and_room(app)
    future_date = date.today() + timedelta(days=5)
    time_18 = datetime.strptime("18:00", "%H:%M").time()
    screening_id = create_screening_in_db(
        app, movie_id, room_id, future_date, time_18, is_deleted=True
    )

    resp2 = client.get(f"/api/screenings/id/{screening_id}")
    assert resp2.status_code == 404
    assert resp2.get_json()["error"] == "Screening not found"


# =========================================================
#            PUT /api/screenings/<id> (update_screening)
# =========================================================

def test_update_screening_updates_fields_successfully(client, app):
    """
    Must allow updating:
      - movie_id
      - room_id
      - date
      - time
      - price
      - available_seats
    as long as they are valid.
    """
    # Original movie/room
    movie_id, room_id = create_basic_movie_and_room(app)
    future_date = date.today() + timedelta(days=7)
    time_20 = datetime.strptime("20:00", "%H:%M").time()

    # Original screening
    screening_id = create_screening_in_db(
        app, movie_id, room_id, future_date, time_20, price=10000.0, seats=50
    )

    # Another movie and room to change to
    with app.app_context():
        g2 = Genre(name="Drama")
        new_movie = Movie(title="Titanic", duration_minutes=180, genre=g2)
        new_room = TheaterRoom(name="Room 2", capacity=120, location="2nd floor", is_active=True)
        db.session.add_all([g2, new_movie, new_room])
        db.session.commit()
        new_movie_id = new_movie.id_movie
        new_room_id = new_room.id_room

    new_date = (date.today() + timedelta(days=8)).strftime("%Y-%m-%d")
    payload = {
        "movie_id": new_movie_id,
        "room_id": new_room_id,
        "date": new_date,
        "time": "21:30",
        "price": 18000.0,
        "available_seats": 70,
    }

    resp = client.put(f"/api/screenings/{screening_id}", json=payload)
    assert resp.status_code == 200
    assert resp.get_json()["message"] == "Screening updated successfully"

    with app.app_context():
        updated = db.session.get(Screening, screening_id)
        assert updated.movie_id == new_movie_id
        assert updated.room_id == new_room_id
        assert updated.date == datetime.strptime(new_date, "%Y-%m-%d").date()
        assert updated.time == datetime.strptime("21:30", "%H:%M").time()
        assert float(updated.price) == pytest.approx(18000.0)
        assert updated.available_seats == 70


def test_update_screening_invalid_or_unavailable_movie_returns_400(client, app):
    """
    If trying to change to an invalid or soft-deleted movie, must return 400.
    """
    movie_id, room_id = create_basic_movie_and_room(app)
    future_date = date.today() + timedelta(days=6)
    t = datetime.strptime("19:00", "%H:%M").time()
    screening_id = create_screening_in_db(app, movie_id, room_id, future_date, t)

    # Case 1: non-existent movie
    payload1 = {"movie_id": 9999}
    resp1 = client.put(f"/api/screenings/{screening_id}", json=payload1)
    assert resp1.status_code == 400
    assert resp1.get_json()["error"] == "Invalid or unavailable movie"

    # Case 2: soft-deleted movie
    with app.app_context():
        g = Genre(name="Sci-Fi")
        deleted_movie = Movie(
            title="Deleted Movie", duration_minutes=100, genre=g, is_deleted=True
        )
        db.session.add_all([g, deleted_movie])
        db.session.commit()
        deleted_movie_id = deleted_movie.id_movie

    payload2 = {"movie_id": deleted_movie_id}
    resp2 = client.put(f"/api/screenings/{screening_id}", json=payload2)
    assert resp2.status_code == 400
    assert resp2.get_json()["error"] == "Invalid or unavailable movie"


def test_update_screening_invalid_or_inactive_room_returns_400(client, app):
    """
    If trying to change to a non-existent or inactive room, must return 400.
    """
    movie_id, room_id = create_basic_movie_and_room(app)
    future_date = date.today() + timedelta(days=6)
    t = datetime.strptime("19:30", "%H:%M").time()
    screening_id = create_screening_in_db(app, movie_id, room_id, future_date, t)

    # Non-existent room
    resp1 = client.put(f"/api/screenings/{screening_id}", json={"room_id": 9999})
    assert resp1.status_code == 400
    assert resp1.get_json()["error"] == "Invalid or inactive room"

    # Inactive room
    with app.app_context():
        inactive_room = TheaterRoom(
            name="Inactive Room", capacity=50, location="X", is_active=False
        )
        db.session.add(inactive_room)
        db.session.commit()
        inactive_room_id = inactive_room.id_room

    resp2 = client.put(
        f"/api/screenings/{screening_id}", json={"room_id": inactive_room_id}
    )
    assert resp2.status_code == 400
    assert resp2.get_json()["error"] == "Invalid or inactive room"


def test_update_screening_invalid_date_or_time_format_returns_400(client, app):
    """
    If date/time format is invalid, must return 400.
    """
    movie_id, room_id = create_basic_movie_and_room(app)
    future_date = date.today() + timedelta(days=7)
    t = datetime.strptime("20:00", "%H:%M").time()
    screening_id = create_screening_in_db(app, movie_id, room_id, future_date, t)

    # Invalid date
    resp1 = client.put(
        f"/api/screenings/{screening_id}", json={"date": "31-12-2025"}
    )
    assert resp1.status_code == 400
    assert resp1.get_json()["error"] == "Invalid date format, expected YYYY-MM-DD"

    # Invalid time
    resp2 = client.put(
        f"/api/screenings/{screening_id}", json={"time": "8pm"}
    )
    assert resp2.status_code == 400
    assert resp2.get_json()["error"] == "Invalid time format, expected HH:MM"


def test_update_screening_to_past_date_returns_400(client, app):
    """
    If trying to update to a date in the past, must return 400.
    """
    movie_id, room_id = create_basic_movie_and_room(app)
    future_date = date.today() + timedelta(days=7)
    t = datetime.strptime("20:00", "%H:%M").time()
    screening_id = create_screening_in_db(app, movie_id, room_id, future_date, t)

    past_date = (date.today() - timedelta(days=1)).strftime("%Y-%m-%d")
    resp = client.put(
        f"/api/screenings/{screening_id}", json={"date": past_date}
    )
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "Cannot schedule screenings in the past"


def test_update_screening_price_and_clear_price(client, app):
    """
    Must allow:
      - changing price to a valid float
      - clearing price by sending None
      - returning 400 if price is non-numeric or non-finite (NaN, inf)
    """
    movie_id, room_id = create_basic_movie_and_room(app)
    future_date = date.today() + timedelta(days=5)
    t = datetime.strptime("18:30", "%H:%M").time()
    screening_id = create_screening_in_db(
        app, movie_id, room_id, future_date, t, price=10000.0
    )

    # Invalid price: not convertible to float
    resp1 = client.put(
        f"/api/screenings/{screening_id}", json={"price": "not-a-number"}
    )
    assert resp1.status_code == 400
    assert resp1.get_json()["error"] == "Invalid price"

    # Invalid price: NaN (non-finite)
    resp2 = client.put(
        f"/api/screenings/{screening_id}", json={"price": "NaN"}
    )
    assert resp2.status_code == 400
    assert resp2.get_json()["error"] == "Invalid price"

    # Valid price
    resp3 = client.put(
        f"/api/screenings/{screening_id}", json={"price": 20000.0}
    )
    assert resp3.status_code == 200

    with app.app_context():
        s2 = db.session.get(Screening, screening_id)
        assert float(s2.price) == pytest.approx(20000.0)

    # price = None => clear price
    resp4 = client.put(
        f"/api/screenings/{screening_id}", json={"price": None}
    )
    assert resp4.status_code == 200

    with app.app_context():
        s3 = db.session.get(Screening, screening_id)
        assert s3.price is None


def test_update_screening_invalid_available_seats_returns_400(client, app):
    """
    available_seats must be an integer >= 0:
      - if negative or not convertible, return 400.
    """
    movie_id, room_id = create_basic_movie_and_room(app)
    future_date = date.today() + timedelta(days=5)
    t = datetime.strptime("19:00", "%H:%M").time()
    screening_id = create_screening_in_db(app, movie_id, room_id, future_date, t, seats=50)

    # Negative seats
    resp1 = client.put(
        f"/api/screenings/{screening_id}", json={"available_seats": -1}
    )
    assert resp1.status_code == 400
    assert resp1.get_json()["error"] == "Invalid available_seats"

    # Non-numeric seats
    resp2 = client.put(
        f"/api/screenings/{screening_id}", json={"available_seats": "many"}
    )
    assert resp2.status_code == 400
    assert resp2.get_json()["error"] == "Invalid available_seats"

    # Valid seats
    resp3 = client.put(
        f"/api/screenings/{screening_id}", json={"available_seats": 75}
    )
    assert resp3.status_code == 200

    with app.app_context():
        updated = db.session.get(Screening, screening_id)
        assert updated.available_seats == 75


def test_update_screening_conflict_detection(client, app):
    """
    If updating a screening ends up with room/date/time matching another
    non-deleted screening, it must return 400 'Scheduling conflict detected'.
    """
    movie_id, room_id = create_basic_movie_and_room(app)
    future_date = date.today() + timedelta(days=10)
    t1 = datetime.strptime("18:00", "%H:%M").time()
    t2 = datetime.strptime("19:00", "%H:%M").time()

    # Screening 1 (target slot)
    s1_id = create_screening_in_db(app, movie_id, room_id, future_date, t1, is_deleted=False)
    # Screening 2 that we will try to move into the same slot
    s2_id = create_screening_in_db(app, movie_id, room_id, future_date, t2, is_deleted=False)

    # Try to update s2 to have same room/date/time as s1
    resp = client.put(
        f"/api/screenings/{s2_id}",
        json={
            "date": future_date.strftime("%Y-%m-%d"),
            "time": "18:00",  # same time as s1
            # room_id remains the original one
        },
    )
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "Scheduling conflict detected"

    # Ensure s2 did NOT change its time
    with app.app_context():
        s2 = db.session.get(Screening, s2_id)
        assert s2.time == t2


def test_update_screening_not_found_returns_404(client, app):
    """
    If the screening does not exist or is soft-deleted, must return 404.
    """
    # Case 1: non-existent
    resp1 = client.put("/api/screenings/9999", json={"time": "20:00"})
    assert resp1.status_code == 404
    assert resp1.get_json()["error"] == "Screening not found"

    # Case 2: soft-deleted
    movie_id, room_id = create_basic_movie_and_room(app)
    future_date = date.today() + timedelta(days=4)
    t = datetime.strptime("17:00", "%H:%M").time()
    s_id = create_screening_in_db(app, movie_id, room_id, future_date, t, is_deleted=True)

    resp2 = client.put(f"/api/screenings/{s_id}", json={"time": "19:00"})
    assert resp2.status_code == 404
    assert resp2.get_json()["error"] == "Screening not found"


# =========================================================
#       DELETE /api/screenings/<id> (soft delete)
# =========================================================

def test_delete_screening_soft_delete_flag(client, app):
    """
    DELETE must set is_deleted=True and return 200.
    """
    movie_id, room_id = create_basic_movie_and_room(app)
    future_date = date.today() + timedelta(days=4)
    t = datetime.strptime("17:00", "%H:%M").time()

    screening_id = create_screening_in_db(app, movie_id, room_id, future_date, t, is_deleted=False)

    resp = client.delete(f"/api/screenings/{screening_id}")
    assert resp.status_code == 200
    data = resp.get_json()
    assert "Screening deleted (soft delete)" in data["message"]

    with app.app_context():
        deleted = db.session.get(Screening, screening_id)
        assert deleted.is_deleted is True


def test_delete_screening_returns_404_when_not_found_or_already_deleted(client, app):
    """
    If the screening does not exist or is already soft-deleted,
    DELETE must return 404.
    """
    # Non-existent
    resp1 = client.delete("/api/screenings/9999")
    assert resp1.status_code == 404
    assert resp1.get_json()["error"] == "Screening not found"

    # Already deleted
    movie_id, room_id = create_basic_movie_and_room(app)
    future_date = date.today() + timedelta(days=3)
    t = datetime.strptime("16:00", "%H:%M").time()
    s_id = create_screening_in_db(app, movie_id, room_id, future_date, t, is_deleted=True)

    resp2 = client.delete(f"/api/screenings/{s_id}")
    assert resp2.status_code == 404
    assert resp2.get_json()["error"] == "Screening not found"


# =========================================================
#       GET /api/screenings-all (get_all_screenings)
# =========================================================

def test_get_all_screenings_returns_all_non_deleted_with_movie_and_room(client, app):
    """
    Must return all non-deleted screenings, including:
      - movie_id, room_id
      - date, time
      - price, available_seats
      - room (name)
      - movie (title)
    And MUST NOT include is_deleted=True ones.
    """
    movie_id, room_id = create_basic_movie_and_room(app)
    future_date1 = date.today() + timedelta(days=2)
    future_date2 = date.today() + timedelta(days=3)
    t1 = datetime.strptime("18:00", "%H:%M").time()
    t2 = datetime.strptime("20:00", "%H:%M").time()

    # s1 not deleted
    create_screening_in_db(
        app, movie_id, room_id, future_date1, t1, is_deleted=False, price=15000.0, seats=90
    )
    # s2 deleted
    create_screening_in_db(
        app, movie_id, room_id, future_date2, t2, is_deleted=True, price=20000.0, seats=80
    )

    resp = client.get("/api/screenings-all")
    assert resp.status_code == 200
    data = resp.get_json()

    # Only one non-deleted screening must be returned
    assert len(data) == 1
    s = data[0]
    assert s["movie_id"] == movie_id
    assert s["room_id"] == room_id
    assert s["room"] == "Room 1"
    assert s["movie"] == "Matrix"
    assert s["price"] == 15000.0
    assert s["available_seats"] == 90


def test_get_all_screenings_empty_list_when_no_screenings(client, app):
    """
    If there are no screenings, must return [] and status 200.
    """
    resp = client.get("/api/screenings-all")
    assert resp.status_code == 200
    data = resp.get_json()
    assert isinstance(data, list)
    assert len(data) == 0
