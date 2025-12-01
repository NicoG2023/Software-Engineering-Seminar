from flask import Blueprint, jsonify, request
from database import db
from models import Movie, Genre

movies_bp = Blueprint("movies", __name__)


# -------------------------------
# Create a new movie
# -------------------------------
@movies_bp.route("/movies", methods=["POST"])
def create_movie():
    data = request.get_json()

    if (
        not data
        or not data.get("title")
        or not data.get("genre")
        or not data.get("duration")
    ):
        return jsonify({"error": "Missing required fields"}), 400

    # Check if movie with same title already exists and is preloaded
    existing = Movie.query.filter_by(title=data["title"], is_preloaded=True).first()
    if existing:
        return (
            jsonify(
                {
                    "error": "Cannot create movie. A preloaded movie with this title already exists.",
                    "preloaded_movie_id": existing.id_movie,
                }
            ),
            403,
        )

    # Buscar o crear el género
    genre_name = data["genre"].strip()
    genre = Genre.query.filter_by(name=genre_name).first()
    if not genre:
        genre = Genre(name=genre_name)
        db.session.add(genre)
        db.session.commit()

    # Crear la película (solo permitido si no está precargada)
    movie = Movie(
        title=data["title"],
        duration_minutes=int(data["duration"]),
        genre=genre,
        is_preloaded=False,  # User-created movies are not preloaded
    )
    db.session.add(movie)
    db.session.commit()

    return (
        jsonify(
            {
                "message": "Movie created successfully",
                "id": movie.id_movie,
                "title": movie.title,
                "genre": movie.genre.name,
                "duration": movie.duration_minutes,
            }
        ),
        201,
    )


# -------------------------------
# Get all movies (filter optional)
# -------------------------------
@movies_bp.route("/movies", methods=["GET"])
def list_movies():
    genre_filter = request.args.get("genre")
    title_filter = request.args.get("title")

    query = Movie.query.filter_by(is_deleted=False)

    if genre_filter:
        query = query.join(Genre).filter(Genre.name.ilike(f"%{genre_filter}%"))
    if title_filter:
        query = query.filter(Movie.title.ilike(f"%{title_filter}%"))

    movies = query.all()

    return (
        jsonify(
            [
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
                    "is_preloaded": m.is_preloaded,
                }
                for m in movies
            ]
        ),
        200,
    )


# -------------------------------
# Get movie by id
# -------------------------------
@movies_bp.route("/movies/<int:id>", methods=["GET"])
def get_movie(id):
    movie = Movie.query.get(id)
    if not movie or movie.is_deleted:
        return jsonify({"error": "Movie not found"}), 404

    result = {
        "id": movie.id_movie,
        "title": movie.title,
        "genre": movie.genre.name if movie.genre else None,
        "duration": movie.duration_minutes,
        "year": movie.year,
        "director": movie.director,
        "actors": movie.actors,
        "plot": movie.plot,
        "poster_url": movie.poster_url,
        "rating": movie.rating,
        "imdb_id": movie.imdb_id,
        "is_preloaded": movie.is_preloaded,
    }
    return jsonify(result), 200


# -------------------------------
# List genres
# -------------------------------
@movies_bp.route("/genres", methods=["GET"])
def list_genres():
    genres = Genre.query.order_by(Genre.name.asc()).all()
    return jsonify([{"id": g.id_genre, "name": g.name} for g in genres]), 200


# -------------------------------
# Update a movie
# -------------------------------
@movies_bp.route("/movies/<int:id>", methods=["PUT"])
def update_movie(id):
    movie = Movie.query.get_or_404(id)

    # Prevent modification of preloaded movies
    if movie.is_preloaded:
        return (
            jsonify(
                {
                    "error": "Cannot modify preloaded movies from OMDB API",
                    "is_preloaded": True,
                }
            ),
            403,
        )

    data = request.get_json()

    # Actualizar título y duración
    movie.title = data.get("title", movie.title)
    movie.duration_minutes = data.get("duration", movie.duration_minutes)

    # Si hay cambio de género
    if "genre" in data:
        genre_name = data["genre"].strip()
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
@movies_bp.route("/movies/<int:id>", methods=["DELETE"])
def delete_movie(id):
    movie = Movie.query.get_or_404(id)

    # Prevent deletion of preloaded movies
    if movie.is_preloaded:
        return (
            jsonify(
                {
                    "error": "Cannot delete preloaded movies from OMDB API",
                    "is_preloaded": True,
                }
            ),
            403,
        )

    movie.is_deleted = True  # Soft delete flag
    db.session.commit()

    return jsonify({"message": "Movie deleted (soft delete)"}), 200


# -------------------------------
# Seed monthly movies (simple, no OMDB)
# -------------------------------
@movies_bp.route("/movies/seed-monthly-simple", methods=["POST"])
def seed_monthly_simple():
    import json

    try:
        with open("data/monthly_movies.json", "r") as f:
            data = json.load(f)
    except Exception:
        return jsonify({"error": "monthly_movies.json not found"}), 404

    default_genre_name = "General"
    default_duration = 120
    genre = Genre.query.filter_by(name=default_genre_name).first()
    if not genre:
        genre = Genre(name=default_genre_name)
        db.session.add(genre)
        db.session.commit()

    created = 0
    for m in data.get("movies", []):
        title = m.get("title")
        if not title:
            continue
        if Movie.query.filter_by(title=title).first():
            continue
        movie = Movie(
            title=title,
            duration_minutes=default_duration,
            genre=genre,
            is_preloaded=False,
        )
        db.session.add(movie)
        created += 1
    db.session.commit()

    return jsonify({"message": "Seeded monthly movies", "created": created}), 201


# -------------------------------
# Seed monthly movies via OMDB enrichment
# -------------------------------
@movies_bp.route("/movies/seed-monthly", methods=["POST"])
def seed_monthly_omdb():
    import json
    from services.omdb_service import OMDBService

    try:
        with open("data/monthly_movies.json", "r") as f:
            data = json.load(f)
    except Exception:
        return jsonify({"error": "monthly_movies.json not found"}), 404

    movies_list = data.get("movies", [])
    service = OMDBService()
    created = 0
    updated = 0
    skipped = 0

    for m in movies_list:
        title = m.get("title")
        year = m.get("year")
        if not title:
            continue
        raw = service.get_movie_details(title, year)
        if not raw:
            continue
        parsed = service.parse_movie_data(raw)

        genre_name = parsed.get("genre") or "Unknown"
        genre = Genre.query.filter_by(name=genre_name).first()
        if not genre:
            genre = Genre(name=genre_name)
            db.session.add(genre)
            db.session.commit()

        existing = Movie.query.filter_by(imdb_id=parsed.get("imdb_id")).first()
        if existing:
            if not existing.is_preloaded:
                existing.is_preloaded = True
                existing.year = parsed.get("year")
                existing.director = parsed.get("director")
                existing.actors = parsed.get("actors")
                existing.plot = parsed.get("plot")
                existing.poster_url = parsed.get("poster_url")
                existing.rating = parsed.get("rating")
                existing.genre = genre
                updated += 1
            else:
                skipped += 1
            db.session.commit()
            continue

        movie = Movie(
            title=parsed.get("title"),
            duration_minutes=parsed.get("duration_minutes"),
            imdb_id=parsed.get("imdb_id"),
            year=parsed.get("year"),
            director=parsed.get("director"),
            actors=parsed.get("actors"),
            plot=parsed.get("plot"),
            poster_url=parsed.get("poster_url"),
            rating=parsed.get("rating"),
            is_preloaded=True,
            genre=genre,
        )
        db.session.add(movie)
        created += 1
    db.session.commit()
    return (
        jsonify(
            {
                "message": "Monthly movies seeded with OMDB enrichment",
                "created": created,
                "updated": updated,
                "skipped": skipped,
            }
        ),
        201,
    )
