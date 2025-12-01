import requests
import os
from typing import Optional, Dict
from dotenv import load_dotenv

load_dotenv()

OMDB_API_KEY = os.getenv("OMDB_API_KEY")
OMDB_BASE_URL = "http://www.omdbapi.com/"


class OMDBService:
    """Service to interact with OMDB API"""

    def __init__(self):
        if not OMDB_API_KEY:
            raise ValueError("OMDB_API_KEY not found in environment variables")
        self.api_key = OMDB_API_KEY
        self.base_url = OMDB_BASE_URL
        self._cache = {}

    def get_movie_details(
        self, title: str, year: Optional[str] = None
    ) -> Optional[Dict]:
        """
        Fetch movie details from OMDB API

        Args:
            title: Movie title
            year: Movie year (optional, helps with accuracy)

        Returns:
            Dictionary with movie details or None if not found
        """
        # Create cache key
        cache_key = f"{title}_{year}" if year else title

        # Check cache first
        if cache_key in self._cache:
            print(f"✅ Cache hit for: {cache_key}")
            return self._cache[cache_key]

        # Prepare API request
        params = {"apikey": self.api_key, "t": title, "type": "movie", "plot": "full"}

        if year:
            params["y"] = year

        try:
            print(f"🔍 Fetching from OMDB: {title} ({year if year else 'any year'})")
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()

            if data.get("Response") == "True":
                # Store in cache
                self._cache[cache_key] = data
                print(f"✅ Found: {data.get('Title')} ({data.get('Year')})")
                return data
            else:
                print(f"❌ Not found: {title} - {data.get('Error')}")
                return None

        except requests.exceptions.RequestException as e:
            print(f"❌ Error fetching from OMDB: {e}")
            return None

    def parse_movie_data(self, omdb_data: Dict) -> Dict:
        """
        Parse OMDB data into our database format

        Args:
            omdb_data: Raw data from OMDB API

        Returns:
            Dictionary with parsed movie data
        """
        # Extract runtime and convert to minutes
        runtime_str = omdb_data.get("Runtime", "0 min")
        duration_minutes = 0
        if runtime_str and runtime_str != "N/A":
            try:
                duration_minutes = int(runtime_str.split()[0])
            except (ValueError, IndexError):
                duration_minutes = 90  # Default duration

        # Extract genre (use first genre if multiple)
        genre_str = omdb_data.get("Genre", "Unknown")
        genre = genre_str.split(",")[0].strip() if genre_str != "N/A" else "Unknown"

        # Extract rating
        rating_str = omdb_data.get("imdbRating", "0")
        rating = float(rating_str) if rating_str != "N/A" else 0.0

        return {
            "title": omdb_data.get("Title"),
            "imdb_id": omdb_data.get("imdbID"),
            "year": omdb_data.get("Year"),
            "duration_minutes": duration_minutes,
            "genre": genre,
            "director": omdb_data.get("Director", "Unknown"),
            "actors": omdb_data.get("Actors", "Unknown"),
            "plot": omdb_data.get("Plot", ""),
            "poster_url": (
                omdb_data.get("Poster") if omdb_data.get("Poster") != "N/A" else None
            ),
            "rating": rating,
            "is_preloaded": True,
        }


def get_movie_details(title: str, year: Optional[str] = None) -> Optional[Dict]:
    """
    Convenience function to get movie details

    Args:
        title: Movie title
        year: Movie year (optional)

    Returns:
        Parsed movie data or None if not found
    """
    service = OMDBService()
    omdb_data = service.get_movie_details(title, year)

    if omdb_data:
        return service.parse_movie_data(omdb_data)

    return None
