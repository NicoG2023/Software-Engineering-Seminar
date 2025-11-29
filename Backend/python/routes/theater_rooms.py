from flask import Blueprint, jsonify, request
from database import db
from models import TheaterRoom

theater_rooms_bp = Blueprint('theater_rooms', __name__)

# -------------------------------
# Create a new theater room
# -------------------------------
@theater_rooms_bp.route('/rooms', methods=['POST'])
def create_room():
    """
    Create a new theater room.

    OpenAPI summary:
      - **Method:** POST
      - **URL:** `/api/rooms`

    Request body (application/json):
    ```json
    {
      "name": "Room 1",
      "capacity": 80,
      "location": "Main building, 2nd floor"
    }
    ```

    Fields:
      - `name` (string, required): Room name.
      - `capacity` (integer, required): Total number of seats (> 0).
      - `location` (string, optional): Description of the room location.

    Responses:
      - **201 Created**
        ```json
        {
          "id": 1,
          "name": "Room 1",
          "capacity": 80,
          "location": "Main building, 2nd floor",
          "is_active": true
        }
        ```
      - **400 Bad Request**
        ```json
        { "error": "Missing required fields" }
        ```
        ```json
        { "error": "Capacity must be a positive integer" }
        ```

    Description:
      Creates a new theater room that can later be used to schedule screenings.
      The room is created as active (`is_active = True`) by default.
    """
    data = request.get_json() or {}

    name = (data.get('name') or '').strip()
    capacity = data.get('capacity')
    location = (data.get('location') or '').strip() or None

    if not name or capacity is None:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        capacity_int = int(capacity)
        if capacity_int <= 0:
            raise ValueError()
    except (TypeError, ValueError):
        return jsonify({"error": "Capacity must be a positive integer"}), 400

    room = TheaterRoom(
        name=name,
        capacity=capacity_int,
        location=location,
        is_active=True
    )
    db.session.add(room)
    db.session.commit()

    return jsonify({
        "id": room.id_room,
        "name": room.name,
        "capacity": room.capacity,
        "location": room.location,
        "is_active": room.is_active
    }), 201


# -------------------------------
# List theater rooms
# -------------------------------
@theater_rooms_bp.route('/rooms', methods=['GET'])
def list_rooms():
    """
    List theater rooms.

    OpenAPI summary:
      - **Method:** GET
      - **URL:** `/api/rooms`

    Query parameters:
      - `include_inactive` (boolean, optional, default = false):
          - `false` → only active rooms
          - `true`  → all rooms

    Example:
      - `/api/rooms`
      - `/api/rooms?include_inactive=true`

    Responses:
      - **200 OK**
        ```json
        [
          {
            "id": 1,
            "name": "Room 1",
            "capacity": 80,
            "location": "Main building, 2nd floor",
            "is_active": true
          }
        ]
        ```

    Description:
      Returns the list of theater rooms. By default only active rooms are returned.
      If `include_inactive=true` is provided, inactive rooms are included as well.
    """
    include_inactive_raw = request.args.get('include_inactive', 'false').lower()
    include_inactive = include_inactive_raw in ('true', '1', 'yes')

    query = TheaterRoom.query
    if not include_inactive:
        query = query.filter_by(is_active=True)

    rooms = query.all()

    return jsonify([
        {
            "id": r.id_room,
            "name": r.name,
            "capacity": r.capacity,
            "location": r.location,
            "is_active": r.is_active
        }
        for r in rooms
    ]), 200


# -------------------------------
# Get a single theater room by ID
# -------------------------------
@theater_rooms_bp.route('/rooms/<int:id>', methods=['GET'])
def get_room(id):
    """
    Get a single theater room by its ID.

    OpenAPI summary:
      - **Method:** GET
      - **URL:** `/api/rooms/{id}`

    Path parameters:
      - `id` (integer, required): Room identifier.

    Responses:
      - **200 OK**
        ```json
        {
          "id": 1,
          "name": "Room 1",
          "capacity": 80,
          "location": "Main building, 2nd floor",
          "is_active": true
        }
        ```
      - **404 Not Found**
        ```json
        { "error": "Room not found" }
        ```

    Description:
      Returns a single theater room, active or inactive.
    """
    room = db.session.get(TheaterRoom, id)
    if not room:
        return jsonify({"error": "Room not found"}), 404

    return jsonify({
        "id": room.id_room,
        "name": room.name,
        "capacity": room.capacity,
        "location": room.location,
        "is_active": room.is_active
    }), 200


# -------------------------------
# Update a theater room
# -------------------------------
@theater_rooms_bp.route('/rooms/<int:id>', methods=['PUT'])
def update_room(id):
    """
    Update a theater room.

    OpenAPI summary:
      - **Method:** PUT
      - **URL:** `/api/rooms/{id}`

    Path parameters:
      - `id` (integer, required): Room identifier.

    Request body (application/json) – all fields optional:
    ```json
    {
      "name": "Room 1 - Updated",
      "capacity": 100,
      "location": "New location",
      "is_active": true
    }
    ```

    Fields:
      - `name` (string, optional): New room name.
      - `capacity` (integer, optional): New capacity (> 0).
      - `location` (string, optional): New location.
      - `is_active` (boolean, optional): Activate/deactivate the room.

    Responses:
      - **200 OK**
        ```json
        { "message": "Room updated successfully" }
        ```
      - **400 Bad Request**
        ```json
        { "error": "Capacity must be a positive integer" }
        ```
      - **404 Not Found**
        ```json
        { "error": "Room not found" }
        ```

    Description:
      Updates the basic attributes of a theater room. Any field not present
      in the request body is left unchanged. Allow toggling `is_active`, which
      is used to prevent new screenings in inactive rooms.
    """
    room = db.session.get(TheaterRoom, id)
    if not room:
        return jsonify({"error": "Room not found"}), 404

    data = request.get_json() or {}

    # Name
    if 'name' in data:
      name = (data.get('name') or '').strip()
      if name:
          room.name = name

    # Capacity
    if 'capacity' in data:
        raw_cap = data.get('capacity')
        try:
            cap_int = int(raw_cap)
            if cap_int <= 0:
                raise ValueError()
        except (TypeError, ValueError):
            return jsonify({"error": "Capacity must be a positive integer"}), 400
        room.capacity = cap_int

    # Location
    if 'location' in data:
        loc = (data.get('location') or '').strip()
        room.location = loc or None

    # is_active
    if 'is_active' in data:
        room.is_active = bool(data.get('is_active'))

    db.session.commit()
    return jsonify({"message": "Room updated successfully"}), 200


# -------------------------------
# Soft delete / deactivate a theater room
# -------------------------------
@theater_rooms_bp.route('/rooms/<int:id>', methods=['DELETE'])
def delete_room(id):
    """
    Deactivate (soft delete) a theater room.

    OpenAPI summary:
      - **Method:** DELETE
      - **URL:** `/api/rooms/{id}`

    Path parameters:
      - `id` (integer, required): Room identifier.

    Responses:
      - **200 OK**
        ```json
        { "message": "Room deactivated (soft delete)" }
        ```
      - **404 Not Found**
        ```json
        { "error": "Room not found" }
        ```

    Description:
      Performs a *soft delete* by setting `is_active = False` on the room,
      without physically removing the record from the database.
      Existing screenings that reference this room remain stored for history,
      but new screenings should not be created for inactive rooms.
    """
    room = db.session.get(TheaterRoom, id)
    if not room or not room.is_active:
        return jsonify({"error": "Room not found"}), 404

    room.is_active = False
    db.session.commit()
    return jsonify({"message": "Room deactivated (soft delete)"}), 200
