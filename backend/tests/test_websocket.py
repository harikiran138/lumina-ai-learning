"""WebSocket service tests"""

import sys
import os

# Add the parent directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from fastapi.testclient import TestClient
from fastapi.websockets import WebSocket
from services.websocket_service import RealTimePathwayService
from unittest.mock import MagicMock, AsyncMock
from main import app

def create_mock_websocket():
    """Create a mock WebSocket instance for testing"""
    websocket = MagicMock(spec=WebSocket)
    websocket.accept = AsyncMock()
    websocket.send_json = AsyncMock()
    websocket.receive_json = AsyncMock(return_value={"type": "test"})
    return websocket

@pytest.fixture
def websocket_service():
    """Create WebSocket service instance for testing"""
    return RealTimePathwayService()

@pytest.fixture
def test_client():
    """Create test client"""
    return TestClient(app)

@pytest.mark.asyncio
async def test_student_connection(websocket_service):
    """Test student WebSocket connection"""
    connection_manager = websocket_service.connection_manager
    assert len(connection_manager.student_connections) == 0
    
    # Simulate connection
    student_id = "test_student"
    websocket = create_mock_websocket()
    await connection_manager.connect_student(websocket, student_id)
    
    assert len(connection_manager.student_connections) == 1
    assert student_id in connection_manager.student_connections
    websocket.accept.assert_called_once()

@pytest.mark.asyncio
async def test_teacher_connection(websocket_service):
    """Test teacher WebSocket connection"""
    connection_manager = websocket_service.connection_manager
    assert len(connection_manager.teacher_connections) == 0
    
    # Simulate connection
    teacher_id = "test_teacher"
    websocket = create_mock_websocket()
    await connection_manager.connect_teacher(websocket, teacher_id)
    
    assert len(connection_manager.teacher_connections) == 1
    assert teacher_id in connection_manager.teacher_connections
    websocket.accept.assert_called_once()

@pytest.mark.asyncio
async def test_analytics_broadcast(websocket_service):
    """Test broadcasting analytics updates"""
    connection_manager = websocket_service.connection_manager
    
    # Connect test clients
    student_ws = create_mock_websocket()
    teacher_ws = create_mock_websocket()
    
    await connection_manager.connect_student(student_ws, "test_student")
    await connection_manager.connect_teacher(teacher_ws, "test_teacher")
    
    # Simulate analytics update
    test_data = {
        "type": "analytics_update",
        "data": {
            "student_id": "test_student",
            "engagement_score": 85,
            "mastery_level": "advanced"
        }
    }
    
    # Test broadcast
    await connection_manager.broadcast_analytics_update(test_data)
    
    # Verify that the websockets received the update
    assert student_ws.send_json.call_args is not None
    actual_student_message = student_ws.send_json.call_args[0][0]
    assert actual_student_message["type"] == "analytics_update"
    assert actual_student_message["data"] == test_data
    assert "timestamp" in actual_student_message
        
    assert teacher_ws.send_json.call_args is not None
    actual_teacher_message = teacher_ws.send_json.call_args[0][0]
    assert actual_teacher_message["type"] == "analytics_update"
    assert actual_teacher_message["data"] == test_data
    assert "timestamp" in actual_teacher_message

@pytest.mark.asyncio
async def test_realtime_pathway_updates(websocket_service):
    """Test real-time pathway updates"""
    student_id = "test_student"
    update_data = {
        "type": "pathway_update",
        "data": {
            "student_id": student_id,
            "current_node": "math_basics",
            "next_node": "algebra_intro",
            "progress": 0.75
        }
    }
    
    # Connect test student
    websocket = create_mock_websocket()
    await websocket_service.connection_manager.connect_student(websocket, student_id)
    
    # Send update
    await websocket_service.connection_manager.send_pathway_update(student_id, update_data)
    
    # Verify that the websocket received the update
        # Only verify type and data since timestamp will be different
    assert websocket.send_json.call_args is not None
    actual_message = websocket.send_json.call_args[0][0]
    assert actual_message["type"] == "pathway_update"
    assert actual_message["data"] == update_data
    assert "timestamp" in actual_message


@pytest.mark.asyncio
async def test_connection_cleanup(websocket_service):
    """Test proper cleanup of disconnected clients"""
    connection_manager = websocket_service.connection_manager
    
    # Connect test clients
    student_ws = create_mock_websocket()
    teacher_ws = create_mock_websocket()
    
    await connection_manager.connect_student(student_ws, "test_student")
    await connection_manager.connect_teacher(teacher_ws, "test_teacher")
    
    # Simulate disconnections
    await connection_manager.disconnect_student(student_ws, "test_student")
    await connection_manager.disconnect_teacher(teacher_ws, "test_teacher")
    
    assert len(connection_manager.student_connections) == 0
    assert len(connection_manager.teacher_connections) == 0

@pytest.mark.asyncio
async def test_message_queueing(websocket_service):
    """Test message queueing for disconnected clients"""
    student_id = "test_student"
    
    # Queue message for disconnected student
    update_data = {
        "type": "important_update",
        "data": {"message": "test"}
    }
    
    await websocket_service.queue_message(student_id, update_data)
    
    # Connect student and verify queued message delivery
    websocket = create_mock_websocket()
    await websocket_service.connection_manager.connect_student(websocket, student_id)
    
    # Verify that the queued message was sent
    assert websocket.send_json.call_args is not None
    actual_message = websocket.send_json.call_args[0][0]
    assert actual_message["type"] == "queued_message"
    assert actual_message["data"] == update_data
    assert "timestamp" in actual_message


@pytest.mark.asyncio
async def test_broadcast_filtering(websocket_service):
    """Test filtered broadcasting to specific client groups"""
    connection_manager = websocket_service.connection_manager
    
    # Connect various test clients
    student1_ws = create_mock_websocket()
    student2_ws = create_mock_websocket()
    teacher_ws = create_mock_websocket()
    
    await connection_manager.connect_student(student1_ws, "student1")
    await connection_manager.connect_student(student2_ws, "student2")
    await connection_manager.connect_teacher(teacher_ws, "teacher1")
    
    # Test broadcast with filter
    update_data = {
        "type": "targeted_update",
        "data": {"message": "test"}
    }
    
    await connection_manager.broadcast_to_teachers(update_data)
    
    # Verify only teacher_ws received the message
    assert teacher_ws.send_json.call_args is not None
    actual_message = teacher_ws.send_json.call_args[0][0]
    assert actual_message["type"] == "teacher_update"
    assert actual_message["data"] == update_data
    assert "timestamp" in actual_message
    assert not student1_ws.send_json.called
    assert not student2_ws.send_json.called


@pytest.mark.asyncio
async def test_error_handling(websocket_service):
    """Test error handling in WebSocket operations"""
    # Test invalid student ID
    with pytest.raises(ValueError):
        await websocket_service.send_pathway_update("", {})
    
    # Test invalid message format
    with pytest.raises(ValueError):
        await websocket_service.broadcast_analytics_update(None)
    
    # Test connection with invalid websocket
    with pytest.raises(ValueError):
        await websocket_service.connection_manager.connect_student(None, "test_student")