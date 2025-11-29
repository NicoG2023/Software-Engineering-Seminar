import os
import sys

# Añadir la carpeta raíz (Backend/python) al sys.path
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from flask import Flask
from database import db
from models import TheaterRoom
from routes.theater_rooms import theater_rooms_bp
import pytest


@pytest.fixture
def app():
    """
    Crea una app Flask de prueba con SQLite en memoria y registra el blueprint
    de theater_rooms bajo el prefijo /api.
    """
    app = Flask(__name__)
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    app.register_blueprint(theater_rooms_bp, url_prefix="/api")

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
#                POST /api/rooms
# =========================================================

def test_create_room_success(client, app):
    """
    Debe crear una sala correctamente cuando se envían todos los campos requeridos.
    Verifica que:
      - el status es 201
      - is_active es True por defecto
      - se persiste en la BD con los valores correctos.
    """
    payload = {
        "name": "Room A",
        "capacity": 80,
        "location": "Main building, floor 1"
    }

    resp = client.post("/api/rooms", json=payload)
    assert resp.status_code == 201

    data = resp.get_json()
    assert data["name"] == "Room A"
    assert data["capacity"] == 80
    assert data["location"] == "Main building, floor 1"
    assert data["is_active"] is True
    assert "id" in data

    with app.app_context():
        room = TheaterRoom.query.filter_by(name="Room A").first()
        assert room is not None
        assert room.capacity == 80
        assert room.location == "Main building, floor 1"
        assert room.is_active is True


def test_create_room_missing_required_fields_returns_400(client):
    """
    Si faltan name o capacity, debe devolver 400 con mensaje 'Missing required fields'.
    """
    # Falta capacity
    payload = {"name": "Room Without Capacity"}

    resp = client.post("/api/rooms", json=payload)
    assert resp.status_code == 400
    data = resp.get_json()
    assert "error" in data
    assert "Missing required fields" in data["error"]

    # Falta name
    payload2 = {"capacity": 100}
    resp2 = client.post("/api/rooms", json=payload2)
    assert resp2.status_code == 400
    data2 = resp2.get_json()
    assert "error" in data2
    assert "Missing required fields" in data2["error"]


def test_create_room_invalid_capacity_returns_400(client):
    """
    Debe devolver 400 cuando capacity no es un entero positivo (>0):
      - capacity <= 0
      - capacity no convertible a entero.
    """
    # capacity = 0
    resp = client.post("/api/rooms", json={
        "name": "Zero Capacity",
        "capacity": 0
    })
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["error"] == "Capacity must be a positive integer"

    # capacity negativo
    resp2 = client.post("/api/rooms", json={
        "name": "Negative Capacity",
        "capacity": -10
    })
    assert resp2.status_code == 400
    data2 = resp2.get_json()
    assert data2["error"] == "Capacity must be a positive integer"

    # capacity no numérico
    resp3 = client.post("/api/rooms", json={
        "name": "Bad Capacity",
        "capacity": "not-a-number"
    })
    assert resp3.status_code == 400
    data3 = resp3.get_json()
    assert data3["error"] == "Capacity must be a positive integer"


def test_create_room_location_optional_and_trimmed(client, app):
    """
    location es opcional:
      - si se envía string vacío o solo espacios, se guarda como None.
      - verifica que el campo se trimea correctamente.
    """
    payload = {
        "name": "Room Trimmed",
        "capacity": 50,
        "location": "  Second floor  "
    }
    resp = client.post("/api/rooms", json=payload)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["location"] == "Second floor"

    payload2 = {
        "name": "Room Without Location",
        "capacity": 30,
        "location": "   "
    }
    resp2 = client.post("/api/rooms", json=payload2)
    assert resp2.status_code == 201
    data2 = resp2.get_json()
    assert data2["location"] is None

    with app.app_context():
        r1 = TheaterRoom.query.filter_by(name="Room Trimmed").first()
        r2 = TheaterRoom.query.filter_by(name="Room Without Location").first()
        assert r1.location == "Second floor"
        assert r2.location is None


# =========================================================
#                GET /api/rooms (list)
# =========================================================

def test_list_rooms_only_active_by_default(client, app):
    """
    GET /api/rooms debe devolver solo las salas activas (is_active=True)
    cuando no se pasa include_inactive o se deja en false.
    """
    with app.app_context():
        r1 = TheaterRoom(name="Active 1", capacity=50, location=None, is_active=True)
        r2 = TheaterRoom(name="Inactive", capacity=60, location=None, is_active=False)
        db.session.add_all([r1, r2])
        db.session.commit()

    # Sin parámetros: solo activas
    resp = client.get("/api/rooms")
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data) == 1
    assert data[0]["name"] == "Active 1"
    assert data[0]["is_active"] is True


def test_list_rooms_include_inactive_true_returns_all(client, app):
    """
    GET /api/rooms?include_inactive=true debe devolver tanto activas como inactivas.
    """
    with app.app_context():
        r1 = TheaterRoom(name="Active", capacity=50, location=None, is_active=True)
        r2 = TheaterRoom(name="Inactive", capacity=60, location=None, is_active=False)
        db.session.add_all([r1, r2])
        db.session.commit()

    resp = client.get("/api/rooms?include_inactive=true")
    assert resp.status_code == 200
    data = resp.get_json()
    names = {r["name"] for r in data}
    assert names == {"Active", "Inactive"}

    # También debería funcionar con include_inactive=1
    resp2 = client.get("/api/rooms?include_inactive=1")
    assert resp2.status_code == 200
    data2 = resp2.get_json()
    names2 = {r["name"] for r in data2}
    assert names2 == {"Active", "Inactive"}


def test_list_rooms_returns_empty_list_when_no_rooms(client):
    """
    Si no hay salas en la BD, GET /api/rooms debe devolver [] y 200.
    """
    resp = client.get("/api/rooms")
    assert resp.status_code == 200
    data = resp.get_json()
    assert isinstance(data, list)
    assert len(data) == 0


# =========================================================
#                GET /api/rooms/<id>
# =========================================================

def test_get_room_returns_room_even_if_inactive(client, app):
    """
    GET /api/rooms/<id> debe devolver la sala tanto si está activa como inactiva.
    Solo debe fallar si no existe.
    """
    with app.app_context():
        room = TheaterRoom(name="Some Room", capacity=40, location="X", is_active=False)
        db.session.add(room)
        db.session.commit()
        room_id = room.id_room

    resp = client.get(f"/api/rooms/{room_id}")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["id"] == room_id
    assert data["name"] == "Some Room"
    assert data["capacity"] == 40
    assert data["location"] == "X"
    assert data["is_active"] is False


def test_get_room_not_found_returns_404(client):
    """
    Si el ID no existe, debe devolver 404 con error 'Room not found'.
    """
    resp = client.get("/api/rooms/9999")
    assert resp.status_code == 404
    data = resp.get_json()
    assert data["error"] == "Room not found"


# =========================================================
#                PUT /api/rooms/<id>
# =========================================================

def test_update_room_updates_all_fields(client, app):
    """
    Debe permitir actualizar name, capacity, location e is_active
    cuando se envían en el body.
    """
    with app.app_context():
        room = TheaterRoom(name="Original", capacity=50, location="Old loc", is_active=True)
        db.session.add(room)
        db.session.commit()
        room_id = room.id_room

    payload = {
        "name": "Updated Name",
        "capacity": 100,
        "location": "New Loc",
        "is_active": False,
    }

    resp = client.put(f"/api/rooms/{room_id}", json=payload)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["message"] == "Room updated successfully"

    with app.app_context():
        updated = db.session.get(TheaterRoom, room_id)
        assert updated.name == "Updated Name"
        assert updated.capacity == 100
        assert updated.location == "New Loc"
        assert updated.is_active is False


def test_update_room_partial_update_keeps_other_fields(client, app):
    """
    Si se envían solo algunos campos, los demás deben permanecer sin cambios.
    """
    with app.app_context():
        room = TheaterRoom(name="Partial", capacity=70, location="Loc", is_active=True)
        db.session.add(room)
        db.session.commit()
        room_id = room.id_room

    payload = {
        "capacity": 90  # solo capacity
    }

    resp = client.put(f"/api/rooms/{room_id}", json=payload)
    assert resp.status_code == 200

    with app.app_context():
        updated = db.session.get(TheaterRoom, room_id)
        assert updated.name == "Partial"  # sin cambios
        assert updated.capacity == 90     # actualizado
        assert updated.location == "Loc"  # sin cambios
        assert updated.is_active is True  # sin cambios


def test_update_room_invalid_capacity_returns_400_and_does_not_change_capacity(client, app):
    """
    Si se pasa un capacity inválido (<=0 o no numérico), debe devolver 400
    y no cambiar la capacidad en BD.
    """
    with app.app_context():
        room = TheaterRoom(name="Cap Test", capacity=60, location=None, is_active=True)
        db.session.add(room)
        db.session.commit()
        room_id = room.id_room

    # capacity no numérico
    resp = client.put(f"/api/rooms/{room_id}", json={"capacity": "NaN"})
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["error"] == "Capacity must be a positive integer"

    # capacity <= 0
    resp2 = client.put(f"/api/rooms/{room_id}", json={"capacity": 0})
    assert resp2.status_code == 400
    data2 = resp2.get_json()
    assert data2["error"] == "Capacity must be a positive integer"

    with app.app_context():
        updated = db.session.get(TheaterRoom, room_id)
        # Debe seguir igual que al principio
        assert updated.capacity == 60


def test_update_room_not_found_returns_404(client):
    """
    Si se llama PUT sobre un ID que no existe, debe devolver 404.
    """
    resp = client.put("/api/rooms/9999", json={"name": "Does Not Matter"})
    assert resp.status_code == 404
    data = resp.get_json()
    assert data["error"] == "Room not found"


def test_update_room_trims_name_and_location(client, app):
    """
    name y location se trimean; si name viene vacío tras trim, se ignora.
    """
    with app.app_context():
        room = TheaterRoom(name="Original", capacity=50, location="Loc", is_active=True)
        db.session.add(room)
        db.session.commit()
        room_id = room.id_room

    payload = {
        "name": "   New Name   ",
        "location": "   New Location   "
    }

    resp = client.put(f"/api/rooms/{room_id}", json=payload)
    assert resp.status_code == 200

    with app.app_context():
        updated = db.session.get(TheaterRoom, room_id)
        assert updated.name == "New Name"
        assert updated.location == "New Location"

    # Ahora probamos name como espacios -> se ignora
    resp2 = client.put(f"/api/rooms/{room_id}", json={"name": "   "})
    assert resp2.status_code == 200
    with app.app_context():
        updated2 = db.session.get(TheaterRoom, room_id)
        # Se mantiene el nombre anterior
        assert updated2.name == "New Name"


# =========================================================
#                DELETE /api/rooms/<id>
# =========================================================

def test_delete_room_soft_deletes_room(client, app):
    """
    DELETE /api/rooms/<id> debe hacer un soft delete:
      - is_active pasa de True a False
      - devuelve 200 y mensaje correcto.
    """
    with app.app_context():
        room = TheaterRoom(name="To Deactivate", capacity=40, location=None, is_active=True)
        db.session.add(room)
        db.session.commit()
        room_id = room.id_room

    resp = client.delete(f"/api/rooms/{room_id}")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["message"] == "Room deactivated (soft delete)"

    with app.app_context():
        updated = db.session.get(TheaterRoom, room_id)
        assert updated.is_active is False


def test_delete_room_returns_404_when_not_found_or_already_inactive(client, app):
    """
    Si la sala no existe o ya está inactiva, DELETE debe devolver 404 con 'Room not found'.
    """
    # Caso 1: ID inexistente
    resp = client.delete("/api/rooms/9999")
    assert resp.status_code == 404
    data = resp.get_json()
    assert data["error"] == "Room not found"

    # Caso 2: ya inactiva
    with app.app_context():
        room = TheaterRoom(name="Inactive Room", capacity=30, location=None, is_active=False)
        db.session.add(room)
        db.session.commit()
        room_id = room.id_room

    resp2 = client.delete(f"/api/rooms/{room_id}")
    assert resp2.status_code == 404
    data2 = resp2.get_json()
    assert data2["error"] == "Room not found"
