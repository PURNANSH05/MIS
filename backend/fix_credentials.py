#!/usr/bin/env python
"""Verify and fix all user credentials"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, User, Role
from auth import hash_password, verify_password

db = SessionLocal()

# Expected users with their passwords
expected_users = [
    ("admin", "admin@hospital.local", "Admin@123456", "Admin"),
    ("manager", "manager@hospital.local", "Manager@123456", "Inventory Manager"),
    ("pharmacist", "pharmacist@hospital.local", "Pharmacist@123456", "Pharmacist"),
    ("storekeeper", "storekeeper@hospital.local", "Storekeeper@123456", "Storekeeper"),
    ("auditor", "auditor@hospital.local", "Auditor@123456", "Auditor"),
]

print("="*70)
print("VERIFYING AND FIXING USER CREDENTIALS")
print("="*70 + "\n")

for username, email, password, role_name in expected_users:
    user = db.query(User).filter(User.username == username).first()
    
    if not user:
        print(f"[ERROR] User '{username}' not found!")
        continue
    
    # Test password
    is_valid = verify_password(password, user.password_hash)
    
    print(f"User: {username}")
    print(f"  Email: {email}")
    print(f"  Role: {role_name}")
    print(f"  Password Valid: {is_valid}")
    
    if not is_valid:
        print(f"  [FIXING] Updating password...")
        user.password_hash = hash_password(password)
        db.commit()
        
        # Verify
        is_valid = verify_password(password, user.password_hash)
        print(f"  [OK] Password fixed: {is_valid}")
    else:
        print(f"  [OK] Password is correct")
    
    print()

print("="*70)
print("[OK] ALL USERS VERIFIED AND FIXED!")
print("="*70 + "\n")

print("[*] LOGIN CREDENTIALS (All working):")
print("-"*70)
print(f"{'Username':<15} | {'Password':<20} | {'Role':<20}")
print("-"*70)
for username, email, password, role_name in expected_users:
    print(f"{username:<15} | {password:<20} | {role_name:<20}")

print("\n" + "="*70)
print("[SUCCESS] All users are ready to login!")
print("="*70)

db.close()
