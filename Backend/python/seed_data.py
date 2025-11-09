# seed_data.py
from datetime import datetime, timedelta, time
from decimal import Decimal

from app import app        # importa la app ya configurada
from database import db
from models import User, Genre, Movie, TheaterRoom, Screening, Ticket


def seed():
    with app.app_context():
        print("🚧 Dropping & recreating all tables...")
        db.drop_all()
        db.create_all()

        # -------------------------
        # 1) Usuarios
        # -------------------------
        admin = User(
            name="Admin User",
            email="admin@example.com",
            # En un proyecto real esto sería un hash (ej: bcrypt)
            password_hash="hashed-admin-password",
            role="admin",
            is_active=True,
        )
        user1 = User(
            name="John Doe",
            email="john@example.com",
            password_hash="hashed-john-password",
            role="user",
            is_active=True,
        )
        user2 = User(
            name="Jane Smith",
            email="jane@example.com",
            password_hash="hashed-jane-password",
            role="user",
            is_active=True,
        )

        db.session.add_all([admin, user1, user2])
        db.session.commit()
        print("✅ Users inserted")

        # -------------------------
        # 2) Géneros
        # -------------------------
        g_action = Genre(name="Action")
        g_sci_fi = Genre(name="Sci-Fi")
        g_drama = Genre(name="Drama")
        g_comedy = Genre(name="Comedy")

        db.session.add_all([g_action, g_sci_fi, g_drama, g_comedy])
        db.session.commit()
        print("✅ Genres inserted")

        # -------------------------
        # 3) Películas
        # -------------------------
        m1 = Movie(
            title="Inception",
            duration_minutes=148,
            genre=g_sci_fi,
            is_deleted=False,
        )
        m2 = Movie(
            title="The Dark Knight",
            duration_minutes=152,
            genre=g_action,
            is_deleted=False,
        )
        m3 = Movie(
            title="Interstellar",
            duration_minutes=169,
            genre=g_sci_fi,
            is_deleted=False,
        )
        m4 = Movie(
            title="La La Land",
            duration_minutes=128,
            genre=g_drama,
            is_deleted=False,
        )

        db.session.add_all([m1, m2, m3, m4])
        db.session.commit()
        print("✅ Movies inserted")

        # -------------------------
        # 4) Salas
        # -------------------------
        room1 = TheaterRoom(
            name="Room 1",
            capacity=120,
            location="1st Floor - Left Wing",
            is_active=True,
        )
        room2 = TheaterRoom(
            name="Room 2",
            capacity=80,
            location="1st Floor - Right Wing",
            is_active=True,
        )

        db.session.add_all([room1, room2])
        db.session.commit()
        print("✅ Theater rooms inserted")

        # -------------------------
        # 5) Funciones (Screenings)
        # -------------------------
        today = datetime.utcnow().date()

        s1 = Screening(
            movie_id=m1.id_movie,
            room_id=room1.id_room,
            date=today + timedelta(days=1),
            time=time(19, 30),
            price=Decimal("2500.00"),
            available_seats=room1.capacity,
            is_deleted=False,
        )
        s2 = Screening(
            movie_id=m2.id_movie,
            room_id=room1.id_room,
            date=today + timedelta(days=2),
            time=time(21, 0),
            price=Decimal("2800.00"),
            available_seats=room1.capacity,
            is_deleted=False,
        )
        s3 = Screening(
            movie_id=m3.id_movie,
            room_id=room2.id_room,
            date=today + timedelta(days=3),
            time=time(18, 0),
            price=Decimal("3000.00"),
            available_seats=room2.capacity,
            is_deleted=False,
        )
        s4 = Screening(
            movie_id=m4.id_movie,
            room_id=room2.id_room,
            date=today + timedelta(days=4),
            time=time(20, 0),
            price=Decimal("2200.00"),
            available_seats=room2.capacity,
            is_deleted=False,
        )

        db.session.add_all([s1, s2, s3, s4])
        db.session.commit()
        print("✅ Screenings inserted")

        # -------------------------
        # 6) Tickets
        # -------------------------
        t1 = Ticket(
            seat_number="A10",
            purchase_date=datetime.utcnow(),
            price=Decimal("2500.00"),
            status="active",
            screening_id=s1.id_screening,
            user_id=user1.id_user,
        )
        t2 = Ticket(
            seat_number="A11",
            purchase_date=datetime.utcnow(),
            price=Decimal("2500.00"),
            status="active",
            screening_id=s1.id_screening,
            user_id=user2.id_user,
        )
        t3 = Ticket(
            seat_number="B05",
            purchase_date=datetime.utcnow(),
            price=Decimal("3000.00"),
            status="active",
            screening_id=s3.id_screening,
            user_id=user1.id_user,
        )

        # Actualizar asientos disponibles
        s1.available_seats -= 2
        s3.available_seats -= 1

        db.session.add_all([t1, t2, t3])
        db.session.commit()
        print("✅ Tickets inserted")

        print("🎉 Seeding completed!")


if __name__ == "__main__":
    seed()
