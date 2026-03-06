import axios from 'axios';
import { toast } from 'react-toastify';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      localStorage.removeItem('token');
      toast.error('Your session has expired. Please log in again.');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (credentials) => {
    const response = await apiClient.post('/api/login', credentials);
    if (response?.data?.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response;
  },
  
  logout: async () => {
    const response = await apiClient.post('/api/auth/logout');
    localStorage.removeItem('token');
    return response;
  },
  
  getCurrentUser: async () => {
    return apiClient.get('/api/auth/me');
  },
  
  getPermissions: async () => {
    return apiClient.get('/api/auth/permissions');
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
