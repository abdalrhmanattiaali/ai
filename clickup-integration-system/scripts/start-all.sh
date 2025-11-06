#!/bin/bash
# ============================================================================
# ClickUp Integration System - Start All Services
# Starts Python Backend, Node.js Backend, and Admin API
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  🚀 Starting ClickUp Integration System${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo

# ============================================================================
# Start Python Backend (Port 5005)
# ============================================================================

echo -e "${BLUE}[1/3] Starting Python Backend (Flask)...${NC}"

cd "${PROJECT_DIR}/python-backend"

if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating Python virtual environment...${NC}"
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q -r requirements.txt

nohup python3 clickup_webhook.py > ../logs/python-backend.log 2>&1 &
PYTHON_PID=$!

echo -e "${GREEN}✅ Python Backend started (PID: $PYTHON_PID, Port: 5005)${NC}"
echo "$PYTHON_PID" > ../logs/python-backend.pid
echo

# ============================================================================
# Start Node.js Backend (Port 5014)
# ============================================================================

echo -e "${BLUE}[2/3] Starting Node.js Backend (Express + WhatsApp)...${NC}"

cd "${PROJECT_DIR}/nodejs-backend"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing Node.js dependencies...${NC}"
    npm install
fi

nohup node index1.js > ../logs/nodejs-backend.log 2>&1 &
NODEJS_PID=$!

echo -e "${GREEN}✅ Node.js Backend started (PID: $NODEJS_PID, Port: 5014)${NC}"
echo "$NODEJS_PID" > ../logs/nodejs-backend.pid
echo

# ============================================================================
# Start Admin API (Port 5010)
# ============================================================================

echo -e "${BLUE}[3/3] Starting Admin API...${NC}"

cd "${PROJECT_DIR}/admin-api"

if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating Python virtual environment for Admin API...${NC}"
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q -r requirements.txt

nohup python3 admin_server.py > ../logs/admin-api.log 2>&1 &
ADMIN_PID=$!

echo -e "${GREEN}✅ Admin API started (PID: $ADMIN_PID, Port: 5010)${NC}"
echo "$ADMIN_PID" > ../logs/admin-api.pid
echo

# ============================================================================
# Wait for services to start
# ============================================================================

echo -e "${YELLOW}⏳ Waiting for services to initialize...${NC}"
sleep 5

# ============================================================================
# Check if services are running
# ============================================================================

echo
echo -e "${BLUE}🔍 Checking service status...${NC}"
echo

# Python Backend
if curl -s http://localhost:5005/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Python Backend: Running${NC}"
else
    echo -e "${RED}❌ Python Backend: Not responding${NC}"
fi

# Node.js Backend
if curl -s http://localhost:5014/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Node.js Backend: Running${NC}"
else
    echo -e "${RED}❌ Node.js Backend: Not responding${NC}"
fi

# Admin API
if curl -s http://localhost:5010/api/system/stats > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Admin API: Running${NC}"
else
    echo -e "${YELLOW}⚠️  Admin API: Starting (may need authentication)${NC}"
fi

# ============================================================================
# Summary
# ============================================================================

echo
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ All Services Started Successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo
echo -e "${BLUE}📡 Services:${NC}"
echo -e "  • Python Backend:  http://localhost:5005"
echo -e "  • Node.js Backend: http://localhost:5014"
echo -e "  • Admin Dashboard: http://localhost:5010"
echo
echo -e "${BLUE}📋 Default Admin Login:${NC}"
echo -e "  • Username: admin"
echo -e "  • Password: admin123 ${RED}(CHANGE THIS!)${NC}"
echo
echo -e "${BLUE}📝 Logs:${NC}"
echo -e "  • Python:  tail -f ${PROJECT_DIR}/logs/python-backend.log"
echo -e "  • Node.js: tail -f ${PROJECT_DIR}/logs/nodejs-backend.log"
echo -e "  • Admin:   tail -f ${PROJECT_DIR}/logs/admin-api.log"
echo
echo -e "${BLUE}🛑 To stop all services:${NC}"
echo -e "  ${PROJECT_DIR}/scripts/stop-all.sh"
echo
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
