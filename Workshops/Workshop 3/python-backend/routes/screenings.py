from flask import Blueprint, jsonify, request
from database import db
from models import Screening, Movie, TheaterRoom
from datetime import datetime, date

screenings_bp = Blueprint('screenings', __name__)

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
      "time": "19:30"
    }
    ```

    Responses:
      - **201 Created**
        ```json
        {
          "message": "Screening created successfully"
        }
        ```
      - **400 Bad Request**
        ```json
        {
          "error": "Invalid movie or room"
        }
        ```
        or
        ```json
        {
          "error": "Cannot schedule screenings in the past"
        }
        ```
        or
        ```json
        {
          "error": "Scheduling conflict detected"
        }
        ```

    Description:
      Creates a new screening for a given movie and theater room.
      It validates:
        - that the movie and room exist,
        - that the date is not in the past,
        - and that there is no screening conflict for the same room/date/time.
    """
    data = request.get_json()
    movie = Movie.query.get(data.get('movie_id'))
    room = TheaterRoom.query.get(data.get('room_id'))
    if not movie or not room:
        return jsonify({"error": "Invalid movie or room"}), 400

    screening_date = datetime.strptime(data['date'], "%Y-%m-%d").date()
    screening_time = datetime.strptime(data['time'], "%H:%M").time()

    if screening_date < date.today():
        return jsonify({"error": "Cannot schedule screenings in the past"}), 400

    conflict = Screening.query.filter_by(
        room_id=room.id,
        date=screening_date,
        time=screening_time,
        deleted=False  # assuming a soft-delete flag named `deleted`
    ).first()
    if conflict:
        return jsonify({"error": "Scheduling conflict detected"}), 400

    new_screening = Screening(
        movie_id=movie.id,
        room_id=room.id,
        date=screening_date,
        time=screening_time
    )
    db.session.add(new_screening)
    db.session.commit()
    return jsonify({"message": "Screening created successfully"}), 201


@screenings_bp.route('/screenings/<int:movie_id>', methods=['GET'])
def get_screenings_by_movie(movie_id):
    """
    Get screenings by movie.

    OpenAPI summary:
      - **Method:** GET
      - **URL:** `/api/screenings/{movie_id}`

    Path parameters:
      - `movie_id` (integer, required): movie identifier.

    Responses:
      - **200 OK**
        ```json
        [
          {
            "id": 10,
            "date": "2025-01-10",
            "time": "19:30",
            "room": "Room 1"
          }
        ]
        ```

    Description:
      Returns all non-deleted screenings for the given movie (`deleted = False`).
    """
    screenings = Screening.query.filter_by(movie_id=movie_id, deleted=False).all()
    return jsonify([
        {
            "id": s.id,
            "date": s.date.isoformat(),
            "time": s.time.strftime("%H:%M"),
            "room": s.room.name
        } for s in screenings
    ])


@screenings_bp.route('/screenings/<int:id>', methods=['DELETE'])
def delete_screening(id):
    """
    Soft delete a screening.

    OpenAPI summary:
      - **Method:** DELETE
      - **URL:** `/api/screenings/{id}`

    Path parameters:
      - `id` (integer, required): screening identifier.

    Responses:
      - **200 OK**
        ```json
        {
          "message": "Screening deleted (soft delete)"
        }
        ```
      - **404 Not Found**
        If the screening ID does not exist.

    Description:
      Performs a *soft delete* on the screening by setting `deleted = True`,
      keeping the record in the database for audit/history purposes.
    """
    screening = Screening.query.get_or_404(id)
    screening.deleted = True  # Soft delete
    db.session.commit()
    return jsonify({"message": "Screening deleted (soft delete)"}), 200
