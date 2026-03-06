#!/usr/bin/env python
"""Fix admin user access - remove force password change and ensure proper role"""

from database import SessionLocal, User, Role
from auth import hash_password, verify_password

db = SessionLocal()

print("="*60)
print("FIXING ADMIN USER ACCESS")
print("="*60)

# Get admin user
admin = db.query(User).filter(User.username == "admin").first()

if admin:
    print(f"Found admin user: {admin.username}")
    print(f"Current role: {admin.role.name if admin.role else 'No role'}")
    print(f"Force password change: {admin.force_password_change}")
    print(f"Is active: {admin.is_active}")
    
    # Remove force password change requirement
    admin.force_password_change = False
    
    # Ensure admin role is properly set
    admin_role = db.query(Role).filter(Role.name == "Admin").first()
    if admin_role:
        admin.role_id = admin_role.id
        print(f"✅ Admin role set to: {admin_role.name}")
    else:
        print("❌ Admin role not found!")
    
    # Ensure user is active
    admin.is_active = True
    
    # Commit changes
    db.commit()
    
    print("✅ Admin user updated successfully!")
    print(f"   - Force password change: {admin.force_password_change}")
    print(f"   - Role: {admin.role.name if admin.role else 'No role'}")
    print(f"   - Active: {admin.is_active}")
    print()
    print("You can now login with:")
    print("   Username: admin")
    print("   Password: Admin@123456")
    print()
    print("All admin features will be available after login!")
    
else:
    print("❌ Admin user not found!")

db.close()
