# 📁 PROJECT STRUCTURE GUIDE

## Overview

The Medical Inventory System is organized into a clean, professional two-folder structure with separate `frontend` and `backend` directories, plus a `docs` folder for all documentation.

---

## Directory Organization

```
Medical Inventory System(MIS)/
│
├── 📂 frontend/                           # Frontend SPA (JavaScript/HTML/CSS)
│   ├── app.js                            # Main application logic (776 lines)
│   ├── app-enterprise.js                 # Enterprise variant
│   ├── index.html                        # Main user interface
│   ├── index-enterprise.html             # Enterprise UI variant
│   ├── styles.css                        # Responsive styling
│   ├── styles-enterprise.css             # Enterprise styling
│   ├── app_old.js                        # Legacy version (kept for reference)
│   └── README.md                         # Frontend-specific documentation
│
├── 📂 backend/                            # Backend API (FastAPI/Python)
│   ├── main.py                           # FastAPI application (988+ lines)
│   │                                      # ├─ 15+ REST endpoints
│   │                                      # ├─ Authentication & authorization
│   │                                      # ├─ Stock operations
│   │                                      # ├─ Reports & alerts
│   │                                      # └─ Audit logging
│   │
│   ├── database.py                       # SQLAlchemy ORM models (220+ lines)
│   │                                      # ├─ Users, Roles, Items
│   │                                      # ├─ ItemBatch, Locations
│   │                                      # ├─ StockMovement (immutable ledger)
│   │                                      # ├─ Suppliers, PurchaseOrders
│   │                                      # ├─ AuditLog, SystemAlert
│   │                                      # └─ Database relationships & constraints
│   │
│   ├── schemas.py                        # Pydantic validation models (500+ lines)
│   │                                      # ├─ Request models (with validators)
│   │                                      # ├─ Response models
│   │                                      # └─ Multi-level validation
│   │
│   ├── auth.py                           # Authentication & authorization (200+ lines)
│   │                                      # ├─ JWT token generation/verification
│   │                                      # ├─ Password hashing (bcrypt)
│   │                                      # ├─ Password strength validation
│   │                                      # ├─ RBAC (5 roles, 30+ permissions)
│   │                                      # └─ Token refresh mechanism
│   │
│   ├── init_database.py                  # Database initialization script (180+ lines)
│   │                                      # ├─ Create default roles
│   │                                      # ├─ Create admin user
│   │                                      # ├─ Create sample data
│   │                                      # ├─ Idempotent operations
│   │                                      # └─ Helpful output messages
│   │
│   ├── requirements.txt                  # Python dependencies (pinned versions)
│   │                                      # ├─ FastAPI 0.109.0
│   │                                      # ├─ SQLAlchemy 2.0.23
│   │                                      # ├─ Uvicorn 0.27.0
│   │                                      # ├─ bcrypt 4.1.1
│   │                                      # ├─ python-jose (JWT)
│   │                                      # └─ Other production dependencies
│   │
│   ├── Dockerfile                        # Backend container configuration
│   │                                      # ├─ Python 3.11-slim base
│   │                                      # ├─ Dependency installation
│   │                                      # ├─ Health checks
│   │                                      # └─ Production-ready settings
│   │
│   ├── .env                              # Environment variables (local)
│   ├── .env.example                      # Configuration template (root level)
│   │
│   ├── README.md                         # Backend-specific documentation
│   │
│   ├── Utility & Setup Scripts           # Various database management scripts
│   │   ├── check_schema.py
│   │   ├── fix_database.py
│   │   ├── fix_schema.py
│   │   ├── inspect_schema.py
│   │   ├── seed_data.py
│   │   ├── setup_database.py
│   │   ├── setup_database_interactive.py
│   │   ├── setup_db_auto.py
│   │   └── verify_system.py
│   │
│   └── __pycache__/                      # Python cache (auto-generated)
│
├── 📂 docs/                               # Complete Documentation (2850+ lines)
│   ├── START_HERE.md                     # Entry point for all users
│   ├── README.md                         # Full project guide (400+ lines)
│   ├── QUICK_REFERENCE.md                # Quick facts & navigation (350+ lines)
│   ├── SYSTEM_SUMMARY.txt                # Visual system overview (350+ lines)
│   ├── TECHNICAL_SPECIFICATION.md        # Complete architecture (700+ lines)
│   ├── DEPLOYMENT_GUIDE.md               # Operations & deployment (400+ lines)
│   ├── IMPLEMENTATION_SUMMARY.md         # Project status (300+ lines)
│   ├── IMPLEMENTATION_CHECKLIST.md       # Feature verification (500+ lines)
│   ├── DOCUMENTATION_INDEX.md            # Documentation navigation (400+ lines)
│   └── PROJECT_COMPLETION_REPORT.md      # Final completion report (250+ lines)
│
├── 🐳 Deployment Configuration
│   ├── docker-compose.yml                # 3-service orchestration
│   │                                      # ├─ PostgreSQL database service
│   │                                      # ├─ FastAPI backend service
│   │                                      # └─ Nginx reverse proxy service
│   │
│   ├── Dockerfile                        # Backend container (also in backend/)
│   ├── nginx.conf                        # Nginx reverse proxy config
│   │                                      # ├─ SSL/TLS termination
│   │                                      # ├─ Rate limiting
│   │                                      # ├─ Security headers
│   │                                      # ├─ Gzip compression
│   │                                      # └─ SPA fallback routing
│   │
│   └── .env.example                      # Configuration template
│       ├─ Database settings
│       ├─ Security keys
│       ├─ Alert thresholds
│       ├─ Logging configuration
│       └─ 50+ parameters
│
├── 🔒 Version Control & Security
│   ├── .gitignore                        # Git security rules
│   │                                      # ├─ Python artifacts
│   │                                      # ├─ Virtual environments
│   │                                      # ├─ IDE configurations
│   │                                      # ├─ Sensitive files (.env, SSL keys)
│   │                                      # └─ OS-specific files
│   │
│   └── .git/                             # Git repository (auto-generated)
│
├── 📄 Root Documentation & Entry Points
│   ├── README.md                         # Project overview (THIS FILE)
│   │                                      # ├─ Quick structure explanation
│   │                                      # ├─ Getting started guide
│   │                                      # ├─ Documentation links
│   │                                      # └─ Key features list
│   │
│   ├── start.html                        # Application entry point
│   │
│   └── PROJECT_SUMMARY.txt               # Visual summary (optional)
│
└── 🔧 Cache & Temp (Auto-Generated)
    └── __pycache__/                      # Python cache files

```

---

## Key File Locations

| Component | Location | Purpose |
|-----------|----------|---------|
| **API Code** | `backend/main.py` | 15+ REST endpoints |
| **Database Models** | `backend/database.py` | 10 complete tables |
| **Request Validation** | `backend/schemas.py` | Pydantic models |
| **Authentication** | `backend/auth.py` | JWT, bcrypt, RBAC |
| **Frontend App** | `frontend/app.js` | SPA application |
| **UI** | `frontend/index.html` | Main interface |
| **Styling** | `frontend/styles.css` | Responsive design |
| **Deployment** | `docker-compose.yml` | 3-service stack |
| **Backend Container** | `Dockerfile` | Production image |
| **Reverse Proxy** | `nginx.conf` | SSL, routing, rate limit |
| **Configuration** | `.env.example` | 50+ parameters |
| **Documentation** | `docs/` | 2850+ lines |

---

## Logical Organization

### By Technology Stack

**Frontend (JavaScript/HTML/CSS)**
- `frontend/app.js` - Main application logic
- `frontend/index.html` - User interface
- `frontend/styles.css` - Styling

**Backend (FastAPI/Python)**
- `backend/main.py` - API endpoints and business logic
- `backend/database.py` - Database models and schema
- `backend/schemas.py` - Input/output validation
- `backend/auth.py` - Authentication and authorization

**Database (PostgreSQL)**
- Defined in `backend/database.py`
- Initialized by `backend/init_database.py`
- Managed via `docker-compose.yml`

**Infrastructure (Docker/Nginx)**
- `docker-compose.yml` - Service orchestration
- `Dockerfile` - Backend container
- `nginx.conf` - Reverse proxy

---

### By Feature Area

**Authentication & Security**
- `backend/auth.py` - Core authentication logic
- `backend/schemas.py` - Password validation schemas
- `nginx.conf` - Rate limiting and security headers
- `docker-compose.yml` - Container security

**Stock Management**
- `backend/main.py` - Stock operation endpoints
- `backend/database.py` - StockMovement table
- `backend/schemas.py` - Stock operation schemas
- `frontend/app.js` - UI for stock operations

**Reporting**
- `backend/main.py` - Report endpoints
- `backend/database.py` - Data models for reports
- `frontend/app.js` - Report display

**Audit & Compliance**
- `backend/database.py` - AuditLog table
- `backend/main.py` - Audit logging logic
- `docs/` - Compliance documentation

---

### By Responsibility

**Database Administration**
- `backend/database.py` - Schema design
- `backend/init_database.py` - Initialization
- Utility scripts in `backend/`
- `docker-compose.yml` - PostgreSQL service

**Backend Development**
- `backend/main.py` - API implementation
- `backend/auth.py` - Auth logic
- `backend/schemas.py` - Validation models
- `backend/requirements.txt` - Dependencies

**Frontend Development**
- `frontend/app.js` - UI logic
- `frontend/index.html` - HTML structure
- `frontend/styles.css` - Styling

**DevOps & Deployment**
- `docker-compose.yml` - Orchestration
- `Dockerfile` - Container build
- `nginx.conf` - Reverse proxy
- `.env.example` - Configuration
- `docs/DEPLOYMENT_GUIDE.md` - Procedures

**Documentation**
- `docs/` - All documentation
- `README.md` - Project overview
- Code docstrings and comments

---

## File Size Summary

| Category | Files | Total Lines | Purpose |
|----------|-------|-------------|---------|
| Backend Python | 4 main files | 3000+ | Core application logic |
| Frontend | 3 JS files + HTML/CSS | 1500+ | User interface |
| Documentation | 10 files | 2850+ | Complete system documentation |
| Configuration | 4 files | 300+ | Docker, Nginx, environment |
| Utilities | 9 scripts | 500+ | Database management |
| **TOTAL** | **~35 files** | **~8000+ lines** | **Complete system** |

---

## Navigation Guide

### I'm new - Where do I start?
1. Read [docs/START_HERE.md](docs/START_HERE.md) (5 min)
2. Skim [README.md](README.md) (10 min)
3. Check [docs/QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md) (10 min)

### I want to deploy
→ Read [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)

### I want to understand the architecture
→ Read [docs/TECHNICAL_SPECIFICATION.md](docs/TECHNICAL_SPECIFICATION.md)

### I need to develop
→ Start with `backend/README.md` and `frontend/README.md`

### I want to verify everything is done
→ Check [docs/IMPLEMENTATION_CHECKLIST.md](docs/IMPLEMENTATION_CHECKLIST.md)

---

## Maintenance

When making changes:
1. **Backend code** → Update `backend/` files
2. **Frontend code** → Update `frontend/` files
3. **Database schema** → Update `backend/database.py`
4. **Configuration** → Update `.env.example` and docs
5. **Dependencies** → Update `backend/requirements.txt`
6. **Docker config** → Update `docker-compose.yml` or `Dockerfile`
7. **Documentation** → Update files in `docs/`

---

## Quick Commands

```bash
# View backend code
cat backend/main.py
cat backend/database.py
cat backend/auth.py

# View frontend code
cat frontend/app.js
cat frontend/index.html

# View configuration
cat .env.example
cat docker-compose.yml
cat nginx.conf

# View documentation
ls -la docs/
cat docs/QUICK_REFERENCE.md
```

---

## Project Statistics

- **Frontend Files**: 6
- **Backend Files**: 9 (main)
- **Documentation Files**: 10
- **Configuration Files**: 4
- **Utility Scripts**: 9
- **Total Files**: ~35
- **Total Lines of Code**: 3000+
- **Total Lines of Documentation**: 2850+
- **Database Tables**: 10
- **API Endpoints**: 15+

---

**This structure ensures everything is organized, easy to find, and simple to navigate.**

**Start with**: [docs/START_HERE.md](../docs/START_HERE.md)
