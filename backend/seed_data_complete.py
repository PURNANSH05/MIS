#!/usr/bin/env python
"""
Complete Data Seeding Script for Medical Inventory System
Adds realistic sample data for testing all features
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, User, Role, Location, Item, ItemBatch, Supplier, PurchaseOrder, StockMovement, SystemAlert
from auth import hash_password
from datetime import datetime, timedelta
import random

def seed_complete_data():
    """Add complete sample data to the system"""
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("SEEDING COMPLETE SAMPLE DATA FOR MEDICAL INVENTORY SYSTEM")
        print("=" * 60)
        
        admin_user = db.query(User).filter(User.username == "admin").first()
        admin_user_id = admin_user.id if admin_user else None
        if not admin_user_id:
            first_user = db.query(User).order_by(User.id.asc()).first()
            admin_user_id = first_user.id if first_user else 1

        # ============ CREATE LOCATIONS ============
        print("\n📍 Creating Locations...")
        locations = [
            Location(name="Central Warehouse", location_type="Warehouse", description="Main storage facility"),
            Location(name="Pharmacy Counter", location_type="Pharmacy", description="Dispensing counter"),
            Location(name="General Ward", location_type="Ward", description="General patient ward"),
            Location(name="ICU Ward", location_type="Ward", description="Intensive care unit"),
            Location(name="Emergency Department", location_type="Department", description="Emergency department"),
            Location(name="Pediatric Ward", location_type="Ward", description="Children's ward"),
            Location(name="Surgery Block", location_type="Department", description="Surgical operations area"),
        ]
        
        existing_locations = {loc.name for loc in db.query(Location).all()}
        created_count = 0
        for loc in locations:
            if loc.name not in existing_locations:
                db.add(loc)
                created_count += 1
        db.commit()
        print(f"✓ Created {created_count} locations")
        
        # Reload locations
        locations = db.query(Location).all()
        
        # ============ CREATE SUPPLIERS ============
        print("\n🏭 Creating Suppliers...")
        suppliers = [
            Supplier(
                name="Pharma Plus Inc",
                contact_person="John Smith",
                email="contact@pharmaplus.com",
                phone="+1-800-PHARMA1",
                address="123 Medical Ave, Healthcare City, HC 12345",
                city="Healthcare City",
                country="USA"
            ),
            Supplier(
                name="Global Medical Supplies",
                contact_person="Maria Garcia",
                email="sales@globalmeds.com",
                phone="+1-800-MEDS-101",
                address="456 Hospital Blvd, Medical Plaza, MP 67890",
                city="Medical Plaza",
                country="USA"
            ),
            Supplier(
                name="Wellness Pharma Ltd",
                contact_person="Dr. Raj Patel",
                email="orders@wellnesspharma.com",
                phone="+44-20-7946-0958",
                address="789 Clinic Road, London, UK",
                city="London",
                country="UK"
            ),
            Supplier(
                name="Asian Pharmaceuticals",
                contact_person="Chen Wei",
                email="export@asianpharma.com",
                phone="+86-10-1234-5678",
                address="321 Medicine Street, Beijing, China",
                city="Beijing",
                country="China"
            ),
        ]
        
        existing_suppliers = {sup.name for sup in db.query(Supplier).all()}
        created_count = 0
        for sup in suppliers:
            if sup.name not in existing_suppliers:
                db.add(sup)
                created_count += 1
        db.commit()
        print(f"✓ Created {created_count} suppliers")
        
        # Reload suppliers
        suppliers = db.query(Supplier).all()
        
        # ============ CREATE ITEMS ============
        print("\n💊 Creating Medical Items...")
        items_data = [
            {
                "name": "Paracetamol 500mg Tablets",
                "sku": "PARA-500-TAB",
                "category": "Analgesics",
                "unit": "Tablet",
                "description": "Paracetamol pain relief and fever reducer, 500mg strength",
            },
            {
                "name": "Aspirin 100mg Tablets",
                "sku": "ASPI-100-TAB",
                "category": "Antiplatelet",
                "unit": "Tablet",
                "description": "Low-dose aspirin for cardiovascular protection",
            },
            {
                "name": "Amoxicillin 500mg Capsules",
                "sku": "AMOX-500-CAP",
                "category": "Antibiotics",
                "unit": "Capsule",
                "description": "Broad-spectrum antibiotic for bacterial infections",
            },
            {
                "name": "Vitamin D 1000IU Tablets",
                "sku": "VITD-1000-TAB",
                "category": "Vitamins",
                "unit": "Tablet",
                "description": "Vitamin D supplement for bone health",
            },
            {
                "name": "Insulin Pen 100IU/ml",
                "sku": "INSU-100-PEN",
                "category": "Endocrine",
                "unit": "Pen",
                "description": "Insulin injection pen for diabetes management",
            },
            {
                "name": "Antibacterial Ointment 30g",
                "sku": "ANTI-OINT-30",
                "category": "Topical",
                "unit": "Tube",
                "description": "Antiseptic ointment for wound care",
            },
            {
                "name": "Surgical Mask N95",
                "sku": "MASK-N95-BOX",
                "category": "PPE",
                "unit": "Box",
                "description": "N95 protective mask (box of 50)",
            },
            {
                "name": "Gauze Pads Sterile 2x2",
                "sku": "GAUZ-2x2-PKG",
                "category": "Medical Supplies",
                "unit": "Package",
                "description": "Sterile gauze pads 2x2 inches (package of 100)",
            },
            {
                "name": "Ibuprofen 200mg Tablets",
                "sku": "IBUP-200-TAB",
                "category": "Analgesics",
                "unit": "Tablet",
                "description": "Anti-inflammatory pain reliever, 200mg",
            },
            {
                "name": "Metformin 500mg Tablets",
                "sku": "METF-500-TAB",
                "category": "Endocrine",
                "unit": "Tablet",
                "description": "First-line medication for type 2 diabetes",
            },
            {
                "name": "Cough Syrup 100ml",
                "sku": "COUGH-100-BOT",
                "category": "Respiratory",
                "unit": "Bottle",
                "description": "Cough suppressant syrup with honey",
            },
            {
                "name": "Antihistamine Tablets",
                "sku": "ANTI-HIST-TAB",
                "category": "Allergy",
                "unit": "Tablet",
                "description": "Fast-acting allergy relief tablets",
            },
        ]
        
        existing_items = {item.sku for item in db.query(Item).all()}
        items = []
        created_count = 0
        for item_data in items_data:
            if item_data["sku"] not in existing_items:
                item = Item(**item_data)
                db.add(item)
                items.append(item)
                created_count += 1
        db.commit()
        print(f"✓ Created {created_count} medical items")
        
        # Reload items
        items = db.query(Item).all()
        
        # ============ CREATE ITEM BATCHES ============
        print("\n📦 Creating Item Batches...")
        existing_batches = {
            (b.item_id, b.batch_number, b.location_id)
            for b in db.query(ItemBatch.item_id, ItemBatch.batch_number, ItemBatch.location_id).all()
        }
        batches_created = 0
        for item in items:
            # Create 2-4 batches per item
            num_batches = random.randint(2, 4)
            for i in range(num_batches):
                batch_num = f"BATCH{item.id}{i+1:02d}"
                manufacturing_date = (datetime.utcnow() - timedelta(days=random.randint(30, 180))).date()
                expiry_date = (manufacturing_date + timedelta(days=random.randint(365, 1095)))
                
                location_id = random.choice(locations).id
                key = (item.id, batch_num, location_id)
                if key in existing_batches:
                    continue

                batch = ItemBatch(
                    item_id=item.id,
                    batch_number=batch_num,
                    quantity=random.randint(100, 1000),
                    manufacturing_date=manufacturing_date,
                    expiry_date=expiry_date,
                    location_id=location_id,
                )
                db.add(batch)
                existing_batches.add(key)
                batches_created += 1
        
        db.commit()
        print(f"✓ Created {batches_created} item batches across all items")
        
        # ============ CREATE STOCK MOVEMENTS ============
        print("\n📊 Creating Stock Movements...")
        batches = db.query(ItemBatch).all()
        existing_refs = {r[0] for r in db.query(StockMovement.reference_number).filter(StockMovement.reference_number.isnot(None)).all()}
        movements_created = 0

        sample_batches = batches[:]
        random.shuffle(sample_batches)
        sample_batches = sample_batches[:min(40, len(sample_batches))]

        movement_types = ["RECEIVE", "ISSUE", "TRANSFER", "DISPOSE", "ADJUST"]
        for batch in sample_batches:
            mtype = random.choice(movement_types)
            if mtype == "RECEIVE":
                qty = random.randint(50, 300)
                remarks = "Stock received from supplier"
                prefix = "REC"
            elif mtype == "ISSUE":
                qty = -random.randint(5, 60)
                remarks = "Stock issued for patient use"
                prefix = "ISS"
            elif mtype == "TRANSFER":
                qty = -random.randint(5, 40)
                remarks = "Stock transferred to another location"
                prefix = "TRN"
            elif mtype == "DISPOSE":
                qty = -random.randint(1, 25)
                remarks = "Disposed damaged/expired stock"
                prefix = "DSP"
            else:
                qty = random.randint(-20, 20)
                if qty == 0:
                    qty = 5
                remarks = "Manual stock adjustment"
                prefix = "ADJ"

            # Generate unique reference number
            for _ in range(10):
                ref = f"{prefix}{batch.id:05d}-{random.randint(1000, 9999)}"
                if ref not in existing_refs:
                    break
            else:
                continue

            movement = StockMovement(
                batch_id=batch.id,
                movement_type=mtype,
                quantity=qty,
                location_id=batch.location_id,
                reference_number=ref,
                remarks=remarks,
                created_by_id=admin_user_id,
            )
            db.add(movement)
            existing_refs.add(ref)
            movements_created += 1
        
        db.commit()
        print(f"✓ Created {movements_created} stock movements")

        print("\n🧾 Creating Purchase Orders...")
        existing_po_numbers = {p[0] for p in db.query(PurchaseOrder.po_number).filter(PurchaseOrder.po_number.isnot(None)).all()}
        pos_created = 0
        for idx in range(1, 11):
            po_number = f"PO-{datetime.utcnow().strftime('%Y%m%d')}-{idx:03d}"
            if po_number in existing_po_numbers:
                continue
            if not suppliers or not items:
                break

            supplier = random.choice(suppliers)
            item = random.choice(items)
            qty = random.randint(50, 500)
            unit_price = float(random.randint(5, 200))
            status = random.choice(["PENDING", "ORDERED", "RECEIVED", "CANCELLED"])
            expected_delivery = (datetime.utcnow() + timedelta(days=random.randint(3, 14))).date()
            actual_delivery = expected_delivery if status == "RECEIVED" else None

            po = PurchaseOrder(
                po_number=po_number,
                supplier_id=supplier.id,
                item_id=item.id,
                quantity=qty,
                unit_price=unit_price,
                status=status,
                expected_delivery=expected_delivery,
                actual_delivery=actual_delivery,
            )
            db.add(po)
            existing_po_numbers.add(po_number)
            pos_created += 1
        db.commit()
        print(f"✓ Created {pos_created} purchase orders")

        print("\n🚨 Creating System Alerts...")
        existing_alert_msgs = {m[0] for m in db.query(SystemAlert.message).filter(SystemAlert.message.isnot(None)).all()}
        alerts_created = 0
        for idx, batch in enumerate(batches[:min(10, len(batches))]):
            if batch.quantity <= 0:
                continue
            if idx % 2 == 0:
                msg = f"Low stock: batch {batch.batch_number} qty={batch.quantity}"
                if msg in existing_alert_msgs:
                    continue
                alert = SystemAlert(
                    alert_type="LOW_STOCK",
                    severity=random.choice(["LOW", "MEDIUM", "HIGH"]),
                    message=msg,
                    batch_id=batch.id,
                    item_id=batch.item_id,
                    location_id=batch.location_id,
                    is_acknowledged=False
                )
            else:
                msg = f"Near expiry: batch {batch.batch_number} exp={batch.expiry_date}"
                if msg in existing_alert_msgs:
                    continue
                alert = SystemAlert(
                    alert_type="NEAR_EXPIRY",
                    severity=random.choice(["MEDIUM", "HIGH", "CRITICAL"]),
                    message=msg,
                    batch_id=batch.id,
                    item_id=batch.item_id,
                    location_id=batch.location_id,
                    is_acknowledged=False
                )
            db.add(alert)
            existing_alert_msgs.add(msg)
            alerts_created += 1
        db.commit()
        print(f"✓ Created {alerts_created} system alerts")
        
        # ============ SUMMARY ============
        print("\n" + "=" * 60)
        print("✅ SAMPLE DATA SEEDING COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        
        print("\n📊 Summary of Created Data:")
        print(f"  • {len(locations)} Locations")
        print(f"  • {len(suppliers)} Suppliers")
        print(f"  • {len(items)} Medical Items")
        print(f"  • {batches_created} Item Batches")
        print(f"  • {movements_created} Stock Movements")
        print(f"  • {pos_created} Purchase Orders")
        print(f"  • {alerts_created} System Alerts")
        
        print("\n🎯 You can now:")
        print("  ✓ Login with admin credentials")
        print("  ✓ View Dashboard with real data")
        print("  ✓ Browse Inventory with 12 items")
        print("  ✓ View Stock Operations")
        print("  ✓ Generate Reports")
        print("  ✓ Check Audit Logs")
        
        print("\n🔑 Login Credentials:")
        print("  Username: admin")
        print("  Password: Admin@123456")
        
        print("\n" + "=" * 60 + "\n")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    seed_complete_data()
