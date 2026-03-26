import axios from 'axios';
import { toast } from 'react-toastify';

export const AUTH_STORAGE_KEYS = {
  accessToken: 'token',
  refreshToken: 'refreshToken',
};

export const getStoredAccessToken = () => localStorage.getItem(AUTH_STORAGE_KEYS.accessToken);
export const getStoredRefreshToken = () => localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken);

export const storeAuthTokens = ({ accessToken, refreshToken }) => {
  if (accessToken) {
    localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, accessToken);
  }
  if (refreshToken) {
    localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, refreshToken);
  }
};

export const clearStoredAuth = () => {
  localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
  localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
};

const configuredApiBaseUrl = (process.env.REACT_APP_API_BASE_URL || '').trim();
const apiBaseUrl = configuredApiBaseUrl && configuredApiBaseUrl !== '/'
  ? configuredApiBaseUrl.replace(/\/+$/, '')
  : '';

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise = null;

const ROLE_PERMISSION_FALLBACKS = {
  'Super Admin': [
    'create_user', 'update_user', 'delete_user', 'list_users',
    'manage_roles', 'change_user_password',
    'create_item', 'update_item', 'delete_item', 'list_items', 'view_items',
    'create_location', 'update_location', 'delete_location', 'list_locations',
    'receive_stock', 'issue_stock', 'transfer_stock', 'dispose_stock',
    'adjust_stock', 'approve_adjustment', 'view_stock_movements',
    'view_stock_report', 'view_expiry_report', 'view_movement_report',
    'view_audit_logs', 'export_reports',
    'system_config', 'manage_alerts', 'acknowledge_alerts', 'view_alerts'
  ],
  'Admin': [
    'create_user', 'update_user', 'delete_user', 'list_users',
    'manage_roles', 'change_user_password',
    'create_item', 'update_item', 'delete_item', 'list_items', 'view_items',
    'create_location', 'update_location', 'delete_location', 'list_locations',
    'receive_stock', 'issue_stock', 'transfer_stock', 'dispose_stock',
    'adjust_stock', 'approve_adjustment', 'view_stock_movements',
    'view_stock_report', 'view_expiry_report', 'view_movement_report',
    'view_audit_logs', 'export_reports',
    'manage_alerts', 'acknowledge_alerts', 'view_alerts'
  ],
  'Inventory Manager': [
    'create_item', 'update_item', 'view_items', 'list_items',
    'create_location', 'update_location', 'list_locations',
    'receive_stock', 'issue_stock', 'transfer_stock', 'dispose_stock',
    'adjust_stock', 'approve_adjustment', 'view_stock_movements',
    'view_stock_report', 'view_expiry_report', 'view_movement_report',
    'view_audit_logs', 'export_reports',
    'view_alerts', 'acknowledge_alerts'
  ],
  Pharmacist: [
    'view_items', 'list_items',
    'receive_stock', 'issue_stock', 'view_stock_movements',
    'view_stock_report', 'view_expiry_report', 'export_reports',
    'view_alerts'
  ],
  Storekeeper: [
    'view_items', 'list_items',
    'receive_stock', 'issue_stock', 'transfer_stock', 'view_stock_movements',
    'view_stock_report', 'export_reports',
    'view_alerts'
  ],
  Auditor: [
    'view_items', 'list_items', 'list_locations',
    'view_stock_report', 'view_expiry_report', 'view_movement_report',
    'view_audit_logs', 'export_reports',
    'view_alerts'
  ],
  admin: [
    'create_user', 'update_user', 'delete_user', 'list_users',
    'manage_roles', 'change_user_password',
    'create_item', 'update_item', 'delete_item', 'list_items', 'view_items',
    'create_location', 'update_location', 'delete_location', 'list_locations',
    'receive_stock', 'issue_stock', 'transfer_stock', 'dispose_stock',
    'adjust_stock', 'approve_adjustment', 'view_stock_movements',
    'view_stock_report', 'view_expiry_report', 'view_movement_report',
    'view_audit_logs', 'export_reports',
    'manage_alerts', 'acknowledge_alerts', 'view_alerts'
  ]
};

const resolveRoleName = (userPayload) => {
  if (!userPayload) return '';
  if (typeof userPayload.role === 'string') return userPayload.role;
  if (typeof userPayload.role?.name === 'string') return userPayload.role.name;
  return '';
};

const buildPermissionsFallback = async () => {
  const meResponse = await apiClient.get('/api/auth/me');
  const userPayload = meResponse?.data || {};
  const role = resolveRoleName(userPayload);
  return {
    data: {
      role,
      permissions: ROLE_PERMISSION_FALLBACKS[role] || [],
    },
  };
};

const shouldAttemptRefresh = (error) => {
  const status = error?.response?.status;
  const url = error?.config?.url || '';

  if (status !== 401) {
    return false;
  }

  if (error?.config?._retry) {
    return false;
  }

  return !['/api/login', '/api/auth/logout', '/api/auth/refresh'].some((path) => url.includes(path));
};

const refreshAccessToken = async () => {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    throw new Error('Missing refresh token');
  }

  const response = await refreshClient.post('/api/auth/refresh', {
    refresh_token: refreshToken,
  });

  const nextAccessToken = response?.data?.access_token;
  if (!nextAccessToken) {
    throw new Error('Refresh endpoint did not return a new access token');
  }

  storeAuthTokens({ accessToken: nextAccessToken });
  return nextAccessToken;
};

apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredAccessToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (shouldAttemptRefresh(error)) {
      try {
        refreshPromise = refreshPromise || refreshAccessToken();
        const nextAccessToken = await refreshPromise;
        error.config._retry = true;
        error.config.headers = error.config.headers || {};
        error.config.headers.Authorization = `Bearer ${nextAccessToken}`;
        return apiClient(error.config);
      } catch (refreshError) {
        clearStoredAuth();
        if (window.location.pathname !== '/login') {
          toast.error('Your session has expired. Please log in again.');
        }
        return Promise.reject(refreshError);
      } finally {
        refreshPromise = null;
      }
    }

    if (error?.response?.status === 401) {
      clearStoredAuth();
      if (window.location.pathname !== '/login') {
        toast.error('Your session has expired. Please log in again.');
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (credentials) => {
    const response = await apiClient.post('/api/login', credentials);
    if (response?.data?.access_token) {
      storeAuthTokens({
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
      });
    }
    return response;
  },
  
  logout: async () => {
    const response = await apiClient.post('/api/auth/logout');
    clearStoredAuth();
    return response;
  },
  
  getCurrentUser: async () => {
    return apiClient.get('/api/auth/me');
  },
  
  getPermissions: async () => {
    try {
      return await apiClient.get('/api/auth/permissions');
    } catch (error) {
      if (error?.response?.status === 404) {
        return buildPermissionsFallback();
      }
      throw error;
    }
  }
};

export const dashboardAPI = {
  getDashboardData: () => {
    return apiClient.get('/api/dashboard');
  },
  
  getRecentActivity: () => {
    return apiClient.get('/api/stock-movements');
  },
  
  refreshDashboard: () => {
    return apiClient.get('/api/dashboard');
  }
};

export const itemsAPI = {
  getItems: (params = {}) => {
    return apiClient.get('/api/items', { params });
  },
  createItem: (payload) => apiClient.post('/api/items', payload),
  updateItem: (itemId, payload) => apiClient.put(`/api/items/${itemId}`, payload),
  deleteItem: (itemId) => apiClient.delete(`/api/items/${itemId}`),
};

export const batchesAPI = {
  getBatches: (params = {}) => apiClient.get('/api/batches', { params }),
};

export const locationsAPI = {
  getLocations: (params = {}) => apiClient.get('/api/locations', { params }),
  createLocation: (payload) => apiClient.post('/api/locations', payload),
  updateLocation: (locationId, payload) => apiClient.put(`/api/locations/${locationId}`, payload),
  deleteLocation: (locationId) => apiClient.delete(`/api/locations/${locationId}`),
};

export const suppliersAPI = {
  getSuppliers: (params = {}) => apiClient.get('/api/suppliers', { params }),
  createSupplier: (payload) => apiClient.post('/api/suppliers', payload),
  deleteSupplier: (supplierId) => apiClient.delete(`/api/suppliers/${supplierId}`),
};

export const stockAPI = {
  receiveStock: (payload) => apiClient.post('/api/stock/receive', payload),
  issueStock: (payload) => apiClient.post('/api/stock/issue', payload),
  transferStock: (payload) => apiClient.post('/api/stock/transfer', payload),
  disposeStock: (payload) => apiClient.post('/api/stock/dispose', payload),
  adjustStock: (payload) => apiClient.post('/api/stock/adjust', payload),
};

export const purchaseOrdersAPI = {
  getPurchaseOrders: (params = {}) => apiClient.get('/api/purchase-orders', { params }),
  createPurchaseOrder: (payload) => apiClient.post('/api/purchase-orders', payload),
};

export const reportsAPI = {
  getReports: () => apiClient.get('/api/reports'),
  getStockReport: (params = {}) => apiClient.get('/api/reports/stock', { params }),
  getExpiryReport: (params = {}) => apiClient.get('/api/reports/expiry', { params }),
  getMovementReport: (params = {}) => apiClient.get('/api/reports/movements', { params }),
  getAuditReport: (params = {}) => apiClient.get('/api/audit-logs', { params }),
};

export const auditAPI = {
  getAuditLogs: (params = {}) => apiClient.get('/api/audit-logs', { params }),
};

export const usersAPI = {
  getUsers: (params = {}) => apiClient.get('/api/users', { params }),
  createUser: (payload) => apiClient.post('/api/users', payload),
  updateUser: (userId, payload) => apiClient.put(`/api/users/${userId}`, payload),
  deleteUser: (userId) => apiClient.delete(`/api/users/${userId}`),
  resetPassword: (userId, payload) => apiClient.post(`/api/users/${userId}/reset-password`, payload),
  getRoles: () => apiClient.get('/api/roles'),
};

export const settingsAPI = {
  getSettings: () => ({ data: {} }),
  getSystemInfo: () => ({ data: {} })
};

export const alertsAPI = {
  // Backend alert endpoints will be added next. Keep these methods so UI can be wired.
  getAlerts: (params = {}) => apiClient.get('/api/alerts', { params }),
  acknowledgeAlert: (alertId) => apiClient.post(`/api/alerts/${alertId}/acknowledge`),
  getAlertStats: () => apiClient.get('/api/alerts/stats'),
};

export default {
  authAPI,
  dashboardAPI,
  itemsAPI,
  batchesAPI,
  locationsAPI,
  suppliersAPI,
  stockAPI,
  purchaseOrdersAPI,
  reportsAPI,
  auditAPI,
  usersAPI,
  settingsAPI,
  alertsAPI
};
