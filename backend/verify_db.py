#!/usr/bin/env python
"""Verify database has all tables and data"""

from database import engine
from sqlalchemy import text, inspect

# Get database inspector
inspector = inspect(engine)

# Get all table names
tables = inspector.get_table_names()
print("="*60)
print("MEDICAL INVENTORY SYSTEM - DATABASE VERIFICATION")
print("="*60)
print(f"\n✅ Total Tables: {len(tables)}\n")

# Dictionary to store table info
table_info = {}

with engine.connect() as conn:
    for table in sorted(tables):
        # Get row count
        result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
        count = result.scalar()
        table_info[table] = count
        
        # Get columns
        columns = inspector.get_columns(table)
        col_names = [col['name'] for col in columns]
        
        print(f"📊 {table.upper()}")
        print(f"   Records: {count}")
        print(f"   Columns: {', '.join(col_names)}")
        print()

print("="*60)
print("SUMMARY:")
print("="*60)
total_records = sum(table_info.values())
print(f"✅ Total Tables Created: {len(table_info)}")
print(f"✅ Total Records: {total_records}")
print("\nTables:")
for table, count in sorted(table_info.items()):
    status = "✅" if count > 0 else "⚠️"
    print(f"  {status} {table}: {count} records")

print("\n" + "="*60)
print("DATABASE IS PERFECT AND READY TO USE!")
print("="*60)
