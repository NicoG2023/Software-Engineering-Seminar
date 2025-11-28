from flask import Blueprint, jsonify, request
from database import db
from models import Movie, Genre

movies_bp = Blueprint('movies', __name__)

# -------------------------------
# Create a new movie
# -------------------------------
@movies_bp.route('/movies', methods=['POST'])
def create_movie():
    data = request.get_json()

    if not data or not data.get('title') or not data.get('genre') or not data.get('duration'):
        return jsonify({"error": "Missing required fields"}), 400

    # Check if movie with same title already exists and is preloaded
    existing = Movie.query.filter_by(title=data['title'], is_preloaded=True).first()
    if existing:
        return jsonify({
            "error": "Cannot create movie. A preloaded movie with this title already exists.",
            "preloaded_movie_id": existing.id_movie
        }), 403

    # Buscar o crear el género
    genre_name = data['genre'].strip()
    genre = Genre.query.filter_by(name=genre_name).first()
    if not genre:
        genre = Genre(name=genre_name)
        db.session.add(genre)
        db.session.commit()

    # Crear la película (solo permitido si no está precargada)
    movie = Movie(
        title=data['title'],
        duration_minutes=int(data['duration']),
        genre=genre,
        is_preloaded=False  # User-created movies are not preloaded
    )
    db.session.add(movie)
    db.session.commit()

    return jsonify({
        "message": "Movie created successfully",
        "id": movie.id_movie,
        "title": movie.title,
        "genre": movie.genre.name
    }), 201


# -------------------------------
# Get all movies (filter optional)
# -------------------------------
@movies_bp.route('/movies', methods=['GET'])
def list_movies():
    genre_filter = request.args.get('genre')
    title_filter = request.args.get('title')

    query = Movie.query.filter_by(is_deleted=False)

    if genre_filter:
        query = query.join(Genre).filter(Genre.name.ilike(f"%{genre_filter}%"))
    if title_filter:
        query = query.filter(Movie.title.ilike(f"%{title_filter}%"))

    movies = query.all()

    return jsonify([
        {
            "id": m.id_movie,
            "title": m.title,
            "genre": m.genre.name if m.genre else None,
            "duration": m.duration_minutes,
            "year": m.year,
            "director": m.director,
            "actors": m.actors,
            "plot": m.plot,
            "poster_url": m.poster_url,
            "rating": m.rating,
            "imdb_id": m.imdb_id,
            "is_preloaded": m.is_preloaded
        }
        for m in movies
    ]), 200


# -------------------------------
# Update a movie
# -------------------------------
@movies_bp.route('/movies/<int:id>', methods=['PUT'])
def update_movie(id):
    movie = Movie.query.get_or_404(id)
    
    # Prevent modification of preloaded movies
    if movie.is_preloaded:
        return jsonify({
            "error": "Cannot modify preloaded movies from OMDB API",
            "is_preloaded": True
        }), 403
    
    data = request.get_json()

    # Actualizar título y duración
    movie.title = data.get('title', movie.title)
    movie.duration_minutes = data.get('duration', movie.duration_minutes)

    # Si hay cambio de género
    if 'genre' in data:
        genre_name = data['genre'].strip()
        genre = Genre.query.filter_by(name=genre_name).first()
        if not genre:
            genre = Genre(name=genre_name)
            db.session.add(genre)
            db.session.commit()
        movie.genre = genre

    db.session.commit()

    return jsonify({"message": "Movie updated successfully"}), 200


# -------------------------------
# Soft delete a movie
# -------------------------------
@movies_bp.route('/movies/<int:id>', methods=['DELETE'])
def delete_movie(id):
    movie = Movie.query.get_or_404(id)
    
    # Prevent deletion of preloaded movies
    if movie.is_preloaded:
        return jsonify({
            "error": "Cannot delete preloaded movies from OMDB API",
            "is_preloaded": True
        }), 403
    
    movie.is_deleted = True  # Soft delete flag
    db.session.commit()

    return jsonify({"message": "Movie deleted (soft delete)"}), 200
