@echo off
REM ============================================
REM Medical Inventory System - COMPLETE STARTUP
REM ============================================
REM This script starts both backend and frontend
REM Run this file once, and your system is up!
REM ============================================

setlocal enabledelayedexpansion

REM Get the directory where this script is located
for /f "delims=" %%A in ('cd') do set "PROJECT_DIR=%%A"

echo.
echo ============================================
echo MEDICAL INVENTORY SYSTEM - STARTUP
echo ============================================
echo.
echo Project: %PROJECT_DIR%
echo.

REM Check Python
echo Checking Python...
if not exist "%PROJECT_DIR%\.venv\Scripts\python.exe" (
    echo ERROR: Virtual environment not found!
    echo Please run setup first.
    pause
    exit /b 1
)
echo OK - Python environment found

REM Check Node/NPM
echo Checking npm...
where npm >nul 2>nul
if errorlevel 1 (
    echo ERROR: npm not found!
    echo Please install Node.js first.
    pause
    exit /b 1
)
echo OK - npm found

REM Check backend directory
echo Checking backend...
if not exist "%PROJECT_DIR%\backend\main.py" (
    echo ERROR: Backend directory not found!
    pause
    exit /b 1
)
echo OK - Backend found

REM Check frontend directory
echo Checking frontend...
if not exist "%PROJECT_DIR%\react-app\package.json" (
    echo ERROR: Frontend directory not found!
    pause
    exit /b 1
)
echo OK - Frontend found

REM Check database
echo Checking database...
if not exist "%PROJECT_DIR%\backend\medical_inventory.db" (
    echo WARNING: Database file not found - will be created
) else (
    echo OK - Database found
)

echo.
echo ============================================
echo STARTING SERVICES...
echo ============================================
echo.

REM Start Backend
echo [1/2] Starting Backend Server (port 8000)...
start "Medical Inventory - Backend" cmd /k "cd /d "%PROJECT_DIR%\backend" && "%PROJECT_DIR%\.venv\Scripts\python.exe" -m uvicorn main:app --host 127.0.0.1 --port 8000"

REM Wait for backend to initialize
timeout /t 3 /nobreak

REM Start Frontend
echo [2/2] Starting Frontend Server (port 3000)...
start "Medical Inventory - Frontend" cmd /k "cd /d "%PROJECT_DIR%\react-app" && set PORT=3000 && npm start"

REM Wait a bit for frontend to start
timeout /t 5 /nobreak

echo.
echo ============================================
echo SERVICES STARTED!
echo ============================================
echo.
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://127.0.0.1:3000
echo API Docs: http://127.0.0.1:8000/docs
echo.
echo Login credentials:
echo   Username: admin
echo   Password: Admin@123456
echo.
echo Two new windows have opened:
echo   - Backend window (port 8000)
echo   - Frontend window (port 3000)
echo.
echo Press Ctrl+C in either window to stop that service.
echo.
echo Opening browser...
timeout /t 2 /nobreak

REM Try to open browser
start "" "http://127.0.0.1:3000"

echo.
echo System is ready! Check the browser window for the login page.
echo.
pause
