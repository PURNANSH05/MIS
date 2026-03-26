#!/usr/bin/env python3
"""Test all form submission endpoints"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://127.0.0.1:8000"

# First, get a login token
print("=" * 80)
print("TESTING FORM SUBMISSION ENDPOINTS")
print("=" * 80)

# Login
print("\n1. LOGIN TEST")
login_response = requests.post(
    f"{BASE_URL}/api/login",
    json={"username": "admin", "password": "Admin@123456"}
)
print(f"Status: {login_response.status_code}")
if login_response.status_code != 200:
    print(f"Error: {login_response.text}")
    exit(1)

token = login_response.json()['access_token']
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
print(f"✓ Login successful. Token: {token[:50]}...")

# Test adding an item
print("\n2. ADD ITEM TEST")
item_data = {
    "name": "Test Medicine A",
    "sku": f"MED-TEST-{datetime.now().timestamp()}",
    "category": "Medication",
    "unit": "Bottle",
    "reorder_level": 10,
    "description": "Test item for form submission"
}
item_response = requests.post(
    f"{BASE_URL}/api/items",
    json=item_data,
    headers=headers
)
print(f"Status: {item_response.status_code}")
if item_response.status_code != 200:
    print(f"Error: {item_response.text}")
else:
    item_id = item_response.json()['id']
    print(f"✓ Item created successfully. ID: {item_id}")

# Test adding a location
print("\n3. ADD LOCATION TEST")
location_data = {
    "name": f"Test Location {datetime.now().timestamp()}",
    "location_type": "WAREHOUSE",
    "capacity": 500,
    "description": "Test location"
}
location_response = requests.post(
    f"{BASE_URL}/api/locations",
    json=location_data,
    headers=headers
)
print(f"Status: {location_response.status_code}")
if location_response.status_code != 200:
    print(f"Error: {location_response.text}")
else:
    location_id = location_response.json()['id']
    print(f"✓ Location created successfully. ID: {location_id}")

# Test receiving stock
print("\n4. RECEIVE STOCK TEST")
receive_data = {
    "item_id": item_id,
    "batch_number": f"BATCH-{datetime.now().timestamp()}",
    "quantity": 50,
    "location_id": location_id,
    "manufacturing_date": (datetime.now() - timedelta(days=30)).isoformat().split('T')[0],
    "expiry_date": (datetime.now() + timedelta(days=365)).isoformat().split('T')[0],
    "reference_number": f"RCV-{datetime.now().timestamp()}",
    "remarks": "Test stock receive"
}
receive_response = requests.post(
    f"{BASE_URL}/api/stock/receive",
    json=receive_data,
    headers=headers
)
print(f"Status: {receive_response.status_code}")
if receive_response.status_code != 200:
    print(f"Error: {receive_response.text}")
else:
    print(f"✓ Stock received successfully")

# Test adding a supplier
print("\n5. ADD SUPPLIER TEST")
supplier_data = {
    "name": f"Test Supplier {datetime.now().timestamp()}",
    "contact_person": "John Doe",
    "phone": "+1-234-567-8900",
    "email": "supplier@test.com",
    "address": "123 Main St",
    "city": "New York",
    "country": "USA",
    "is_active": True
}
supplier_response = requests.post(
    f"{BASE_URL}/api/suppliers",
    json=supplier_data,
    headers=headers
)
print(f"Status: {supplier_response.status_code}")
if supplier_response.status_code != 200:
    print(f"Error: {supplier_response.text}")
else:
    print(f"✓ Supplier created successfully")

# Test issuing stock
print("\n6. ISSUE STOCK TEST")
issue_data = {
    "item_id": item_id,
    "quantity": 10,
    "location_id": location_id,
    "reference_number": f"ISS-{datetime.now().timestamp()}",
    "remarks": "Test stock issue"
}
issue_response = requests.post(
    f"{BASE_URL}/api/stock/issue",
    json=issue_data,
    headers=headers
)
print(f"Status: {issue_response.status_code}")
if issue_response.status_code != 200:
    print(f"Error: {issue_response.text}")
else:
    print(f"✓ Stock issued successfully")

print("\n" + "=" * 80)
print("ALL TESTS COMPLETED!")
print("=" * 80)
