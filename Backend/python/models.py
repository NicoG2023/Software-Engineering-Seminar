from app import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'user'
    id_user = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum('admin', 'user', name='user_roles'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)

    tickets = db.relationship('Ticket', back_populates='user')


class Genre(db.Model):
    __tablename__ = 'genre'
    id_genre = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)

    movies = db.relationship('Movie', back_populates='genre')


class Movie(db.Model):
    __tablename__ = 'movie'
    id_movie = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    duration_minutes = db.Column(db.Integer, nullable=False)
    is_deleted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    genre_id = db.Column(db.Integer, db.ForeignKey('genre.id_genre'))
    genre = db.relationship('Genre', back_populates='movies')

    screenings = db.relationship('Screening', back_populates='movie')


class TheaterRoom(db.Model):
    __tablename__ = 'theater_room'
    id_room = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    location = db.Column(db.String(150))
    is_active = db.Column(db.Boolean, default=True)

    screenings = db.relationship('Screening', back_populates='room')


class Screening(db.Model):
    __tablename__ = 'screening'
    id_screening = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)
    price = db.Column(db.Numeric(8, 2))
    available_seats = db.Column(db.Integer)
    is_deleted = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    movie_id = db.Column(db.Integer, db.ForeignKey('movie.id_movie'))
    room_id = db.Column(db.Integer, db.ForeignKey('theater_room.id_room'))

    movie = db.relationship('Movie', back_populates='screenings')
    room = db.relationship('TheaterRoom', back_populates='screenings')
    tickets = db.relationship('Ticket', back_populates='screening')


class Ticket(db.Model):
    __tablename__ = 'ticket'
    id_ticket = db.Column(db.Integer, primary_key=True)
    seat_number = db.Column(db.String(10))
    purchase_date = db.Column(db.DateTime, default=datetime.utcnow)
    price = db.Column(db.Numeric(8, 2))
    status = db.Column(db.Enum('active', 'cancelled', 'refunded', name='ticket_status'), default='active')

    screening_id = db.Column(db.Integer, db.ForeignKey('screening.id_screening'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id_user'))

    screening = db.relationship('Screening', back_populates='tickets')
    user = db.relationship('User', back_populates='tickets')
