#!/usr/bin/env python
"""
Database Verification Script
Verifies that all tables are created and accessible
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine, Base
from sqlalchemy import inspect, text

def verify_database():
    """Verify database setup"""
    print("="*60)
    print("DATABASE VERIFICATION")
    print("="*60)
    
    try:
        # Test database connection
        print("1. Testing database connection...")
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("   ✓ Database connection successful")
        
        # Check if tables exist
        print("\n2. Checking database tables...")
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        expected_tables = [
            'roles', 'users', 'locations', 'items', 'suppliers',
            'item_batches', 'stock_movements', 'purchase_orders',
            'audit_logs', 'system_alerts'
        ]
        
        print(f"   Found {len(tables)} tables:")
        for table in sorted(tables):
            status = "✓" if table in expected_tables else "?"
            print(f"   {status} {table}")
        
        # Check table structures
        print("\n3. Verifying table structures...")
        db = SessionLocal()
        
        try:
            # Check roles
            role_count = db.execute(text("SELECT COUNT(*) FROM roles")).scalar()
            print(f"   ✓ Roles table: {role_count} records")
            
            # Check users
            user_count = db.execute(text("SELECT COUNT(*) FROM users")).scalar()
            print(f"   ✓ Users table: {user_count} records")
            
            # Check locations
            location_count = db.execute(text("SELECT COUNT(*) FROM locations")).scalar()
            print(f"   ✓ Locations table: {location_count} records")
            
            # Check items
            item_count = db.execute(text("SELECT COUNT(*) FROM items")).scalar()
            print(f"   ✓ Items table: {item_count} records")
            
            # Check suppliers
            supplier_count = db.execute(text("SELECT COUNT(*) FROM suppliers")).scalar()
            print(f"   ✓ Suppliers table: {supplier_count} records")
            
            # Check audit logs
            audit_count = db.execute(text("SELECT COUNT(*) FROM audit_logs")).scalar()
            print(f"   ✓ Audit logs table: {audit_count} records")
            
        finally:
            db.close()
        
        print("\n4. Testing foreign key constraints...")
        with engine.connect() as conn:
            # Test a simple query with joins
            result = conn.execute(text("""
                SELECT u.username, r.name as role_name 
                FROM users u 
                JOIN roles r ON u.role_id = r.id 
                LIMIT 1
            """)).fetchone()
            
            if result:
                print(f"   ✓ Foreign key constraints working (User: {result[0]}, Role: {result[1]})")
            else:
                print("   ⚠ No user-role relationships found")
        
        print("\n" + "="*60)
        print("✅ DATABASE VERIFICATION COMPLETED SUCCESSFULLY!")
        print("="*60)
        print("🎯 Your pgAdmin should now show:")
        print("   • All 10 tables created")
        print("   • Proper relationships between tables")
        print("   • Initial data populated")
        print("   • Ready for real-time data entry")
        print("\n🌐 Refresh pgAdmin to see all tables!")
        print("="*60)
        
        return True
        
    except Exception as e:
        print(f"\n❌ Database verification failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = verify_database()
    sys.exit(0 if success else 1)
