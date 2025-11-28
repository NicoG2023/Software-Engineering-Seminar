import json
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database import db
from models import Movie, Genre
from services.omdb_service import OMDBService


def load_monthly_movies(json_path: str):
    """
    Load monthly movies from JSON file
    
    Args:
        json_path: Path to the monthly_movies.json file
    
    Returns:
        Dictionary with month and movies list
    """
    if not os.path.exists(json_path):
        raise FileNotFoundError(f"Monthly movies file not found: {json_path}")
    
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def preload_movies_from_json(app, json_path: str):
    """
    Preload movies from monthly JSON file using OMDB API
    
    Args:
        app: Flask application instance
        json_path: Path to the monthly_movies.json file
    """
    print("\n" + "="*60)
    print("🎬 PRELOADING MOVIES FROM MONTHLY REPORT")
    print("="*60 + "\n")
    
    # Load monthly movies
    try:
        monthly_data = load_monthly_movies(json_path)
        month = monthly_data.get("month", "Unknown")
        movies_list = monthly_data.get("movies", [])
        
        print(f"📅 Month: {month}")
        print(f"📊 Total movies to process: {len(movies_list)}\n")
    except Exception as e:
        print(f"❌ Error loading monthly movies: {e}")
        return
    
    # Initialize OMDB service
    omdb_service = OMDBService()
    
    # Statistics
    stats = {
        "total": len(movies_list),
        "success": 0,
        "updated": 0,
        "failed": 0,
        "skipped": 0
    }
    
    with app.app_context():
        for idx, movie_info in enumerate(movies_list, 1):
            title = movie_info.get("title")
            year = movie_info.get("year")
            
            print(f"\n[{idx}/{stats['total']}] Processing: {title} ({year})")
            print("-" * 40)
            
            # Fetch from OMDB
            omdb_data = omdb_service.get_movie_details(title, year)
            
            if not omdb_data:
                print(f"❌ Failed to fetch data from OMDB")
                stats["failed"] += 1
                continue
            
            # Parse OMDB data
            parsed_data = omdb_service.parse_movie_data(omdb_data)
            
            # Check if movie already exists by IMDB ID
            existing_movie = Movie.query.filter_by(imdb_id=parsed_data["imdb_id"]).first()
            
            if existing_movie:
                print(f"⚠️  Movie already exists (ID: {existing_movie.id_movie})")
                
                # Update if not preloaded before
                if not existing_movie.is_preloaded:
                    print(f"🔄 Updating to preloaded status...")
                    existing_movie.is_preloaded = True
                    existing_movie.imdb_id = parsed_data["imdb_id"]
                    existing_movie.year = parsed_data["year"]
                    existing_movie.director = parsed_data["director"]
                    existing_movie.actors = parsed_data["actors"]
                    existing_movie.plot = parsed_data["plot"]
                    existing_movie.poster_url = parsed_data["poster_url"]
                    existing_movie.rating = parsed_data["rating"]
                    stats["updated"] += 1
                else:
                    print(f"✓ Already preloaded, skipping...")
                    stats["skipped"] += 1
                
                db.session.commit()
                continue
            
            # Get or create genre
            genre_name = parsed_data["genre"]
            genre = Genre.query.filter_by(name=genre_name).first()
            if not genre:
                print(f"📝 Creating new genre: {genre_name}")
                genre = Genre(name=genre_name)
                db.session.add(genre)
                db.session.commit()
            
            # Create new movie
            new_movie = Movie(
                title=parsed_data["title"],
                duration_minutes=parsed_data["duration_minutes"],
                imdb_id=parsed_data["imdb_id"],
                year=parsed_data["year"],
                director=parsed_data["director"],
                actors=parsed_data["actors"],
                plot=parsed_data["plot"],
                poster_url=parsed_data["poster_url"],
                rating=parsed_data["rating"],
                is_preloaded=True,
                genre=genre
            )
            
            try:
                db.session.add(new_movie)
                db.session.commit()
                print(f"✅ Successfully added: {new_movie.title}")
                print(f"   - IMDB ID: {new_movie.imdb_id}")
                print(f"   - Genre: {genre.name}")
                print(f"   - Duration: {new_movie.duration_minutes} min")
                print(f"   - Rating: {new_movie.rating}/10")
                stats["success"] += 1
            except Exception as e:
                db.session.rollback()
                print(f"❌ Error saving to database: {e}")
                stats["failed"] += 1
    
    # Print summary
    print("\n" + "="*60)
    print("📊 PRELOAD SUMMARY")
    print("="*60)
    print(f"Total movies:    {stats['total']}")
    print(f"✅ Success:       {stats['success']}")
    print(f"🔄 Updated:       {stats['updated']}")
    print(f"⏭️  Skipped:       {stats['skipped']}")
    print(f"❌ Failed:        {stats['failed']}")
    print("="*60 + "\n")


if __name__ == "__main__":
    # This allows running the script directly for testing
    print("⚠️  This script should be run via Flask CLI command")
    print("   Use: flask preload-movies")
