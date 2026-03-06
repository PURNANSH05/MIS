#!/usr/bin/env python3
"""
Database Fix Script
Adds missing columns to existing tables
"""

import sys
import os
from sqlalchemy import text

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import engine

def add_column_if_missing(connection, table_name, column_name, column_def):
    """Helper to add column if it doesn't exist"""
    result = connection.execute(
        text(f"SELECT column_name FROM information_schema.columns WHERE table_name='{table_name}' AND column_name='{column_name}'")
    )
    if not result.fetchone():
        print(f"  → Adding '{column_name}' column to {table_name} table...")
        connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_def}"))
        connection.commit()
    else:
        print(f"  ✓ '{column_name}' column already exists in {table_name}")

def fix_database_schema():
    """Add missing columns to tables"""
    print("🔄 Fixing database schema...")
    
    with engine.connect() as connection:
        try:
            # Fix locations table
            add_column_if_missing(connection, "locations", "description", "VARCHAR")
            add_column_if_missing(connection, "locations", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
            
            # Fix items table
            add_column_if_missing(connection, "items", "description", "VARCHAR")
            add_column_if_missing(connection, "items", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
            
            # Fix item_batches table
            add_column_if_missing(connection, "item_batches", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
            
            # Fix stock_movements table - created_by relationship
            add_column_if_missing(connection, "stock_movements", "created_by_id", "INTEGER REFERENCES users(id)")
            
            # Fix suppliers table
            add_column_if_missing(connection, "suppliers", "created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
            
            # Fix purchase_orders table
            add_column_if_missing(connection, "purchase_orders", "expected_delivery", "DATE")
            
            print("✅ Database schema fixed!")
            return True
            
        except Exception as e:
            print(f"❌ Error fixing schema: {e}")
            connection.rollback()
            return False

if __name__ == "__main__":
    success = fix_database_schema()
    sys.exit(0 if success else 1)
