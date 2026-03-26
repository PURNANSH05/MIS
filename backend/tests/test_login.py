#!/usr/bin/env python
"""Test login endpoint"""

import requests
import json

API_URL = "http://127.0.0.1:8000/api/login"

credentials = {
    "username": "admin",
    "password": "Admin@123456"
}

print("Testing login endpoint...")
print(f"URL: {API_URL}")
print(f"Credentials: {json.dumps(credentials, indent=2)}")
print()

try:
    response = requests.post(API_URL, json=credentials)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("\n✅ Login successful!")
    else:
        print("\n❌ Login failed!")
except Exception as e:
    print(f"❌ Error: {str(e)}")
