#!/usr/bin/env python
"""Seed test items for the medical inventory system"""

from database import SessionLocal, Item, Location
import random

db = SessionLocal()

print("="*60)
print("SEEDING TEST ITEMS AND LOCATIONS")
print("="*60)

# Create test locations if they don't exist
locations_data = [
    {"name": "Main Pharmacy", "location_type": "Pharmacy", "description": "Primary pharmacy location"},
    {"name": "Emergency Ward", "location_type": "Ward", "description": "Emergency department storage"},
    {"name": "Central Warehouse", "location_type": "Warehouse", "description": "Main storage facility"},
    {"name": "ICU Storage", "location_type": "Ward", "description": "Intensive care unit storage"}
]

for loc_data in locations_data:
    existing = db.query(Location).filter(Location.name == loc_data["name"]).first()
    if not existing:
        location = Location(**loc_data)
        db.add(location)
        print(f"✅ Created location: {loc_data['name']}")

# Create test items if they don't exist
items_data = [
    {
        "name": "Paracetamol 500mg",
        "sku": "PAR-500-001",
        "category": "Medication",
        "unit": "Tablet",
        "reorder_level": 100,
        "description": "Pain relief medication"
    },
    {
        "name": "Amoxicillin 250mg",
        "sku": "AMX-250-001",
        "category": "Medication",
        "unit": "Capsule",
        "reorder_level": 50,
        "description": "Antibiotic medication"
    },
    {
        "name": "Medical Gloves",
        "sku": "GLOVE-L-001",
        "category": "PPE",
        "unit": "Box",
        "reorder_level": 20,
        "description": "Disposable medical gloves"
    },
    {
        "name": "Face Masks",
        "sku": "MASK-S-001",
        "category": "PPE",
        "unit": "Box",
        "reorder_level": 30,
        "description": "Disposable face masks"
    },
    {
        "name": "IV Catheter",
        "sku": "IV-CAT-001",
        "category": "Consumables",
        "unit": "Piece",
        "reorder_level": 25,
        "description": "Intravenous catheter"
    },
    {
        "name": "Syringe 5ml",
        "sku": "SYR-5ML-001",
        "category": "Consumables",
        "unit": "Piece",
        "reorder_level": 100,
        "description": "5ml disposable syringe"
    },
    {
        "name": "Blood Pressure Monitor",
        "sku": "BPM-001",
        "category": "Equipment",
        "unit": "Unit",
        "reorder_level": 2,
        "description": "Digital blood pressure monitor"
    },
    {
        "name": "Thermometer",
        "sku": "TEMP-001",
        "category": "Equipment",
        "unit": "Unit",
        "reorder_level": 5,
        "description": "Digital thermometer"
    }
]

for item_data in items_data:
    existing = db.query(Item).filter(Item.sku == item_data["sku"]).first()
    if not existing:
        item = Item(**item_data)
        db.add(item)
        print(f"✅ Created item: {item_data['name']} ({item_data['sku']})")

db.commit()

# Display summary
print("\n" + "="*60)
print("SEEDING COMPLETE")
print("="*60)

locations_count = db.query(Location).count()
items_count = db.query(Item).count()

print(f"Total Locations: {locations_count}")
print(f"Total Items: {items_count}")

print("\nYou can now test adding and editing items in the system!")
print("Login with: admin / Admin@123456")

db.close()
