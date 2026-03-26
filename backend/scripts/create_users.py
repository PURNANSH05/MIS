#!/usr/bin/env python
"""Create all proper roles and users for the system"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, Role, User
from auth import hash_password

db = SessionLocal()

# Define all roles
roles_data = [
    {
        "name": "Super Admin",
        "description": "Full system access"
    },
    {
        "name": "Admin",
        "description": "User & access management (limited)"
    },
    {
        "name": "Inventory Manager",
        "description": "Stock control, approvals, reporting"
    },
    {
        "name": "Pharmacist",
        "description": "Issue medicines, receive stock"
    },
    {
        "name": "Storekeeper",
        "description": "Stock updates, batch handling"
    },
    {
        "name": "Auditor",
        "description": "Read-only access to logs and reports"
    },
]

# Define users for each role
users_data = [
    {
        "username": "admin",
        "email": "admin@hospital.local",
        "password": "Admin@123456",
        "role_name": "Super Admin"
    },
    {
        "username": "manager",
        "email": "manager@hospital.local",
        "password": "Manager@123456",
        "role_name": "Inventory Manager"
    },
    {
        "username": "pharmacist",
        "email": "pharmacist@hospital.local",
        "password": "Pharmacist@123456",
        "role_name": "Pharmacist"
    },
    {
        "username": "storekeeper",
        "email": "storekeeper@hospital.local",
        "password": "Storekeeper@123456",
        "role_name": "Storekeeper"
    },
    {
        "username": "auditor",
        "email": "auditor@hospital.local",
        "password": "Auditor@123456",
        "role_name": "Auditor"
    },
]

try:
    print("="*70)
    print("CREATING ROLES AND USERS")
    print("="*70 + "\n")
    
    # Create all roles
    print("[*] Creating Roles:")
    print("-" * 70)
    for role_data in roles_data:
        existing_role = db.query(Role).filter(Role.name == role_data["name"]).first()
        if not existing_role:
            role = Role(
                name=role_data["name"],
                description=role_data["description"]
            )
            db.add(role)
            print(f"[OK] {role_data['name']}: {role_data['description']}")
        else:
            print(f"[INFO] {role_data['name']} already exists")
    
    db.commit()
    print()
    
    # Create all users
    print("[*] Creating Users:")
    print("-" * 70)
    for user_data in users_data:
        # Check if user exists
        existing_user = db.query(User).filter(User.username == user_data["username"]).first()
        
        # Get role
        role = db.query(Role).filter(Role.name == user_data["role_name"]).first()
        
        if not existing_user and role:
            user = User(
                username=user_data["username"],
                email=user_data["email"],
                password_hash=hash_password(user_data["password"]),
                role_id=role.id,
                is_active=True,
                force_password_change=False
            )
            db.add(user)
            print(f"[OK] {user_data['username']:<15} | Role: {user_data['role_name']:<20} | Pass: {user_data['password']}")
        elif existing_user:
            print(f"[INFO] {user_data['username']} already exists")
        else:
            print(f"[ERR] {user_data['username']} - Role not found")
    
    db.commit()
    
    print("\n" + "="*70)
    print("[OK] ALL ROLES AND USERS CREATED SUCCESSFULLY!")
    print("="*70 + "\n")
    
    print("[*] LOGIN CREDENTIALS:")
    print("-" * 70)
    print(f"{'Username':<15} | {'Password':<20} | {'Role':<20}")
    print("-" * 70)
    for user in users_data:
        print(f"{user['username']:<15} | {user['password']:<20} | {user['role_name']:<20}")
    
    print("\n" + "="*70)
    print("[SUCCESS] System is now ready to use!")
    print("="*70)
    
except Exception as e:
    print(f"\n[ERROR] Error: {str(e)}")
    import traceback
    traceback.print_exc()
    db.rollback()
finally:
    db.close()
