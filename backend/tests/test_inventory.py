#!/usr/bin/env python
"""Test inventory functionality"""

import requests

def test_inventory():
    print("🧪 Testing Inventory Functionality...")
    
    # Test login
    login_data = {'username': 'admin', 'password': 'Admin@123456'}
    response = requests.post('http://localhost:8000/api/login', json=login_data)
    token = response.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test items
    items = requests.get('http://localhost:8000/api/items', headers=headers).json()
    print(f"✅ Items loaded: {len(items)}")
    
    # Test add item
    import time
    timestamp = int(time.time())
    new_item = {
        'name': 'Test Item',
        'sku': f'TEST-{timestamp}',
        'category': 'Medication',
        'unit': 'Tablet',
        'reorder_level': 10,
        'description': 'Test item for verification'
    }
    response = requests.post('http://localhost:8000/api/items', json=new_item, headers=headers)
    if response.status_code == 200:
        created_item = response.json()
        print(f"✅ Item created: {created_item['name']} (ID: {created_item['id']})")
        
        # Test delete item
        delete_response = requests.delete(f'http://localhost:8000/api/items/{created_item["id"]}', headers=headers)
        if delete_response.status_code == 200:
            print("✅ Item deleted successfully")
        else:
            print(f"❌ Delete failed: {delete_response.status_code}")
    else:
        print(f"❌ Create failed: {response.status_code}")
    
    print("🎉 Inventory functionality is working!")

if __name__ == "__main__":
    test_inventory()
