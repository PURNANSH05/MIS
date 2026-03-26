#!/usr/bin/env powershell
# Medical Inventory System - Ultimate Startup Script
# This script will verify all requirements and start the application

#Requires -Version 3.0
[CmdletBinding()]
param(
    [switch]$Verify,
    [switch]$Clean,
    [switch]$Backend,
    [switch]$Frontend,
    [switch]$Help
)

$ErrorActionPreference = "Stop"

# Configuration
$RootPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendPath = Join-Path $RootPath "backend"
$ReactAppPath = Join-Path $RootPath "react-app"
$BackendPort = 8000
$FrontendPort = 3000
$ProjectPython = Join-Path $RootPath ".venv\Scripts\python.exe"
if (-not (Test-Path $ProjectPython)) {
    $ProjectPython = "python"
}

# Colors
$Colors = @{
    Success = @{ForegroundColor = "Green"; BackgroundColor = "Black"}
    Error = @{ForegroundColor = "Red"; BackgroundColor = "Black"}
    Warning = @{ForegroundColor = "Yellow"; BackgroundColor = "Black"}
    Info = @{ForegroundColor = "Cyan"; BackgroundColor = "Black"}
    Highlight = @{ForegroundColor = "White"; BackgroundColor = "DarkBlue"}
}

function Write-Status {
    param([string]$Message, [string]$Type = "Info")
    $color = $Colors[$Type]
    Write-Host $Message @color
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "=" * 60 @{ForegroundColor = "DarkCyan"; BackgroundColor = "Black"}
    Write-Host "  $Title" @{ForegroundColor = "White"; BackgroundColor = "DarkBlue"}
    Write-Host "=" * 60 @{ForegroundColor = "DarkCyan"; BackgroundColor = "Black"}
    Write-Host ""
}

function Check-Python {
    try {
        $version = (& $ProjectPython --version 2>&1)
        if ($? -and $version -match "Python 3\.[8-9]|Python 3\.[1-9][0-9]") {
            Write-Status "✓ Python found: $version" "Success"
            return $true
        } else {
            Write-Status "✗ Python version not compatible (need 3.8+): $version" "Error"
            return $false
        }
    } catch {
        Write-Status "✗ Python not found. Please install Python 3.8+" "Error"
        return $false
    }
}

function Check-NodeJS {
    try {
        $version = (node --version 2>&1)
        if ($? -and $version -match "v1[4-9]|v[2-9][0-9]") {
            Write-Status "✓ Node.js found: $version" "Success"
            return $true
        } else {
            Write-Status "✗ Node.js version not compatible (need 14+): $version" "Error"
            return $false
        }
    } catch {
        Write-Status "✗ Node.js not found. Please install Node.js 14+" "Error"
        return $false
    }
}

function Check-NPM {
    try {
        $version = (npm --version 2>&1)
        if ($? -and ($version -as [version]) -ge [version]"6.0.0") {
            Write-Status "✓ npm found: $version" "Success"
            return $true
        } else {
            Write-Status "✗ npm version too old (need 6+): $version" "Error"
            return $false
        }
    } catch {
        Write-Status "✗ npm not found" "Error"
        return $false
    }
}

function Check-BackendDependencies {
    Write-Status "Checking backend dependencies..." "Info"
    
    try {
        # Check if pip packages are installed
        $output = (pip list 2>&1 | Select-String -Pattern "fastapi|sqlalchemy|uvicorn" -List)
        if ($output.Count -ge 3) {
            Write-Status "✓ Backend dependencies installed" "Success"
            return $true
        } else {
            Write-Status "! Backend dependencies missing, will install..." "Warning"
            return $false
        }
    } catch {
        Write-Status "✗ Could not check backend dependencies" "Error"
        return $false
    }
}

function Check-FrontendDependencies {
    $nodeModulesPath = Join-Path $ReactAppPath "node_modules"
    if (Test-Path $nodeModulesPath) {
        Write-Status "✓ Frontend dependencies installed" "Success"
        return $true
    } else {
        Write-Status "! Frontend dependencies missing, will install..." "Warning"
        return $false
    }
}

function Check-EnvFiles {
    $backendEnv = Join-Path $BackendPath ".env"
    $frontendEnv = Join-Path $ReactAppPath ".env"
    
    $allGood = $true
    
    if (Test-Path $backendEnv) {
        Write-Status "✓ Backend .env file exists" "Success"
    } else {
        Write-Status "✗ Backend .env file missing" "Error"
        $allGood = $false
    }
    
    if (Test-Path $frontendEnv) {
        Write-Status "✓ Frontend .env file exists" "Success"
    } else {
        Write-Status "✗ Frontend .env file missing" "Error"
        $allGood = $false
    }
    
    return $allGood
}

function Install-BackendDependencies {
    Write-Status "Installing backend dependencies..." "Info"
    Push-Location $BackendPath
    try {
        & $ProjectPython -m pip install --upgrade pip setuptools wheel | Out-Null
        & $ProjectPython -m pip install -r requirements.txt
        if ($?) {
            Write-Status "✓ Backend dependencies installed successfully" "Success"
            return $true
        } else {
            Write-Status "✗ Failed to install backend dependencies" "Error"
            return $false
        }
    } catch {
        Write-Status "✗ Error installing backend dependencies: $_" "Error"
        return $false
    } finally {
        Pop-Location
    }
}

function Install-FrontendDependencies {
    Write-Status "Installing frontend dependencies..." "Info"
    Push-Location $ReactAppPath
    try {
        npm install
        if ($?) {
            Write-Status "✓ Frontend dependencies installed successfully" "Success"
            return $true
        } else {
            Write-Status "✗ Failed to install frontend dependencies" "Error"
            return $false
        }
    } catch {
        Write-Status "✗ Error installing frontend dependencies: $_" "Error"
        return $false
    } finally {
        Pop-Location
    }
}

function Start-Backend {
    Write-Status "Starting backend server..." "Info"
    Push-Location $BackendPath
    try {
        Write-Status "Backend starting on http://127.0.0.1:$BackendPort" "Info"
        Write-Status "Using Python: $ProjectPython" "Info"
        & $ProjectPython -m uvicorn main:app --host 127.0.0.1 --port $BackendPort
    } catch {
        Write-Status "✗ Failed to start backend: $_" "Error"
    } finally {
        Pop-Location
    }
}

function Start-Frontend {
    Write-Status "Starting frontend server..." "Info"
    Push-Location $ReactAppPath
    try {
        Write-Status "Frontend will start on http://127.0.0.1:$FrontendPort" "Info"
        $env:PORT = $FrontendPort
        $env:BROWSER = "none"
        npm start
    } catch {
        Write-Status "✗ Failed to start frontend: $_" "Error"
    } finally {
        Pop-Location
    }
}

function Show-Help {
    Write-Host @"
Medical Inventory System - Startup Script

USAGE:
  .\run.ps1 [OPTIONS]

OPTIONS:
  -Verify      Check all requirements without starting
  -Clean       Remove node_modules and reinstall everything
  -Backend     Start only backend
  -Frontend    Start only frontend
  -Help        Show this help message

EXAMPLES:
  .\run.ps1                 # Start complete system
  .\run.ps1 -Verify         # Check setup
  .\run.ps1 -Clean          # Clean and reinstall
  .\run.ps1 -Backend        # Start only backend
  .\run.ps1 -Frontend       # Start only frontend

"@
    exit 0
}

# Main Logic
Write-Section "MEDICAL INVENTORY SYSTEM - STARTUP"

if ($Help) { Show-Help }

# Verify Phase
Write-Section "VERIFICATION"

$pythonOk = Check-Python
$nodeOk = Check-NodeJS
$npmOk = Check-NPM

if (-not ($pythonOk -and $nodeOk -and $npmOk)) {
    Write-Status "✗ Critical dependencies missing" "Error"
    exit 1
}

Write-Host ""
$backendDepsOk = Check-BackendDependencies
$frontendDepsOk = Check-FrontendDependencies
$envOk = Check-EnvFiles

if ($Verify) {
    Write-Status "Verification complete!" "Info"
    exit 0
}

# Installation Phase
Write-Section "INSTALLATION"

if (-not $backendDepsOk) {
    if (-not (Install-BackendDependencies)) {
        exit 1
    }
}

if ($Clean) {
    Write-Status "Cleaning frontend..." "Warning"
    Push-Location $ReactAppPath
    if (Test-Path "node_modules") { Remove-Item "node_modules" -Recurse -Force -ErrorAction SilentlyContinue }
    if (Test-Path "package-lock.json") { Remove-Item "package-lock.json" -Force -ErrorAction SilentlyContinue }
    npm cache clean --force | Out-Null
    Pop-Location
}

if (-not $frontendDepsOk -or $Clean) {
    if (-not (Install-FrontendDependencies)) {
        exit 1
    }
}

# Startup Phase
Write-Section "STARTUP"

Write-Status "System ready to start!" "Success"
Write-Host ""
Write-Status "Starting services..." "Info"
Write-Host ""

if ($Backend) {
    Start-Backend
} elseif ($Frontend) {
    Start-Frontend
} else {
    # Start both
    Write-Status "[1] Starting Backend (http://127.0.0.1:$BackendPort)" "Highlight"
    Start-Job -Name "Backend" -ScriptBlock {
        Set-Location $using:BackendPath
        & $using:ProjectPython -m uvicorn main:app --host 127.0.0.1 --port $using:BackendPort 2>&1
    } | Out-Null
    
    Write-Host ""
    Write-Status "Waiting for backend to initialize..." "Info"
    Start-Sleep -Seconds 5
    
    Write-Host ""
    Write-Status "[2] Starting Frontend (http://127.0.0.1:$FrontendPort)" "Highlight"
    Start-Frontend
}
