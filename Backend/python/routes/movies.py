from flask import Blueprint, jsonify, request, abort
from database import db
from models import Movie, Genre

movies_bp = Blueprint('movies', __name__)


def get_movie_or_404(movie_id: int) -> Movie:
    """
    Helper using db.session.get instead of Movie.query.get / get_or_404,
    and also honoring soft delete (is_deleted).
    """
    movie = db.session.get(Movie, movie_id)
    if movie is None or movie.is_deleted:
        # Flask will return a 404 response; tests only check the status code.
        abort(404, description="Movie not found")
    return movie


# -------------------------------
# Create a new movie
# -------------------------------
@movies_bp.route('/movies', methods=['POST'])
def create_movie():
    """
    Create a new movie.
    """
    data = request.get_json() or {}

    title = data.get('title')
    genre_name = data.get('genre')
    duration = data.get('duration')

    if not title or not genre_name or duration is None:
        return jsonify({"error": "Missing required fields"}), 400

    # Normalize values
    title = title.strip()
    genre_name = genre_name.strip()

    # Find or create the genre (case-sensitive is fine for tests, but you could
    # switch to case-insensitive if you want).
    genre = Genre.query.filter_by(name=genre_name).first()
    if not genre:
        genre = Genre(name=genre_name)
        db.session.add(genre)
        # No need to commit yet; we will commit once at the end.
        db.session.flush()

    # Create the movie
    try:
        duration_int = int(duration)
    except (TypeError, ValueError):
        return jsonify({"error": "Duration must be an integer"}), 400

    movie = Movie(
        title=title,
        duration_minutes=duration_int,
        genre=genre
    )
    db.session.add(movie)
    db.session.commit()

    return jsonify({
        "message": "Movie created successfully",
        "id": movie.id_movie,
        "title": movie.title,
        "genre": movie.genre.name if movie.genre else None,
        "duration": movie.duration_minutes
    }), 201


# -------------------------------
# Get all movies (filter optional)
# -------------------------------
@movies_bp.route('/movies', methods=['GET'])
def list_movies():
    """
    List movies (optionally filtered).
    """
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
            "duration": m.duration_minutes
        }
        for m in movies
    ]), 200


# -------------------------------
# Update a movie
# -------------------------------
@movies_bp.route('/movies/<int:id>', methods=['PUT'])
def update_movie(id):
    """
    Update a movie (modern style, no Query.get / get_or_404).
    """
    movie = get_movie_or_404(id)
    data = request.get_json() or {}

    # Title
    if 'title' in data and data['title'] is not None:
        movie.title = data['title'].strip()

    # Duration
    if 'duration' in data and data['duration'] is not None:
        try:
            movie.duration_minutes = int(data['duration'])
        except (TypeError, ValueError):
            return jsonify({"error": "Duration must be an integer"}), 400

    # Genre
    if 'genre' in data and data['genre'] is not None:
        genre_name = data['genre'].strip()
        genre = Genre.query.filter_by(name=genre_name).first()
        if not genre:
            genre = Genre(name=genre_name)
            db.session.add(genre)
            db.session.flush()
        movie.genre = genre

    db.session.commit()

    return jsonify({"message": "Movie updated successfully"}), 200


# -------------------------------
# Soft delete a movie
# -------------------------------
@movies_bp.route('/movies/<int:id>', methods=['DELETE'])
def delete_movie(id):
    """
    Soft delete a movie (modern style, no Query.get / get_or_404).
    """
    movie = get_movie_or_404(id)
    movie.is_deleted = True  # Soft delete flag
    db.session.commit()

    return jsonify({"message": "Movie deleted (soft delete)"}), 200


# -------------------------------
# Get a movie by ID
# -------------------------------
@movies_bp.route('/movies/<int:id>', methods=['GET'])
def get_movie(id):
    """
    Get a single movie by its ID, returning JSON even on 404.
    (This keeps the behavior your tests expect.)
    """
    movie = Movie.query.filter_by(id_movie=id, is_deleted=False).first()

    if not movie:
        return jsonify({"error": "Movie not found"}), 404

    return jsonify({
        "id": movie.id_movie,
        "title": movie.title,
        "genre": movie.genre.name if movie.genre else None,
        "duration": movie.duration_minutes
    }), 200


# -------------------------------
# List all genres
# -------------------------------
@movies_bp.route('/genres', methods=['GET'])
def list_genres():
    """
    List all genres.
    """
    genres = Genre.query.order_by(Genre.name.asc()).all()

    return jsonify([
        {
            "id": g.id_genre,
            "name": g.name
        }
        for g in genres
    ]), 200
