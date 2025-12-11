#!/bin/bash
echo "Starting Lumina AI Backend Infrastructure..."
echo "Services: API (port 8000), Worker, Redis, Postgres, MinIO"

# Check docker
if ! command -v docker &> /dev/null
then
    echo "Docker could not be found. Please install Docker Desktop."
    exit 1
fi

# Build and Start
docker-compose down
docker-compose up --build -d

echo "------------------------------------------------"
echo "Backend is running!"
echo "API Docs: http://localhost:8000/docs"
echo "App Status: http://localhost:8000/"
echo "------------------------------------------------"
echo "Logs (Worker):"
docker-compose logs -f worker
