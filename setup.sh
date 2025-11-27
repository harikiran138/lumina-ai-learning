#!/bin/bash

# Lumina AI Platform - Golden Theme Setup Script
# This script helps you setup PostgreSQL and seed the database

echo "🌟 Lumina AI Platform - Golden Yellow & Black Theme"
echo "=================================================="
echo ""

# Colors
GOLD='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if PostgreSQL is installed
echo -e "${GOLD}Step 1: Checking PostgreSQL...${NC}"
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL is installed${NC}"
else
    echo -e "${RED}✗ PostgreSQL is not installed${NC}"
    echo "Please install PostgreSQL first:"
    echo "  macOS:   brew install postgresql@14"
    echo "  Linux:   sudo apt install postgresql"
    exit 1
fi

# Step 2: Check if PostgreSQL is running
echo ""
echo -e "${GOLD}Step 2: Checking if PostgreSQL is running...${NC}"
if pg_isready &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
else
    echo -e "${RED}✗ PostgreSQL is not running${NC}"
    echo "Starting PostgreSQL..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew services start postgresql@14
    else
        sudo systemctl start postgresql
    fi
    sleep 2
fi

# Step 3: Create database
echo ""
echo -e "${GOLD}Step 3: Creating database...${NC}"
echo "Database name: lumina_dev"

# Check if database exists
if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw lumina_dev; then
    echo -e "${GREEN}✓ Database 'lumina_dev' already exists${NC}"
else
    psql -U postgres -c "CREATE DATABASE lumina_dev;" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Created database 'lumina_dev'${NC}"
    else
        echo -e "${RED}✗ Could not create database${NC}"
        echo "Try manually: psql -U postgres"
        echo "Then run: CREATE DATABASE lumina_dev;"
    fi
fi

# Step 4: Setup .env.local
echo ""
echo -e "${GOLD}Step 4: Setting up environment variables...${NC}"
if [ ! -f .env.local ]; then
    cp .env.example .env.local
    
    # Update DATABASE_URL
    sed -i '' 's|DATABASE_URL=.*|DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lumina_dev?schema=public"|' .env.local
    
    echo -e "${GREEN}✓ Created .env.local${NC}"
    echo "  Please edit .env.local and add your:"
    echo "    - JWT_SECRET (32+ characters)"
    echo "    - NEXTAUTH_SECRET (32+ characters)"
    echo "    - OPENAI_API_KEY (if you have one)"
else
    echo -e "${GREEN}✓ .env.local already exists${NC}"
fi

# Step 5: Install dependencies
echo ""
echo -e "${GOLD}Step 5: Installing dependencies...${NC}"
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi

# Step 6: Push database schema
echo ""
echo -e "${GOLD}Step 6: Pushing database schema...${NC}"
npm run db:push
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database schema created${NC}"
else
    echo -e "${RED}✗ Failed to push schema${NC}"
    exit 1
fi

# Step 7: Seed database with active data
echo ""
echo -e "${GOLD}Step 7: Seeding database with active, realistic data...${NC}"
npm run db:seed
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database seeded successfully!${NC}"
else
    echo -e "${RED}✗ Failed to seed database${NC}"
    exit 1
fi

# Success!
echo ""
echo "=================================================="
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo "=================================================="
echo ""
echo "Your Lumina AI Platform is ready with:"
echo "  ✨ Golden Yellow & Black Theme"
echo "  👤 10 Active Users"
echo "  🤖 6 Specialized AI Agents"
echo "  📁 5 Active Projects"
echo "  📋 20 Realistic Tasks"
echo "  💬 30+ Chat Conversations"
echo ""
echo -e "${GOLD}Next Steps:${NC}"
echo "  1. Start the server:  npm run dev"
echo "  2. Open browser:      http://localhost:1234"
echo "  3. Test database:     http://localhost:1234/api/db/test"
echo "  4. View agents:       http://localhost:1234/api/agents"
echo ""
echo -e "${GOLD}Default Login Credentials:${NC}"
echo "  Admin:    admin@lumina.ai / password123"
echo "  Teacher:  teacher@lumina.ai / password123"
echo "  Student:  student@lumina.ai / password123"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
