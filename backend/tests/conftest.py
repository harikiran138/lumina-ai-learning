"""Test configuration and fixtures"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from tests.models import TestBase
from tests.db_test import get_db, setup_test_db

@pytest.fixture(autouse=True)
def override_db_dependency():
    """Override the get_db dependency for all services"""
    import services.pathway_generation_enhancements as pge
    import services.skill_graph_service as sgs
    import services.realtime_analytics as ra
    pge.get_db = get_db
    sgs.get_db = get_db
    ra.get_db = get_db

@pytest.fixture(scope="function")
def test_db():
    """Create a test database for each test function"""
    engine = create_engine("sqlite:///:memory:", echo=True)
    TestBase.metadata.create_all(bind=engine)
    
    # Create a new sessionmaker
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()
    
    # Override the global get_db function to use our test session
    def get_test_db():
        try:
            yield session
        finally:
            session.close()
    
    # Override the get_db function in all services
    import services.pathway_generation_enhancements as pge
    import services.skill_graph_service as sgs
    import services.realtime_analytics as ra
    pge.get_db = get_test_db
    sgs.get_db = get_test_db
    ra.get_db = get_test_db
    
    # Create test teacher first
    from tests.models import TestUser
    teacher = TestUser(
        id="test_teacher",
        name="Test Teacher",
        email="test_teacher@example.com",
        role="teacher"
    )
    session.add(teacher)
    session.commit()
    
    yield session
    
    # Drop all tables after each test
    TestBase.metadata.drop_all(bind=engine)
    session.close()