#!/usr/bin/env python3
"""Test login endpoint with correct credentials"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

credentials = [
    {"username": "admin", "password": "Admin@123456"},
    {"username": "manager", "password": "Manager@123456"},
    {"username": "pharmacist", "password": "Pharmacist@123456"},
    {"username": "storekeeper", "password": "Storekeeper@123456"},
    {"username": "auditor", "password": "Auditor@123456"},
]

print("=" * 80)
print("TESTING LOGIN ENDPOINT WITH CORRECT CREDENTIALS")
print("=" * 80)

for creds in credentials:
    try:
        response = requests.post(
            f"{BASE_URL}/api/login",
            json=creds,
            timeout=5
        )
        
        print(f"\n✓ {creds['username']}")
        print(f"  Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"  Token: {data['access_token'][:50]}...")
            print(f"  User: {data['user']['username']} ({data['user']['role']['name']})")
            print(f"  Result: ✅ LOGIN SUCCESSFUL")
        else:
            print(f"  Error: {response.text}")
            print(f"  Result: ❌ LOGIN FAILED")
    except Exception as e:
        print(f"\n✗ {creds['username']}")
        print(f"  Error: {e}")
        print(f"  Result: ❌ CONNECTION ERROR")

print("\n" + "=" * 80)
print("TESTING COMPLETE")
print("=" * 80)
