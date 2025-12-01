from flask import Blueprint, jsonify
from models import TheaterRoom

rooms_bp = Blueprint("rooms", __name__)


@rooms_bp.route("/rooms", methods=["GET"])
def list_rooms():
    rooms = TheaterRoom.query.filter_by(is_active=True).all()
    return jsonify(
        [
            {
                "id": r.id_room,
                "name": r.name,
                "capacity": r.capacity,
                "location": r.location,
            }
            for r in rooms
        ]
    )
