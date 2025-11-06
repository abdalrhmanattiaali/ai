#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ClickUp Integration System - Python Backend
ERPNext Webhook Handler with ClickUp Integration

Author: ClickUp Integration Team
Version: 2.0
"""

import os
import json
import sqlite3
import logging
import requests
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from apscheduler.schedulers.background import BackgroundScheduler
from functools import wraps
import hmac
import hashlib
from contextlib import contextmanager
from queue import Queue
import time

# ============================================================================
# CONFIGURATION
# ============================================================================

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# ERPNext Configuration
ERP_BASE_URL = os.getenv('ERP_BASE_URL', 'https://erp.stretapro.com')
ERPNEXT_API_KEY = os.getenv('ERPNEXT_API_KEY')
ERPNEXT_API_SECRET = os.getenv('ERPNEXT_API_SECRET')

# ClickUp Configuration
CLICKUP_ACCESS_TOKEN = os.getenv('CLICKUP_ACCESS_TOKEN')
CLICKUP_API_BASE = "https://api.clickup.com/api/v2"

# ClickUp List IDs
CLICKUP_LIST_ID = os.getenv('CLICKUP_LIST_ID')  # Sales Orders
CLICKUP_SAMPLES_LIST_ID = os.getenv('CLICKUP_SAMPLES_LIST_ID')
CLICKUP_DELIVERY_LIST_ID = os.getenv('CLICKUP_DELIVERY_LIST_ID')
CLICKUP_INVOICE_LIST_ID = os.getenv('CLICKUP_INVOICE_LIST_ID')
CLICKUP_PAYMENT_LIST_ID = os.getenv('CLICKUP_PAYMENT_LIST_ID')
CLICKUP_CLEARING_LIST_ID = os.getenv('CLICKUP_CLEARING_LIST_ID')
CLICKUP_OVERDUE_LIST_ID = os.getenv('CLICKUP_OVERDUE_LIST_ID')
CLICKUP_WORK_ORDER_LIST_ID = os.getenv('CLICKUP_WORK_ORDER_LIST_ID')

# Team Assignees
ASSIGNEES = os.getenv('ASSIGNEES', '62585187,74558888,74558852').split(',')

# WhatsApp Configuration
WHATSAPP_GATEWAY_URL = os.getenv('WHATSAPP_GATEWAY_URL', 'http://127.0.0.1:5014/send')
WHATSAPP_DEFAULT_TO = os.getenv('WHATSAPP_DEFAULT_TO')

# Database Configuration
DATABASE_FILE = os.getenv('DATABASE_FILE', './clickup_log.db')

# Logging Configuration
LOG_FILE = os.getenv('LOG_FILE', '/var/log/clickup_integration.log')
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

# Security
WEBHOOK_SECRET = os.getenv('WEBHOOK_SECRET')

# ============================================================================
# LOGGING SETUP
# ============================================================================

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ============================================================================
# FLASK APP SETUP
# ============================================================================

app = Flask(__name__)

# ============================================================================
# DATABASE MANAGEMENT
# ============================================================================

class DatabasePool:
    """Database connection pool for better performance"""

    def __init__(self, db_file, pool_size=5):
        self.db_file = db_file
        self.pool = Queue(maxsize=pool_size)
        for _ in range(pool_size):
            conn = sqlite3.connect(db_file, check_same_thread=False)
            conn.row_factory = sqlite3.Row
            self.pool.put(conn)

    @contextmanager
    def get_connection(self):
        """Get connection from pool with context manager"""
        conn = self.pool.get()
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            logger.error(f"Database error: {e}")
            raise
        finally:
            self.pool.put(conn)

# Initialize database
def init_database():
    """Initialize database tables"""
    conn = sqlite3.connect(DATABASE_FILE, check_same_thread=False)
    c = conn.cursor()

    # Processed orders table
    c.execute("""
        CREATE TABLE IF NOT EXISTS processed_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            erp_id TEXT NOT NULL,
            order_type TEXT NOT NULL,
            clickup_task_id TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(erp_id, order_type)
        )
    """)

    # Customer delivery tasks
    c.execute("""
        CREATE TABLE IF NOT EXISTS customer_delivery_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL UNIQUE,
            clickup_task_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Customer invoice tasks
    c.execute("""
        CREATE TABLE IF NOT EXISTS customer_invoice_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL UNIQUE,
            clickup_task_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Customer payment tasks
    c.execute("""
        CREATE TABLE IF NOT EXISTS customer_payment_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL UNIQUE,
            clickup_task_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Customer overdue invoice tasks
    c.execute("""
        CREATE TABLE IF NOT EXISTS customer_overdue_invoice_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL UNIQUE,
            clickup_task_id TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Task templates table
    c.execute("""
        CREATE TABLE IF NOT EXISTS task_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            template_data TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # System metrics table
    c.execute("""
        CREATE TABLE IF NOT EXISTS system_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            metric_name TEXT NOT NULL,
            metric_value TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()
    logger.info("Database initialized successfully")

# Initialize database pool
db_pool = None

def get_db_pool():
    """Get or create database pool"""
    global db_pool
    if db_pool is None:
        db_pool = DatabasePool(DATABASE_FILE)
    return db_pool

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def verify_webhook_signature(payload, signature):
    """Verify webhook signature for security"""
    if not WEBHOOK_SECRET or not signature:
        return True  # Skip verification if not configured

    expected_signature = hmac.new(
        WEBHOOK_SECRET.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(signature, expected_signature)

def retry_on_failure(max_retries=3, delay=2):
    """Decorator for retrying failed operations"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise
                    logger.warning(f"Attempt {attempt + 1} failed: {e}. Retrying...")
                    time.sleep(delay * (2 ** attempt))  # Exponential backoff
            return None
        return wrapper
    return decorator

def shorten_url(long_url):
    """Shorten URL using TinyURL API"""
    try:
        response = requests.get(f'http://tinyurl.com/api-create.php?url={long_url}', timeout=5)
        if response.status_code == 200:
            return response.text
        return long_url
    except Exception as e:
        logger.error(f"URL shortening failed: {e}")
        return long_url

def send_whatsapp_message(to, message):
    """Send WhatsApp message via gateway"""
    try:
        payload = {
            "to": to or WHATSAPP_DEFAULT_TO,
            "message": message
        }
        response = requests.post(WHATSAPP_GATEWAY_URL, json=payload, timeout=10)
        if response.status_code == 200:
            logger.info(f"WhatsApp message sent successfully to {to}")
            return True
        else:
            logger.error(f"Failed to send WhatsApp message: {response.text}")
            return False
    except Exception as e:
        logger.error(f"WhatsApp send error: {e}")
        return False

# ============================================================================
# CLICKUP API FUNCTIONS
# ============================================================================

@retry_on_failure(max_retries=3, delay=2)
def create_clickup_task(payload, list_id):
    """Create a task in ClickUp"""
    url = f"{CLICKUP_API_BASE}/list/{list_id}/task"
    headers = {
        "Authorization": CLICKUP_ACCESS_TOKEN,
        "Content-Type": "application/json"
    }

    response = requests.post(url, headers=headers, json=payload, timeout=30)

    if response.status_code in [200, 201]:
        task_data = response.json()
        logger.info(f"Task created successfully: {task_data.get('id')}")
        return task_data
    else:
        logger.error(f"Failed to create task: {response.status_code} - {response.text}")
        raise Exception(f"ClickUp API error: {response.status_code}")

@retry_on_failure(max_retries=3, delay=2)
def get_clickup_task(task_id):
    """Get task details from ClickUp"""
    url = f"{CLICKUP_API_BASE}/task/{task_id}"
    headers = {"Authorization": CLICKUP_ACCESS_TOKEN}

    response = requests.get(url, headers=headers, timeout=30)

    if response.status_code == 200:
        return response.json()
    else:
        logger.error(f"Failed to get task: {response.status_code}")
        return None

@retry_on_failure(max_retries=3, delay=2)
def update_clickup_task(task_id, payload):
    """Update a task in ClickUp"""
    url = f"{CLICKUP_API_BASE}/task/{task_id}"
    headers = {
        "Authorization": CLICKUP_ACCESS_TOKEN,
        "Content-Type": "application/json"
    }

    response = requests.put(url, headers=headers, json=payload, timeout=30)

    if response.status_code == 200:
        logger.info(f"Task updated successfully: {task_id}")
        return response.json()
    else:
        logger.error(f"Failed to update task: {response.status_code}")
        return None

@retry_on_failure(max_retries=3, delay=2)
def create_clickup_subtask(parent_task_id, payload):
    """Create a subtask under a parent task"""
    url = f"{CLICKUP_API_BASE}/task/{parent_task_id}/subtask"
    headers = {
        "Authorization": CLICKUP_ACCESS_TOKEN,
        "Content-Type": "application/json"
    }

    response = requests.post(url, headers=headers, json=payload, timeout=30)

    if response.status_code in [200, 201]:
        subtask_data = response.json()
        logger.info(f"Subtask created: {subtask_data.get('id')}")
        return subtask_data
    else:
        logger.error(f"Failed to create subtask: {response.status_code}")
        return None

@retry_on_failure(max_retries=3, delay=2)
def add_checklist_to_task(task_id, checklist_name, items):
    """Add checklist to a task"""
    # Create checklist
    url = f"{CLICKUP_API_BASE}/task/{task_id}/checklist"
    headers = {
        "Authorization": CLICKUP_ACCESS_TOKEN,
        "Content-Type": "application/json"
    }

    payload = {"name": checklist_name}
    response = requests.post(url, headers=headers, json=payload, timeout=30)

    if response.status_code not in [200, 201]:
        logger.error(f"Failed to create checklist: {response.status_code}")
        return None

    checklist_data = response.json()
    checklist_id = checklist_data.get('checklist', {}).get('id')

    if not checklist_id:
        return None

    # Add items to checklist
    for item in items:
        item_url = f"{CLICKUP_API_BASE}/checklist/{checklist_id}/checklist_item"
        item_payload = {"name": item}
        requests.post(item_url, headers=headers, json=item_payload, timeout=30)

    logger.info(f"Checklist added to task {task_id}")
    return checklist_data

# ============================================================================
# ERPNEXT API FUNCTIONS
# ============================================================================

def get_erpnext_doc(doctype, name):
    """Get document from ERPNext"""
    url = f"{ERP_BASE_URL}/api/resource/{doctype}/{name}"
    headers = {
        "Authorization": f"token {ERPNEXT_API_KEY}:{ERPNEXT_API_SECRET}"
    }

    try:
        response = requests.get(url, headers=headers, timeout=30)
        if response.status_code == 200:
            return response.json().get('data')
        else:
            logger.error(f"Failed to get ERPNext doc: {response.status_code}")
            return None
    except Exception as e:
        logger.error(f"ERPNext API error: {e}")
        return None

def get_erpnext_list(doctype, filters=None, fields=None, limit=None):
    """Get list of documents from ERPNext"""
    url = f"{ERP_BASE_URL}/api/resource/{doctype}"
    headers = {
        "Authorization": f"token {ERPNEXT_API_KEY}:{ERPNEXT_API_SECRET}"
    }

    params = {}
    if filters:
        params['filters'] = json.dumps(filters)
    if fields:
        params['fields'] = json.dumps(fields)
    if limit:
        params['limit_page_length'] = limit

    try:
        response = requests.get(url, headers=headers, params=params, timeout=30)
        if response.status_code == 200:
            return response.json().get('data', [])
        else:
            logger.error(f"Failed to get ERPNext list: {response.status_code}")
            return []
    except Exception as e:
        logger.error(f"ERPNext API error: {e}")
        return []

# ============================================================================
# WEBHOOK HANDLERS - SALES ORDERS
# ============================================================================

@app.route('/clickup-webhook', methods=['POST'])
def handle_sales_order_webhook():
    """Handle Sales Order webhook from ERPNext"""
    try:
        # Verify signature
        signature = request.headers.get('X-Signature')
        if not verify_webhook_signature(request.get_data(as_text=True), signature):
            return jsonify({"error": "Invalid signature"}), 401

        data = request.json
        logger.info(f"Received Sales Order webhook: {json.dumps(data, indent=2)}")

        # Extract order data
        order_name = data.get('name')
        customer = data.get('customer')
        items = data.get('items', [])

        if not order_name or not customer:
            return jsonify({"error": "Missing required fields"}), 400

        # Check if already processed
        with get_db_pool().get_connection() as conn:
            c = conn.cursor()
            c.execute(
                "SELECT clickup_task_id FROM processed_orders WHERE erp_id = ? AND order_type = 'sales_order'",
                (order_name,)
            )
            existing = c.fetchone()

            if existing:
                logger.info(f"Sales Order {order_name} already processed")
                return jsonify({"message": "Already processed", "task_id": existing[0]}), 200

        # Create main task
        main_task_payload = {
            "name": f"طلب: {customer} - {order_name}",
            "description": f"معالجة طلب البيع رقم {order_name} للعميل {customer}",
            "assignees": ASSIGNEES,
            "priority": 3,
            "status": "TO DO"
        }

        main_task = create_clickup_task(main_task_payload, CLICKUP_LIST_ID)
        if not main_task:
            return jsonify({"error": "Failed to create main task"}), 500

        main_task_id = main_task.get('id')
        task_url = main_task.get('url')
        short_url = shorten_url(task_url)

        # Save to database
        with get_db_pool().get_connection() as conn:
            c = conn.cursor()
            c.execute(
                "INSERT INTO processed_orders (erp_id, order_type, clickup_task_id) VALUES (?, ?, ?)",
                (order_name, 'sales_order', main_task_id)
            )

        # Create subtasks for items
        for idx, item in enumerate(items, 1):
            item_code = item.get('item_code')
            qty = item.get('qty')

            subtask_payload = {
                "name": f"{idx}. {item_code} - كمية: {qty}",
                "description": f"تحضير المنتج: {item_code}\nالكمية: {qty}",
                "assignees": ASSIGNEES
            }

            create_clickup_subtask(main_task_id, subtask_payload)

        # Add printing task with checklist
        print_task_payload = {
            "name": "طباعة الملصقات",
            "description": "طباعة ملصقات المنتجات",
            "assignees": ASSIGNEES
        }

        print_task = create_clickup_subtask(main_task_id, print_task_payload)
        if print_task:
            print_items = [f"{item.get('item_code')} - {item.get('qty')}" for item in items]
            add_checklist_to_task(print_task.get('id'), "قائمة الطباعة", print_items)

        # Add sticker and loading tasks
        create_clickup_subtask(main_task_id, {
            "name": "لصق الملصقات",
            "description": "لصق الملصقات على المنتجات",
            "assignees": ASSIGNEES
        })

        create_clickup_subtask(main_task_id, {
            "name": "تحميل الطلب",
            "description": "تحميل الطلب للشحن",
            "assignees": ASSIGNEES
        })

        # Send WhatsApp notification
        message = f"""
📦 *طلب بيع جديد*

العميل: {customer}
رقم الطلب: {order_name}
عدد الأصناف: {len(items)}

🔗 الرابط: {short_url}
"""
        send_whatsapp_message(None, message)

        logger.info(f"Sales Order {order_name} processed successfully")
        return jsonify({"message": "Success", "task_id": main_task_id, "url": short_url}), 200

    except Exception as e:
        logger.error(f"Error handling sales order webhook: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

# ============================================================================
# WEBHOOK HANDLERS - SAMPLE REQUESTS
# ============================================================================

@app.route('/clickup-samples-webhook', methods=['POST'])
def handle_sample_request_webhook():
    """Handle Sample Request webhook from ERPNext"""
    try:
        data = request.json
        logger.info(f"Received Sample Request webhook: {json.dumps(data, indent=2)}")

        request_name = data.get('name')
        customer = data.get('customer')
        items = data.get('items', [])

        if not request_name or not customer:
            return jsonify({"error": "Missing required fields"}), 400

        # Check if already processed
        with get_db_pool().get_connection() as conn:
            c = conn.cursor()
            c.execute(
                "SELECT clickup_task_id FROM processed_orders WHERE erp_id = ? AND order_type = 'sample_request'",
                (request_name,)
            )
            existing = c.fetchone()

            if existing:
                return jsonify({"message": "Already processed"}), 200

        # Create main task
        main_task_payload = {
            "name": f"عينات: {customer} - {request_name}",
            "description": f"طلب عينات للعميل {customer}",
            "assignees": ASSIGNEES,
            "priority": 2,
            "status": "TO DO"
        }

        main_task = create_clickup_task(main_task_payload, CLICKUP_SAMPLES_LIST_ID)
        if not main_task:
            return jsonify({"error": "Failed to create task"}), 500

        main_task_id = main_task.get('id')

        # Save to database
        with get_db_pool().get_connection() as conn:
            c = conn.cursor()
            c.execute(
                "INSERT INTO processed_orders (erp_id, order_type, clickup_task_id) VALUES (?, ?, ?)",
                (request_name, 'sample_request', main_task_id)
            )

        # Create subtasks for items
        for idx, item in enumerate(items, 1):
            item_code = item.get('item_code')
            qty = item.get('qty', 1)

            subtask_payload = {
                "name": f"{idx}. {item_code} - عينة",
                "description": f"تحضير عينة: {item_code}",
                "assignees": ASSIGNEES
            }

            create_clickup_subtask(main_task_id, subtask_payload)

        # Add final task
        create_clickup_subtask(main_task_id, {
            "name": "إغلاق طلب العينات",
            "description": "التأكد من إرسال جميع العينات",
            "assignees": ASSIGNEES
        })

        logger.info(f"Sample Request {request_name} processed successfully")
        return jsonify({"message": "Success", "task_id": main_task_id}), 200

    except Exception as e:
        logger.error(f"Error handling sample request webhook: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

# ============================================================================
# WEBHOOK HANDLERS - DELIVERY NOTES
# ============================================================================

@app.route('/clickup-delivery-webhook', methods=['POST'])
def handle_delivery_webhook():
    """Handle Delivery Note webhook from ERPNext"""
    try:
        data = request.json
        logger.info(f"Received Delivery Note webhook")

        delivery_name = data.get('name')
        customer = data.get('customer')

        if not delivery_name or not customer:
            return jsonify({"error": "Missing required fields"}), 400

        # Check if already processed
        with get_db_pool().get_connection() as conn:
            c = conn.cursor()
            c.execute(
                "SELECT clickup_task_id FROM processed_orders WHERE erp_id = ? AND order_type = 'delivery_subtask'",
                (delivery_name,)
            )
            existing = c.fetchone()

            if existing:
                return jsonify({"message": "Already processed"}), 200

            # Check for existing customer task
            c.execute(
                "SELECT clickup_task_id FROM customer_delivery_tasks WHERE customer_name = ?",
                (customer,)
            )
            customer_task = c.fetchone()

        # Get or create main customer task
        if customer_task:
            main_task_id = customer_task[0]
            # Check if task is still open
            task_details = get_clickup_task(main_task_id)
            if task_details and task_details.get('status', {}).get('status') != 'TO DO':
                # Task closed, create new one
                main_task_id = None
        else:
            main_task_id = None

        if not main_task_id:
            # Create new main task
            main_task_payload = {
                "name": f"تسليم: {customer}",
                "description": f"تسليم طلبات العميل: {customer}",
                "assignees": ASSIGNEES,
                "priority": 3,
                "status": "TO DO"
            }

            main_task = create_clickup_task(main_task_payload, CLICKUP_DELIVERY_LIST_ID)
            if not main_task:
                return jsonify({"error": "Failed to create task"}), 500

            main_task_id = main_task.get('id')

            # Save customer task
            with get_db_pool().get_connection() as conn:
                c = conn.cursor()
                c.execute(
                    "INSERT OR REPLACE INTO customer_delivery_tasks (customer_name, clickup_task_id) VALUES (?, ?)",
                    (customer, main_task_id)
                )

        # Create subtask for this delivery
        subtask_payload = {
            "name": f"تسليم: {delivery_name}",
            "description": f"تسليم إشعار رقم {delivery_name}",
            "assignees": ASSIGNEES
        }

        subtask = create_clickup_subtask(main_task_id, subtask_payload)

        # Save to database
        with get_db_pool().get_connection() as conn:
            c = conn.cursor()
            c.execute(
                "INSERT INTO processed_orders (erp_id, order_type, clickup_task_id) VALUES (?, ?, ?)",
                (delivery_name, 'delivery_subtask', subtask.get('id') if subtask else main_task_id)
            )

        logger.info(f"Delivery Note {delivery_name} processed successfully")
        return jsonify({"message": "Success", "task_id": main_task_id}), 200

    except Exception as e:
        logger.error(f"Error handling delivery webhook: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

# ============================================================================
# WEBHOOK HANDLERS - INVOICES
# ============================================================================

@app.route('/clickup-invoice-webhook', methods=['POST'])
def handle_invoice_webhook():
    """Handle Sales Invoice webhook from ERPNext"""
    try:
        data = request.json
        logger.info(f"Received Invoice webhook")

        invoice_name = data.get('name')
        customer = data.get('customer')
        grand_total = data.get('grand_total', 0)

        if not invoice_name or not customer:
            return jsonify({"error": "Missing required fields"}), 400

        # Check if already processed
        with get_db_pool().get_connection() as conn:
            c = conn.cursor()
            c.execute(
                "SELECT clickup_task_id FROM processed_orders WHERE erp_id = ? AND order_type = 'invoice_subtask'",
                (invoice_name,)
            )
            existing = c.fetchone()

            if existing:
                return jsonify({"message": "Already processed"}), 200

            # Check for existing customer invoice task
            c.execute(
                "SELECT clickup_task_id FROM customer_invoice_tasks WHERE customer_name = ?",
                (customer,)
            )
            customer_task = c.fetchone()

        # Get or create main customer task
        if customer_task:
            main_task_id = customer_task[0]
            task_details = get_clickup_task(main_task_id)
            if task_details and task_details.get('status', {}).get('status') != 'TO DO':
                main_task_id = None
        else:
            main_task_id = None

        if not main_task_id:
            main_task_payload = {
                "name": f"فواتير: {customer}",
                "description": f"فواتير العميل: {customer}",
                "assignees": ASSIGNEES,
                "priority": 2,
                "status": "TO DO"
            }

            main_task = create_clickup_task(main_task_payload, CLICKUP_INVOICE_LIST_ID)
            if not main_task:
                return jsonify({"error": "Failed to create task"}), 500

            main_task_id = main_task.get('id')

            with get_db_pool().get_connection() as conn:
                c = conn.cursor()
                c.execute(
                    "INSERT OR REPLACE INTO customer_invoice_tasks (customer_name, clickup_task_id) VALUES (?, ?, ?)",
                    (customer, main_task_id)
                )

        # Create subtask
        subtask_payload = {
            "name": f"فاتورة: {invoice_name} - {grand_total} ج.م",
            "description": f"فاتورة رقم {invoice_name}\nالمبلغ: {grand_total}",
            "assignees": ASSIGNEES
        }

        subtask = create_clickup_subtask(main_task_id, subtask_payload)

        with get_db_pool().get_connection() as conn:
            c = conn.cursor()
            c.execute(
                "INSERT INTO processed_orders (erp_id, order_type, clickup_task_id) VALUES (?, ?, ?)",
                (invoice_name, 'invoice_subtask', subtask.get('id') if subtask else main_task_id)
            )

        logger.info(f"Invoice {invoice_name} processed successfully")
        return jsonify({"message": "Success"}), 200

    except Exception as e:
        logger.error(f"Error handling invoice webhook: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

# ============================================================================
# WEBHOOK HANDLERS - PAYMENTS
# ============================================================================

@app.route('/clickup-payment-webhook', methods=['POST'])
def handle_payment_webhook():
    """Handle Payment Entry webhook from ERPNext"""
    try:
        data = request.json
        logger.info(f"Received Payment webhook")

        payment_name = data.get('name')
        party = data.get('party')
        paid_amount = data.get('paid_amount', 0)
        mode_of_payment = data.get('mode_of_payment')

        if not payment_name or not party:
            return jsonify({"error": "Missing required fields"}), 400

        # Check if already processed
        with get_db_pool().get_connection() as conn:
            c = conn.cursor()
            c.execute(
                "SELECT clickup_task_id FROM processed_orders WHERE erp_id = ? AND order_type = 'payment_subtask'",
                (payment_name,)
            )
            existing = c.fetchone()

            if existing:
                return jsonify({"message": "Already processed"}), 200

            # Get or create customer payment task
            c.execute(
                "SELECT clickup_task_id FROM customer_payment_tasks WHERE customer_name = ?",
                (party,)
            )
            customer_task = c.fetchone()

        if customer_task:
            main_task_id = customer_task[0]
        else:
            main_task_payload = {
                "name": f"مدفوعات: {party}",
                "description": f"تحصيل مدفوعات من {party}",
                "assignees": ASSIGNEES,
                "priority": 2,
                "status": "TO DO"
            }

            main_task = create_clickup_task(main_task_payload, CLICKUP_PAYMENT_LIST_ID)
            if not main_task:
                return jsonify({"error": "Failed to create task"}), 500

            main_task_id = main_task.get('id')

            with get_db_pool().get_connection() as conn:
                c = conn.cursor()
                c.execute(
                    "INSERT INTO customer_payment_tasks (customer_name, clickup_task_id) VALUES (?, ?)",
                    (party, main_task_id)
                )

        # Create subtask
        subtask_payload = {
            "name": f"{mode_of_payment}: {paid_amount} ج.م",
            "description": f"دفعة رقم {payment_name}\nالمبلغ: {paid_amount}\nطريقة الدفع: {mode_of_payment}",
            "assignees": ASSIGNEES
        }

        subtask = create_clickup_subtask(main_task_id, subtask_payload)

        with get_db_pool().get_connection() as conn:
            c = conn.cursor()
            c.execute(
                "INSERT INTO processed_orders (erp_id, order_type, clickup_task_id) VALUES (?, ?, ?)",
                (payment_name, 'payment_subtask', subtask.get('id') if subtask else main_task_id)
            )

        logger.info(f"Payment {payment_name} processed successfully")
        return jsonify({"message": "Success"}), 200

    except Exception as e:
        logger.error(f"Error handling payment webhook: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

# ============================================================================
# SCHEDULED JOBS
# ============================================================================

def check_overdue_invoices():
    """Check for overdue invoices and create ClickUp tasks"""
    try:
        logger.info("Checking for overdue invoices...")

        # Get overdue invoices from ERPNext
        filters = {
            "status": ["in", ["Unpaid", "Overdue", "Partly Paid"]],
            "docstatus": 1
        }

        invoices = get_erpnext_list("Sales Invoice", filters=filters,
                                     fields=["name", "customer", "grand_total", "due_date", "outstanding_amount"])

        if not invoices:
            logger.info("No overdue invoices found")
            return

        # Group by customer
        customer_invoices = {}
        for invoice in invoices:
            due_date = datetime.strptime(invoice.get('due_date'), '%Y-%m-%d')
            if due_date < datetime.now():
                customer = invoice.get('customer')
                if customer not in customer_invoices:
                    customer_invoices[customer] = []
                customer_invoices[customer].append(invoice)

        # Create tasks for each customer
        for customer, inv_list in customer_invoices.items():
            # Check if task already exists
            with get_db_pool().get_connection() as conn:
                c = conn.cursor()
                c.execute(
                    "SELECT clickup_task_id FROM customer_overdue_invoice_tasks WHERE customer_name = ?",
                    (customer,)
                )
                existing_task = c.fetchone()

            if existing_task:
                # Update existing task
                task_id = existing_task[0]
                description = f"فواتير متأخرة للعميل: {customer}\n\n"
                for inv in inv_list:
                    description += f"- {inv.get('name')}: {inv.get('outstanding_amount')} ج.م (تاريخ الاستحقاق: {inv.get('due_date')})\n"

                update_clickup_task(task_id, {"description": description})
            else:
                # Create new task
                total_outstanding = sum(float(inv.get('outstanding_amount', 0)) for inv in inv_list)

                task_payload = {
                    "name": f"متابعة فواتير متأخرة: {customer}",
                    "description": f"إجمالي المستحق: {total_outstanding} ج.م\nعدد الفواتير: {len(inv_list)}",
                    "assignees": ASSIGNEES,
                    "priority": 1,  # Urgent
                    "status": "TO DO"
                }

                task = create_clickup_task(task_payload, CLICKUP_OVERDUE_LIST_ID)
                if task:
                    task_id = task.get('id')

                    # Add subtasks for each invoice
                    for inv in inv_list:
                        subtask_payload = {
                            "name": f"{inv.get('name')}: {inv.get('outstanding_amount')} ج.م",
                            "description": f"تاريخ الاستحقاق: {inv.get('due_date')}",
                            "assignees": ASSIGNEES
                        }
                        create_clickup_subtask(task_id, subtask_payload)

                    # Save to database
                    with get_db_pool().get_connection() as conn:
                        c = conn.cursor()
                        c.execute(
                            "INSERT INTO customer_overdue_invoice_tasks (customer_name, clickup_task_id) VALUES (?, ?)",
                            (customer, task_id)
                        )

                    # Send WhatsApp notification
                    message = f"""
⚠️ *تنبيه: فواتير متأخرة*

العميل: {customer}
عدد الفواتير: {len(inv_list)}
المبلغ المستحق: {total_outstanding} ج.م

يرجى المتابعة العاجلة
"""
                    send_whatsapp_message(None, message)

        logger.info(f"Overdue invoice check completed. Processed {len(customer_invoices)} customers")

    except Exception as e:
        logger.error(f"Error checking overdue invoices: {e}", exc_info=True)

def generate_monthly_summary():
    """Generate monthly summary report"""
    try:
        logger.info("Generating monthly summary...")

        # Calculate date range (previous month)
        today = datetime.now()
        first_day_current = today.replace(day=1)
        last_day_previous = first_day_current - timedelta(days=1)
        first_day_previous = last_day_previous.replace(day=1)

        # Get statistics from ERPNext
        sales_orders = get_erpnext_list(
            "Sales Order",
            filters={
                "creation": ["between", [first_day_previous.strftime('%Y-%m-%d'), last_day_previous.strftime('%Y-%m-%d')]]
            }
        )

        delivery_notes = get_erpnext_list(
            "Delivery Note",
            filters={
                "creation": ["between", [first_day_previous.strftime('%Y-%m-%d'), last_day_previous.strftime('%Y-%m-%d')]]
            }
        )

        invoices = get_erpnext_list(
            "Sales Invoice",
            filters={
                "creation": ["between", [first_day_previous.strftime('%Y-%m-%d'), last_day_previous.strftime('%Y-%m-%d')]]
            }
        )

        # Calculate totals
        total_sales = len(sales_orders)
        total_deliveries = len(delivery_notes)
        total_invoices = len(invoices)

        invoice_total_value = sum(float(inv.get('grand_total', 0)) for inv in invoices)

        # Generate report message
        message = f"""
📊 *التقرير الشهري - {last_day_previous.strftime('%B %Y')}*

📦 أوامر المبيعات: {total_sales}
🚚 إشعارات التسليم: {total_deliveries}
💰 الفواتير: {total_invoices}
💵 إجمالي قيمة الفواتير: {invoice_total_value:,.2f} ج.م

تم إنشاء التقرير تلقائياً
"""

        # Send via WhatsApp
        send_whatsapp_message(None, message)

        logger.info("Monthly summary generated successfully")

    except Exception as e:
        logger.error(f"Error generating monthly summary: {e}", exc_info=True)

# ============================================================================
# HEALTH CHECK & MANUAL TRIGGERS
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0"
    }), 200

@app.route('/trigger-check', methods=['GET'])
def trigger_overdue_check():
    """Manually trigger overdue invoice check"""
    try:
        check_overdue_invoices()
        return jsonify({"message": "Overdue check completed"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/monthly-summary', methods=['GET'])
def trigger_monthly_summary():
    """Manually trigger monthly summary"""
    try:
        generate_monthly_summary()
        return jsonify({"message": "Monthly summary generated"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================================
# SCHEDULER SETUP
# ============================================================================

def setup_scheduler():
    """Setup background scheduler for periodic tasks"""
    scheduler = BackgroundScheduler()

    # Check overdue invoices every hour
    scheduler.add_job(check_overdue_invoices, 'interval', hours=1)

    # Monthly summary on last day of month at 23:55
    scheduler.add_job(generate_monthly_summary, 'cron', day='last', hour=23, minute=55)

    scheduler.start()
    logger.info("Scheduler started")

    return scheduler

# ============================================================================
# MAIN
# ============================================================================

if __name__ == '__main__':
    try:
        logger.info("Starting ClickUp Integration System - Python Backend v2.0")

        # Initialize database
        init_database()

        # Setup scheduler
        scheduler = setup_scheduler()

        # Start Flask app
        app.run(host='0.0.0.0', port=5005, debug=False)

    except KeyboardInterrupt:
        logger.info("Shutting down...")
        if 'scheduler' in locals():
            scheduler.shutdown()
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
