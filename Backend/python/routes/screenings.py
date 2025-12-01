# routes/screenings.py
from flask import Blueprint, jsonify, request
from database import db
from models import Screening, Movie, TheaterRoom
from datetime import datetime, date
import math

screenings_bp = Blueprint('screenings', __name__)

# -------------------------------
# Create a new screening
# -------------------------------
@screenings_bp.route('/screenings', methods=['POST'])
def create_screening():
    """
    Create a new screening.

    OpenAPI summary:
      - **Method:** POST
      - **URL:** `/api/screenings`

    Request body (application/json):
    ```json
    {
      "movie_id": 1,
      "room_id": 1,
      "date": "2025-01-10",
      "time": "19:30",
      "price": 25000.0   // optional
    }
    ```

    Responses:
      - **201 Created**
        ```json
        {
          "message": "Screening created successfully",
          "id": 10
        }
        ```
      - **400 Bad Request** (varios casos)
        ```json
        { "error": "Missing required fields" }
        ```
        ```json
        { "error": "Invalid date format, expected YYYY-MM-DD" }
        ```
        ```json
        { "error": "Invalid time format, expected HH:MM" }
        ```
        ```json
        { "error": "Invalid movie or room" }
        ```
        ```json
        { "error": "Movie or room not available" }
        ```
        ```json
        { "error": "Cannot schedule screenings in the past" }
        ```
        ```json
        { "error": "Scheduling conflict detected" }
        ```

    Description:
      Creates a new screening for a given movie and theater room.
      It validates:
        - that all required fields are present,
        - that the movie and room exist,
        - that the movie is not soft-deleted and the room is active,
        - that the date is not in the past,
        - and that there is no screening conflict for the same room/date/time.
      It initializes `available_seats` with the room capacity and optionally
      sets a price.
    """
    data = request.get_json() or {}

    movie_id = data.get('movie_id')
    room_id = data.get('room_id')
    date_str = data.get('date')
    time_str = data.get('time')

    if not all([movie_id, room_id, date_str, time_str]):
        return jsonify({"error": "Missing required fields"}), 400

    # Buscar movie y room
    movie = db.session.get(Movie, movie_id)
    room = db.session.get(TheaterRoom, room_id)

    if not movie or not room:
        return jsonify({"error": "Invalid movie or room"}), 400

    # Validar estado de movie y room
    if getattr(movie, "is_deleted", False) or not room.is_active:
        return jsonify({"error": "Movie or room not available"}), 400

    # Parsear fecha y hora
    try:
        screening_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format, expected YYYY-MM-DD"}), 400

    try:
        screening_time = datetime.strptime(time_str, "%H:%M").time()
    except ValueError:
        return jsonify({"error": "Invalid time format, expected HH:MM"}), 400

    # No permitir fechas en el pasado
    if screening_date < date.today():
        return jsonify({"error": "Cannot schedule screenings in the past"}), 400

    # Comprobar conflictos en la misma sala/fecha/hora
    conflict = Screening.query.filter_by(
        room_id=room.id_room,
        date=screening_date,
        time=screening_time,
        is_deleted=False
    ).first()

    if conflict:
        return jsonify({"error": "Scheduling conflict detected"}), 400

    # Precio opcional
    raw_price = data.get("price")
    price_value = None
    if raw_price is not None:
        try:
            price_value = float(raw_price)
        except (TypeError, ValueError):
            return jsonify({"error": "Invalid price"}), 400

    # Crear screening
    new_screening = Screening(
        movie_id=movie.id_movie,
        room_id=room.id_room,
        date=screening_date,
        time=screening_time,
        price=price_value,
        available_seats=room.capacity,  # inicializamos con la capacidad total
    )
    db.session.add(new_screening)
    db.session.commit()

    return jsonify({
        "message": "Screening created successfully",
        "id": new_screening.id_screening
    }), 201


# -------------------------------
# Get screenings by movie
# -------------------------------
@screenings_bp.route('/screenings/<int:movie_id>', methods=['GET'])
def get_screenings_by_movie(movie_id):
    """
    Get screenings by movie.

    OpenAPI summary:
      - **Method:** GET
      - **URL:** `/api/screenings/{movie_id}`

    Path parameters:
      - `movie_id` (integer, required): Movie identifier.

    Responses:
      - **200 OK**
        ```json
        [
          {
            "id": 10,
            "date": "2025-01-10",
            "time": "19:30",
            "room": "Room 1",
            "room_id": 1,
            "price": 25000.0,
            "available_seats": 80
          }
        ]
        ```

    Description:
      Returns all non-deleted screenings for the given movie (`is_deleted = False`),
      including basic information about date, time, room, price and available seats.
    """
    screenings = Screening.query.filter_by(
        movie_id=movie_id,
        is_deleted=False
    ).all()

    return jsonify([
        {
            "id": s.id_screening,
            "date": s.date.isoformat(),
            "time": s.time.strftime("%H:%M"),
            "room": s.room.name if s.room else None,
            "room_id": s.room_id,
            "price": float(s.price) if s.price is not None else None,
            "available_seats": s.available_seats,
        }
        for s in screenings
    ]), 200


# -------------------------------
# Get single screening by ID
# -------------------------------
@screenings_bp.route('/screenings/id/<int:id>', methods=['GET'])
def get_screening(id):
    """
    Get a single screening by its ID.

    OpenAPI summary:
      - **Method:** GET
      - **URL:** `/api/screenings/id/{id}`

    Path parameters:
      - `id` (integer, required): Screening identifier.

    Responses:
      - **200 OK**
        ```json
        {
          "id": 10,
          "movie_id": 1,
          "room_id": 1,
          "date": "2025-01-10",
          "time": "19:30",
          "price": 25000.0,
          "available_seats": 80,
          "room": "Room 1"
        }
        ```
      - **404 Not Found**
        ```json
        { "error": "Screening not found" }
        ```

    Description:
      Returns a single non-deleted screening with all its core fields.
      Useful for edit forms in the admin UI.
    """
    screening = Screening.query.filter_by(
        id_screening=id,
        is_deleted=False
    ).first()

    if not screening:
        return jsonify({"error": "Screening not found"}), 404

    return jsonify({
        "id": screening.id_screening,
        "movie_id": screening.movie_id,
        "room_id": screening.room_id,
        "date": screening.date.isoformat(),
        "time": screening.time.strftime("%H:%M"),
        "price": float(screening.price) if screening.price is not None else None,
        "available_seats": screening.available_seats,
        "room": screening.room.name if screening.room else None,
    }), 200


# -------------------------------
# Update a screening
# -------------------------------
@screenings_bp.route('/screenings/<int:id>', methods=['PUT'])
def update_screening(id):
    """
    Update a screening.

    OpenAPI summary:
      - **Method:** PUT
      - **URL:** `/api/screenings/{id}`

    Path parameters:
      - `id` (integer, required): Screening identifier.

    Request body (application/json) – all fields optional:
    ```json
    {
      "movie_id": 1,
      "room_id": 2,
      "date": "2025-01-11",
      "time": "21:00",
      "price": 27000.0,
      "available_seats": 75
    }
    ```

    Responses:
      - **200 OK**
        ```json
        { "message": "Screening updated successfully" }
        ```
      - **400 Bad Request**
        (mismos tipos de errores que en el POST: formatos inválidos, conflictos, etc.)
      - **404 Not Found**
        Si el screening no existe o está soft-deleted.

    Description:
      Updates one or more fields of an existing screening. It:
        - ignores fields not present in the body,
        - validates movie and room if changed,
        - validates date/time formatting and that they are not in the past,
        - checks for scheduling conflicts in the room/date/time,
        - allows updating price and available_seats.
    """
    screening = Screening.query.filter_by(
        id_screening=id,
        is_deleted=False
    ).first()

    if not screening:
        return jsonify({"error": "Screening not found"}), 404

    data = request.get_json() or {}

    # Movie change (opcional)
    movie_id = data.get('movie_id')
    if movie_id is not None:
        movie = db.session.get(Movie, movie_id)
        if not movie or getattr(movie, "is_deleted", False):
            return jsonify({"error": "Invalid or unavailable movie"}), 400
        screening.movie_id = movie.id_movie

    # Room change (opcional)
    room_id = data.get('room_id')
    if room_id is not None:
        room = db.session.get(TheaterRoom, room_id)
        if not room or not room.is_active:
            return jsonify({"error": "Invalid or inactive room"}), 400
        screening.room_id = room.id_room
        # Opcional: resetear available_seats a la nueva capacidad (si quisieras)
        # screening.available_seats = room.capacity

    # Date change (opcional)
    date_str = data.get('date')
    if date_str is not None:
        try:
            new_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid date format, expected YYYY-MM-DD"}), 400
        if new_date < date.today():
            return jsonify({"error": "Cannot schedule screenings in the past"}), 400
        screening.date = new_date

    # Time change (opcional)
    time_str = data.get('time')
    if time_str is not None:
        try:
            new_time = datetime.strptime(time_str, "%H:%M").time()
        except ValueError:
            return jsonify({"error": "Invalid time format, expected HH:MM"}), 400
        screening.time = new_time

    # Price change (opcional)
    if 'price' in data:
      raw_price = data.get('price')
      if raw_price is None:
          screening.price = None
      else:
          try:
              price_value = float(raw_price)
          except (TypeError, ValueError):
              return jsonify({"error": "Invalid price"}), 400

          if not math.isfinite(price_value):
              return jsonify({"error": "Invalid price"}), 400

          screening.price = price_value

    # Available seats change (opcional)
    if 'available_seats' in data:
        raw_seats = data.get('available_seats')
        try:
            seats_int = int(raw_seats)
            if seats_int < 0:
                raise ValueError()
        except (TypeError, ValueError):
            return jsonify({"error": "Invalid available_seats"}), 400
        screening.available_seats = seats_int

    # Verificar conflicto con otros screenings de la misma sala/fecha/hora
    conflict = Screening.query.filter(
        Screening.id_screening != screening.id_screening,
        Screening.room_id == screening.room_id,
        Screening.date == screening.date,
        Screening.time == screening.time,
        Screening.is_deleted == False  # noqa: E712
    ).first()

    if conflict:
        return jsonify({"error": "Scheduling conflict detected"}), 400

    db.session.commit()
    return jsonify({"message": "Screening updated successfully"}), 200


# -------------------------------
# Soft delete a screening
# -------------------------------
@screenings_bp.route('/screenings/<int:id>', methods=['DELETE'])
def delete_screening(id):
    """
    Soft delete a screening.

    OpenAPI summary:
      - **Method:** DELETE
      - **URL:** `/api/screenings/{id}`

    Path parameters:
      - `id` (integer, required): Screening identifier.

    Responses:
      - **200 OK**
        ```json
        { "message": "Screening deleted (soft delete)" }
        ```
      - **404 Not Found**
        ```json
        { "error": "Screening not found" }
        ```

    Description:
      Performs a *soft delete* on the screening by setting `is_deleted = True`,
      keeping the record in the database for audit/history purposes.
    """
    screening = Screening.query.filter_by(id_screening=id).first()

    if not screening or screening.is_deleted:
        return jsonify({"error": "Screening not found"}), 404

    screening.is_deleted = True
    db.session.commit()
    return jsonify({"message": "Screening deleted (soft delete)"}), 200

# -------------------------------
# Get all screenings (admin use)
# -------------------------------
@screenings_bp.route('/screenings-all', methods=['GET'])
def get_all_screenings():
    """
    Get all non-deleted screenings.

    OpenAPI summary:
      - **Method:** GET
      - **URL:** `/api/screenings-all`

    Responses:
      - **200 OK**
        ```json
        [
          {
            "id": 12,
            "movie_id": 3,
            "room_id": 1,
            "date": "2025-01-12",
            "time": "18:00",
            "price": 20000.0,
            "available_seats": 60,
            "room": "Sala Principal",
            "movie": "Interstellar"
          }
        ]
        ```

    Description:
      Returns **every** screening that is not soft-deleted (`is_deleted = False`).
      This is intended for **admin dashboards** where all screenings must be shown
      regardless of movie.

      It includes:
        - basic screening fields,
        - room name,
        - movie title,
        - availability info,
        - formatted date and time.
    """
    screenings = Screening.query.filter_by(is_deleted=False).all()

    result = []
    for s in screenings:
        result.append({
            "id": s.id_screening,
            "movie_id": s.movie_id,
            "room_id": s.room_id,
            "date": s.date.isoformat(),
            "time": s.time.strftime("%H:%M"),
            "price": float(s.price) if s.price is not None else None,
            "available_seats": s.available_seats,
            "room": s.room.name if s.room else None,
            "movie": s.movie.title if s.movie else None,
        })

    return jsonify(result), 200


# -------------------------------
# Seed sample screenings for current month
# -------------------------------
@screenings_bp.route('/screenings/seed-month', methods=['POST'])
def seed_month_screenings():
    """
    Create sample screenings across the current month for existing movies.

    Strategy:
    - Use the first active room
    - Create one screening per movie at 19:00 for each remaining day of current month
    - Skip days in the past and skip conflicts
    """
    # find an active room
    room = TheaterRoom.query.filter_by(is_active=True).order_by(TheaterRoom.id_room.asc()).first()
    if not room:
        return jsonify({"error": "No active rooms found"}), 400

    # movies available (not deleted)
    movies = Movie.query.filter_by(is_deleted=False).all()
    if not movies:
        return jsonify({"error": "No movies found"}), 400

    # month iteration
    today = date.today()
    month_start = date(today.year, today.month, 1)
    # compute last day of month
    if today.month == 12:
        next_month_start = date(today.year + 1, 1, 1)
    else:
        next_month_start = date(today.year, today.month + 1, 1)
    month_days = (next_month_start - month_start).days

    created = 0
    time_slots = ["10:00", "13:00", "16:00", "19:00", "21:00"]
    for day in range(1, month_days + 1):
        d = date(today.year, today.month, day)
        if d < today:
            continue
        # schedule at most one movie per time slot
        for idx, t in enumerate(time_slots):
            if idx >= len(movies):
                break
            m = movies[idx]
            slot_time = datetime.strptime(t, "%H:%M").time()
            # conflict: any movie occupying same room/date/time
            room_conflict = Screening.query.filter_by(
                room_id=room.id_room,
                date=d,
                time=slot_time,
                is_deleted=False,
            ).first()
            if room_conflict:
                continue
            new_s = Screening(
                movie_id=m.id_movie,
                room_id=room.id_room,
                date=d,
                time=slot_time,
                price=None,
                available_seats=room.capacity,
            )
            db.session.add(new_s)
            created += 1

    db.session.commit()
    return jsonify({"message": "Month screenings seeded", "created": created}), 201
