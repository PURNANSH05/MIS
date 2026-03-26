import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, Dict
import os
from dotenv import load_dotenv

load_dotenv()

# Security Configuration - MUST be changed in production
SECRET_KEY = os.getenv("SECRET_KEY", "medical-inventory-secret-key-change-in-production-immediately")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Password policy
MIN_PASSWORD_LENGTH = 8
REQUIRE_SPECIAL_CHARACTERS = True


def hash_password(password: str) -> str:
    """Hash password using bcrypt with salt rounds"""
    # Validate password length
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"Password must be at least {MIN_PASSWORD_LENGTH} characters")
    
    # Truncate password to 72 bytes (bcrypt limitation)
    password_bytes = password[:72].encode('utf-8')
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt(rounds=12)).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password using bcrypt - Constant time comparison"""
    try:
        # Truncate password to 72 bytes (bcrypt limitation)
        plain_password_bytes = plain_password[:72].encode('utf-8')
        return bcrypt.checkpw(plain_password_bytes, hashed_password.encode('utf-8'))
    except Exception:
        return False


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password meets security requirements
    Returns: (is_valid, error_message)
    """
    if len(password) < MIN_PASSWORD_LENGTH:
        return False, f"Password must be at least {MIN_PASSWORD_LENGTH} characters"
    
    if REQUIRE_SPECIAL_CHARACTERS:
        has_upper = any(c.isupper() for c in password)
        has_lower = any(c.islower() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
        
        if not (has_upper and has_lower and has_digit and has_special):
            return False, "Password must contain uppercase, lowercase, numbers, and special characters"
    
    return True, ""


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> Optional[Dict]:
    """
    Verify JWT token and extract payload
    Returns: Dict with user_id, role, or None if invalid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Verify token type
        if payload.get("type") != token_type:
            return None
        
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            return None
        
        try:
            user_id = int(user_id_str)
        except (ValueError, TypeError):
            return None
        
        result = {
            "user_id": user_id,
            "role": payload.get("role"),
            "username": payload.get("username")
        }
        return result
    except JWTError:
        return None
    except Exception:
        return None


# Comprehensive Role-Based Access Control
ROLE_PERMISSIONS = {
    "Super Admin": [
        # User Management
        "create_user", "update_user", "delete_user", "list_users",
        "manage_roles", "change_user_password",
        # Item Management
        "create_item", "update_item", "delete_item", "view_items", "list_items",
        # Location Management
        "create_location", "update_location", "delete_location", "list_locations",
        # Stock Operations
        "receive_stock", "issue_stock", "transfer_stock", "dispose_stock",
        "adjust_stock", "approve_adjustment", "view_stock_movements",
        # Reporting
        "view_stock_report", "view_expiry_report", "view_movement_report",
        "view_audit_logs", "export_reports",
        # System
        "system_config", "manage_alerts", "acknowledge_alerts", "view_alerts"
    ],
    "Admin": [
        # User Management
        "create_user", "update_user", "delete_user", "list_users",
        "manage_roles", "change_user_password",
        # Item and stock management
        "create_item", "update_item", "delete_item", "view_items", "list_items",
        "create_location", "update_location", "delete_location", "list_locations",
        "receive_stock", "issue_stock", "transfer_stock", "dispose_stock",
        "adjust_stock", "approve_adjustment", "view_stock_movements",
        # Reporting and audit
        "view_stock_report", "view_expiry_report", "view_movement_report",
        "view_audit_logs",
        "export_reports",
        # Alerts
        "manage_alerts", "acknowledge_alerts", "view_alerts",
    ],
    "Inventory Manager": [
        # Item Management
        "create_item", "update_item", "view_items", "list_items",
        # Location Management
        "create_location", "update_location", "list_locations",
        # Stock Operations
        "receive_stock", "issue_stock", "transfer_stock", "dispose_stock",
        "adjust_stock", "approve_adjustment", "view_stock_movements",
        # Reporting
        "view_stock_report", "view_expiry_report", "view_movement_report",
        "view_audit_logs", "export_reports",
        # Alerts
        "view_alerts", "acknowledge_alerts"
    ],
    "Pharmacist": [
        # Item Management
        "view_items", "list_items",
        # Stock Operations
        "receive_stock", "issue_stock", "view_stock_movements",
        # Reporting
        "view_stock_report", "view_expiry_report", "export_reports",
        # Alerts
        "view_alerts"
    ],
    "Storekeeper": [
        # Item Management
        "view_items", "list_items",
        # Stock Operations
        "receive_stock", "issue_stock", "transfer_stock", "view_stock_movements",
        # Reporting
        "view_stock_report", "export_reports",
        # Alerts
        "view_alerts"
    ],
    "Auditor": [
        # Item Management
        "view_items", "list_items",
        # Location Management
        "list_locations",
        # Reporting
        "view_stock_report", "view_expiry_report", "view_movement_report",
        "view_audit_logs", "export_reports",
        # Alerts
        "view_alerts"
    ]
}


ROLE_NAME_ALIASES = {
    "super admin": "Super Admin",
    "admin": "Admin",
    "inventory manager": "Inventory Manager",
    "pharmacist": "Pharmacist",
    "storekeeper": "Storekeeper",
    "auditor": "Auditor",
}


def normalize_role_name(role: Optional[str]) -> str:
    """Normalize stored role names so permission checks are case-tolerant."""
    if not role:
        return ""
    return ROLE_NAME_ALIASES.get(role.strip().lower(), role.strip())


def has_permission(role: str, permission: str) -> bool:
    """Check if role has specific permission"""
    normalized_role = normalize_role_name(role)
    if normalized_role not in ROLE_PERMISSIONS:
        return False
    return permission in ROLE_PERMISSIONS[normalized_role]


def get_role_permissions(role: str) -> list:
    """Get all permissions for a role"""
    return ROLE_PERMISSIONS.get(normalize_role_name(role), [])
