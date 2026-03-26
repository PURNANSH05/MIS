# Medical Inventory System

Medical Inventory System is a FastAPI + React application for managing medical stock, locations, suppliers, users, alerts, and reports.

## Structure

- `backend/` - FastAPI backend, database models, auth, schemas, and utility scripts
- `react-app/` - React frontend
- `start.py` - Python launcher for backend + frontend
- `run.ps1` - PowerShell launcher
- `START_COMPLETE.bat` - Windows batch launcher

## Main Stack

- Backend: FastAPI, SQLAlchemy, SQLite/PostgreSQL support
- Frontend: React 18, React Router, Axios, React Toastify

## Start The App

### Option 1: Windows batch

Run:

```bat
START_COMPLETE.bat
```

### Option 2: PowerShell

Run:

```powershell
.\run.ps1
```

### Option 3: Manual

Backend:

```powershell
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Frontend:

```powershell
cd react-app
npm start
```

## URLs

- Frontend: `http://127.0.0.1:3000`
- Backend: `http://127.0.0.1:8000`
- API docs: `http://127.0.0.1:8000/docs`

## Default Login

- Username: `admin`
- Password: `Admin@123456`

## Notes

- The project now uses the main backend in `backend/main.py`.
- Duplicate startup helpers, generated reports, and temporary fix artifacts were removed to keep the repo clean.
