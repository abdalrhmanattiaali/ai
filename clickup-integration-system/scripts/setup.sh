#!/bin/bash
# ============================================================================
# ClickUp Integration System - Setup Script
# This script sets up the entire system from scratch
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ClickUp Integration System - Setup Script${NC}"
echo -e "${GREEN}  Version 2.0${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo

# ============================================================================
# Check if running as root
# ============================================================================

if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Warning: Running as root. Consider using a non-root user.${NC}"
fi

# ============================================================================
# Get project directory
# ============================================================================

PROJECT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
echo -e "${GREEN}📁 Project directory: ${PROJECT_DIR}${NC}"
echo

# ============================================================================
# Step 1: Install System Dependencies
# ============================================================================

echo -e "${GREEN}[1/9] Installing system dependencies...${NC}"

if command -v apt-get &> /dev/null; then
    echo "Detected Debian/Ubuntu system"
    sudo apt-get update
    sudo apt-get install -y python3 python3-pip python3-venv nodejs npm sqlite3 git curl
elif command -v yum &> /dev/null; then
    echo "Detected RedHat/CentOS system"
    sudo yum install -y python3 python3-pip nodejs npm sqlite git curl
else
    echo -e "${RED}❌ Unsupported package manager. Please install dependencies manually.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ System dependencies installed${NC}"
echo

# ============================================================================
# Step 2: Check Node.js and npm versions
# ============================================================================

echo -e "${GREEN}[2/9] Checking Node.js and npm versions...${NC}"

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
NPM_VERSION=$(npm --version | cut -d'.' -f1)

if [ "$NODE_VERSION" -lt 16 ]; then
    echo -e "${RED}❌ Node.js version 16 or higher required. Found: $(node --version)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js: $(node --version), npm: $(npm --version)${NC}"
echo

# ============================================================================
# Step 3: Install Python dependencies
# ============================================================================

echo -e "${GREEN}[3/9] Installing Python dependencies...${NC}"

cd "${PROJECT_DIR}/python-backend"

# Create virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Created Python virtual environment"
fi

# Activate virtual environment and install dependencies
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo -e "${GREEN}✅ Python dependencies installed${NC}"
echo

# ============================================================================
# Step 4: Install Node.js dependencies
# ============================================================================

echo -e "${GREEN}[4/9] Installing Node.js dependencies...${NC}"

cd "${PROJECT_DIR}/nodejs-backend"

# Install dependencies
npm install

echo -e "${GREEN}✅ Node.js dependencies installed${NC}"
echo

# ============================================================================
# Step 5: Setup environment files
# ============================================================================

echo -e "${GREEN}[5/9] Setting up environment files...${NC}"

# Python .env
if [ ! -f "${PROJECT_DIR}/python-backend/.env" ]; then
    cp "${PROJECT_DIR}/config/.env.python.example" "${PROJECT_DIR}/python-backend/.env"
    echo "Created Python .env file"
    echo -e "${YELLOW}⚠️  Please edit ${PROJECT_DIR}/python-backend/.env with your credentials${NC}"
else
    echo "Python .env file already exists"
fi

# Node.js .env
if [ ! -f "${PROJECT_DIR}/nodejs-backend/.env" ]; then
    cp "${PROJECT_DIR}/config/.env.nodejs.example" "${PROJECT_DIR}/nodejs-backend/.env"
    echo "Created Node.js .env file"
    echo -e "${YELLOW}⚠️  Please edit ${PROJECT_DIR}/nodejs-backend/.env with your credentials${NC}"
else
    echo "Node.js .env file already exists"
fi

echo -e "${GREEN}✅ Environment files setup${NC}"
echo

# ============================================================================
# Step 6: Initialize database
# ============================================================================

echo -e "${GREEN}[6/9] Initializing database...${NC}"

cd "${PROJECT_DIR}/python-backend"
source venv/bin/activate
python3 "${PROJECT_DIR}/database/init_db.py"

echo -e "${GREEN}✅ Database initialized${NC}"
echo

# ============================================================================
# Step 7: Create log directory
# ============================================================================

echo -e "${GREEN}[7/9] Creating log directories...${NC}"

sudo mkdir -p /var/log
sudo touch /var/log/clickup_integration.log
sudo chown $USER:$USER /var/log/clickup_integration.log
sudo chmod 644 /var/log/clickup_integration.log

echo -e "${GREEN}✅ Log directories created${NC}"
echo

# ============================================================================
# Step 8: Setup systemd services
# ============================================================================

echo -e "${GREEN}[8/9] Setting up systemd services...${NC}"

CURRENT_USER=$(whoami)
CURRENT_GROUP=$(id -gn)

# Update service files with correct paths and user
for service in clickup-python.service clickup-nodejs.service; do
    sed -e "s|your_user|${CURRENT_USER}|g" \
        -e "s|your_group|${CURRENT_GROUP}|g" \
        -e "s|/path/to/clickup-integration-system|${PROJECT_DIR}|g" \
        "${PROJECT_DIR}/scripts/${service}" | \
        sudo tee "/etc/systemd/system/${service}" > /dev/null

    echo "Created systemd service: ${service}"
done

# Reload systemd
sudo systemctl daemon-reload

echo -e "${GREEN}✅ Systemd services configured${NC}"
echo

# ============================================================================
# Step 9: Summary and next steps
# ============================================================================

echo -e "${GREEN}[9/9] Setup complete!${NC}"
echo
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  📋 Next Steps:${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo
echo -e "${YELLOW}1.${NC} Edit configuration files:"
echo -e "   ${PROJECT_DIR}/python-backend/.env"
echo -e "   ${PROJECT_DIR}/nodejs-backend/.env"
echo
echo -e "${YELLOW}2.${NC} Start services:"
echo -e "   sudo systemctl start clickup-python"
echo -e "   sudo systemctl start clickup-nodejs"
echo
echo -e "${YELLOW}3.${NC} Enable services to start on boot:"
echo -e "   sudo systemctl enable clickup-python"
echo -e "   sudo systemctl enable clickup-nodejs"
echo
echo -e "${YELLOW}4.${NC} Check service status:"
echo -e "   sudo systemctl status clickup-python"
echo -e "   sudo systemctl status clickup-nodejs"
echo
echo -e "${YELLOW}5.${NC} View logs:"
echo -e "   sudo journalctl -u clickup-python -f"
echo -e "   sudo journalctl -u clickup-nodejs -f"
echo
echo -e "${YELLOW}6.${NC} Configure webhooks in ERPNext and ClickUp"
echo
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅ Setup completed successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
