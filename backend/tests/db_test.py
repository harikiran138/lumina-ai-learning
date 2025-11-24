"""Test database configuration"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from tests.models import TestBase

engine = create_engine("sqlite:///:memory:", echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def setup_test_db():
    """Create test database tables"""
    TestBase.metadata.create_all(bind=engine)