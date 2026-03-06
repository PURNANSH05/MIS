#!/usr/bin/env python
"""
Fix Admin User Credentials Script
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, User, Role
from auth import hash_password

def fix_admin_user():
    """Fix or recreate admin user with correct credentials"""
    db = SessionLocal()
    
    try:
        # Get or create admin role
        admin_role = db.query(Role).filter(Role.name == "Admin").first()
        if not admin_role:
            print("✗ Admin role not found. Creating...")
            admin_role = Role(name="Admin", description="System administrator with full access")
            db.add(admin_role)
            db.commit()
            print("✓ Admin role created")
        
        # Check if admin user exists
        admin_user = db.query(User).filter(User.username == "admin").first()
        
        if admin_user:
            print(f"✓ Admin user found (ID: {admin_user.id})")
            print(f"  Current email: {admin_user.email}")
            print(f"  Active: {admin_user.is_active}")
            print(f"  Force password change: {admin_user.force_password_change}")
            
            # Reset password
            print("\n📝 Resetting admin password...")
            admin_user.password_hash = hash_password("Admin@123456")
            admin_user.is_active = True
            admin_user.force_password_change = True
            db.commit()
            print("✓ Admin password reset to: Admin@123456")
        else:
            print("✗ Admin user not found. Creating new admin user...")
            admin_user = User(
                username="admin",
                email="admin@hospital.local",
                password_hash=hash_password("Admin@123456"),
                role_id=admin_role.id,
                is_active=True,
                force_password_change=True
            )
            db.add(admin_user)
            db.commit()
            print("✓ New admin user created")
            print("  Username: admin")
            print("  Password: Admin@123456")
        
        # Verify it works
        print("\n✓ Verifying credentials...")
        from auth import verify_password
        
        # Reload user to get updated hash
        admin_user = db.query(User).filter(User.username == "admin").first()
        if verify_password("Admin@123456", admin_user.password_hash):
            print("✓ Password verification successful!")
            print("\n✅ Admin credentials are now working perfectly")
            print("\nYou can now login with:")
            print("  Username: admin")
            print("  Password: Admin@123456")
        else:
            print("✗ Password verification failed!")
            
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    fix_admin_user()
