#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Database Initialization Script
Creates and initializes the SQLite database with all required tables
"""

import sqlite3
import os
from datetime import datetime

DATABASE_FILE = os.getenv('DATABASE_FILE', './clickup_log.db')

def init_database():
    """Initialize database with all required tables"""

    print(f"Initializing database: {DATABASE_FILE}")

    conn = sqlite3.connect(DATABASE_FILE, check_same_thread=False)
    c = conn.cursor()

    # Processed orders table
    print("Creating processed_orders table...")
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
    print("Creating customer_delivery_tasks table...")
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
    print("Creating customer_invoice_tasks table...")
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
    print("Creating customer_payment_tasks table...")
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
    print("Creating customer_overdue_invoice_tasks table...")
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
    print("Creating task_templates table...")
    c.execute("""
        CREATE TABLE IF NOT EXISTS task_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            template_data TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # System metrics table
    print("Creating system_metrics table...")
    c.execute("""
        CREATE TABLE IF NOT EXISTS system_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            metric_name TEXT NOT NULL,
            metric_value TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Create indexes for better performance
    print("Creating indexes...")

    c.execute("""
        CREATE INDEX IF NOT EXISTS idx_processed_orders_erp_id
        ON processed_orders(erp_id)
    """)

    c.execute("""
        CREATE INDEX IF NOT EXISTS idx_processed_orders_type
        ON processed_orders(order_type)
    """)

    c.execute("""
        CREATE INDEX IF NOT EXISTS idx_processed_orders_timestamp
        ON processed_orders(timestamp)
    """)

    conn.commit()

    # Verify tables
    print("\nVerifying tables...")
    c.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = c.fetchall()

    print(f"✅ Database initialized successfully with {len(tables)} tables:")
    for table in tables:
        print(f"   - {table[0]}")

    conn.close()

    return True

def reset_database():
    """Reset database (drop all tables and recreate)"""
    print("⚠️  WARNING: This will delete all data!")
    confirm = input("Type 'YES' to confirm: ")

    if confirm != 'YES':
        print("Operation cancelled")
        return False

    if os.path.exists(DATABASE_FILE):
        backup_file = f"{DATABASE_FILE}.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        print(f"Creating backup: {backup_file}")
        import shutil
        shutil.copy2(DATABASE_FILE, backup_file)
        os.remove(DATABASE_FILE)
        print("Old database removed")

    return init_database()

if __name__ == '__main__':
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == '--reset':
        reset_database()
    else:
        init_database()
