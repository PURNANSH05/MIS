# Backend - FastAPI Medical Inventory System

FastAPI backend for Medical Inventory Management System.

## Quick Start

```powershell
# From root directory
cd backend
pip install -r requirements.txt
python start.py
```

Backend runs on **http://127.0.0.1:8000**

## Project Structure

```
backend/
├── app/              Core FastAPI application
│   ├── main.py       FastAPI entry point & routes
│   ├── auth.py       Authentication & JWT tokens
│   ├── database.py   SQLAlchemy ORM models
│   ├── schemas.py    Pydantic validation schemas
│   └── login_tracker.py  Session tracking
│
├── scripts/          Database & utility scripts
│   ├── init_database.py      Initialize database
│   ├── seed_data_complete.py Seed sample data
│   ├── reset_db.py           Reset database
│   └── ...
│
├── tests/            Test suite
│   ├── test_login.py
│   ├── test_inventory.py
│   └── ...
│
├── config/           Configuration files
│   ├── .env          Environment variables
│   ├── nginx.conf    Nginx configuration
│   └── medical_inventory.db  SQLite database
│
├── requirements.txt  Python dependencies
├── start.py          Backend startup script
└── README.md         This file
```

## Setup Instructions

### 1. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 2. Configure Environment

Copy and edit `.config/.env`:

```env
DB_TYPE=sqlite                # or postgresql
DEBUG=True
ENVIRONMENT=development
ALLOWED_ORIGINS=*
```

For PostgreSQL, set:
```env
DB_TYPE=postgresql
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medical_inventory
```

### 3. Initialize Database

```powershell
cd scripts
python init_database.py
python seed_data_complete.py
cd ..
```

### 4. Run Backend

```powershell
python start.py
```

## API Documentation

- **Swagger UI:** http://127.0.0.1:8000/docs
- **ReDoc:** http://127.0.0.1:8000/redoc

## Common Commands

```powershell
# Run tests
pytest tests/ -v

# Reset database
python scripts/reset_db.py

# Run specific test
pytest tests/test_login.py -v
```

## Key Files

| File | Purpose |
|------|---------|
| `main.py` | FastAPI app with all endpoints |
| `auth.py` | JWT tokens, password hashing, permissions |
| `database.py` | SQLAlchemy models & engine |
| `schemas.py` | Request/response validation |
| `login_tracker.py` | Session & login tracking |

## Database Support

- **Development:** SQLite (config/medical_inventory.db)
- **Production:** PostgreSQL

Switch in `config/.env` via `DB_TYPE` variable.

## Troubleshooting

**Port 8000 in use:**
```powershell
netstat -ano | findstr :8000
taskkill /F /PID <pid>
```

**Module not found:**
```powershell
pip install -r requirements.txt
```

**Database locked:**
```powershell
python scripts/reset_db.py
```


The API will be available at: http://localhost:8000
API Documentation: http://localhost:8000/docs

Frontend Setup:
- Copy frontend folder contents to your web server
- Update API_BASE_URL in frontend/app.js if needed
- Access via: http://localhost:8000 or your web server URL
"""
