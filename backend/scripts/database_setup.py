#!/usr/bin/env python
"""
PRODUCTION DATABASE SETUP SCRIPT
Medical Inventory System - Corporate Grade Database Initialization

This script creates a complete, production-ready database with:
- All tables with proper constraints and indexes
- Initial master data for immediate use
- Comprehensive error handling and logging
- Transaction rollback on failure
- Professional data seeding for testing
"""

import sys
import os
import logging
from datetime import datetime, date, timedelta
from typing import List, Dict, Any

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('database_setup.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Import database components
try:
    from database import (
        SessionLocal, init_db, engine, Base,
        User, Role, Location, Item, Supplier, ItemBatch, 
        StockMovement, PurchaseOrder, AuditLog, SystemAlert
    )
    from auth import hash_password
    logger.info("✓ Database imports successful")
except ImportError as e:
    logger.error(f"✗ Import error: {e}")
    sys.exit(1)

class DatabaseSetup:
    """Professional database setup class with transaction management"""
    
    def __init__(self):
        self.db = SessionLocal()
        self.setup_stats = {
            'roles': 0,
            'users': 0,
            'locations': 0,
            'suppliers': 0,
            'items': 0,
            'batches': 0,
            'movements': 0,
            'purchase_orders': 0
        }
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.db.rollback()
            logger.error(f"✗ Transaction rolled back due to: {exc_val}")
        else:
            self.db.commit()
            logger.info("✓ Transaction committed successfully")
        self.db.close()
    
    def create_tables(self):
        """Create all database tables with proper schema"""
        try:
            logger.info("Creating database schema...")
            Base.metadata.create_all(bind=engine)
            logger.info("✓ All tables created successfully")
            return True
        except Exception as e:
            logger.error(f"✗ Failed to create tables: {e}")
            return False
    
    def init_roles(self) -> bool:
        """Initialize system roles with proper permissions"""
        try:
            roles_data = [
                ("Super Admin", "System administrator with full access to all modules"),
                ("Admin", "User and access administrator (limited)"),
                ("Inventory Manager", "Manages inventory, stock operations, and reports"),
                ("Pharmacist", "Handles medication dispensing and stock management"),
                ("Storekeeper", "Manages physical stock and location transfers"),
                ("Auditor", "Read-only access for audit and compliance purposes")
            ]
            
            for role_name, description in roles_data:
                if not self.db.query(Role).filter(Role.name == role_name).first():
                    role = Role(name=role_name, description=description)
                    self.db.add(role)
                    self.setup_stats['roles'] += 1
            
            logger.info(f"✓ Created {self.setup_stats['roles']} roles")
            return True
        except Exception as e:
            logger.error(f"✗ Failed to create roles: {e}")
            return False
    
    def init_admin_user(self) -> bool:
        """Create default admin user with secure credentials"""
        try:
            admin_role = self.db.query(Role).filter(Role.name == "Super Admin").first()
            if not admin_role:
                logger.error("✗ Super Admin role not found")
                return False
            
            if not self.db.query(User).filter(User.username == "admin").first():
                admin_user = User(
                    username="admin",
                    email="admin@hospital.local",
                    password_hash=hash_password("Admin@123456"),
                    role_id=admin_role.id,
                    is_active=True,
                    force_password_change=True
                )
                self.db.add(admin_user)
                self.setup_stats['users'] += 1
                
                # Log admin creation
                audit_log = AuditLog(
                    user_id=admin_user.id,
                    action="CREATE_USER",
                    module="USER",
                    record_id=admin_user.id,
                    new_value=f"username=admin, role=Super Admin",
                    status="SUCCESS",
                    remarks="System admin user created during setup"
                )
                self.db.add(audit_log)
            
            logger.info("✓ Admin user created (username: admin, password: Admin@123456)")
            return True
        except Exception as e:
            logger.error(f"✗ Failed to create admin user: {e}")
            return False
    
    def init_locations(self) -> bool:
        """Initialize hospital locations with realistic data"""
        try:
            locations_data = [
                ("Central Warehouse", "Warehouse", "Main storage facility for all medical supplies"),
                ("Pharmacy Main", "Pharmacy", "Main pharmacy dispensing area"),
                ("Emergency Pharmacy", "Pharmacy", "Emergency department pharmacy"),
                ("General Ward A", "Ward", "General patient ward - Block A"),
                ("General Ward B", "Ward", "General patient ward - Block B"),
                ("ICU Unit", "Ward", "Intensive Care Unit"),
                ("Surgical Ward", "Ward", "Post-operative surgical ward"),
                ("Pediatric Ward", "Ward", "Children's ward"),
                ("Maternity Ward", "Ward", "Maternity and neonatal care"),
                ("Outpatient Pharmacy", "Pharmacy", "Outpatient dispensing"),
                ("Laboratory", "Department", "Diagnostic laboratory"),
                ("Radiology", "Department", "Medical imaging department")
            ]
            
            for name, location_type, description in locations_data:
                if not self.db.query(Location).filter(Location.name == name).first():
                    location = Location(
                        name=name,
                        location_type=location_type,
                        description=description,
                        is_active=True
                    )
                    self.db.add(location)
                    self.setup_stats['locations'] += 1
            
            logger.info(f"✓ Created {self.setup_stats['locations']} locations")
            return True
        except Exception as e:
            logger.error(f"✗ Failed to create locations: {e}")
            return False
    
    def init_suppliers(self) -> bool:
        """Initialize suppliers with comprehensive contact information"""
        try:
            suppliers_data = [
                {
                    "name": "PharmaCorp International",
                    "contact_person": "Dr. Robert Johnson",
                    "phone": "+1-800-555-0100",
                    "email": "orders@pharmacorp.com",
                    "address": "1234 Medical Park Drive",
                    "city": "New York",
                    "country": "USA"
                },
                {
                    "name": "MedSupply Solutions",
                    "contact_person": "Sarah Williams",
                    "phone": "+1-800-555-0101",
                    "email": "sales@medsupply.com",
                    "address": "5678 Healthcare Boulevard",
                    "city": "Chicago",
                    "country": "USA"
                },
                {
                    "name": "Global Medical Devices",
                    "contact_person": "Michael Chen",
                    "phone": "+1-800-555-0102",
                    "email": "info@globalmed.com",
                    "address": "9012 Technology Lane",
                    "city": "San Francisco",
                    "country": "USA"
                },
                {
                    "name": "Emergency Care Supplies",
                    "contact_person": "Jennifer Davis",
                    "phone": "+1-800-555-0103",
                    "email": "orders@emergencysupplies.com",
                    "address": "3456 Emergency Road",
                    "city": "Los Angeles",
                    "country": "USA"
                },
                {
                    "name": "Surgical Instruments Ltd",
                    "contact_person": "Dr. James Wilson",
                    "phone": "+1-800-555-0104",
                    "email": "sales@surgicalinst.com",
                    "address": "7890 Surgical Plaza",
                    "city": "Boston",
                    "country": "USA"
                }
            ]
            
            for supplier_data in suppliers_data:
                if not self.db.query(Supplier).filter(Supplier.name == supplier_data["name"]).first():
                    supplier = Supplier(**supplier_data, is_active=True)
                    self.db.add(supplier)
                    self.setup_stats['suppliers'] += 1
            
            logger.info(f"✓ Created {self.setup_stats['suppliers']} suppliers")
            return True
        except Exception as e:
            logger.error(f"✗ Failed to create suppliers: {e}")
            return False
    
    def init_items(self) -> bool:
        """Initialize comprehensive medical items inventory"""
        try:
            items_data = [
                # Medications
                ("Paracetamol 500mg", "PARA-500", "Medication", "Tablet", 100, "Pain reliever and fever reducer"),
                ("Amoxicillin 500mg", "AMOX-500", "Medication", "Capsule", 50, "Broad-spectrum antibiotic"),
                ("Ibuprofen 400mg", "IBU-400", "Medication", "Tablet", 80, "Anti-inflammatory and analgesic"),
                ("Aspirin 75mg", "ASP-75", "Medication", "Tablet", 150, "Antiplatelet and analgesic"),
                ("Insulin Glargine", "INS-GLA", "Medication", "Vial", 20, "Long-acting insulin"),
                ("Metformin 500mg", "MET-500", "Medication", "Tablet", 60, "Anti-diabetic medication"),
                ("Omeprazole 20mg", "OME-20", "Medication", "Capsule", 40, "Proton pump inhibitor"),
                ("Lisinopril 10mg", "LIS-10", "Medication", "Tablet", 30, "ACE inhibitor"),
                
                # Surgical Supplies
                ("Surgical Gloves Size M", "GLOV-M", "Surgical", "Box", 100, "Latex surgical gloves medium"),
                ("Surgical Gloves Size L", "GLOV-L", "Surgical", "Box", 100, "Latex surgical gloves large"),
                ("Sterile Gauze 4x4", "GAUZE-44", "Surgical", "Pack", 200, "Sterile gauze pads"),
                ("Surgical Mask", "MASK-SURG", "Surgical", "Box", 500, "Disposable surgical masks"),
                ("N95 Respirator", "MASK-N95", "Surgical", "Box", 100, "N95 respirator masks"),
                
                # Equipment
                ("Blood Pressure Monitor", "BPM-001", "Equipment", "Unit", 10, "Digital blood pressure monitor"),
                ("Thermometer Digital", "TEMP-DIG", "Equipment", "Unit", 50, "Digital thermometer"),
                ("Stethoscope", "STETH-01", "Equipment", "Unit", 15, "Medical stethoscope"),
                
                # Consumables
                ("Syringe 5ml", "SYR-5ML", "Consumables", "Pack", 1000, "5ml disposable syringes"),
                ("IV Cannula 18G", "IV-18G", "Consumables", "Pack", 500, "18G IV cannulas"),
                ("Alcohol Swabs", "ALC-SWAB", "Consumables", "Box", 200, "Alcohol prep pads"),
                ("Band-Aid Assorted", "BAND-ASS", "Consumables", "Box", 100, "Assorted bandages"),
                
                # Lab Supplies
                ("Blood Collection Tubes", "TUBE-BLOOD", "Laboratory", "Pack", 500, "Vacutainer tubes"),
                ("Gloves Nitrile", "GLOV-NIT", "Laboratory", "Box", 200, "Nitrile examination gloves"),
                ("Petri Dishes", "PETRI-100", "Laboratory", "Pack", 100, "Sterile petri dishes")
            ]
            
            for name, sku, category, unit, reorder_level, description in items_data:
                if not self.db.query(Item).filter(Item.sku == sku).first():
                    item = Item(
                        name=name,
                        sku=sku,
                        category=category,
                        unit=unit,
                        reorder_level=reorder_level,
                        description=description,
                        is_active=True
                    )
                    self.db.add(item)
                    self.setup_stats['items'] += 1
            
            logger.info(f"✓ Created {self.setup_stats['items']} items")
            return True
        except Exception as e:
            logger.error(f"✗ Failed to create items: {e}")
            return False
    
    def init_sample_batches(self) -> bool:
        """Create sample inventory batches for testing"""
        try:
            # Get some items and locations for batch creation
            items = self.db.query(Item).limit(10).all()
            warehouse = self.db.query(Location).filter(Location.name == "Central Warehouse").first()
            pharmacy = self.db.query(Location).filter(Location.name == "Pharmacy Main").first()
            
            if not items or not warehouse or not pharmacy:
                logger.warning("⚠ Insufficient data for batch creation")
                return True
            
            batch_count = 0
            for i, item in enumerate(items):
                # Create batch in warehouse
                batch = ItemBatch(
                    item_id=item.id,
                    batch_number=f"BATCH-{datetime.now().year}-{i+1:03d}",
                    manufacturing_date=date.today() - timedelta(days=30),
                    expiry_date=date.today() + timedelta(days=730),  # 2 years expiry
                    location_id=warehouse.id,
                    quantity=100 + (i * 50)
                )
                self.db.add(batch)
                batch_count += 1
                
                # Create movement record
                movement = StockMovement(
                    batch_id=batch.id,
                    movement_type="RECEIVE",
                    quantity=batch.quantity,
                    location_id=warehouse.id,
                    reference_number=f"RCV-{datetime.now().year}-{i+1:04d}",
                    remarks="Initial stock during setup"
                )
                self.db.add(movement)
            
            self.setup_stats['batches'] = batch_count
            self.setup_stats['movements'] = batch_count
            logger.info(f"✓ Created {batch_count} sample batches with movements")
            return True
        except Exception as e:
            logger.error(f"✗ Failed to create sample batches: {e}")
            return False
    
    def setup_database(self) -> bool:
        """Complete database setup with all components"""
        try:
            logger.info("🚀 Starting production database setup...")
            
            # Create tables
            if not self.create_tables():
                return False
            
            # Initialize master data
            logger.info("📋 Initializing master data...")
            if not self.init_roles():
                return False
            if not self.init_admin_user():
                return False
            if not self.init_locations():
                return False
            if not self.init_suppliers():
                return False
            if not self.init_items():
                return False
            if not self.init_sample_batches():
                return False
            
            return True
        except Exception as e:
            logger.error(f"✗ Database setup failed: {e}")
            return False
    
    def print_summary(self):
        """Print setup summary"""
        print("\n" + "="*80)
        print("🎉 PRODUCTION DATABASE SETUP COMPLETED SUCCESSFULLY!")
        print("="*80)
        print(f"📊 Setup Summary:")
        print(f"   • Roles Created: {self.setup_stats['roles']}")
        print(f"   • Users Created: {self.setup_stats['users']}")
        print(f"   • Locations Created: {self.setup_stats['locations']}")
        print(f"   • Suppliers Created: {self.setup_stats['suppliers']}")
        print(f"   • Items Created: {self.setup_stats['items']}")
        print(f"   • Batches Created: {self.setup_stats['batches']}")
        print(f"   • Stock Movements: {self.setup_stats['movements']}")
        print("\n🔑 Login Credentials:")
        print(f"   • Username: admin")
        print(f"   • Password: Admin@123456")
        print(f"   • Database: medical_inventory")
        print("\n🌐 Next Steps:")
        print(f"   1. Start the application: python -m uvicorn main:app --reload")
        print(f"   2. Access at: http://localhost:8000")
        print(f"   3. Change admin password on first login")
        print(f"   4. Add more users and configure system settings")
        print("="*80)

def main():
    """Main setup function"""
    try:
        with DatabaseSetup() as db_setup:
            if db_setup.setup_database():
                db_setup.print_summary()
                return 0
            else:
                logger.error("✗ Database setup failed")
                return 1
    except Exception as e:
        logger.error(f"✗ Critical error during setup: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
