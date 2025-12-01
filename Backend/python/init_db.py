#!/usr/bin/env python3
"""
Script to initialize database schema
Run this script to create all tables
"""
from app import app
from database import db

if __name__ == "__main__":
    with app.app_context():
        print("🔄 Creating database tables...")
        db.create_all()
        print("✅ Database tables created successfully!")

        # Print all created tables
        from sqlalchemy import inspect

        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"\n📊 Created tables: {', '.join(tables)}")
