"""
Seed initial data for Medical Inventory System
Run this after initializing the database
"""

from database import SessionLocal, User, Role, Location, Item, Supplier
from auth import hash_password

def seed_database():
    db = SessionLocal()
    
    try:
        # Clear existing data
        db.query(User).delete()
        db.query(Role).delete()
        db.query(Location).delete()
        db.query(Item).delete()
        db.query(Supplier).delete()
        db.commit()
        
        # Create Roles
        roles = [
            Role(name="Admin", description="System Administrator with full access"),
            Role(name="Inventory Manager", description="Manages inventory and approvals"),
            Role(name="Pharmacist", description="Issues medicines and receives stock"),
            Role(name="Storekeeper", description="Updates stock and handles batches"),
            Role(name="Auditor", description="Read-only access to logs and reports"),
        ]
        db.add_all(roles)
        db.commit()
        
        # Create Admin User
        admin_role = db.query(Role).filter(Role.name == "Admin").first()
        admin_user = User(
            username="admin",
            email="admin@medicalsystem.com",
            hashed_password=hash_password("admin123"),
            role_id=admin_role.id,
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        
        # Create Locations
        locations = [
            Location(
                name="Central Warehouse",
                location_type="WAREHOUSE",
                description="Main warehouse for medical supplies",
                is_active=True
            ),
            Location(
                name="Pharmacy Counter",
                location_type="PHARMACY",
                description="Pharmacy dispensing counter",
                is_active=True
            ),
            Location(
                name="ICU Ward",
                location_type="WARD",
                description="Intensive Care Unit",
                is_active=True
            ),
            Location(
                name="General Ward",
                location_type="WARD",
                description="General ward medications",
                is_active=True
            ),
            Location(
                name="Emergency Department",
                location_type="DEPARTMENT",
                description="Emergency and trauma supplies",
                is_active=True
            ),
        ]
        db.add_all(locations)
        db.commit()
        
        # Create Medical Items
        items = [
            Item(
                name="Paracetamol 500mg",
                sku="PARA-500-TAB",
                category="Pain Relief",
                unit="Tablet",
                reorder_level=100,
                description="Paracetamol pain relief tablets",
                is_active=True
            ),
            Item(
                name="Amoxicillin 500mg",
                sku="AMOX-500-CAP",
                category="Antibiotics",
                unit="Capsule",
                reorder_level=50,
                description="Amoxicillin antibiotic capsules",
                is_active=True
            ),
            Item(
                name="Insulin Injection",
                sku="INS-100-INJ",
                category="Diabetes",
                unit="Vial",
                reorder_level=30,
                description="Insulin injection for diabetes management",
                is_active=True
            ),
            Item(
                name="Gauze Bandage",
                sku="GAUZ-5-RLL",
                category="Wound Care",
                unit="Roll",
                reorder_level=200,
                description="Sterile gauze bandage roll",
                is_active=True
            ),
            Item(
                name="Surgical Gloves",
                sku="GLOVE-M-BOX",
                category="PPE",
                unit="Box",
                reorder_level=100,
                description="Medical grade surgical gloves",
                is_active=True
            ),
            Item(
                name="Syringes 10ml",
                sku="SYR-10-PKT",
                category="Injection",
                unit="Packet",
                reorder_level=150,
                description="Sterile syringes 10ml",
                is_active=True
            ),
            Item(
                name="Cotton Balls",
                sku="COTT-500-PKT",
                category="Wound Care",
                unit="Packet",
                reorder_level=80,
                description="Sterilized cotton balls",
                is_active=True
            ),
            Item(
                name="Blood Pressure Monitor",
                sku="BP-MONITOR-DIG",
                category="Equipment",
                unit="Unit",
                reorder_level=10,
                description="Digital blood pressure monitoring device",
                is_active=True
            ),
        ]
        db.add_all(items)
        db.commit()
        
        # Create Suppliers
        suppliers = [
            Supplier(
                name="MediCare Pharmaceuticals",
                contact_person="Mr. John Smith",
                phone="555-0101",
                email="contact@medicare.com",
                address="123 Health Street, Medical City",
                is_active=True
            ),
            Supplier(
                name="Global Health Supplies",
                contact_person="Ms. Sarah Johnson",
                phone="555-0102",
                email="sales@globalhealthsupply.com",
                address="456 Wellness Avenue, Pharma Town",
                is_active=True
            ),
            Supplier(
                name="Prime Medical Equipment",
                contact_person="Dr. Michael Brown",
                phone="555-0103",
                email="orders@primemed.com",
                address="789 Care Lane, Equipment Plaza",
                is_active=True
            ),
        ]
        db.add_all(suppliers)
        db.commit()
        
        print("✓ Database seeded successfully!")
        print("\nDefault Admin User:")
        print("  Username: admin")
        print("  Password: admin123")
        print("\nNOTE: Change admin password after first login!")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
