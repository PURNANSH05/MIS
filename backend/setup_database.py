#!/usr/bin/env python3
"""
Database Setup Script
Creates database, tables, and seeds sample data
"""

import psycopg2
from psycopg2 import sql
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get credentials from .env
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "2006")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "medical_inventory")

print("=" * 60)
print("MEDICAL INVENTORY SYSTEM - DATABASE SETUP")
print("=" * 60)

# Step 1: Connect to default postgres database
print("\n[Step 1] Connecting to PostgreSQL...")
try:
    conn = psycopg2.connect(
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
        database="postgres"
    )
    conn.autocommit = True
    cursor = conn.cursor()
    print("✓ Connected to PostgreSQL successfully!")
except Exception as e:
    print(f"✗ Connection failed: {e}")
    exit(1)

# Step 2: Create database if it doesn't exist
print(f"\n[Step 2] Creating database '{DB_NAME}'...")
try:
    cursor.execute(sql.SQL("CREATE DATABASE {} WITH OWNER {};").format(
        sql.Identifier(DB_NAME),
        sql.Identifier(DB_USER)
    ))
    print(f"✓ Database '{DB_NAME}' created!")
except psycopg2.Error as e:
    if "already exists" in str(e):
        print(f"✓ Database '{DB_NAME}' already exists")
    else:
        print(f"✗ Error: {e}")
        cursor.close()
        conn.close()
        exit(1)

cursor.close()
conn.close()

# Step 3: Connect to the medical_inventory database
print(f"\n[Step 3] Connecting to '{DB_NAME}' database...")
try:
    conn = psycopg2.connect(
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME
    )
    cursor = conn.cursor()
    print(f"✓ Connected to '{DB_NAME}'!")
except Exception as e:
    print(f"✗ Connection failed: {e}")
    exit(1)

# Step 4: Create all tables
print("\n[Step 4] Creating tables...")
tables_sql = """
-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Items Table
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    reorder_level INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations Table
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    location_type VARCHAR(100) NOT NULL,
    address TEXT,
    contact_person VARCHAR(255),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Item Batches Table
CREATE TABLE IF NOT EXISTS item_batches (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(id),
    batch_number VARCHAR(100) NOT NULL,
    manufacturing_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    location_id INTEGER NOT NULL REFERENCES locations(id),
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(batch_number, item_id, location_id)
);

-- Stock Movements Table (Immutable Ledger)
CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER NOT NULL REFERENCES item_batches(id),
    movement_type VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    reference_number VARCHAR(100),
    created_by_id INTEGER NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Orders Table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    po_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    item_id INTEGER NOT NULL REFERENCES items(id),
    quantity INTEGER NOT NULL,
    expected_delivery_date DATE,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_by_id INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    module VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    status VARCHAR(50) DEFAULT 'SUCCESS',
    error_message TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_items_sku ON items(sku);
CREATE INDEX IF NOT EXISTS idx_item_batches_item_id ON item_batches(item_id);
CREATE INDEX IF NOT EXISTS idx_item_batches_location_id ON item_batches(location_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_batch_id ON stock_movements(batch_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_by_id ON stock_movements(created_by_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
"""

try:
    cursor.execute(tables_sql)
    conn.commit()
    print("✓ All 9 tables created successfully!")
except Exception as e:
    print(f"✗ Error creating tables: {e}")
    conn.rollback()
    cursor.close()
    conn.close()
    exit(1)

# Step 5: Seed sample data
print("\n[Step 5] Seeding sample data...")
try:
    # Insert Roles
    cursor.execute("""
        INSERT INTO roles (name, description) VALUES 
        ('Admin', 'Full system access'),
        ('Inventory Manager', 'Manage inventory operations'),
        ('Pharmacist', 'Dispense medications'),
        ('Storekeeper', 'Store management'),
        ('Auditor', 'View audit logs')
        ON CONFLICT (name) DO NOTHING;
    """)
    
    # Insert Users (password: admin123 hashed with bcrypt)
    cursor.execute("""
        INSERT INTO users (username, email, password_hash, role_id) VALUES 
        ('admin', 'admin@hospital.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5YmMxSUaqvFm2', 1)
        ON CONFLICT (username) DO NOTHING;
    """)
    
    # Insert Locations
    cursor.execute("""
        INSERT INTO locations (name, location_type, address, contact_person, phone) VALUES 
        ('Main Pharmacy', 'Pharmacy', 'Building A, 1st Floor', 'John Smith', '555-0001'),
        ('Central Warehouse', 'Warehouse', 'Building B, Ground Floor', 'Sarah Johnson', '555-0002'),
        ('Pediatric Ward', 'Ward', 'Building C, 3rd Floor', 'Dr. Emily Brown', '555-0003'),
        ('Emergency Department', 'Department', 'Building A, Ground Floor', 'Dr. Michael Davis', '555-0004'),
        ('ICU', 'Ward', 'Building D, 2nd Floor', 'Dr. Lisa Anderson', '555-0005')
        ON CONFLICT (name) DO NOTHING;
    """)
    
    # Insert Suppliers
    cursor.execute("""
        INSERT INTO suppliers (name, contact_person, email, phone, address, city, country) VALUES 
        ('MediPharm Solutions', 'Robert Wilson', 'contact@medipharm.com', '555-1001', '123 Medical Ave', 'New York', 'USA'),
        ('Global Health Supplies', 'Jennifer Martinez', 'orders@globalhealthsupplies.com', '555-1002', '456 Healthcare Blvd', 'Los Angeles', 'USA'),
        ('Pure Medicine Co', 'David Lee', 'sales@puremedicine.com', '555-1003', '789 Pharma Street', 'Chicago', 'USA')
        ON CONFLICT (name) DO NOTHING;
    """)
    
    # Insert Items (Common Hospital Medications)
    cursor.execute("""
        INSERT INTO items (name, sku, category, unit, reorder_level) VALUES 
        ('Paracetamol 500mg', 'PARA-500', 'Analgesics', 'Box', 50),
        ('Ibuprofen 400mg', 'IBU-400', 'Analgesics', 'Box', 40),
        ('Amoxicillin 500mg', 'AMOX-500', 'Antibiotics', 'Box', 30),
        ('Metformin 500mg', 'MET-500', 'Antidiabetics', 'Bottle', 25),
        ('Aspirin 100mg', 'ASP-100', 'Cardiovascular', 'Box', 60),
        ('Vitamin D3 1000IU', 'VIT-D3', 'Vitamins', 'Bottle', 20),
        ('Antibiotic Ointment 1%', 'ANT-OI-1', 'Topical', 'Tube', 35),
        ('Cough Syrup 100ml', 'COUGH-100', 'Cough Suppressants', 'Bottle', 15),
        ('Multivitamin Tablet', 'MULTI-VIT', 'Vitamins', 'Box', 40),
        ('Insulin Pen', 'INS-PEN', 'Diabetes', 'Box', 10)
        ON CONFLICT (sku) DO NOTHING;
    """)
    
    conn.commit()
    print("✓ Sample data seeded successfully!")
    
except Exception as e:
    print(f"✗ Error seeding data: {e}")
    conn.rollback()
    cursor.close()
    conn.close()
    exit(1)

# Step 6: Verify all data
print("\n[Step 6] Verifying setup...")
try:
    # Count tables
    cursor.execute("""
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    """)
    table_count = cursor.fetchone()[0]
    
    # Count data
    cursor.execute("SELECT COUNT(*) FROM roles;")
    role_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM users;")
    user_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM items;")
    item_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM locations;")
    location_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM suppliers;")
    supplier_count = cursor.fetchone()[0]
    
    print(f"\n{'='*60}")
    print("DATABASE SETUP COMPLETE!")
    print(f"{'='*60}")
    print(f"✓ Tables Created: {table_count}")
    print(f"✓ Roles: {role_count}")
    print(f"✓ Users: {user_count} (admin/admin123)")
    print(f"✓ Items: {item_count}")
    print(f"✓ Locations: {location_count}")
    print(f"✓ Suppliers: {supplier_count}")
    print(f"{'='*60}")
    print("\nYou can now:")
    print("1. Start backend: python main.py")
    print("2. Login in web app: admin/admin123")
    print("3. View database in pgAdmin")
    print(f"{'='*60}\n")
    
except Exception as e:
    print(f"✗ Error verifying: {e}")

cursor.close()
conn.close()
