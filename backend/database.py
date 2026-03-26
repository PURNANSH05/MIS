from sqlalchemy import create_engine, Column, Integer, String, Float, Date, DateTime, ForeignKey, Text, Boolean, Enum, UniqueConstraint, Index, CheckConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum
import os
from dotenv import load_dotenv

load_dotenv()

# Database Configuration - Support both SQLite (development) and PostgreSQL (production)
DB_TYPE = os.getenv("DB_TYPE", "sqlite").lower()

if DB_TYPE == "postgresql":
    # PostgreSQL Database Configuration (Production)
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = os.getenv("DB_PORT", "5432")
    DB_NAME = os.getenv("DB_NAME", "medical_inventory")
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    
    # Connection pooling with proper timeout settings
    engine = create_engine(
        DATABASE_URL, 
        pool_pre_ping=True, 
        pool_recycle=3600,
        echo=False,
        pool_size=10,
        max_overflow=20
    )
else:
    # SQLite Database Configuration (Development - No PostgreSQL needed!)
    db_path = os.path.join(os.path.dirname(__file__), "medical_inventory.db")
    DATABASE_URL = f"sqlite:///{db_path}"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False
    )
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Role(Base):
    """Role model for role-based access control"""
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    users = relationship("User", back_populates="role")


class User(Base):
    """User model with authentication fields"""
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="RESTRICT"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    force_password_change = Column(Boolean, default=True, nullable=False)
    last_login = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    role = relationship("Role", back_populates="users")
    audit_logs = relationship("AuditLog", back_populates="user")
    login_sessions = relationship("LoginSession", back_populates="user", cascade="all, delete-orphan")


class Location(Base):
    """Location model for warehouse, pharmacy, and ward locations"""
    __tablename__ = "locations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    location_type = Column(String(50), nullable=False)  # "Warehouse", "Pharmacy", "Ward", etc.
    description = Column(String(255))
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    batches = relationship("ItemBatch", back_populates="location")
    movements = relationship("StockMovement", back_populates="location")


class Item(Base):
    """Medical item master data"""
    __tablename__ = "items"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False)
    sku = Column(String(50), unique=True, index=True, nullable=False)
    category = Column(String(50), index=True, nullable=False)
    unit = Column(String(20), nullable=False)  # "Tablet", "Bottle", "Box", etc.
    reorder_level = Column(Integer, default=10, nullable=False)
    description = Column(String(255))
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    batches = relationship("ItemBatch", back_populates="item")


class ItemBatch(Base):
    """Batch-level inventory tracking with expiry dates"""
    __tablename__ = "item_batches"
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"), nullable=False)
    batch_number = Column(String(50), nullable=False)
    manufacturing_date = Column(Date, nullable=False)
    expiry_date = Column(Date, index=True, nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="RESTRICT"), nullable=False)
    quantity = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        UniqueConstraint('item_id', 'batch_number', 'location_id', name='uq_item_batch_location'),
        Index('idx_expiry_date', 'expiry_date'),
        Index('idx_location_expiry', 'location_id', 'expiry_date'),
    )
    
    item = relationship("Item", back_populates="batches")
    location = relationship("Location", back_populates="batches")
    movements = relationship("StockMovement", back_populates="batch", cascade="all, delete-orphan")


class StockMovementType(str, enum.Enum):
    """Enumeration of stock movement types"""
    RECEIVE = "RECEIVE"
    ISSUE = "ISSUE"
    TRANSFER = "TRANSFER"
    DISPOSE = "DISPOSE"
    ADJUSTMENT = "ADJUSTMENT"


class StockMovement(Base):
    """Immutable ledger of all stock movements (CRITICAL: append-only, never edit)"""
    __tablename__ = "stock_movements"
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("item_batches.id", ondelete="RESTRICT"), nullable=False)
    movement_type = Column(String(20), index=True, nullable=False)
    quantity = Column(Integer, nullable=False)  # Can be negative for issues/disposals
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="RESTRICT"), nullable=False)
    reference_number = Column(String(50), index=True)
    remarks = Column(Text)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    created_at = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    
    __table_args__ = (
        Index('idx_batch_created', 'batch_id', 'created_at'),
        Index('idx_movement_type_date', 'movement_type', 'created_at'),
    )
    
    batch = relationship("ItemBatch", back_populates="movements")
    location = relationship("Location", back_populates="movements")
    created_by = relationship("User")


class Supplier(Base):
    """Supplier master data"""
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True, nullable=False, unique=True)
    contact_person = Column(String(100))
    phone = Column(String(20))
    email = Column(String(100))
    address = Column(String(255))
    city = Column(String(50))
    country = Column(String(50))
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class PurchaseOrder(Base):
    """Purchase order tracking"""
    __tablename__ = "purchase_orders"
    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String(50), unique=True, index=True, nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="RESTRICT"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id", ondelete="RESTRICT"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float)
    status = Column(String(20), default="PENDING", nullable=False, index=True)  # PENDING, ORDERED, RECEIVED, CANCELLED
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expected_delivery = Column(Date)
    actual_delivery = Column(Date)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    supplier = relationship("Supplier")
    item = relationship("Item")


class AuditLog(Base):
    """Comprehensive audit trail for all system actions"""
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    action = Column(String(50), index=True, nullable=False)  # CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
    module = Column(String(50), nullable=False)  # USER, ITEM, BATCH, STOCK_MOVEMENT, REPORT, etc.
    record_id = Column(Integer)
    old_value = Column(Text)
    new_value = Column(Text)
    status = Column(String(20), nullable=False, default="SUCCESS")  # SUCCESS, FAILED
    remarks = Column(Text)
    ip_address = Column(String(50))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    
    __table_args__ = (
        Index('idx_user_action', 'user_id', 'action'),
        Index('idx_module_date', 'module', 'timestamp'),
        Index('idx_action_date', 'action', 'timestamp'),
    )
    
    user = relationship("User", back_populates="audit_logs")


class LoginSession(Base):
    """Comprehensive login/logout session tracking"""
    __tablename__ = "login_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_token = Column(String(255), unique=True, index=True, nullable=False)
    login_time = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    logout_time = Column(DateTime, nullable=True, index=True)
    session_duration = Column(Integer, nullable=True)  # Duration in seconds
    ip_address = Column(String(50), nullable=False, index=True)
    user_agent = Column(Text, nullable=False)
    browser = Column(String(100), nullable=False)
    operating_system = Column(String(100), nullable=False)
    device_type = Column(String(50), nullable=False)  # Desktop, Mobile, Tablet
    login_status = Column(String(20), default="ACTIVE", nullable=False)  # ACTIVE, LOGGED_OUT, EXPIRED, FORCED_LOGOUT
    logout_reason = Column(String(100), nullable=True)  # MANUAL, TIMEOUT, FORCED, SYSTEM
    last_activity = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    __table_args__ = (
        Index('idx_user_session', 'user_id', 'login_time'),
        Index('idx_session_token', 'session_token'),
        Index('idx_login_time', 'login_time'),
        Index('idx_ip_address', 'ip_address'),
        Index('idx_login_status', 'login_status'),
    )
    
    user = relationship("User")


class SystemAlert(Base):
    """System alerts for low stock and expiry notifications"""
    __tablename__ = "system_alerts"
    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(String(30), nullable=False, index=True)  # "LOW_STOCK", "EXPIRING_SOON", "EXPIRED"
    batch_id = Column(Integer, ForeignKey("item_batches.id", ondelete="CASCADE"))
    item_id = Column(Integer, ForeignKey("items.id", ondelete="CASCADE"))
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="RESTRICT"))
    severity = Column(String(20), default="WARNING", nullable=False)  # INFO, WARNING, CRITICAL
    message = Column(Text, nullable=False)
    is_acknowledged = Column(Boolean, default=False, nullable=False)
    acknowledged_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    acknowledged_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, index=True, nullable=False)
    resolved_at = Column(DateTime)
    
    __table_args__ = (
        Index('idx_alert_type_ack', 'alert_type', 'is_acknowledged'),
        Index('idx_location_created', 'location_id', 'created_at'),
    )
    
    batch = relationship("ItemBatch")
    item = relationship("Item")
    location = relationship("Location")


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
