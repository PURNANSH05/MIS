#!/usr/bin/env python3
"""Debug password hashes in database"""
from database import User, engine
from sqlalchemy.orm import Session
from auth import verify_password

session = Session(engine)
users = session.query(User).all()

print("=" * 80)
print("USER PASSWORD HASHES IN DATABASE")
print("=" * 80)

for user in users:
    print(f"\nUsername: {user.username}")
    print(f"Hash: {user.password_hash}")
    print(f"Hash length: {len(user.password_hash)}")
    
    # Test with known passwords
    test_passwords = [
        f"{user.username.title()}@123456",
        "Admin@123456",
        "password",
        "test"
    ]
    
    for pwd in test_passwords:
        result = verify_password(pwd, user.password_hash)
        print(f"  verify_password('{pwd}'): {result}")

session.close()
