#!/usr/bin/env python
"""
Create login_sessions table and update database schema
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import engine, Base
from sqlalchemy import text

def create_login_sessions_table():
    """Create the login_sessions table"""
    print("Creating login_sessions table...")
    
    # Create the table using SQLAlchemy
    Base.metadata.create_all(bind=engine)
    
    # Verify table creation
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT COUNT(*) as table_exists 
            FROM information_schema.tables 
            WHERE table_name = 'login_sessions'
        """))
        
        table_exists = result.fetchone()[0]
        
        if table_exists:
            print("✅ login_sessions table created successfully")
            
            # Show table structure
            result = conn.execute(text("""
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'login_sessions'
                ORDER BY ordinal_position
            """))
            
            print("\n📋 Table Structure:")
            print("Column Name | Data Type | Nullable | Default")
            print("-" * 50)
            for row in result:
                print(f"{row[0]:<20} {row[1]:<15} {row[2]:<9} {row[3] or 'None'}")
            
            return True
        else:
            print("❌ Failed to create login_sessions table")
            return False

def main():
    """Main function"""
    print("="*60)
    print("LOGIN SESSIONS TABLE SETUP")
    print("="*60)
    
    try:
        success = create_login_sessions_table()
        
        if success:
            print("\n✅ Login tracking system is ready!")
            print("🔍 Features enabled:")
            print("   • Comprehensive login/logout tracking")
            print("   • Session duration monitoring")
            print("   • IP address and device tracking")
            print("   • Browser and OS detection")
            print("   • Real-time session management")
            print("   • Complete audit trail")
            
            print("\n🌐 API Endpoints available:")
            print("   • GET /api/auth/sessions - User's login history")
            print("   • GET /api/auth/sessions/all - All active sessions (Admin)")
            print("   • GET /api/auth/login-stats - Login statistics (Admin)")
            
            print("\n🎯 Next steps:")
            print("   1. Restart the application server")
            print("   2. Test login/logout functionality")
            print("   3. Check pgAdmin for the new table")
            print("   4. Monitor login tracking in real-time")
            
        else:
            print("\n❌ Setup failed. Please check the error messages.")
            return 1
            
    except Exception as e:
        print(f"\n❌ Error during setup: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    print("\n" + "="*60)
    return 0

if __name__ == "__main__":
    sys.exit(main())
