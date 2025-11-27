#!/bin/bash

# Lumina AI Platform - Docker Setup Script
# Golden Yellow & Black Theme Edition

echo "🐳 Lumina AI Platform - Docker Setup"
echo "===================================="
echo ""

# Colors for output
GOLD='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is installed
echo -e "${GOLD}Step 1: Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed${NC}"
    echo "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed${NC}"
    echo "Please install Docker Compose from: https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✓ Docker is installed${NC}"
echo -e "${GREEN}✓ Docker Compose is installed${NC}"

# Check if Docker is running
echo ""
echo -e "${GOLD}Step 2: Checking if Docker is running...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker is not running${NC}"
    echo "Please start Docker Desktop and try again"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"

# Stop and remove existing containers
echo ""
echo -e "${GOLD}Step 3: Cleaning up existing containers...${NC}"
docker-compose down -v 2>/dev/null
echo -e "${GREEN}✓ Cleanup complete${NC}"

# Create .env file for Docker
echo ""
echo -e "${GOLD}Step 4: Setting up environment variables...${NC}"
if [ ! -f .env ]; then
    cat > .env << 'EOF'
# Add your OpenAI API key here (optional)
OPENAI_API_KEY=
EOF
    echo -e "${GREEN}✓ Created .env file${NC}"
    echo "  You can add your OpenAI API key in .env file"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Build Docker images
echo ""
echo -e "${GOLD}Step 5: Building Docker images...${NC}"
echo "This may take a few minutes..."
docker-compose build --no-cache
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker images built successfully${NC}"
else
    echo -e "${RED}✗ Failed to build Docker images${NC}"
    exit 1
fi

# Start containers
echo ""
echo -e "${GOLD}Step 6: Starting containers...${NC}"
docker-compose up -d postgres
echo "Waiting for PostgreSQL to be ready..."
sleep 10

# Check if PostgreSQL is healthy
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U lumina_user -d lumina_db > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL is ready${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

# Start the application
echo ""
echo -e "${GOLD}Step 7: Starting Lumina application...${NC}"
docker-compose up -d app
sleep 5

# Start Prisma Studio
echo ""
echo -e "${GOLD}Step 8: Starting Prisma Studio (Database GUI)...${NC}"
docker-compose up -d prisma-studio
sleep 3

# Show status
echo ""
echo "===================================="
echo -e "${GREEN}🎉 Docker Setup Complete!${NC}"
echo "===================================="
echo ""
echo -e "${BLUE}Running Containers:${NC}"
docker-compose ps

echo ""
echo -e "${GOLD}📝 Access Points:${NC}"
echo "  🌐 Application:      http://localhost:1234"
echo "  🗄️  Prisma Studio:    http://localhost:5555"
echo "  🐘 PostgreSQL:       localhost:5432"
echo ""
echo -e "${GOLD}🔐 Database Credentials:${NC}"
echo "  User:     lumina_user"
echo "  Password: lumina_secure_password_123"
echo "  Database: lumina_db"
echo ""
echo -e "${GOLD}👤 Login Credentials:${NC}"
echo "  Admin:    admin@lumina.ai / password123"
echo "  Teacher:  teacher@lumina.ai / password123"
echo "  Student:  student@lumina.ai / password123"
echo ""
echo -e "${GOLD}📊 Useful Commands:${NC}"
echo "  View logs:        docker-compose logs -f app"
echo "  Stop all:         docker-compose down"
echo "  Restart:          docker-compose restart"
echo "  View database:    docker-compose logs -f postgres"
echo ""
echo -e "${GREEN}✨ Your Lumina AI Platform with Golden Theme is now running in Docker! 🚀${NC}"
