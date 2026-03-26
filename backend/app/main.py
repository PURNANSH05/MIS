from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from sqlalchemy import func, distinct, and_, or_
from datetime import date, datetime, timedelta
from typing import List, Optional
import json
import os
import sys
import mimetypes
from dotenv import load_dotenv
from login_tracker import LoginTracker

# Add backend directory to path for imports
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(backend_dir, 'app'))

# Load environment variables from config directory
env_path = os.path.join(backend_dir, 'config', '.env')
load_dotenv(dotenv_path=env_path)

from database import (
    init_db, get_db, SessionLocal, engine, Base, User, Role, Item, ItemBatch, Location, 
    StockMovement, Supplier, PurchaseOrder, AuditLog, SystemAlert
)
from auth import (
    hash_password, verify_password, create_access_token, create_refresh_token, 
    verify_token, has_permission, validate_password_strength
)
from schemas import (
    UserCreate, UserResponse, LoginRequest, LoginResponse, RoleResponse,
    UserUpdate, AdminResetPasswordRequest, ChangePasswordRequest, RefreshTokenRequest,
    LocationCreate, LocationResponse, LocationUpdate,
    ItemCreate, ItemResponse, ItemUpdate,
    ItemBatchCreate, ItemBatchResponse, ItemBatchUpdate,
    StockMovementResponse, ReceiveStockRequest, IssueStockRequest,
    TransferStockRequest, DisposeStockRequest, AdjustStockRequest,
    SupplierCreate, SupplierResponse, SupplierUpdate,
    PurchaseOrderCreate, PurchaseOrderResponse, PurchaseOrderUpdate,
    AuditLogResponse, StockReportResponse, StockReportItem,
    ExpiryReportResponse, ExpiryReportItem, MessageResponse,
    SystemAlertResponse, DashboardResponse, StockMovementReportResponse,
    StockMovementReportItem, SuccessResponse
)

# Configuration
DEBUG = os.getenv("DEBUG", "False").lower() == "true"
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
EXPIRY_ALERT_DAYS = int(os.getenv("EXPIRY_ALERT_DAYS", "30"))
LOW_STOCK_THRESHOLD = int(os.getenv("LOW_STOCK_THRESHOLD", "10"))

# Initialize FastAPI Application
app = FastAPI(
    title="Medical Inventory System",
    version="1.0.0",
    description="Production-Grade Medical Inventory Management System",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration - Restrict for production
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.on_event("startup")
def ensure_rbac_bootstrap():
    db = SessionLocal()
    try:
        super_admin_role = db.query(Role).filter(Role.name == "Super Admin").first()
        if not super_admin_role:
            super_admin_role = Role(name="Super Admin", description="System administrator with full access")
            db.add(super_admin_role)
            db.commit()
            db.refresh(super_admin_role)

        admin_role = db.query(Role).filter(Role.name == "Admin").first()
        if not admin_role:
            admin_role = Role(name="Admin", description="User and access administrator (limited)")
            db.add(admin_role)
            db.commit()

        # Create or update admin user
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            # Create admin user if it doesn't exist
            admin_user = User(
                username="admin",
                email="admin@hospital.local",
                password_hash=hash_password("Admin@123456"),
                role_id=super_admin_role.id,
                is_active=True,
                force_password_change=True
            )
            db.add(admin_user)
            db.commit()
        elif admin_user.role_id != super_admin_role.id:
            # Update role if different
            admin_user.role_id = super_admin_role.id
            db.commit()
    finally:
        db.close()

security = HTTPBearer()

# Initialize Database
Base.metadata.create_all(bind=engine)

# Mount frontend static files from the active React app build when available.
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
react_build_path = os.path.join(project_root, "react-app", "build")
legacy_frontend_path = os.path.join(project_root, "frontend")
react_static_path = os.path.join(react_build_path, "static")

if os.path.exists(react_static_path):
    app.mount("/static", StaticFiles(directory=react_static_path), name="static")
elif os.path.exists(legacy_frontend_path):
    app.mount("/static", StaticFiles(directory=legacy_frontend_path), name="static")


def log_audit(db: Session, user_id: Optional[int], action: str, module: str, record_id: int,
              old_value: Optional[str] = None, new_value: Optional[str] = None, 
              status: str = "SUCCESS", remarks: str = "", ip_address: Optional[str] = None):
    """Log audit action for compliance and tracking"""
    try:
        audit = AuditLog(
            user_id=user_id,
            action=action,
            module=module,
            record_id=record_id,
            old_value=old_value,
            new_value=new_value,
            status=status,
            remarks=remarks,
            ip_address=ip_address
        )
        db.add(audit)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Audit logging error: {str(e)}")
        # Don't raise - audit failures should not break operations


def create_system_alert(db: Session, alert_type: str, severity: str, message: str, 
                       batch_id: Optional[int] = None, item_id: Optional[int] = None,
                       location_id: Optional[int] = None):
    """Create a system alert for monitoring"""
    try:
        alert = SystemAlert(
            alert_type=alert_type,
            severity=severity,
            message=message,
            batch_id=batch_id,
            item_id=item_id,
            location_id=location_id,
            is_acknowledged=False
        )
        db.add(alert)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Alert creation error: {str(e)}")


def get_current_user(request: Request, db: Session = Depends(get_db)):
    """Extract current user from JWT token"""
    # Get authorization header - try both lowercase and with different cases
    auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
    
    if not auth_header:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authorization header")
    
    # Handle different Bearer formats
    if not auth_header.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization header format")
    
    # Extract token - handle case-insensitive Bearer
    token = auth_header.split(" ", 1)[1] if " " in auth_header else None
    
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No token provided")
    
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    
    user = db.query(User).filter(User.id == payload["user_id"]).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account inactive")
    
    return user


def check_permission(user: User, permission: str, db: Session):
    """Check if user has permission"""
    role = db.query(Role).filter(Role.id == user.role_id).first()
    if not has_permission(role.name, permission):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")


def check_any_permission(user: User, permissions: list[str], db: Session):
    """Allow access when the user has at least one of the supplied permissions."""
    role = db.query(Role).filter(Role.id == user.role_id).first()
    role_name = role.name if role else ""
    if not any(has_permission(role_name, permission) for permission in permissions):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission denied")


# ============ FRONTEND ROUTE ============
@app.get("/")
async def root():
    """Serve frontend"""
    frontend_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'index.html')
    if os.path.exists(frontend_path):
        return FileResponse(frontend_path)
    return {"message": "Medical Inventory System API"}


# ============ SYSTEM & AUTH ENDPOINTS ============
@app.post("/api/login", response_model=LoginResponse)
def login(credentials: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """User login endpoint with comprehensive session tracking"""
    # Get client information
    ip_address = request.client.host if request.client else "Unknown"
    user_agent = request.headers.get("user-agent", "Unknown")
    
    user = db.query(User).options(joinedload(User.role)).filter(User.username == credentials.username).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        # Log failed login attempt
        log_audit(db, None, "LOGIN_FAILED", "AUTH", 0, status="FAILED", 
                 remarks=f"Invalid credentials for user: {credentials.username}",
                 ip_address=ip_address)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    if not user.is_active:
        log_audit(db, user.id, "LOGIN_FAILED", "AUTH", user.id, status="FAILED",
                 remarks="Inactive user attempted login",
                 ip_address=ip_address)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account inactive")
    
    role = db.query(Role).filter(Role.id == user.role_id).first()
    
    # Create tokens
    access_token = create_access_token({
        "sub": str(user.id),
        "role": role.name if role else "User",
        "username": user.username
    })
    refresh_token = create_refresh_token({
        "sub": str(user.id),
        "username": user.username
    })
    
    # Initialize login tracker and track login
    login_tracker = LoginTracker(db)
    login_session = login_tracker.track_login(
        user=user,
        session_token=access_token,
        ip_address=ip_address,
        user_agent=user_agent,
        request=request
    )
    
    log_audit(db, user.id, "LOGIN", "AUTH", login_session.id, status="SUCCESS",
             new_value=f"Session ID: {login_session.id}, IP: {ip_address}",
             ip_address=ip_address)
    
    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.from_orm(user),
        force_password_change=user.force_password_change
    )


@app.post("/api/auth/refresh")
def refresh_token_endpoint(request_data: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Refresh access token using refresh token"""
    payload = verify_token(request_data.refresh_token, token_type="refresh")
    
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    
    user = db.query(User).filter(User.id == payload["user_id"]).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    
    role = db.query(Role).filter(Role.id == user.role_id).first()
    
    new_access_token = create_access_token({
        "sub": str(user.id),
        "role": role.name if role else "User",
        "username": user.username
    })
    
    return {"access_token": new_access_token, "token_type": "bearer"}


@app.post("/api/auth/change-password")
def change_password(change_req: ChangePasswordRequest, current_user: User = Depends(get_current_user), 
                   db: Session = Depends(get_db)):
    """Change user password and clear force_password_change flag"""
    # Verify old password
    if not verify_password(change_req.old_password, current_user.password_hash):
        log_audit(db, current_user.id, "CHANGE_PASSWORD_FAILED", "USER", current_user.id,
                 status="FAILED", remarks="Invalid old password")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid current password")
    
    # Verify passwords match
    if change_req.new_password != change_req.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New passwords do not match")
    
    # Validate password strength
    is_valid, error_msg = validate_password_strength(change_req.new_password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)
    
    # Update password
    current_user.password_hash = hash_password(change_req.new_password)
    current_user.force_password_change = False
    db.commit()
    
    log_audit(db, current_user.id, "CHANGE_PASSWORD", "USER", current_user.id,
             status="SUCCESS", remarks="Password changed successfully")
    
    return MessageResponse(message="Password changed successfully")


@app.post("/api/auth/logout")
def logout(current_user: User = Depends(get_current_user), request: Request = None, 
          db: Session = Depends(get_db)):
    """User logout endpoint with comprehensive session tracking"""
    # Get authorization header to extract session token
    auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
    session_token = None
    
    if auth_header and auth_header.lower().startswith("bearer "):
        session_token = auth_header.split(" ", 1)[1]
    
    # Get IP address
    ip_address = request.client.host if request.client else "Unknown"
    
    # Initialize login tracker and track logout
    login_tracker = LoginTracker(db)
    logout_success = login_tracker.track_logout(
        session_token=session_token,
        logout_reason="MANUAL"
    )
    
    if logout_success:
        log_audit(db, current_user.id, "LOGOUT", "AUTH", current_user.id, status="SUCCESS",
                 remarks="User logged out manually",
                 ip_address=ip_address)
    else:
        log_audit(db, current_user.id, "LOGOUT", "AUTH", current_user.id, status="SUCCESS",
                 remarks="User logged out (session not found)",
                 ip_address=ip_address)
    
    return {"message": "Logged out successfully"}


@app.get("/api/auth/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current logged in user info"""
    return UserResponse.from_orm(current_user)


@app.get("/api/auth/permissions")
def get_user_permissions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user's permissions"""
    role = db.query(Role).filter(Role.id == current_user.role_id).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    
    from auth import get_role_permissions
    permissions = get_role_permissions(role.name)
    
    return {
        "role": role.name,
        "permissions": permissions
    }


@app.get("/api/auth/sessions")
def get_login_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user's login sessions"""
    check_permission(current_user, "view_audit_logs", db)
    
    login_tracker = LoginTracker(db)
    sessions = login_tracker.get_user_login_history(current_user.id, limit=20)
    
    return [
        {
            "id": session.id,
            "login_time": session.login_time.isoformat(),
            "logout_time": session.logout_time.isoformat() if session.logout_time else None,
            "session_duration": session.session_duration,
            "ip_address": session.ip_address,
            "browser": session.browser,
            "operating_system": session.operating_system,
            "device_type": session.device_type,
            "login_status": session.login_status,
            "logout_reason": session.logout_reason,
            "is_active": session.is_active
        }
        for session in sessions
    ]


@app.get("/api/auth/sessions/all")
def get_all_login_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all active login sessions (Admin only)"""
    check_permission(current_user, "view_audit_logs", db)
    
    login_tracker = LoginTracker(db)
    sessions = login_tracker.get_active_sessions()
    
    return [
        {
            "id": session.id,
            "user_id": session.user_id,
            "username": session.user.username,
            "login_time": session.login_time.isoformat(),
            "ip_address": session.ip_address,
            "browser": session.browser,
            "device_type": session.device_type,
            "last_activity": session.last_activity.isoformat()
        }
        for session in sessions
    ]


@app.get("/api/auth/login-stats")
def get_login_statistics(days: int = 30, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get login statistics (Admin only)"""
    check_permission(current_user, "view_audit_logs", db)
    
    login_tracker = LoginTracker(db)
    stats = login_tracker.get_login_statistics(days)
    
    return stats


# ============ USER MANAGEMENT ENDPOINTS (Admin only) ============
@app.post("/api/users", response_model=UserResponse)
def create_user(user_data: UserCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create new user (Admin only)"""
    check_permission(current_user, "create_user", db)
    
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")
    
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role_id=user_data.role_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    log_audit(db, current_user.id, "CREATE_USER", "USER", new_user.id, 
              new_value=f"username={new_user.username}, role_id={new_user.role_id}")
    
    return UserResponse.from_orm(new_user)


@app.get("/api/users", response_model=List[UserResponse])
def list_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all users"""
    check_permission(current_user, "list_users", db)
    users = db.query(User).all()
    return [UserResponse.from_orm(u) for u in users]


@app.get("/api/roles", response_model=List[RoleResponse])
def list_roles(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all roles"""
    roles = db.query(Role).all()
    return [RoleResponse.from_orm(r) for r in roles]


@app.put("/api/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_data: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update user (Admin only)"""
    check_permission(current_user, "update_user", db)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    super_admin_role = db.query(Role).filter(Role.name == "Super Admin").first()
    super_admin_role_id = super_admin_role.id if super_admin_role else None
    is_target_super_admin = bool(super_admin_role_id and user.role_id == super_admin_role_id)

    updates = user_data.dict(exclude_unset=True)
    if user.username == "admin":
        if ("is_active" in updates and updates.get("is_active") is False) or ("role_id" in updates and updates.get("role_id") != user.role_id):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Default admin account cannot be deactivated or changed")

    if is_target_super_admin and super_admin_role_id:
        active_super_admins = db.query(User).filter(User.role_id == super_admin_role_id, User.is_active == True).count()
        if active_super_admins <= 1:
            if ("is_active" in updates and updates.get("is_active") is False) or ("role_id" in updates and updates.get("role_id") != super_admin_role_id):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove the last active super admin")

    old_value = f"email={user.email}, role_id={user.role_id}, is_active={user.is_active}"
    for key, value in updates.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    new_value = f"email={user.email}, role_id={user.role_id}, is_active={user.is_active}"
    log_audit(db, current_user.id, "UPDATE_USER", "USER", user.id, old_value=old_value, new_value=new_value)
    return UserResponse.from_orm(user)


@app.delete("/api/users/{user_id}", response_model=MessageResponse)
def delete_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Soft delete (deactivate) a user (Admin only)"""
    check_permission(current_user, "delete_user", db)

    if current_user.id == user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot delete your own account")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.username == "admin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Default admin account cannot be deleted")

    super_admin_role = db.query(Role).filter(Role.name == "Super Admin").first()
    super_admin_role_id = super_admin_role.id if super_admin_role else None
    if super_admin_role_id and user.role_id == super_admin_role_id and user.is_active:
        active_super_admins = db.query(User).filter(User.role_id == super_admin_role_id, User.is_active == True).count()
        if active_super_admins <= 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete the last active super admin")

    if not user.is_active:
        return MessageResponse(message="User already inactive")

    old_value = f"username={user.username}, email={user.email}, role_id={user.role_id}, is_active={user.is_active}"
    user.is_active = False
    db.commit()

    log_audit(db, current_user.id, "DELETE_USER", "USER", user.id, old_value=old_value, new_value="is_active=False")
    return MessageResponse(message="User deleted successfully")


@app.post("/api/users/{user_id}/reset-password", response_model=MessageResponse)
def admin_reset_user_password(
    user_id: int,
    request: AdminResetPasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin resets a user's password and forces password change on next login."""
    check_permission(current_user, "change_user_password", db)

    if request.new_password != request.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match")

    is_valid, error_msg = validate_password_strength(request.new_password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.password_hash = hash_password(request.new_password)
    user.force_password_change = True
    db.commit()

    log_audit(db, current_user.id, "RESET_PASSWORD", "USER", user.id, remarks="Admin reset password")
    return MessageResponse(message="Password reset successfully")


# ============ LOCATION MANAGEMENT ============
@app.post("/api/locations", response_model=LocationResponse)
def create_location(location_data: LocationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create new location"""
    check_permission(current_user, "create_location", db)

    existing = db.query(Location).filter(Location.name == location_data.name).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Location already exists")

    new_location = Location(**location_data.dict())
    db.add(new_location)
    db.commit()
    db.refresh(new_location)

    log_audit(db, current_user.id, "CREATE_LOCATION", "LOCATION", new_location.id,
              new_value=f"name={new_location.name}, type={new_location.location_type}")

    return LocationResponse.from_orm(new_location)


@app.get("/api/locations", response_model=List[LocationResponse])
def list_locations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all active locations"""
    check_permission(current_user, "list_locations", db)
    locations = db.query(Location).filter(Location.is_active == True).all()
    return [LocationResponse.from_orm(l) for l in locations]


@app.put("/api/locations/{location_id}", response_model=LocationResponse)
def update_location(
    location_id: int,
    location_data: LocationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update location"""
    check_permission(current_user, "update_location", db)

    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")

    old_value = f"name={location.name}, type={location.location_type}, is_active={location.is_active}"
    for key, value in location_data.dict(exclude_unset=True).items():
        setattr(location, key, value)

    db.commit()
    db.refresh(location)
    new_value = f"name={location.name}, type={location.location_type}, is_active={location.is_active}"
    log_audit(db, current_user.id, "UPDATE_LOCATION", "LOCATION", location_id, old_value=old_value, new_value=new_value)
    return LocationResponse.from_orm(location)


@app.delete("/api/locations/{location_id}", response_model=MessageResponse)
def delete_location(location_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Soft delete (deactivate) a location"""
    check_permission(current_user, "delete_location", db)

    location = db.query(Location).filter(Location.id == location_id).first()
    if not location:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")

    if not location.is_active:
        return MessageResponse(message="Location already inactive")

    old_value = f"name={location.name}, type={location.location_type}, is_active={location.is_active}"
    location.is_active = False
    db.commit()

    log_audit(db, current_user.id, "DELETE_LOCATION", "LOCATION", location.id, old_value=old_value, new_value="is_active=False")
    return MessageResponse(message="Location deleted successfully")


# ============ ITEM MANAGEMENT ============
@app.post("/api/items", response_model=ItemResponse)
def create_item(item_data: ItemCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create new medical item"""
    check_permission(current_user, "create_item", db)
    
    existing = db.query(Item).filter(Item.sku == item_data.sku).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Item SKU already exists")
    
    new_item = Item(**item_data.dict())
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    
    log_audit(db, current_user.id, "CREATE_ITEM", "ITEM", new_item.id,
              new_value=f"name={new_item.name}, sku={new_item.sku}")
    
    return ItemResponse.from_orm(new_item)


@app.get("/api/items", response_model=List[ItemResponse])
def list_items(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all items"""
    items = db.query(Item).filter(Item.is_active == True).all()
    return [ItemResponse.from_orm(i) for i in items]


@app.get("/api/items/{item_id}", response_model=ItemResponse)
def get_item(item_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get item details"""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return ItemResponse.from_orm(item)


@app.put("/api/items/{item_id}", response_model=ItemResponse)
def update_item(item_id: int, item_data: ItemUpdate, 
               current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update item"""
    check_permission(current_user, "update_item", db)
    
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")

    old_value = (
        f"name={db_item.name}, category={db_item.category}, unit={db_item.unit}, "
        f"reorder_level={db_item.reorder_level}, is_active={db_item.is_active}"
    )
    
    for key, value in item_data.dict(exclude_unset=True).items():
        setattr(db_item, key, value)
    
    db.commit()
    db.refresh(db_item)

    new_value = (
        f"name={db_item.name}, category={db_item.category}, unit={db_item.unit}, "
        f"reorder_level={db_item.reorder_level}, is_active={db_item.is_active}"
    )
    log_audit(db, current_user.id, "UPDATE_ITEM", "ITEM", db_item.id, old_value=old_value, new_value=new_value)
    return ItemResponse.from_orm(db_item)


@app.delete("/api/items/{item_id}")
def delete_item(item_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete item"""
    check_permission(current_user, "delete_item", db)
    
    db_item = db.query(Item).filter(Item.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Soft delete - mark as inactive
    db_item.is_active = False
    db.commit()
    
    log_audit(db, current_user.id, "DELETE_ITEM", "ITEM", db_item.id, 
              old_value=f"name={db_item.name}", new_value="DELETED")
    return {"message": "Item deleted successfully"}


# ============ BATCH MANAGEMENT ============
@app.get("/api/batches", response_model=List[ItemBatchResponse])
def list_batches(item_id: Optional[int] = None, location_id: Optional[int] = None,
                current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List all batches (with optional filters)"""
    query = db.query(ItemBatch)
    
    if item_id:
        query = query.filter(ItemBatch.item_id == item_id)
    if location_id:
        query = query.filter(ItemBatch.location_id == location_id)
    
    batches = query.all()
    return [ItemBatchResponse.from_orm(b) for b in batches]


@app.get("/api/batches/{batch_id}", response_model=ItemBatchResponse)
def get_batch(batch_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get batch details"""
    batch = db.query(ItemBatch).filter(ItemBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")
    return ItemBatchResponse.from_orm(batch)


# ============ STOCK MOVEMENT ENDPOINTS ============
def get_fefo_batch(item_id: int, location_id: int, quantity_needed: int, db: Session):
    """Get batch using FEFO logic (First Expiry First Out)"""
    batches = db.query(ItemBatch).filter(
        ItemBatch.item_id == item_id,
        ItemBatch.location_id == location_id,
        ItemBatch.quantity > 0
    ).order_by(ItemBatch.expiry_date.asc()).all()
    
    if not batches or sum(b.quantity for b in batches) < quantity_needed:
        return None
    
    return batches[0]


def calculate_batch_quantity(batch_id: int, db: Session) -> int:
    """Calculate batch quantity from movements (ledger-based)"""
    movements = db.query(StockMovement).filter(StockMovement.batch_id == batch_id).all()
    total = sum(m.quantity for m in movements)
    return total


@app.post("/api/stock/receive", response_model=MessageResponse)
def receive_stock(request: ReceiveStockRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Receive stock from supplier"""
    check_permission(current_user, "receive_stock", db)
    
    item = db.query(Item).filter(Item.id == request.item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    
    if request.expiry_date <= date.today():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Expiry date cannot be in the past")
    
    # Check if batch exists
    batch = db.query(ItemBatch).filter(
        ItemBatch.item_id == request.item_id,
        ItemBatch.batch_number == request.batch_number,
        ItemBatch.location_id == request.location_id
    ).first()
    
    if not batch:
        batch = ItemBatch(
            item_id=request.item_id,
            batch_number=request.batch_number,
            manufacturing_date=request.manufacturing_date,
            expiry_date=request.expiry_date,
            location_id=request.location_id,
            quantity=0
        )
        db.add(batch)
        db.commit()
        db.refresh(batch)
    
    # Create stock movement
    movement = StockMovement(
        batch_id=batch.id,
        movement_type="RECEIVE",
        quantity=request.quantity,
        location_id=request.location_id,
        reference_number=request.reference_number,
        remarks=request.remarks,
        created_by_id=current_user.id
    )
    db.add(movement)
    
    # Update batch quantity
    batch.quantity += request.quantity
    
    db.commit()
    
    log_audit(db, current_user.id, "RECEIVE_STOCK", "STOCK_MOVEMENT", batch.id,
              new_value=f"batch={request.batch_number}, qty={request.quantity}")
    
    return MessageResponse(message="Stock received successfully")


@app.post("/api/stock/issue", response_model=MessageResponse)
def issue_stock(request: IssueStockRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Issue stock to department (Uses FEFO logic)"""
    check_permission(current_user, "issue_stock", db)
    
    item = db.query(Item).filter(Item.id == request.item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    
    # Get FEFO batch
    batch = get_fefo_batch(request.item_id, request.location_id, request.quantity, db)
    if not batch:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, 
                          detail="Insufficient stock or batch not found")
    
    if batch.quantity < request.quantity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, 
                          detail="Insufficient quantity in selected batch")
    
    # Create issue movement
    movement = StockMovement(
        batch_id=batch.id,
        movement_type="ISSUE",
        quantity=-request.quantity,
        location_id=request.location_id,
        reference_number=request.reference_number,
        remarks=request.remarks,
        created_by_id=current_user.id
    )
    db.add(movement)
    batch.quantity -= request.quantity
    db.commit()
    
    log_audit(db, current_user.id, "ISSUE_STOCK", "STOCK_MOVEMENT", batch.id,
              new_value=f"batch={batch.batch_number}, qty={request.quantity}")
    
    return MessageResponse(message="Stock issued successfully")


@app.post("/api/stock/transfer", response_model=MessageResponse)
def transfer_stock(request: TransferStockRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Transfer stock between locations"""
    check_permission(current_user, "transfer_stock", db)
    
    batch = db.query(ItemBatch).filter(ItemBatch.id == request.batch_id).first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")
    
    if batch.quantity < request.quantity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, 
                          detail="Insufficient quantity")
    
    # Verify source and destination locations exist and are different
    source_location = db.query(Location).filter(Location.id == request.source_location_id).first()
    dest_location = db.query(Location).filter(Location.id == request.destination_location_id).first()
    
    if not source_location or not dest_location:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Location not found")
    
    if request.source_location_id == request.destination_location_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, 
                          detail="Source and destination locations must be different")
    
    # Create deduction movement from source location
    movement_out = StockMovement(
        batch_id=request.batch_id,
        movement_type="TRANSFER",
        quantity=-request.quantity,
        location_id=request.source_location_id,
        reference_number=request.reference_number,
        remarks=f"Transfer to {dest_location.name}",
        created_by_id=current_user.id
    )
    db.add(movement_out)
    
    # Reduce quantity from original batch if it's completely transferred
    if batch.location_id == request.source_location_id:
        if batch.quantity == request.quantity:
            # All quantity transferred - update batch location
            batch.location_id = request.destination_location_id
        else:
            # Partial transfer - keep batch at source, add movement at destination
            batch.quantity -= request.quantity
    else:
        batch.quantity -= request.quantity
    
    # Create addition movement at destination
    movement_in = StockMovement(
        batch_id=request.batch_id,
        movement_type="TRANSFER",
        quantity=request.quantity,
        location_id=request.destination_location_id,
        reference_number=request.reference_number,
        remarks=f"Transfer from {source_location.name}",
        created_by_id=current_user.id
    )
    db.add(movement_in)
    
    db.commit()
    
    log_audit(db, current_user.id, "TRANSFER_STOCK", "STOCK_MOVEMENT", request.batch_id,
              new_value=f"from_loc={request.source_location_id}, to_loc={request.destination_location_id}, qty={request.quantity}")
    
    return MessageResponse(message="Stock transferred successfully")


@app.post("/api/stock/dispose", response_model=MessageResponse)
def dispose_stock(request: DisposeStockRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Dispose expired/damaged stock"""
    check_permission(current_user, "dispose_stock", db)
    
    batch = db.query(ItemBatch).filter(ItemBatch.id == request.batch_id).first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")
    
    if batch.quantity < request.quantity:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, 
                          detail="Insufficient quantity")
    
    # Create disposal movement
    movement = StockMovement(
        batch_id=request.batch_id,
        movement_type="DISPOSE",
        quantity=-request.quantity,
        location_id=batch.location_id,
        reference_number=request.reference_number,
        remarks=f"Reason: {request.reason}",
        created_by_id=current_user.id
    )
    db.add(movement)
    batch.quantity -= request.quantity
    db.commit()
    
    log_audit(db, current_user.id, "DISPOSE_STOCK", "STOCK_MOVEMENT", request.batch_id,
              new_value=f"batch={batch.batch_number}, qty={request.quantity}, reason={request.reason}")
    
    return MessageResponse(message="Stock disposed successfully")


@app.post("/api/stock/adjust", response_model=MessageResponse)
def adjust_stock(request: AdjustStockRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Manual stock adjustment (Authorized users only)"""
    check_permission(current_user, "adjust_stock", db)
    
    batch = db.query(ItemBatch).filter(ItemBatch.id == request.batch_id).first()
    if not batch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Batch not found")
    
    # Create adjustment movement
    movement = StockMovement(
        batch_id=request.batch_id,
        movement_type="ADJUSTMENT",
        quantity=request.adjustment_quantity,
        location_id=batch.location_id,
        reference_number=request.reference_number,
        remarks=f"Reason: {request.reason}",
        created_by_id=current_user.id
    )
    db.add(movement)
    batch.quantity += request.adjustment_quantity
    db.commit()
    
    log_audit(db, current_user.id, "ADJUST_STOCK", "STOCK_MOVEMENT", request.batch_id,
              new_value=f"adjustment={request.adjustment_quantity}, reason={request.reason}")
    
    return MessageResponse(message="Stock adjusted successfully")


# ============ REPORTING ENDPOINTS ============
@app.get("/api/reports/stock", response_model=StockReportResponse)
def get_stock_report(location_id: Optional[int] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get stock on hand report"""
    check_permission(current_user, "view_stock_report", db)
    
    query = db.query(ItemBatch).filter(ItemBatch.quantity > 0)
    if location_id:
        query = query.filter(ItemBatch.location_id == location_id)
    
    batches = query.all()
    items = []
    
    for batch in batches:
        item = batch.item
        location = batch.location
        reorder_level = item.reorder_level
        
        days_until_expiry = (batch.expiry_date - date.today()).days
        
        if batch.quantity == 0:
            status = "OUT_OF_STOCK"
        elif batch.quantity < reorder_level:
            status = "LOW"
        elif batch.expiry_date <= date.today():
            status = "EXPIRED"
        else:
            status = "OK"
        
        items.append(StockReportItem(
            item_id=item.id,
            item_name=item.name,
            sku=item.sku,
            category=item.category,
            unit=item.unit,
            batch_number=batch.batch_number,
            manufacturing_date=batch.manufacturing_date,
            expiry_date=batch.expiry_date,
            location=location.name,
            quantity=batch.quantity,
            reorder_level=reorder_level,
            status=status,
            days_until_expiry=days_until_expiry
        ))
    
    log_audit(db, current_user.id, "VIEW_REPORT", "REPORT", 0, status="SUCCESS", remarks="Stock report viewed")
    
    return StockReportResponse(total_items=len(items), items=items)


@app.get("/api/reports/expiry", response_model=ExpiryReportResponse)
def get_expiry_report(days_threshold: int = 30, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get expiry report"""
    check_permission(current_user, "view_expiry_report", db)
    
    batches = db.query(ItemBatch).filter(ItemBatch.quantity > 0).all()
    today = date.today()
    expired_items = []
    expiring_soon = []
    
    for batch in batches:
        item = batch.item
        location = batch.location
        days_remaining = (batch.expiry_date - today).days
        
        if batch.expiry_date <= today:
            status = "EXPIRED"
            expired_items.append(ExpiryReportItem(
                item_id=item.id,
                item_name=item.name,
                sku=item.sku,
                batch_number=batch.batch_number,
                manufacturing_date=batch.manufacturing_date,
                expiry_date=batch.expiry_date,
                location=location.name,
                quantity=batch.quantity,
                days_remaining=days_remaining,
                status=status
            ))
        elif days_remaining <= days_threshold:
            status = "EXPIRING_SOON"
            expiring_soon.append(ExpiryReportItem(
                item_id=item.id,
                item_name=item.name,
                sku=item.sku,
                batch_number=batch.batch_number,
                manufacturing_date=batch.manufacturing_date,
                expiry_date=batch.expiry_date,
                location=location.name,
                quantity=batch.quantity,
                days_remaining=days_remaining,
                status=status
            ))
    
    log_audit(db, current_user.id, "VIEW_REPORT", "REPORT", 0, status="SUCCESS", remarks="Expiry report viewed")
    
    return ExpiryReportResponse(
        expired_items=expired_items, 
        expiring_soon_items=expiring_soon,
        total_expired=len(expired_items),
        total_expiring_soon=len(expiring_soon)
    )


# ============ AUDIT LOG ENDPOINTS ============
@app.get("/api/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    module: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get audit logs (Auditor/Admin only)"""
    check_permission(current_user, "view_audit_logs", db)
    
    # Validate limit parameter
    limit = min(max(limit, 1), 500)  # Between 1 and 500
    
    query = db.query(AuditLog, User.username).outerjoin(User, AuditLog.user_id == User.id)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action == action)
    if module:
        query = query.filter(AuditLog.module == module)
    if status:
        query = query.filter(AuditLog.status == status)
    if start_date:
        query = query.filter(AuditLog.timestamp >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.filter(AuditLog.timestamp <= datetime.combine(end_date, datetime.max.time()))
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                AuditLog.action.ilike(search_term),
                AuditLog.module.ilike(search_term),
                AuditLog.status.ilike(search_term),
                AuditLog.remarks.ilike(search_term),
                AuditLog.old_value.ilike(search_term),
                AuditLog.new_value.ilike(search_term),
                User.username.ilike(search_term),
            )
        )
    
    logs = query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return [
        AuditLogResponse(
            id=log.id,
            user_id=log.user_id,
            username=username,
            action=log.action,
            module=log.module,
            record_id=log.record_id,
            old_value=log.old_value,
            new_value=log.new_value,
            status=log.status,
            remarks=log.remarks,
            ip_address=log.ip_address,
            timestamp=log.timestamp,
        )
        for log, username in logs
    ]


# ============ ALERT ENDPOINTS ============
@app.get("/api/alerts", response_model=List[SystemAlertResponse])
def list_alerts(
    alert_type: Optional[str] = None,
    severity: Optional[str] = None,
    is_acknowledged: Optional[bool] = None,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List system alerts (low stock / expiry)."""
    check_permission(current_user, "view_alerts", db)

    limit = min(max(limit, 1), 500)
    query = db.query(SystemAlert)
    if alert_type:
        query = query.filter(SystemAlert.alert_type == alert_type)
    if severity:
        query = query.filter(SystemAlert.severity == severity)
    if is_acknowledged is not None:
        query = query.filter(SystemAlert.is_acknowledged == is_acknowledged)

    alerts = query.order_by(SystemAlert.created_at.desc()).limit(limit).all()
    return [SystemAlertResponse.from_orm(a) for a in alerts]


@app.get("/api/alerts/stats")
def get_alert_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get aggregate alert stats for dashboard widgets."""
    check_permission(current_user, "view_alerts", db)

    total = db.query(func.count(SystemAlert.id)).scalar() or 0
    unack = db.query(func.count(SystemAlert.id)).filter(SystemAlert.is_acknowledged == False).scalar() or 0

    by_type = db.query(SystemAlert.alert_type, func.count(SystemAlert.id)).group_by(SystemAlert.alert_type).all()
    by_severity = db.query(SystemAlert.severity, func.count(SystemAlert.id)).group_by(SystemAlert.severity).all()

    return {
        "total": total,
        "unacknowledged": unack,
        "by_type": {t: c for (t, c) in by_type} if by_type else {},
        "by_severity": {s: c for (s, c) in by_severity} if by_severity else {},
    }


@app.post("/api/alerts/{alert_id}/acknowledge", response_model=MessageResponse)
def acknowledge_alert(alert_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Acknowledge an alert."""
    check_permission(current_user, "acknowledge_alerts", db)

    alert = db.query(SystemAlert).filter(SystemAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    if alert.is_acknowledged:
        return MessageResponse(message="Alert already acknowledged")

    alert.is_acknowledged = True
    alert.acknowledged_by = current_user.id
    alert.acknowledged_at = datetime.utcnow()
    db.commit()

    log_audit(
        db,
        current_user.id,
        "ACK_ALERT",
        "ALERT",
        alert.id,
        new_value=f"alert_type={alert.alert_type}, severity={alert.severity}",
        remarks="Alert acknowledged",
    )

    return MessageResponse(message="Alert acknowledged")


# ============ SUPPLIER & PO ENDPOINTS ============
@app.post("/api/suppliers", response_model=SupplierResponse)
def create_supplier(supplier_data: SupplierCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create supplier"""
    check_permission(current_user, "create_item", db)
    
    new_supplier = Supplier(**supplier_data.dict())
    db.add(new_supplier)
    db.commit()
    db.refresh(new_supplier)
    
    log_audit(db, current_user.id, "CREATE_SUPPLIER", "SUPPLIER", new_supplier.id,
              new_value=f"name={new_supplier.name}")
    
    return SupplierResponse.from_orm(new_supplier)


@app.get("/api/suppliers", response_model=List[SupplierResponse])
def list_suppliers(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List suppliers"""
    suppliers = db.query(Supplier).filter(Supplier.is_active == True).all()
    return [SupplierResponse.from_orm(s) for s in suppliers]


@app.delete("/api/suppliers/{supplier_id}", response_model=MessageResponse)
def delete_supplier(supplier_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Soft delete (deactivate) supplier"""
    check_permission(current_user, "create_item", db)

    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")

    if not supplier.is_active:
        return MessageResponse(message="Supplier already inactive")

    old_value = f"name={supplier.name}, email={supplier.email}, phone={supplier.phone}, is_active={supplier.is_active}"
    supplier.is_active = False
    db.commit()

    log_audit(db, current_user.id, "DELETE_SUPPLIER", "SUPPLIER", supplier.id, old_value=old_value, new_value="is_active=False")
    return MessageResponse(message="Supplier deleted successfully")


@app.post("/api/purchase-orders", response_model=PurchaseOrderResponse)
def create_po(po_data: PurchaseOrderCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create purchase order"""
    check_permission(current_user, "create_item", db)
    
    existing = db.query(PurchaseOrder).filter(PurchaseOrder.po_number == po_data.po_number).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PO number already exists")
    
    new_po = PurchaseOrder(**po_data.dict())
    db.add(new_po)
    db.commit()
    db.refresh(new_po)
    
    log_audit(db, current_user.id, "CREATE_PO", "PURCHASE_ORDER", new_po.id,
              new_value=f"po_number={new_po.po_number}, item_id={new_po.item_id}, qty={new_po.quantity}")
    
    return PurchaseOrderResponse.from_orm(new_po)


@app.get("/api/purchase-orders", response_model=List[PurchaseOrderResponse])
def list_pos(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List purchase orders"""
    pos = db.query(PurchaseOrder).all()
    return [PurchaseOrderResponse.from_orm(p) for p in pos]


# ============ HEALTH CHECK ============
@app.get("/api/health")
def health_check():
    """System health check"""
    return {"status": "healthy", "timestamp": datetime.utcnow()}


# ============ DASHBOARD & ANALYTICS ENDPOINTS ============
@app.get("/api/dashboard")
def get_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    try:
        total_items = db.query(Item).count()
        total_locations = db.query(Location).count()
        
        # Low stock items - need subquery to handle grouping properly
        low_stock_subquery = db.query(ItemBatch.item_id, func.sum(ItemBatch.quantity).label('total_qty')).group_by(ItemBatch.item_id).subquery()
        low_stock_count = db.query(func.count(low_stock_subquery.c.item_id)).join(Item, low_stock_subquery.c.item_id == Item.id).filter(
            low_stock_subquery.c.total_qty < Item.reorder_level
        ).scalar() or 0
        
        # Expiring soon items (within 30 days)
        expiring_soon = db.query(ItemBatch).filter(
            ItemBatch.expiry_date <= (date.today() + timedelta(days=30)),
            ItemBatch.expiry_date > date.today()
        ).count()
        
        # Category distribution
        categories = db.query(Item.category, func.count(Item.id)).group_by(Item.category).all()
        
        # Stock movements by type
        movements = db.query(StockMovement.movement_type, func.count(StockMovement.id)).group_by(StockMovement.movement_type).all()
        
        # Location distribution
        locations = db.query(Location.name, func.count(ItemBatch.id)).join(Location, ItemBatch.location_id == Location.id).group_by(Location.name).all()
        
        return {
            "total_items": total_items,
            "total_locations": total_locations,
            "low_stock_count": low_stock_count if low_stock_count else 0,
            "expiring_soon_count": expiring_soon,
            "categories": [cat[0] for cat in categories] if categories else [],
            "category_counts": [cat[1] for cat in categories] if categories else [],
            "movement_types": [m[0] for m in movements] if movements else [],
            "type_counts": [m[1] for m in movements] if movements else [],
            "location_names": [loc[0] for loc in locations] if locations else [],
            "location_counts": [loc[1] for loc in locations] if locations else [],
            "dates": [(date.today() - timedelta(days=i)).isoformat() for i in range(7)],
            "movement_counts": [0] * 7
        }
    except Exception as e:
        print(f"DEBUG: Dashboard error: {str(e)}")
        # Return default values on error
        return {
            "total_items": 0,
            "total_locations": 0,
            "low_stock_count": 0,
            "expiring_soon_count": 0,
            "categories": [],
            "category_counts": [],
            "movement_types": [],
            "type_counts": [],
            "location_names": [],
            "location_counts": [],
            "dates": [(date.today() - timedelta(days=i)).isoformat() for i in range(7)],
            "movement_counts": [0] * 7
        }


@app.get("/api/stock-movements")
def get_stock_movements(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all stock movements"""
    check_any_permission(current_user, ["view_stock_movements", "view_movement_report"], db)
    try:
        movements = db.query(
            StockMovement.id,
            StockMovement.created_at,
            StockMovement.movement_type,
            Item.name.label('item_name'),
            StockMovement.quantity,
            Location.name.label('location_name'),
            StockMovement.reference_number
        ).join(ItemBatch, StockMovement.batch_id == ItemBatch.id).join(
            Item, ItemBatch.item_id == Item.id
        ).join(Location, StockMovement.location_id == Location.id).order_by(StockMovement.created_at.desc()).all()
        
        return [{
            "id": m.id,
            "created_at": m.created_at,
            "movement_type": m.movement_type,
            "item_name": m.item_name,
            "quantity": m.quantity,
            "location_name": m.location_name,
            "reference_number": m.reference_number
        } for m in movements]
    except Exception as e:
        # Return empty list on error
        return []


@app.get("/api/reports/movements")
def get_stock_movement_report(
    movement_type: Optional[str] = None,
    item_id: Optional[int] = None,
    location_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 200,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Filtered stock movement report."""
    check_permission(current_user, "view_movement_report", db)

    limit = min(max(limit, 1), 1000)

    q = db.query(
        StockMovement.id,
        StockMovement.created_at,
        StockMovement.movement_type,
        StockMovement.quantity,
        StockMovement.reference_number,
        StockMovement.remarks,
        Item.id.label('item_id'),
        Item.name.label('item_name'),
        ItemBatch.batch_number.label('batch_number'),
        Location.id.label('location_id'),
        Location.name.label('location_name'),
    ).join(ItemBatch, StockMovement.batch_id == ItemBatch.id).join(
        Item, ItemBatch.item_id == Item.id
    ).join(Location, StockMovement.location_id == Location.id)

    if movement_type:
        q = q.filter(StockMovement.movement_type == movement_type)
    if item_id:
        q = q.filter(Item.id == item_id)
    if location_id:
        q = q.filter(Location.id == location_id)
    if start_date:
        q = q.filter(StockMovement.created_at >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        q = q.filter(StockMovement.created_at <= datetime.combine(end_date, datetime.max.time()))

    rows = q.order_by(StockMovement.created_at.desc()).limit(limit).all()

    log_audit(db, current_user.id, "VIEW_REPORT", "REPORT", 0, status="SUCCESS", remarks="Movement report viewed")
    return [
        {
            "id": r.id,
            "created_at": r.created_at,
            "movement_type": r.movement_type,
            "quantity": r.quantity,
            "reference_number": r.reference_number,
            "remarks": r.remarks,
            "item_id": r.item_id,
            "item_name": r.item_name,
            "batch_number": r.batch_number,
            "location_id": r.location_id,
            "location_name": r.location_name,
        }
        for r in rows
    ]


@app.get("/api/reports")
def get_reports(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get various reports"""
    try:
        # Location summary - count items in each location via ItemBatch
        location_summary = {}
        for loc in db.query(Location).all():
            count = db.query(func.count(distinct(ItemBatch.item_id))).filter(ItemBatch.location_id == loc.id).scalar() or 0
            location_summary[loc.name] = count
        
        # Low stock report - items where total batch quantity < reorder level
        low_stock_subquery = db.query(ItemBatch.item_id, func.sum(ItemBatch.quantity).label('total_qty')).group_by(ItemBatch.item_id).subquery()
        low_stock_items = db.query(Item, low_stock_subquery.c.total_qty).join(low_stock_subquery, Item.id == low_stock_subquery.c.item_id).filter(
            low_stock_subquery.c.total_qty < Item.reorder_level
        ).all()
        low_stock_list = [{
            "name": item[0].name,
            "quantity": int(item[1]) if item[1] else 0,
            "reorder_level": item[0].reorder_level
        } for item in low_stock_items]
        
        # Expiring items
        expiring = db.query(ItemBatch, Item.name).join(Item, ItemBatch.item_id == Item.id).filter(
            ItemBatch.expiry_date <= date.today() + timedelta(days=30)
        ).all()
        expiring_list = [{
            "name": exp[1],
            "expiry_date": exp[0].expiry_date.isoformat()
        } for exp in expiring]
        
        # Movement summary
        movement_summary = {}
        for m in db.query(StockMovement.movement_type, func.count(StockMovement.id)).group_by(StockMovement.movement_type).all():
            movement_summary[m[0]] = m[1]
        
        return {
            "location_summary": location_summary,
            "low_stock": low_stock_list,
            "expiring_items": expiring_list,
            "movement_summary": movement_summary
        }
    except Exception as e:
        # Return empty reports on error
        return {
            "location_summary": {},
            "low_stock": [],
            "expiring_items": [],
            "movement_summary": {}
        }


# ============ FRONTEND SERVING ============
@app.get("/", include_in_schema=False)
def serve_root():
    """Serve root index.html"""
    frontend_dir = react_build_path if os.path.isdir(react_build_path) else legacy_frontend_path
    index_path = os.path.join(frontend_dir, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path, media_type="text/html")
    raise HTTPException(status_code=404, detail="index.html not found")


@app.get("/{file_path:path}", include_in_schema=False)
def serve_frontend(file_path: str):
    """Serve frontend files (only non-API paths)"""
    # Skip API paths - they are handled by FastAPI routes
    if file_path.startswith("api") or file_path.startswith(".well-known"):
        raise HTTPException(status_code=404, detail="Not found")
    
    frontend_dir = react_build_path if os.path.isdir(react_build_path) else legacy_frontend_path
    
    # Default to index.html if root is requested
    if not file_path or file_path == "":
        file_path = "index.html"
    
    # Prevent directory traversal attacks
    full_path = os.path.abspath(os.path.join(frontend_dir, file_path))
    if not full_path.startswith(frontend_dir):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if file exists
    if os.path.isfile(full_path):
        mime_type, _ = mimetypes.guess_type(full_path)
        return FileResponse(full_path, media_type=mime_type or "text/plain")
    
    # If file not found, serve index.html (SPA fallback)
    index_path = os.path.join(frontend_dir, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path, media_type="text/html")
    
    raise HTTPException(status_code=404, detail="File not found")


if __name__ == "__main__":
    import uvicorn
    init_db()
    uvicorn.run(app, host="127.0.0.1", port=8000)
