from pydantic import BaseModel, field_validator, EmailStr, Field
from datetime import date, datetime
from typing import Optional, List


# ============ User & Auth Models ============
class UserBase(BaseModel):
    username: str
    email: str
    role_id: int


class UserCreate(UserBase):
    password: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if '@' not in v or '.' not in v:
            raise ValueError('Invalid email format')
        return v


class UserUpdate(BaseModel):
    email: Optional[str] = None
    role_id: Optional[int] = None
    is_active: Optional[bool] = None


class AdminResetPasswordRequest(BaseModel):
    new_password: str
    confirm_password: str

    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str
    confirm_password: str
    
    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v


class UserResponse(UserBase):
    id: int
    is_active: bool
    force_password_change: bool
    last_login: Optional[datetime] = None
    created_at: datetime
    role: Optional['RoleResponse'] = None
    
    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    user: UserResponse
    force_password_change: bool = False


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None


class RoleResponse(RoleBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============ Location Models ============
class LocationBase(BaseModel):
    name: str
    location_type: str
    description: Optional[str] = None


class LocationCreate(LocationBase):
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if len(v) < 2:
            raise ValueError('Location name must be at least 2 characters')
        return v.strip()


class LocationUpdate(BaseModel):
    name: Optional[str] = None
    location_type: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class LocationResponse(LocationBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============ Item Models ============
class ItemBase(BaseModel):
    name: str
    sku: str
    category: str
    unit: str
    reorder_level: Optional[int] = 10
    description: Optional[str] = None


class ItemCreate(ItemBase):
    @field_validator('sku')
    @classmethod
    def validate_sku(cls, v):
        if len(v) < 2 or len(v) > 50:
            raise ValueError('SKU must be between 2 and 50 characters')
        return v.upper().strip()
    
    @field_validator('reorder_level')
    @classmethod
    def validate_reorder(cls, v):
        if v and v < 0:
            raise ValueError('Reorder level cannot be negative')
        return v


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    reorder_level: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class ItemResponse(ItemBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============ Batch Models ============
class ItemBatchBase(BaseModel):
    item_id: int
    batch_number: str
    manufacturing_date: date
    expiry_date: date
    location_id: int
    quantity: int


class ItemBatchCreate(ItemBatchBase):
    @field_validator('expiry_date')
    @classmethod
    def validate_expiry(cls, v):
        if v <= date.today():
            raise ValueError('Expiry date must be in the future')
        return v
    
    @field_validator('manufacturing_date')
    @classmethod
    def validate_mfg_date(cls, v):
        if v > date.today():
            raise ValueError('Manufacturing date cannot be in the future')
        return v
    
    @field_validator('quantity')
    @classmethod
    def validate_qty(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be greater than 0')
        return v


class ItemBatchUpdate(BaseModel):
    quantity: Optional[int] = None
    location_id: Optional[int] = None


class ItemBatchResponse(ItemBatchBase):
    id: int
    created_at: datetime
    updated_at: datetime
    item: Optional[ItemResponse] = None
    location: Optional[LocationResponse] = None
    days_until_expiry: Optional[int] = None
    
    class Config:
        from_attributes = True


# ============ Stock Movement Models ============
class StockMovementBase(BaseModel):
    batch_id: int
    movement_type: str
    quantity: int
    location_id: int
    reference_number: str
    remarks: Optional[str] = None


class StockMovementCreate(StockMovementBase):
    pass


class StockMovementResponse(StockMovementBase):
    id: int
    created_at: datetime
    created_by_id: int
    
    class Config:
        from_attributes = True


# ============ Stock Operation Models ============
class ReceiveStockRequest(BaseModel):
    item_id: int
    batch_number: str
    manufacturing_date: date
    expiry_date: date
    location_id: int
    quantity: int
    reference_number: str
    remarks: Optional[str] = None
    
    @field_validator('quantity')
    @classmethod
    def validate_qty(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be greater than 0')
        return v
    
    @field_validator('expiry_date')
    @classmethod
    def validate_expiry(cls, v):
        if v <= date.today():
            raise ValueError('Expiry date must be in the future')
        return v


class IssueStockRequest(BaseModel):
    item_id: int
    quantity: int
    location_id: int
    reference_number: str
    remarks: Optional[str] = None
    
    @field_validator('quantity')
    @classmethod
    def validate_qty(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be greater than 0')
        return v


class TransferStockRequest(BaseModel):
    batch_id: int
    source_location_id: int
    destination_location_id: int
    quantity: int
    reference_number: str
    remarks: Optional[str] = None
    
    @field_validator('source_location_id', 'destination_location_id')
    @classmethod
    def validate_locations_different(cls, v, info):
        if info.field_name == 'destination_location_id':
            source = info.data.get('source_location_id')
            if source and v == source:
                raise ValueError('Source and destination locations must be different')
        return v


class DisposeStockRequest(BaseModel):
    batch_id: int
    quantity: int
    reason: str
    reference_number: str
    
    @field_validator('quantity')
    @classmethod
    def validate_qty(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be greater than 0')
        return v
    
    @field_validator('reason')
    @classmethod
    def validate_reason(cls, v):
        if len(v) < 5:
            raise ValueError('Disposal reason must be at least 5 characters')
        return v


class AdjustStockRequest(BaseModel):
    batch_id: int
    adjustment_quantity: int
    reason: str
    reference_number: str
    
    @field_validator('reason')
    @classmethod
    def validate_reason(cls, v):
        if len(v) < 5:
            raise ValueError('Adjustment reason must be at least 5 characters')
        return v


# ============ Supplier Models ============
class SupplierBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None


class SupplierCreate(SupplierBase):
    @field_validator('name')
    @classmethod
    def validate_name(cls, v):
        if len(v) < 2:
            raise ValueError('Supplier name must be at least 2 characters')
        return v.strip()
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if v and '@' not in v:
            raise ValueError('Invalid email format')
        return v


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    is_active: Optional[bool] = None


class SupplierResponse(SupplierBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============ Purchase Order Models ============
class PurchaseOrderBase(BaseModel):
    po_number: str
    supplier_id: int
    item_id: int
    quantity: int
    unit_price: Optional[float] = None
    expected_delivery: date


class PurchaseOrderCreate(PurchaseOrderBase):
    @field_validator('quantity')
    @classmethod
    def validate_qty(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be greater than 0')
        return v


class PurchaseOrderUpdate(BaseModel):
    status: Optional[str] = None
    actual_delivery: Optional[date] = None


class PurchaseOrderResponse(PurchaseOrderBase):
    id: int
    status: str
    created_at: datetime
    actual_delivery: Optional[date] = None
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============ Audit Log Models ============
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    module: str
    record_id: int
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    status: str
    remarks: Optional[str] = None
    ip_address: Optional[str] = None
    timestamp: datetime
    
    class Config:
        from_attributes = True


# ============ Alert Models ============
class SystemAlertResponse(BaseModel):
    id: int
    alert_type: str
    item_id: Optional[int] = None
    batch_id: Optional[int] = None
    location_id: Optional[int] = None
    severity: str
    message: str
    is_acknowledged: bool
    created_at: datetime
    resolved_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# ============ Report Models ============
class StockReportItem(BaseModel):
    item_id: int
    item_name: str
    sku: str
    category: str
    unit: str
    batch_number: str
    manufacturing_date: date
    expiry_date: date
    location: str
    quantity: int
    reorder_level: int
    status: str  # "OK", "LOW", "EXPIRED"
    days_until_expiry: int


class StockReportResponse(BaseModel):
    total_items: int
    items: List[StockReportItem]
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class ExpiryReportItem(BaseModel):
    item_id: int
    item_name: str
    sku: str
    batch_number: str
    manufacturing_date: date
    expiry_date: date
    location: str
    quantity: int
    days_remaining: int
    status: str  # "EXPIRED", "EXPIRING_SOON", "OK"


class ExpiryReportResponse(BaseModel):
    expired_items: List[ExpiryReportItem]
    expiring_soon_items: List[ExpiryReportItem]
    total_expired: int
    total_expiring_soon: int
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class StockMovementReportItem(BaseModel):
    id: int
    date: datetime
    movement_type: str
    item_name: str
    batch_number: str
    quantity: int
    location: str
    reference_number: str
    created_by: str
    remarks: Optional[str] = None


class StockMovementReportResponse(BaseModel):
    total_movements: int
    movements: List[StockMovementReportItem]
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class DashboardResponse(BaseModel):
    total_items: int
    total_locations: int
    total_suppliers: int
    low_stock_count: int
    expiring_soon_count: int
    expired_count: int
    total_stock_value: Optional[float] = None
    recent_movements: List[StockMovementReportItem]
    generated_at: datetime = Field(default_factory=datetime.utcnow)


# ============ General Response Models ============
class MessageResponse(BaseModel):
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ErrorResponse(BaseModel):
    detail: str
    status_code: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class SuccessResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
