#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Ports to check and clear
FRONTEND_PORT=3000
BACKEND_PORT=3001

echo -e "${YELLOW}🔍 Checking for processes on ports $FRONTEND_PORT and $BACKEND_PORT...${NC}"

# Function to kill process on port
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}⚠️  Port $port is in use by process(es): $pids${NC}"
        echo -e "${YELLOW}🔨 Killing process(es)...${NC}"
        kill -9 $pids 2>/dev/null
        sleep 0.5
        
        # Verify it's killed
        if lsof -ti:$port >/dev/null 2>&1; then
            echo -e "${RED}❌ Failed to kill process on port $port${NC}"
            return 1
        else
            echo -e "${GREEN}✅ Port $port is now free${NC}"
        fi
    else
        echo -e "${GREEN}✅ Port $port is already free${NC}"
    fi
}

# Clear both ports
kill_port $FRONTEND_PORT
kill_port $BACKEND_PORT

echo -e "${GREEN}🚀 Ready to start development servers!${NC}"
