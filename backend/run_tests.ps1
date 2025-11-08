# Run tests with coverage
pytest --cov=services --cov-report=html --cov-report=term-missing tests\

# Run WebSocket tests separately (they need async support)
pytest --cov=services --cov-append tests\test_websocket.py -v

# Generate coverage report
coverage html