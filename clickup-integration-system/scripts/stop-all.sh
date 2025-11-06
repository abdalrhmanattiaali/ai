#!/bin/bash
# ============================================================================
# ClickUp Integration System - Stop All Services
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
LOGS_DIR="${PROJECT_DIR}/logs"

echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  🛑 Stopping ClickUp Integration System${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo

# Function to stop service
stop_service() {
    SERVICE_NAME=$1
    PID_FILE=$2

    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "${YELLOW}Stopping $SERVICE_NAME (PID: $PID)...${NC}"
            kill $PID 2>/dev/null || true
            sleep 2

            # Force kill if still running
            if ps -p $PID > /dev/null 2>&1; then
                kill -9 $PID 2>/dev/null || true
            fi

            echo -e "${GREEN}✅ $SERVICE_NAME stopped${NC}"
        else
            echo -e "${YELLOW}⚠️  $SERVICE_NAME not running${NC}"
        fi
        rm -f "$PID_FILE"
    else
        echo -e "${YELLOW}⚠️  $SERVICE_NAME PID file not found${NC}"
    fi
}

# Stop services
stop_service "Python Backend" "${LOGS_DIR}/python-backend.pid"
stop_service "Node.js Backend" "${LOGS_DIR}/nodejs-backend.pid"
stop_service "Admin API" "${LOGS_DIR}/admin-api.pid"

echo
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ All Services Stopped${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo
