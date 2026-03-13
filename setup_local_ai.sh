#!/bin/bash

# Configuration
MODEL_NAME="qwen2.5:1.5b"
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
    # Update or add local Ollama defaults
    if grep -q "LLM_PROVIDER=" "$ENV_FILE"; then
        sed -i '' 's/LLM_PROVIDER=.*/LLM_PROVIDER=ollama/' "$ENV_FILE"
    else
        echo "LLM_PROVIDER=ollama" >> "$ENV_FILE"
    fi
    if grep -q "OLLAMA_MODEL=" "$ENV_FILE"; then
        sed -i '' "s/OLLAMA_MODEL=.*/OLLAMA_MODEL=$MODEL_NAME/" "$ENV_FILE"
    else
        echo "OLLAMA_MODEL=$MODEL_NAME" >> "$ENV_FILE"
    fi
    if grep -q "OLLAMA_THINK=" "$ENV_FILE"; then
        sed -i '' 's/OLLAMA_THINK=.*/OLLAMA_THINK=false/' "$ENV_FILE"
    else
        echo "OLLAMA_THINK=false" >> "$ENV_FILE"
    fi
    if grep -q "OLLAMA_KEEP_ALIVE=" "$ENV_FILE"; then
        sed -i '' 's/OLLAMA_KEEP_ALIVE=.*/OLLAMA_KEEP_ALIVE=15m/' "$ENV_FILE"
    else
        echo "OLLAMA_KEEP_ALIVE=15m" >> "$ENV_FILE"
    fi
    if grep -q "OLLAMA_NUM_CTX=" "$ENV_FILE"; then
        sed -i '' 's/OLLAMA_NUM_CTX=.*/OLLAMA_NUM_CTX=8192/' "$ENV_FILE"
    else
        echo "OLLAMA_NUM_CTX=8192" >> "$ENV_FILE"
    fi
    if grep -q "OLLAMA_READ_TIMEOUT=" "$ENV_FILE"; then
        sed -i '' 's/OLLAMA_READ_TIMEOUT=.*/OLLAMA_READ_TIMEOUT=60/' "$ENV_FILE"
    else
        echo "OLLAMA_READ_TIMEOUT=60" >> "$ENV_FILE"
    fi
    echo -e "${GREEN}✓ Updated .env.local to use Local LLM${NC}"
else
    echo "Creating .env.local with local Ollama defaults"
    cat > "$ENV_FILE" <<EOF
LLM_PROVIDER=ollama
OLLAMA_MODEL=$MODEL_NAME
OLLAMA_THINK=false
OLLAMA_KEEP_ALIVE=15m
OLLAMA_NUM_CTX=8192
OLLAMA_READ_TIMEOUT=60
EOF
fi

echo -e "${BLUE}=== Setup Complete ===${NC}"
echo "You can now run 'npm run dev' and 'python backend/app/main.py' to use the local model."
