#!/usr/bin/env python3
import psycopg2
from psycopg2 import sql

# Connect to PostgreSQL
conn = psycopg2.connect(
    dbname='medical_inventory',
    user='postgres',
    password='2006',
    host='localhost'
)

cur = conn.cursor()

# Check users table columns
try:
    cur.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
    """)
    
    columns = cur.fetchall()
    print("Current columns in users table:")
    for col_name, col_type in columns:
        print(f"  - {col_name}: {col_type}")
    
    # Check if hashed_password exists
    col_names = [col[0] for col in columns]
    
    if 'hashed_password' not in col_names:
        print("\n⚠️ Column 'hashed_password' not found!")
        print("Checking for similar columns...")
        
        password_cols = [col for col in col_names if 'pass' in col.lower()]
        if password_cols:
            print(f"Found: {password_cols}")
        else:
            print("No password column found. Needs to be added.")
    else:
        print("\n✓ Column 'hashed_password' exists!")
        
except Exception as e:
    print(f"Error: {e}")
finally:
    cur.close()
    conn.close()
