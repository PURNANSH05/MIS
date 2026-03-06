#!/usr/bin/env python3
from sqlalchemy import inspect
from database import engine

inspector = inspect(engine)
tables = inspector.get_table_names()

print("Database Schema Inspection:")
print("=" * 60)

for table in tables:
    print(f"\n{table}:")
    columns = inspector.get_columns(table)
    for col in columns:
        print(f"  - {col['name']}: {col['type']}")
