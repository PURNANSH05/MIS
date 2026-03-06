"""
Medical Inventory System - Backend Setup Instructions

Prerequisites:
- Python 3.8+
- pip
- PostgreSQL 12+ (running and configured)
- .env file with PostgreSQL credentials

Setup Steps:

1. Configure PostgreSQL:
   - Create database: medical_inventory
   - Create user: mis_user with password
   - Grant permissions (see SETUP_GUIDE.md Step 0)

2. Create .env file:
   cp .env.example .env
   
   Edit .env with your PostgreSQL credentials:
   DB_USER=mis_user
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=medical_inventory

3. Navigate to backend folder:
   cd backend

4. Create virtual environment (recommended):
   python -m venv venv
   
   On Windows:
   venv\Scripts\activate
   
   On Linux/Mac:
   source venv/bin/activate

5. Install dependencies:
   pip install -r requirements.txt

6. Initialize database:
   python -c "from database import Base, engine; Base.metadata.create_all(bind=engine); print('Database tables created')"

7. Create seed data:
   python seed_data.py

8. Run the server:
   python main.py

The API will be available at: http://localhost:8000
API Documentation: http://localhost:8000/docs

Frontend Setup:
- Copy frontend folder contents to your web server
- Update API_BASE_URL in frontend/app.js if needed
- Access via: http://localhost:8000 or your web server URL
"""
