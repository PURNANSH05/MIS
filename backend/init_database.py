#!/usr/bin/env python
"""
Database Initialization Script for Medical Inventory System
Creates all tables and initial master data
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, init_db, User, Role, Location, Item, Supplier, ItemBatch, StockMovement, PurchaseOrder, AuditLog, SystemAlert
from auth import hash_password

def init_roles(db):
    """Create default roles"""
    roles = [
        Role(name="Super Admin", description="System administrator with full access"),
        Role(name="Admin", description="User and access administrator (limited)"),
        Role(name="Inventory Manager", description="Manages stock and approves adjustments"),
        Role(name="Pharmacist", description="Receives and issues medicines"),
        Role(name="Storekeeper", description="Handles stock updates and transfers"),
        Role(name="Auditor", description="Read-only access for audit purposes"),
    ]
    
    for role in roles:
        if not db.query(Role).filter(Role.name == role.name).first():
            db.add(role)
    db.commit()
    print(f"✓ Created {len(roles)} roles")


def init_admin_user(db):
    """Create default admin user"""
    super_admin_role = db.query(Role).filter(Role.name == "Super Admin").first()
    if not super_admin_role:
        print("✗ Super Admin role not found. Run init_roles first.")
        return
    
    # Check if admin exists
    if db.query(User).filter(User.username == "admin").first():
        print("✓ Admin user already exists")
        return
    
    admin_user = User(
        username="admin",
        email="admin@hospital.local",
        password_hash=hash_password("Admin@123456"),
        role_id=super_admin_role.id,
        is_active=True,
        force_password_change=True  # Force password change on first login
    )
    db.add(admin_user)
    db.commit()
    print("✓ Created admin user (username: admin, password: Admin@123456)")
    print("  ⚠ Admin must change password on first login")


def init_locations(db):
    """Create default locations"""
    locations = [
        Location(name="Central Warehouse", location_type="Warehouse", description="Main storage facility"),
        Location(name="Pharmacy Counter", location_type="Pharmacy", description="Dispensing counter"),
        Location(name="General Ward", location_type="Ward", description="General patient ward"),
        Location(name="ICU Ward", location_type="Ward", description="Intensive care unit"),
        Location(name="Emergency Department", location_type="Department", description="Emergency department"),
    ]
    
    count = 0
    for location in locations:
        if not db.query(Location).filter(Location.name == location.name).first():
            db.add(location)
            count += 1
    db.commit()
    print(f"✓ Created {count} default locations")


def init_suppliers(db):
    """Create sample suppliers"""
    suppliers = [
        Supplier(
            name="Pharma Inc",
            contact_person="John Doe",
            phone="+1-555-0101",
            email="contact@pharma-inc.com",
            address="123 Medical Street",
            city="New York",
            country="USA"
        ),
        Supplier(
            name="Medical Supplies Ltd",
            contact_person="Jane Smith",
            phone="+1-555-0102",
            email="sales@medsupplies.com",
            address="456 Health Avenue",
            city="Boston",
            country="USA"
        ),
    ]
    
    count = 0
    for supplier in suppliers:
        if not db.query(Supplier).filter(Supplier.name == supplier.name).first():
            db.add(supplier)
            count += 1
    db.commit()
    print(f"✓ Created {count} suppliers")


def init_items(db):
    """Create sample medical items"""
    items = [
        Item(
            name="Paracetamol 500mg",
            sku="PARA-500",
            category="Analgesics",
            unit="Tablet",
            reorder_level=100,
            description="Pain reliever and fever reducer"
        ),
        Item(
            name="Amoxicillin 250mg",
            sku="AMOX-250",
            category="Antibiotics",
            unit="Capsule",
            reorder_level=50,
            description="Beta-lactam antibiotic"
        ),
        Item(
            name="Insulin Injection",
            sku="INS-100",
            category="Endocrine",
            unit="Vial",
            reorder_level=20,
            description="Insulin for diabetes management"
        ),
        Item(
            name="Medical Gauze 4x4",
            sku="GAU-44",
            category="Surgical Supplies",
            unit="Box",
            reorder_level=30,
            description="Sterile surgical gauze"
        ),
        Item(
            name="Disposable Gloves",
            sku="GLV-100",
            category="PPE",
            unit="Box",
            reorder_level=50,
            description="Latex-free disposable examination gloves"
        ),
    ]
    
    count = 0
    for item in items:
        if not db.query(Item).filter(Item.sku == item.sku).first():
            db.add(item)
            count += 1
    db.commit()
    print(f"✓ Created {count} sample medical items")


def main():
    """Initialize database"""
    print("\n" + "="*60)
    print("Medical Inventory System - Database Initialization")
    print("="*60 + "\n")
    
    try:
        # Create all tables
        print("Creating database tables...")
        init_db()
        print("✓ Database tables created successfully\n")
        
        # Get database session
        db = SessionLocal()
        
        # Initialize master data
        print("Initializing master data...")
        init_roles(db)
        init_admin_user(db)
        init_locations(db)
        init_suppliers(db)
        init_items(db)
        
        db.close()
        
        print("\n" + "="*60)
        print("✓ Database initialization completed successfully!")
        print("="*60)
        print("\nNext steps:")
        print("1. Change admin password on first login")
        print("2. Add more users with appropriate roles")
        print("3. Configure system settings")
        print("4. Start entering inventory data\n")
        
        return 0
        
    except Exception as e:
        print(f"\n✗ Error during initialization: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
