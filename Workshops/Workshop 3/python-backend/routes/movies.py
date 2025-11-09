from flask import Blueprint, jsonify, request
from database import db
from models import Movie, Genre

movies_bp = Blueprint('movies', __name__)

# -------------------------------
# Create a new movie
# -------------------------------
@movies_bp.route('/movies', methods=['POST'])
def create_movie():
    """
    Create a new movie.

    OpenAPI summary:
      - **Method:** POST
      - **URL:** `/api/movies`

    Request body (application/json):
    ```json
    {
      "title": "Inception",
      "duration": 148,
      "genre": "Sci-Fi"
    }
    ```

    Responses:
      - **201 Created**
        ```json
        {
          "message": "Movie created successfully",
          "id": 1,
          "title": "Inception",
          "genre": "Sci-Fi"
        }
        ```
      - **400 Bad Request**
        ```json
        {
          "error": "Missing required fields"
        }
        ```

    Description:
      Creates a new movie. If the specified genre does not exist, a new
      `Genre` record is created automatically before saving the movie.
    """
    data = request.get_json()

    if not data or not data.get('title') or not data.get('genre') or not data.get('duration'):
        return jsonify({"error": "Missing required fields"}), 400

    # Buscar o crear el género
    genre_name = data['genre'].strip()
    genre = Genre.query.filter_by(name=genre_name).first()
    if not genre:
        genre = Genre(name=genre_name)
        db.session.add(genre)
        db.session.commit()

    # Crear la película
    movie = Movie(
        title=data['title'],
        duration_minutes=int(data['duration']),
        genre=genre
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
    """
    List movies (optionally filtered).

    OpenAPI summary:
      - **Method:** GET
      - **URL:** `/api/movies`

    Query parameters:
      - `genre` (string, optional): filter by genre name (case-insensitive, partial match).
      - `title` (string, optional): filter by movie title (case-insensitive, partial match).

    Responses:
      - **200 OK**
        ```json
        [
          {
            "id": 1,
            "title": "Inception",
            "genre": "Sci-Fi",
            "duration": 148
          }
        ]
        ```

    Description:
      Returns all movies that are not soft-deleted (`is_deleted = False`),
      applying optional filters by genre and/or title.
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
    Update a movie.

    OpenAPI summary:
      - **Method:** PUT
      - **URL:** `/api/movies/{id}`

    Path parameters:
      - `id` (integer, required): movie identifier.

    Request body (application/json) – all fields optional:
    ```json
    {
      "title": "Inception (Extended)",
      "duration": 150,
      "genre": "Sci-Fi"
    }
    ```

    Responses:
      - **200 OK**
        ```json
        {
          "message": "Movie updated successfully"
        }
        ```
      - **404 Not Found**
        If the movie ID does not exist.

    Description:
      Updates the title, duration and/or genre of an existing movie.
      If a new genre name is provided and it does not exist, it is created.
    """
    movie = Movie.query.get_or_404(id)
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
    """
    Soft delete a movie.

    OpenAPI summary:
      - **Method:** DELETE
      - **URL:** `/api/movies/{id}`

    Path parameters:
      - `id` (integer, required): movie identifier.

    Responses:
      - **200 OK**
        ```json
        {
          "message": "Movie deleted (soft delete)"
        }
        ```
      - **404 Not Found**
        If the movie ID does not exist.

    Description:
      Performs a *soft delete* by setting `is_deleted = True` on the movie,
      without physically removing the record from the database.
    """
    movie = Movie.query.get_or_404(id)
    movie.is_deleted = True  # Soft delete flag
    db.session.commit()

    return jsonify({"message": "Movie deleted (soft delete)"}), 200
