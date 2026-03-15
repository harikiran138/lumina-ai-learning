import pytest
import asyncio
from unittest.mock import AsyncMock, patch
from app.services.ml_client import MLServiceClient

@pytest.mark.asyncio
async def test_ml_client_bkt_update_success():
    client = MLServiceClient()
    
    from unittest.mock import MagicMock
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"mastery": 0.85}
    
    with patch("httpx.AsyncClient") as mock_client_class:
        mock_client_instance = mock_client_class.return_value
        mock_client_instance.__aenter__.return_value = mock_client_instance
        mock_client_instance.post = AsyncMock(return_value=mock_response)
        
        result = await client.update_bkt(0.5, True)
        assert result == 0.85
        mock_client_instance.post.assert_called_once()

@pytest.mark.asyncio
async def test_ml_client_bkt_update_failure_fallback():
    client = MLServiceClient()
    
    from unittest.mock import MagicMock
    mock_response = MagicMock()
    mock_response.status_code = 500
    mock_response.raise_for_status.side_effect = Exception("Service Down")
    
    with patch("httpx.AsyncClient") as mock_client_class:
        mock_client_instance = mock_client_class.return_value
        mock_client_instance.__aenter__.return_value = mock_client_instance
        mock_client_instance.post = AsyncMock(return_value=mock_response)
        
        result = await client.update_bkt(0.5, True)
        assert result is None

@pytest.mark.asyncio
async def test_ml_client_fsrs_schedule():
    client = MLServiceClient()
    
    from unittest.mock import MagicMock
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"next_review": "2026-03-20T12:00:00"}
    
    with patch("httpx.AsyncClient") as mock_client_class:
        mock_client_instance = mock_client_class.return_value
        mock_client_instance.__aenter__.return_value = mock_client_instance
        mock_client_instance.post = AsyncMock(return_value=mock_response)
        
        result = await client.get_fsrs_schedule({"stability": 1.0, "difficulty": 5.0}, 3)
        assert result["next_review"] == "2026-03-20T12:00:00"
