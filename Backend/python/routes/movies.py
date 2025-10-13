from flask import Blueprint, jsonify, request
from database import db
from models import Movie

movies_bp = Blueprint('movies', __name__)

@movies_bp.route('/movies', methods=['POST'])
def create_movie():
    data = request.get_json()
    if not data or not data.get('title') or not data.get('genre') or not data.get('duration'):
        return jsonify({"error": "Missing required fields"}), 400
    
    movie = Movie(title=data['title'], genre=data['genre'], duration=int(data['duration']))
    db.session.add(movie)
    db.session.commit()
    return jsonify({"message": "Movie created successfully"}), 201


@movies_bp.route('/movies', methods=['GET'])
def list_movies():
    genre = request.args.get('genre')
    title = request.args.get('title')
    query = Movie.query.filter_by(active=True)

    if genre:
        query = query.filter(Movie.genre.ilike(f"%{genre}%"))
    if title:
        query = query.filter(Movie.title.ilike(f"%{title}%"))

    movies = query.all()
    return jsonify([{"id": m.id, "title": m.title, "genre": m.genre, "duration": m.duration} for m in movies])


@movies_bp.route('/movies/<int:id>', methods=['PUT'])
def update_movie(id):
    movie = Movie.query.get_or_404(id)
    data = request.get_json()

    movie.title = data.get('title', movie.title)
    movie.genre = data.get('genre', movie.genre)
    movie.duration = data.get('duration', movie.duration)

    db.session.commit()
    return jsonify({"message": "Movie updated successfully"})


@movies_bp.route('/movies/<int:id>', methods=['DELETE'])
def delete_movie(id):
    movie = Movie.query.get_or_404(id)
    movie.active = False  # Soft delete
    db.session.commit()
    return jsonify({"message": "Movie deleted (soft delete)"}), 200
