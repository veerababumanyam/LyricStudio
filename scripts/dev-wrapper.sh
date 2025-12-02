#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

FRONTEND_PORT=3000
BACKEND_PORT=3001

# Function to cleanup ports on exit
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up ports...${NC}"
    
    # Kill processes on ports
    if lsof -ti:$FRONTEND_PORT >/dev/null 2>&1; then
        echo -e "${YELLOW}🔨 Killing process on port $FRONTEND_PORT...${NC}"
        kill -9 $(lsof -ti:$FRONTEND_PORT) 2>/dev/null
    fi
    
    if lsof -ti:$BACKEND_PORT >/dev/null 2>&1; then
        echo -e "${YELLOW}🔨 Killing process on port $BACKEND_PORT...${NC}"
        kill -9 $(lsof -ti:$BACKEND_PORT) 2>/dev/null
    fi
    
    echo -e "${GREEN}✅ Cleanup complete${NC}"
    exit 0
}

# Trap exit signals and run cleanup
trap cleanup SIGINT SIGTERM EXIT

# Clear ports before starting
./scripts/clear-ports.sh

# Start the dev servers
echo -e "${GREEN}🚀 Starting development servers...${NC}"
npx concurrently "vite" "cd server && npm run dev" --names "frontend,backend" --prefix-colors "cyan,magenta"
