from flask import Blueprint, jsonify, request
from database import db
from models import Screening, Movie, TheaterRoom
from datetime import datetime, date, time

screenings_bp = Blueprint('screenings', __name__)

@screenings_bp.route('/screenings', methods=['POST'])
def create_screening():
    data = request.get_json()
    movie = Movie.query.get(data.get('movie_id'))
    room = TheaterRoom.query.get(data.get('room_id'))
    if not movie or not room:
        return jsonify({"error": "Invalid movie or room"}), 400

    screening_date = datetime.strptime(data['date'], "%Y-%m-%d").date()
    screening_time = datetime.strptime(data['time'], "%H:%M").time()

    if screening_date < date.today():
        return jsonify({"error": "Cannot schedule screenings in the past"}), 400

    conflict = Screening.query.filter_by(room_id=room.id, date=screening_date, time=screening_time, deleted=False).first()
    if conflict:
        return jsonify({"error": "Scheduling conflict detected"}), 400

    new_screening = Screening(movie_id=movie.id, room_id=room.id, date=screening_date, time=screening_time)
    db.session.add(new_screening)
    db.session.commit()
    return jsonify({"message": "Screening created successfully"}), 201


@screenings_bp.route('/screenings/<int:movie_id>', methods=['GET'])
def get_screenings_by_movie(movie_id):
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
    screening = Screening.query.get_or_404(id)
    screening.deleted = True  # Soft delete
    db.session.commit()
    return jsonify({"message": "Screening deleted (soft delete)"}), 200
