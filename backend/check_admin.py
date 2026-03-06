#!/usr/bin/env python
"""Check admin user password hash"""

from database import SessionLocal, User, Role
from auth import hash_password, verify_password

db = SessionLocal()

# Get admin user
admin = db.query(User).filter(User.username == "admin").first()

if admin:
    print("="*60)
    print("ADMIN USER FOUND")
    print("="*60)
    print(f"Username: {admin.username}")
    print(f"Email: {admin.email}")
    print(f"Password Hash: {admin.password_hash}")
    print(f"Role: {admin.role.name if admin.role else 'No role'}")
    print(f"Is Active: {admin.is_active}")
    print()
    
    # Test password
    test_password = "Admin@123456"
    is_valid = verify_password(test_password, admin.password_hash)
    print(f"Testing password '{test_password}':")
    print(f"Password Valid: {is_valid}")
    
    if not is_valid:
        print("\n⚠️ Password doesn't match! Fixing it...")
        # Update password
        admin.password_hash = hash_password(test_password)
        db.commit()
        print("✅ Password updated successfully!")
        
        # Verify
        is_valid = verify_password(test_password, admin.password_hash)
        print(f"New verification: {is_valid}")
else:
    print("❌ Admin user not found!")

db.close()
