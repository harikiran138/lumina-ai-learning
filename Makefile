.PHONY: help dev frontend backend docker-up docker-down

help:
	@echo "Lumina Command Center"
	@echo "---------------------"
	@echo "make dev        - Start backend and frontend together"
	@echo "make backend    - Start the FastAPI backend on port 9000"
	@echo "make frontend   - Start the Next.js frontend on port 3000"
	@echo "make docker-up  - Start the Docker stack"
	@echo "make docker-down - Stop the Docker stack"

dev:
	@./run_local.sh

backend:
	@./start_backend.sh

frontend:
	@./start_frontend.sh

docker-up:
	@docker-compose up --build

docker-down:
	@docker-compose down
