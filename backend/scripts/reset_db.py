#!/usr/bin/env python
"""Reset database - drops all tables"""

from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Drop all existing tables
    conn.execute(text('DROP TABLE IF EXISTS audit_logs CASCADE;'))
    conn.execute(text('DROP TABLE IF EXISTS stock_movements CASCADE;'))
    conn.execute(text('DROP TABLE IF EXISTS item_batches CASCADE;'))
    conn.execute(text('DROP TABLE IF EXISTS purchase_orders CASCADE;'))
    conn.execute(text('DROP TABLE IF EXISTS items CASCADE;'))
    conn.execute(text('DROP TABLE IF EXISTS suppliers CASCADE;'))
    conn.execute(text('DROP TABLE IF EXISTS locations CASCADE;'))
    conn.execute(text('DROP TABLE IF EXISTS users CASCADE;'))
    conn.execute(text('DROP TABLE IF EXISTS roles CASCADE;'))
    conn.commit()
    print('✅ All tables dropped')

print('✅ Database cleaned. Now ready for initialization.')
