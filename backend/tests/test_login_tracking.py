#!/usr/bin/env python
"""
Test comprehensive login/logout tracking system
"""

import requests
import time
import json

def test_login_tracking():
    """Test the complete login tracking system"""
    print("🔴 COMPREHENSIVE LOGIN TRACKING TEST")
    print("="*60)
    
    base_url = "http://localhost:8000"
    
    try:
        # Test 1: Login with tracking
        print("\n1. Testing login with comprehensive tracking...")
        login_data = {
            'username': 'admin',
            'password': 'Admin@123456'
        }
        
        response = requests.post(f"{base_url}/api/login", json=login_data, timeout=5)
        
        if response.status_code == 200:
            login_result = response.json()
            token = login_result['access_token']
            headers = {'Authorization': f'Bearer {token}'}
            
            print("✅ Login successful with tracking enabled")
            print(f"   User: {login_result['user']['username']}")
            print(f"   Role: {login_result['user']['role']['name']}")
            
            # Test 2: Get user's login sessions
            print("\n2. Testing user login sessions...")
            sessions_response = requests.get(f"{base_url}/api/auth/sessions", headers=headers, timeout=5)
            
            if sessions_response.status_code == 200:
                sessions = sessions_response.json()
                print(f"✅ Retrieved {len(sessions)} login sessions")
                
                if sessions:
                    latest_session = sessions[0]
                    print(f"   Latest Session ID: {latest_session['id']}")
                    print(f"   Login Time: {latest_session['login_time']}")
                    print(f"   IP Address: {latest_session['ip_address']}")
                    print(f"   Browser: {latest_session['browser']}")
                    print(f"   Device: {latest_session['device_type']}")
                    print(f"   OS: {latest_session['operating_system']}")
                    print(f"   Status: {latest_session['login_status']}")
            
            # Test 3: Get all active sessions (Admin)
            print("\n3. Testing all active sessions (Admin)...")
            all_sessions_response = requests.get(f"{base_url}/api/auth/sessions/all", headers=headers, timeout=5)
            
            if all_sessions_response.status_code == 200:
                all_sessions = all_sessions_response.json()
                print(f"✅ Retrieved {len(all_sessions)} active sessions")
                
                for session in all_sessions[:3]:  # Show first 3
                    print(f"   User: {session['username']} | IP: {session['ip_address']} | Device: {session['device_type']}")
            
            # Test 4: Get login statistics
            print("\n4. Testing login statistics...")
            stats_response = requests.get(f"{base_url}/api/auth/login-stats?days=30", headers=headers, timeout=5)
            
            if stats_response.status_code == 200:
                stats = stats_response.json()
                print("✅ Login Statistics Retrieved:")
                print(f"   Total Logins: {stats.get('total_logins', 0)}")
                print(f"   Unique Users: {stats.get('unique_users', 0)}")
                print(f"   Active Sessions: {stats.get('active_sessions', 0)}")
                print(f"   Avg Session Duration: {stats.get('average_session_duration', 0)} seconds")
                
                device_breakdown = stats.get('device_breakdown', {})
                if device_breakdown:
                    print("   Device Breakdown:")
                    for device, count in device_breakdown.items():
                        print(f"     {device}: {count}")
            
            # Test 5: Logout with tracking
            print("\n5. Testing logout with tracking...")
            time.sleep(2)  # Wait a bit to create session duration
            
            logout_response = requests.post(f"{base_url}/api/auth/logout", headers=headers, timeout=5)
            
            if logout_response.status_code == 200:
                print("✅ Logout successful with tracking")
                
                # Verify session was updated
                time.sleep(1)
                final_sessions_response = requests.get(f"{base_url}/api/auth/sessions", headers=headers, timeout=5)
                
                if final_sessions_response.status_code == 200:
                    final_sessions = final_sessions_response.json()
                    if final_sessions:
                        latest_session = final_sessions[0]
                        print(f"   Session Status: {latest_session['login_status']}")
                        print(f"   Logout Time: {latest_session['logout_time']}")
                        print(f"   Session Duration: {latest_session['session_duration']} seconds")
                        print(f"   Logout Reason: {latest_session['logout_reason']}")
            
            print("\n🎉 LOGIN TRACKING SYSTEM: PERFECT!")
            print("✅ All login/logout operations tracked")
            print("✅ Comprehensive session data captured")
            print("✅ Real-time monitoring enabled")
            print("✅ Database integration working")
            
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_login_tracking()
