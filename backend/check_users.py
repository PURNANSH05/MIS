#!/usr/bin/env python
"""Check all users and roles in the system"""

from database import SessionLocal, User, Role
from auth import hash_password, verify_password

db = SessionLocal()

print("="*60)
print("MEDICAL INVENTORY SYSTEM - USER & ROLE CHECK")
print("="*60)

# Check roles
roles = db.query(Role).all()
print(f"\nFOUND {len(roles)} ROLES:")
for role in roles:
    print(f"  ID: {role.id} | Name: {role.name} | Description: {role.description or 'None'}")

# Check users
users = db.query(User).all()
print(f"\nFOUND {len(users)} USERS:")
for user in users:
    role_name = user.role.name if user.role else "NO ROLE"
    print(f"  ID: {user.id} | Username: {user.username} | Email: {user.email}")
    print(f"      Role: {role_name} (ID: {user.role_id}) | Active: {user.is_active}")
    print(f"      Force Password Change: {user.force_password_change}")
    print(f"      Created: {user.created_at}")
    print()

# Check admin specifically
admin = db.query(User).filter(User.username == "admin").first()
if admin:
    print("="*60)
    print("ADMIN USER DETAILS:")
    print("="*60)
    print(f"Username: {admin.username}")
    print(f"Email: {admin.email}")
    print(f"Role: {admin.role.name if admin.role else 'No role'}")
    print(f"Is Active: {admin.is_active}")
    print(f"Force Password Change: {admin.force_password_change}")
    
    # Test common passwords
    test_passwords = ["admin", "Admin@123", "Admin@123456", "password", "123456"]
    print(f"\nTesting common passwords:")
    for pwd in test_passwords:
        is_valid = verify_password(pwd, admin.password_hash)
        status = "✅ VALID" if is_valid else "❌ Invalid"
        print(f"  '{pwd}': {status}")
else:
    print("❌ Admin user not found!")

print("\n" + "="*60)
print("RECOMMENDATIONS:")
print("="*60)

if not admin:
    print("❌ Create admin user")
elif not admin.is_active:
    print("❌ Admin user is not active")
elif admin.force_password_change:
    print("⚠️ Admin user must change password on next login")
else:
    print("✅ Admin user exists and is active")

# Check if admin role exists
admin_role = db.query(Role).filter(Role.name == "Admin").first()
if not admin_role:
    print("❌ Admin role not found - create it")
else:
    print("✅ Admin role exists")

db.close()
