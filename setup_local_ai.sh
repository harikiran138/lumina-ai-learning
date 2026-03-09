#!/bin/bash

# Configuration
MODEL_NAME="qwen3.5:2b"
ENV_FILE=".env.local"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Lumina Local Intelligence Setup ===${NC}"

# 1. Check/Install Ollama
if ! command -v ollama &> /dev/null; then
    echo "Ollama is not installed."
    echo "Installing via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install ollama
    else
        echo "Error: Homebrew not found. Please install Ollama manually from https://ollama.com"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Ollama is installed${NC}"
fi

# 2. Start Ollama Service (if not running)
if ! pgrep -x "ollama" > /dev/null; then
    echo "Starting Ollama service..."
    ollama serve &
    sleep 5
fi

# 3. Pull Model
echo "Pulling optimized local model: $MODEL_NAME"
ollama pull $MODEL_NAME

# 4. Configure Application
if [ -f "$ENV_FILE" ]; then
    # Update or Add LLM_PROVIDER
    if grep -q "LLM_PROVIDER=" "$ENV_FILE"; then
        sed -i '' 's/LLM_PROVIDER=.*/LLM_PROVIDER=ollama/' "$ENV_FILE"
    else
        echo "LLM_PROVIDER=ollama" >> "$ENV_FILE"
    fi
    echo -e "${GREEN}✓ Updated .env.local to use Local LLM${NC}"
else
    echo "Creating .env.local with LLM_PROVIDER=ollama"
    echo "LLM_PROVIDER=ollama" > "$ENV_FILE"
fi

echo -e "${BLUE}=== Setup Complete ===${NC}"
echo "You can now run 'npm run dev' and 'python backend/app/main.py' to use the local model."
