#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ClickUp Integration System - Admin API
Complete Management Dashboard Backend

@version 2.0
@author ClickUp Integration Team
"""

import os
import json
import sqlite3
import logging
import secrets
import hashlib
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import jwt
from dotenv import load_dotenv
import requests

# Load environment
load_dotenv()

# ============================================================================
# CONFIGURATION
# ============================================================================

app = Flask(__name__, static_folder='../admin-dashboard/build')
app.config['SECRET_KEY'] = os.getenv('ADMIN_SECRET_KEY', secrets.token_hex(32))
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', secrets.token_hex(32))
app.config['JWT_EXPIRATION_HOURS'] = int(os.getenv('JWT_EXPIRATION_HOURS', 24))

CORS(app, resources={r"/api/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# Database
ADMIN_DB = os.getenv('ADMIN_DB', './admin.db')
MAIN_DB = os.getenv('DATABASE_FILE', '../python-backend/clickup_log.db')

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# DATABASE SETUP
# ============================================================================

def init_admin_database():
    """Initialize admin database with all required tables"""
    conn = sqlite3.connect(ADMIN_DB)
    c = conn.cursor()

    # Users table
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            email TEXT UNIQUE,
            role TEXT DEFAULT 'admin',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME,
            is_active INTEGER DEFAULT 1
        )
    """)

    # Settings table
    c.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT,
            data_type TEXT DEFAULT 'string',
            description TEXT,
            is_encrypted INTEGER DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(category, key)
        )
    """)

    # Notifications config table
    c.execute("""
        CREATE TABLE IF NOT EXISTS notification_configs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            type TEXT NOT NULL,
            enabled INTEGER DEFAULT 1,
            schedule TEXT,
            message_template TEXT,
            recipients TEXT,
            conditions TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Cron jobs table
    c.execute("""
        CREATE TABLE IF NOT EXISTS cron_jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            schedule TEXT NOT NULL,
            function_name TEXT NOT NULL,
            enabled INTEGER DEFAULT 1,
            last_run DATETIME,
            next_run DATETIME,
            parameters TEXT,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Audit log table
    c.execute("""
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            category TEXT,
            details TEXT,
            ip_address TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # WhatsApp session table
    c.execute("""
        CREATE TABLE IF NOT EXISTS whatsapp_session (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            is_connected INTEGER DEFAULT 0,
            qr_code TEXT,
            session_data TEXT,
            phone_number TEXT,
            connected_at DATETIME,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # System stats table
    c.execute("""
        CREATE TABLE IF NOT EXISTS system_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            stat_name TEXT NOT NULL,
            stat_value TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Insert default admin user if not exists
    c.execute("SELECT COUNT(*) FROM users")
    if c.fetchone()[0] == 0:
        default_password = 'admin123'  # Change this!
        password_hash = hashlib.sha256(default_password.encode()).hexdigest()
        c.execute(
            "INSERT INTO users (username, password_hash, email, role) VALUES (?, ?, ?, ?)",
            ('admin', password_hash, 'admin@clickup.local', 'superadmin')
        )
        logger.warning("Default admin user created with password 'admin123' - CHANGE THIS!")

    # Insert default settings
    default_settings = [
        ('erpnext', 'base_url', os.getenv('ERP_BASE_URL', ''), 'string', 'ERPNext base URL', 0),
        ('erpnext', 'api_key', os.getenv('ERPNEXT_API_KEY', ''), 'string', 'ERPNext API Key', 1),
        ('erpnext', 'api_secret', os.getenv('ERPNEXT_API_SECRET', ''), 'string', 'ERPNext API Secret', 1),
        ('clickup', 'access_token', os.getenv('CLICKUP_ACCESS_TOKEN', ''), 'string', 'ClickUp Access Token', 1),
        ('clickup', 'team_id', os.getenv('CLICKUP_TEAM_ID', ''), 'string', 'ClickUp Team ID', 0),
        ('openai', 'api_key', os.getenv('OPENAI_API_KEY', ''), 'string', 'OpenAI API Key', 1),
        ('whatsapp', 'group_name', os.getenv('WHATSAPP_GROUP_NAME', 'Click Up notification 📢'), 'string', 'WhatsApp Group Name', 0),
        ('system', 'notifications_enabled', 'true', 'boolean', 'Enable/Disable all notifications', 0),
        ('system', 'ai_content_enabled', 'true', 'boolean', 'Enable/Disable AI content generation', 0),
        ('system', 'log_level', 'INFO', 'string', 'Logging level', 0),
    ]

    for setting in default_settings:
        c.execute("""
            INSERT OR IGNORE INTO settings (category, key, value, data_type, description, is_encrypted)
            VALUES (?, ?, ?, ?, ?, ?)
        """, setting)

    conn.commit()
    conn.close()
    logger.info("Admin database initialized")

# Initialize database on startup
init_admin_database()

# ============================================================================
# AUTHENTICATION
# ============================================================================

def hash_password(password):
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, password_hash):
    """Verify password against hash"""
    return hash_password(password) == password_hash

def generate_token(user_id, username, role):
    """Generate JWT token"""
    payload = {
        'user_id': user_id,
        'username': username,
        'role': role,
        'exp': datetime.utcnow() + timedelta(hours=app.config['JWT_EXPIRATION_HOURS']),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, app.config['JWT_SECRET_KEY'], algorithm='HS256')

def decode_token(token):
    """Decode JWT token"""
    try:
        return jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        if token.startswith('Bearer '):
            token = token[7:]

        payload = decode_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401

        request.current_user = payload
        return f(*args, **kwargs)

    return decorated

def log_audit(user_id, action, category, details, ip_address):
    """Log audit trail"""
    conn = sqlite3.connect(ADMIN_DB)
    c = conn.cursor()
    c.execute(
        "INSERT INTO audit_log (user_id, action, category, details, ip_address) VALUES (?, ?, ?, ?, ?)",
        (user_id, action, category, json.dumps(details), ip_address)
    )
    conn.commit()
    conn.close()

# ============================================================================
# AUTH ENDPOINTS
# ============================================================================

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login"""
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    conn = sqlite3.connect(ADMIN_DB)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute(
        "SELECT * FROM users WHERE username = ? AND is_active = 1",
        (username,)
    )
    user = c.fetchone()

    if not user or not verify_password(password, user['password_hash']):
        conn.close()
        return jsonify({'error': 'Invalid credentials'}), 401

    # Update last login
    c.execute(
        "UPDATE users SET last_login = ? WHERE id = ?",
        (datetime.now(), user['id'])
    )
    conn.commit()
    conn.close()

    # Generate token
    token = generate_token(user['id'], user['username'], user['role'])

    # Log audit
    log_audit(user['id'], 'login', 'auth', {'username': username}, request.remote_addr)

    return jsonify({
        'token': token,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'role': user['role']
        }
    }), 200

@app.route('/api/auth/change-password', methods=['POST'])
@token_required
def change_password():
    """Change user password"""
    data = request.json
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not current_password or not new_password:
        return jsonify({'error': 'Current and new password required'}), 400

    user_id = request.current_user['user_id']

    conn = sqlite3.connect(ADMIN_DB)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,))
    user = c.fetchone()

    if not verify_password(current_password, user['password_hash']):
        conn.close()
        return jsonify({'error': 'Current password is incorrect'}), 401

    new_hash = hash_password(new_password)
    c.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, user_id))
    conn.commit()
    conn.close()

    log_audit(user_id, 'change_password', 'auth', {}, request.remote_addr)

    return jsonify({'message': 'Password changed successfully'}), 200

# ============================================================================
# SETTINGS ENDPOINTS
# ============================================================================

@app.route('/api/settings', methods=['GET'])
@token_required
def get_settings():
    """Get all settings grouped by category"""
    category = request.args.get('category')

    conn = sqlite3.connect(ADMIN_DB)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    if category:
        c.execute("SELECT * FROM settings WHERE category = ?", (category,))
    else:
        c.execute("SELECT * FROM settings")

    settings = c.fetchall()
    conn.close()

    result = {}
    for setting in settings:
        cat = setting['category']
        if cat not in result:
            result[cat] = []

        # Don't expose encrypted values
        value = setting['value']
        if setting['is_encrypted'] and value:
            value = '***ENCRYPTED***'

        result[cat].append({
            'id': setting['id'],
            'key': setting['key'],
            'value': value,
            'data_type': setting['data_type'],
            'description': setting['description'],
            'is_encrypted': bool(setting['is_encrypted']),
            'updated_at': setting['updated_at']
        })

    return jsonify(result), 200

@app.route('/api/settings/<int:setting_id>', methods=['PUT'])
@token_required
def update_setting(setting_id):
    """Update a setting"""
    data = request.json
    new_value = data.get('value')

    if new_value is None:
        return jsonify({'error': 'Value is required'}), 400

    conn = sqlite3.connect(ADMIN_DB)
    c = conn.cursor()

    c.execute(
        "UPDATE settings SET value = ?, updated_at = ? WHERE id = ?",
        (str(new_value), datetime.now(), setting_id)
    )
    conn.commit()

    # Get setting details for audit
    c.execute("SELECT category, key FROM settings WHERE id = ?", (setting_id,))
    setting = c.fetchone()
    conn.close()

    if setting:
        log_audit(
            request.current_user['user_id'],
            'update_setting',
            'settings',
            {'setting_id': setting_id, 'category': setting[0], 'key': setting[1]},
            request.remote_addr
        )

    return jsonify({'message': 'Setting updated successfully'}), 200

@app.route('/api/settings', methods=['POST'])
@token_required
def create_setting():
    """Create a new setting"""
    data = request.json

    required_fields = ['category', 'key', 'value', 'data_type']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    conn = sqlite3.connect(ADMIN_DB)
    c = conn.cursor()

    try:
        c.execute("""
            INSERT INTO settings (category, key, value, data_type, description, is_encrypted)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            data['category'],
            data['key'],
            data['value'],
            data['data_type'],
            data.get('description', ''),
            int(data.get('is_encrypted', 0))
        ))
        conn.commit()
        setting_id = c.lastrowid
        conn.close()

        log_audit(
            request.current_user['user_id'],
            'create_setting',
            'settings',
            {'category': data['category'], 'key': data['key']},
            request.remote_addr
        )

        return jsonify({'message': 'Setting created', 'id': setting_id}), 201

    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Setting already exists'}), 409

# ============================================================================
# NOTIFICATIONS MANAGEMENT
# ============================================================================

@app.route('/api/notifications', methods=['GET'])
@token_required
def get_notifications():
    """Get all notification configs"""
    conn = sqlite3.connect(ADMIN_DB)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT * FROM notification_configs ORDER BY created_at DESC")
    notifications = c.fetchall()
    conn.close()

    result = []
    for notif in notifications:
        result.append({
            'id': notif['id'],
            'name': notif['name'],
            'type': notif['type'],
            'enabled': bool(notif['enabled']),
            'schedule': notif['schedule'],
            'message_template': notif['message_template'],
            'recipients': json.loads(notif['recipients']) if notif['recipients'] else [],
            'conditions': json.loads(notif['conditions']) if notif['conditions'] else {},
            'created_at': notif['created_at'],
            'updated_at': notif['updated_at']
        })

    return jsonify(result), 200

@app.route('/api/notifications', methods=['POST'])
@token_required
def create_notification():
    """Create new notification config"""
    data = request.json

    required_fields = ['name', 'type', 'message_template']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400

    conn = sqlite3.connect(ADMIN_DB)
    c = conn.cursor()

    try:
        c.execute("""
            INSERT INTO notification_configs
            (name, type, enabled, schedule, message_template, recipients, conditions)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            data['name'],
            data['type'],
            int(data.get('enabled', 1)),
            data.get('schedule', ''),
            data['message_template'],
            json.dumps(data.get('recipients', [])),
            json.dumps(data.get('conditions', {}))
        ))
        conn.commit()
        notif_id = c.lastrowid
        conn.close()

        log_audit(
            request.current_user['user_id'],
            'create_notification',
            'notifications',
            {'name': data['name']},
            request.remote_addr
        )

        return jsonify({'message': 'Notification created', 'id': notif_id}), 201

    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Notification with this name already exists'}), 409

@app.route('/api/notifications/<int:notif_id>', methods=['PUT'])
@token_required
def update_notification(notif_id):
    """Update notification config"""
    data = request.json

    conn = sqlite3.connect(ADMIN_DB)
    c = conn.cursor()

    updates = []
    values = []

    if 'name' in data:
        updates.append('name = ?')
        values.append(data['name'])
    if 'type' in data:
        updates.append('type = ?')
        values.append(data['type'])
    if 'enabled' in data:
        updates.append('enabled = ?')
        values.append(int(data['enabled']))
    if 'schedule' in data:
        updates.append('schedule = ?')
        values.append(data['schedule'])
    if 'message_template' in data:
        updates.append('message_template = ?')
        values.append(data['message_template'])
    if 'recipients' in data:
        updates.append('recipients = ?')
        values.append(json.dumps(data['recipients']))
    if 'conditions' in data:
        updates.append('conditions = ?')
        values.append(json.dumps(data['conditions']))

    updates.append('updated_at = ?')
    values.append(datetime.now())
    values.append(notif_id)

    c.execute(
        f"UPDATE notification_configs SET {', '.join(updates)} WHERE id = ?",
        values
    )
    conn.commit()
    conn.close()

    log_audit(
        request.current_user['user_id'],
        'update_notification',
        'notifications',
        {'notification_id': notif_id},
        request.remote_addr
    )

    return jsonify({'message': 'Notification updated'}), 200

@app.route('/api/notifications/<int:notif_id>', methods=['DELETE'])
@token_required
def delete_notification(notif_id):
    """Delete notification config"""
    conn = sqlite3.connect(ADMIN_DB)
    c = conn.cursor()

    c.execute("DELETE FROM notification_configs WHERE id = ?", (notif_id,))
    conn.commit()
    conn.close()

    log_audit(
        request.current_user['user_id'],
        'delete_notification',
        'notifications',
        {'notification_id': notif_id},
        request.remote_addr
    )

    return jsonify({'message': 'Notification deleted'}), 200

# ============================================================================
# CRON JOBS MANAGEMENT
# ============================================================================

@app.route('/api/cron-jobs', methods=['GET'])
@token_required
def get_cron_jobs():
    """Get all cron jobs"""
    conn = sqlite3.connect(ADMIN_DB)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT * FROM cron_jobs ORDER BY name")
    jobs = c.fetchall()
    conn.close()

    result = []
    for job in jobs:
        result.append({
            'id': job['id'],
            'name': job['name'],
            'schedule': job['schedule'],
            'function_name': job['function_name'],
            'enabled': bool(job['enabled']),
            'last_run': job['last_run'],
            'next_run': job['next_run'],
            'parameters': json.loads(job['parameters']) if job['parameters'] else {},
            'description': job['description'],
            'created_at': job['created_at']
        })

    return jsonify(result), 200

@app.route('/api/cron-jobs/<int:job_id>/toggle', methods=['POST'])
@token_required
def toggle_cron_job(job_id):
    """Enable/disable cron job"""
    conn = sqlite3.connect(ADMIN_DB)
    c = conn.cursor()

    c.execute("SELECT enabled FROM cron_jobs WHERE id = ?", (job_id,))
    job = c.fetchone()

    if not job:
        conn.close()
        return jsonify({'error': 'Job not found'}), 404

    new_status = 0 if job[0] else 1

    c.execute("UPDATE cron_jobs SET enabled = ? WHERE id = ?", (new_status, job_id))
    conn.commit()
    conn.close()

    log_audit(
        request.current_user['user_id'],
        'toggle_cron_job',
        'cron',
        {'job_id': job_id, 'enabled': bool(new_status)},
        request.remote_addr
    )

    return jsonify({'message': 'Job status updated', 'enabled': bool(new_status)}), 200

# ============================================================================
# WHATSAPP QR CODE (Socket.IO)
# ============================================================================

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    logger.info(f"Client connected: {request.sid}")
    emit('connected', {'message': 'Connected to admin server'})

@socketio.on('request_qr_code')
def handle_qr_request():
    """Request WhatsApp QR code"""
    logger.info("QR Code requested")

    # Trigger Node.js backend to generate QR
    try:
        response = requests.post('http://localhost:5014/api/whatsapp/generate-qr')
        if response.status_code == 200:
            emit('qr_code_requested', {'status': 'success'})
        else:
            emit('qr_code_error', {'error': 'Failed to request QR code'})
    except Exception as e:
        logger.error(f"Error requesting QR code: {e}")
        emit('qr_code_error', {'error': str(e)})

@app.route('/api/whatsapp/qr-code', methods=['POST'])
def receive_qr_code():
    """Receive QR code from Node.js backend"""
    data = request.json
    qr_code = data.get('qr_code')

    if qr_code:
        # Save to database
        conn = sqlite3.connect(ADMIN_DB)
        c = conn.cursor()
        c.execute("""
            INSERT OR REPLACE INTO whatsapp_session (id, qr_code, is_connected, updated_at)
            VALUES (1, ?, 0, ?)
        """, (qr_code, datetime.now()))
        conn.commit()
        conn.close()

        # Broadcast to all connected clients
        socketio.emit('qr_code_updated', {'qr_code': qr_code})

        return jsonify({'message': 'QR code received'}), 200

    return jsonify({'error': 'No QR code provided'}), 400

@app.route('/api/whatsapp/status', methods=['POST'])
def update_whatsapp_status():
    """Update WhatsApp connection status"""
    data = request.json
    is_connected = data.get('is_connected', False)
    phone_number = data.get('phone_number')

    conn = sqlite3.connect(ADMIN_DB)
    c = conn.cursor()

    if is_connected:
        c.execute("""
            UPDATE whatsapp_session
            SET is_connected = 1, phone_number = ?, connected_at = ?, qr_code = NULL, updated_at = ?
            WHERE id = 1
        """, (phone_number, datetime.now(), datetime.now()))
    else:
        c.execute("""
            UPDATE whatsapp_session
            SET is_connected = 0, updated_at = ?
            WHERE id = 1
        """, (datetime.now(),))

    conn.commit()
    conn.close()

    # Broadcast status update
    socketio.emit('whatsapp_status', {
        'is_connected': is_connected,
        'phone_number': phone_number
    })

    return jsonify({'message': 'Status updated'}), 200

@app.route('/api/whatsapp/status', methods=['GET'])
@token_required
def get_whatsapp_status():
    """Get current WhatsApp status"""
    conn = sqlite3.connect(ADMIN_DB)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute("SELECT * FROM whatsapp_session WHERE id = 1")
    session = c.fetchone()
    conn.close()

    if session:
        return jsonify({
            'is_connected': bool(session['is_connected']),
            'phone_number': session['phone_number'],
            'qr_code': session['qr_code'],
            'connected_at': session['connected_at'],
            'updated_at': session['updated_at']
        }), 200

    return jsonify({
        'is_connected': False,
        'phone_number': None,
        'qr_code': None
    }), 200

# ============================================================================
# SYSTEM MONITORING
# ============================================================================

@app.route('/api/system/stats', methods=['GET'])
@token_required
def get_system_stats():
    """Get system statistics"""
    import psutil

    # Get database stats
    conn_main = sqlite3.connect(MAIN_DB)
    c_main = conn_main.cursor()

    stats = {
        'system': {
            'cpu_percent': psutil.cpu_percent(interval=1),
            'memory_percent': psutil.virtual_memory().percent,
            'disk_percent': psutil.disk_usage('/').percent
        },
        'database': {
            'total_orders': c_main.execute("SELECT COUNT(*) FROM processed_orders").fetchone()[0],
            'total_deliveries': c_main.execute("SELECT COUNT(*) FROM customer_delivery_tasks").fetchone()[0],
            'total_invoices': c_main.execute("SELECT COUNT(*) FROM customer_invoice_tasks").fetchone()[0],
            'database_size_mb': round(os.path.getsize(MAIN_DB) / (1024 * 1024), 2)
        },
        'services': {
            'python_backend': check_service_status('http://localhost:5005/health'),
            'nodejs_backend': check_service_status('http://localhost:5014/health')
        }
    }

    conn_main.close()

    return jsonify(stats), 200

def check_service_status(url):
    """Check if service is running"""
    try:
        response = requests.get(url, timeout=2)
        return response.status_code == 200
    except:
        return False

# ============================================================================
# AUDIT LOG
# ============================================================================

@app.route('/api/audit-log', methods=['GET'])
@token_required
def get_audit_log():
    """Get audit log entries"""
    limit = request.args.get('limit', 100, type=int)
    category = request.args.get('category')

    conn = sqlite3.connect(ADMIN_DB)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    if category:
        c.execute("""
            SELECT a.*, u.username
            FROM audit_log a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.category = ?
            ORDER BY a.timestamp DESC
            LIMIT ?
        """, (category, limit))
    else:
        c.execute("""
            SELECT a.*, u.username
            FROM audit_log a
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.timestamp DESC
            LIMIT ?
        """, (limit,))

    logs = c.fetchall()
    conn.close()

    result = []
    for log in logs:
        result.append({
            'id': log['id'],
            'username': log['username'],
            'action': log['action'],
            'category': log['category'],
            'details': json.loads(log['details']) if log['details'] else {},
            'ip_address': log['ip_address'],
            'timestamp': log['timestamp']
        })

    return jsonify(result), 200

# ============================================================================
# SERVE REACT APP
# ============================================================================

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    """Serve React app"""
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    logger.info("Starting Admin API Server on port 5010")
    socketio.run(app, host='0.0.0.0', port=5010, debug=True)
