import json
from app import app
from database import db
from models import Movie, Genre, TheaterRoom

def seed_rooms():
    if TheaterRoom.query.count() == 0:
        db.session.add(TheaterRoom(name='Room A', capacity=120, location='Main'))
        db.session.add(TheaterRoom(name='Room B', capacity=80, location='Annex'))
        db.session.commit()

def seed_movies_from_monthly(default_genre='General', default_duration=120):
    with open('/app/data/monthly_movies.json', 'r') as f:
        data = json.load(f)
    genre = Genre.query.filter_by(name=default_genre).first()
    if not genre:
        genre = Genre(name=default_genre)
        db.session.add(genre)
        db.session.commit()
    created = 0
    for m in data.get('movies', []):
        title = m.get('title')
        if not title:
            continue
        existing = Movie.query.filter_by(title=title).first()
        if existing:
            continue
        db.session.add(Movie(title=title, duration_minutes=default_duration, genre=genre, is_preloaded=False))
        created += 1
    db.session.commit()
    return created

if __name__ == '__main__':
    with app.app_context():
        seed_rooms()
        n = seed_movies_from_monthly()
        print(f'Seeded {n} movies from monthly file')

