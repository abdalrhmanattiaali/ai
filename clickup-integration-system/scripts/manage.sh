#!/bin/bash
# ============================================================================
# ClickUp Integration System - Service Management Script
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Services
PYTHON_SERVICE="clickup-python"
NODEJS_SERVICE="clickup-nodejs"

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}  $1${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# ============================================================================
# Service Management Functions
# ============================================================================

start_services() {
    print_header "Starting Services"

    echo "Starting Python backend..."
    sudo systemctl start $PYTHON_SERVICE
    sleep 2

    echo "Starting Node.js backend..."
    sudo systemctl start $NODEJS_SERVICE
    sleep 2

    print_success "Services started"
    status_services
}

stop_services() {
    print_header "Stopping Services"

    echo "Stopping Python backend..."
    sudo systemctl stop $PYTHON_SERVICE

    echo "Stopping Node.js backend..."
    sudo systemctl stop $NODEJS_SERVICE

    print_success "Services stopped"
}

restart_services() {
    print_header "Restarting Services"

    echo "Restarting Python backend..."
    sudo systemctl restart $PYTHON_SERVICE
    sleep 2

    echo "Restarting Node.js backend..."
    sudo systemctl restart $NODEJS_SERVICE
    sleep 2

    print_success "Services restarted"
    status_services
}

status_services() {
    print_header "Service Status"

    echo -e "\n${BLUE}Python Backend:${NC}"
    systemctl status $PYTHON_SERVICE --no-pager -l | head -n 10

    echo -e "\n${BLUE}Node.js Backend:${NC}"
    systemctl status $NODEJS_SERVICE --no-pager -l | head -n 10
}

enable_services() {
    print_header "Enabling Services (Auto-start on boot)"

    sudo systemctl enable $PYTHON_SERVICE
    sudo systemctl enable $NODEJS_SERVICE

    print_success "Services enabled for auto-start"
}

disable_services() {
    print_header "Disabling Services (No auto-start on boot)"

    sudo systemctl disable $PYTHON_SERVICE
    sudo systemctl disable $NODEJS_SERVICE

    print_success "Services disabled"
}

logs_python() {
    print_header "Python Backend Logs (Ctrl+C to exit)"
    sudo journalctl -u $PYTHON_SERVICE -f
}

logs_nodejs() {
    print_header "Node.js Backend Logs (Ctrl+C to exit)"
    sudo journalctl -u $NODEJS_SERVICE -f
}

logs_both() {
    print_header "All Logs (Ctrl+C to exit)"
    sudo journalctl -u $PYTHON_SERVICE -u $NODEJS_SERVICE -f
}

health_check() {
    print_header "Health Check"

    echo -e "\n${BLUE}Python Backend (Port 5005):${NC}"
    if curl -s http://localhost:5005/health > /dev/null 2>&1; then
        print_success "Python backend is healthy"
        curl -s http://localhost:5005/health | jq . 2>/dev/null || curl -s http://localhost:5005/health
    else
        print_error "Python backend is not responding"
    fi

    echo -e "\n${BLUE}Node.js Backend (Port 5014):${NC}"
    if curl -s http://localhost:5014/health > /dev/null 2>&1; then
        print_success "Node.js backend is healthy"
        curl -s http://localhost:5014/health | jq . 2>/dev/null || curl -s http://localhost:5014/health
    else
        print_error "Node.js backend is not responding"
    fi
}

test_webhooks() {
    print_header "Testing Webhooks"

    echo -e "\n${BLUE}Testing Python webhook...${NC}"
    curl -X POST http://localhost:5005/health

    echo -e "\n${BLUE}Testing Node.js webhook...${NC}"
    curl -X POST http://localhost:5014/health

    echo ""
}

database_info() {
    print_header "Database Information"

    DB_FILE="../python-backend/clickup_log.db"

    if [ -f "$DB_FILE" ]; then
        echo -e "\n${BLUE}Database file:${NC} $DB_FILE"
        echo -e "${BLUE}Size:${NC} $(du -h $DB_FILE | cut -f1)"
        echo -e "${BLUE}Modified:${NC} $(stat -c %y $DB_FILE | cut -d. -f1)"

        echo -e "\n${BLUE}Tables:${NC}"
        sqlite3 $DB_FILE "SELECT name FROM sqlite_master WHERE type='table';" 2>/dev/null || echo "Error reading database"

        echo -e "\n${BLUE}Row counts:${NC}"
        sqlite3 $DB_FILE "SELECT 'processed_orders', COUNT(*) FROM processed_orders;" 2>/dev/null || echo "Error reading table"
        sqlite3 $DB_FILE "SELECT 'customer_delivery_tasks', COUNT(*) FROM customer_delivery_tasks;" 2>/dev/null || echo "Error reading table"
        sqlite3 $DB_FILE "SELECT 'customer_invoice_tasks', COUNT(*) FROM customer_invoice_tasks;" 2>/dev/null || echo "Error reading table"
    else
        print_error "Database file not found: $DB_FILE"
    fi
}

backup_database() {
    print_header "Database Backup"

    DB_FILE="../python-backend/clickup_log.db"
    BACKUP_DIR="../database/backups"

    if [ ! -f "$DB_FILE" ]; then
        print_error "Database file not found: $DB_FILE"
        return 1
    fi

    mkdir -p $BACKUP_DIR

    BACKUP_FILE="$BACKUP_DIR/clickup_log_$(date +%Y%m%d_%H%M%S).db"

    cp $DB_FILE $BACKUP_FILE

    print_success "Database backed up to: $BACKUP_FILE"
    echo "Size: $(du -h $BACKUP_FILE | cut -f1)"
}

# ============================================================================
# Menu
# ============================================================================

show_menu() {
    clear
    print_header "ClickUp Integration System - Service Manager"

    echo ""
    echo "  Service Management:"
    echo "    1) Start services"
    echo "    2) Stop services"
    echo "    3) Restart services"
    echo "    4) Status"
    echo "    5) Enable auto-start"
    echo "    6) Disable auto-start"
    echo ""
    echo "  Logs:"
    echo "    7) Python logs"
    echo "    8) Node.js logs"
    echo "    9) All logs"
    echo ""
    echo "  Diagnostics:"
    echo "   10) Health check"
    echo "   11) Test webhooks"
    echo "   12) Database info"
    echo "   13) Backup database"
    echo ""
    echo "    0) Exit"
    echo ""
    echo -n "  Select option: "
}

# ============================================================================
# Main
# ============================================================================

if [ "$1" != "" ]; then
    # Command line arguments
    case $1 in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        status)
            status_services
            ;;
        logs)
            logs_both
            ;;
        logs-python)
            logs_python
            ;;
        logs-nodejs)
            logs_nodejs
            ;;
        health)
            health_check
            ;;
        backup)
            backup_database
            ;;
        *)
            echo "Usage: $0 {start|stop|restart|status|logs|logs-python|logs-nodejs|health|backup}"
            exit 1
            ;;
    esac
else
    # Interactive menu
    while true; do
        show_menu
        read option

        case $option in
            1)
                start_services
                read -p "Press Enter to continue..."
                ;;
            2)
                stop_services
                read -p "Press Enter to continue..."
                ;;
            3)
                restart_services
                read -p "Press Enter to continue..."
                ;;
            4)
                status_services
                read -p "Press Enter to continue..."
                ;;
            5)
                enable_services
                read -p "Press Enter to continue..."
                ;;
            6)
                disable_services
                read -p "Press Enter to continue..."
                ;;
            7)
                logs_python
                ;;
            8)
                logs_nodejs
                ;;
            9)
                logs_both
                ;;
            10)
                health_check
                read -p "Press Enter to continue..."
                ;;
            11)
                test_webhooks
                read -p "Press Enter to continue..."
                ;;
            12)
                database_info
                read -p "Press Enter to continue..."
                ;;
            13)
                backup_database
                read -p "Press Enter to continue..."
                ;;
            0)
                echo "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option"
                read -p "Press Enter to continue..."
                ;;
        esac
    done
fi
