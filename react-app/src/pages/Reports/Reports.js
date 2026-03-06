import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiBarChart2, FiRefreshCw } from 'react-icons/fi';
import { reportsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './Reports.css';

const Reports = () => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [tab, setTab] = useState('stock');

  const [stock, setStock] = useState([]);
  const [expiry, setExpiry] = useState([]);
  const [movements, setMovements] = useState([]);

  const canViewAny = useMemo(() => {
    return hasPermission('view_stock_report') || hasPermission('view_expiry_report') || hasPermission('view_movement_report');
  }, [hasPermission]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const calls = [];
      if (hasPermission('view_stock_report')) calls.push(reportsAPI.getStockReport());
      else calls.push(Promise.resolve({ data: [] }));
      if (hasPermission('view_expiry_report')) calls.push(reportsAPI.getExpiryReport());
      else calls.push(Promise.resolve({ data: [] }));
      if (hasPermission('view_movement_report')) calls.push(reportsAPI.getMovementReport());
      else calls.push(Promise.resolve({ data: [] }));

      const [stockRes, expiryRes, movementRes] = await Promise.all(calls);
      setStock(Array.isArray(stockRes?.data) ? stockRes.data : stockRes?.data?.items || []);
      setExpiry(Array.isArray(expiryRes?.data) ? expiryRes.data : expiryRes?.data?.items || []);
      setMovements(Array.isArray(movementRes?.data) ? movementRes.data : movementRes?.data?.items || []);
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
  };

  if (!canViewAny) {
    return (
      <div className="reports-page">
        <div className="reports-error">Permission denied</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="reports-page">
        <div className="loading-spinner" aria-label="Loading reports" />
      </div>
    );
  }

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div className="header-left">
          <h1 className="page-title">
            <FiBarChart2 /> Reports
          </h1>
          <p className="page-subtitle">Stock, expiry, and movement reports</p>
        </div>

        <div className="header-right">
          <button className="btn btn-outline btn-sm" onClick={handleRefresh} disabled={refreshing}>
            <FiRefreshCw /> {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="tabs">
        {hasPermission('view_stock_report') ? (
          <button className={`tab ${tab === 'stock' ? 'active' : ''}`} onClick={() => setTab('stock')}>
            Stock
          </button>
        ) : null}
        {hasPermission('view_expiry_report') ? (
          <button className={`tab ${tab === 'expiry' ? 'active' : ''}`} onClick={() => setTab('expiry')}>
            Expiry
          </button>
        ) : null}
        {hasPermission('view_movement_report') ? (
          <button className={`tab ${tab === 'movements' ? 'active' : ''}`} onClick={() => setTab('movements')}>
            Movements
          </button>
        ) : null}
      </div>

      {tab === 'stock' ? (
        <div className="table-card">
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Total Qty</th>
                <th>Reorder</th>
              </tr>
            </thead>
            <tbody>
              {(stock || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty">No data</td>
                </tr>
              ) : (
                (stock || []).map((x, idx) => (
                  <tr key={x.item_id || x.id || idx}>
                    <td>{x.item_name || x.name}</td>
                    <td>{x.sku || '—'}</td>
                    <td>{x.category || '—'}</td>
                    <td>{x.total_quantity ?? x.quantity ?? '—'}</td>
                    <td>{x.reorder_level ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'expiry' ? (
        <div className="table-card">
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Batch</th>
                <th>Location</th>
                <th>Qty</th>
                <th>Expiry</th>
              </tr>
            </thead>
            <tbody>
              {(expiry || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty">No data</td>
                </tr>
              ) : (
                (expiry || []).map((x, idx) => (
                  <tr key={x.batch_id || x.id || idx}>
                    <td>{x.item_name || x.name}</td>
                    <td>{x.batch_number || x.batch || '—'}</td>
                    <td>{x.location_name || x.location || '—'}</td>
                    <td>{x.quantity ?? '—'}</td>
                    <td>{x.expiry_date || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === 'movements' ? (
        <div className="table-card">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Item</th>
                <th>Qty</th>
                <th>Location</th>
                <th>Ref</th>
              </tr>
            </thead>
            <tbody>
              {(movements || []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty">No data</td>
                </tr>
              ) : (
                (movements || []).map((m, idx) => (
                  <tr key={m.id || idx}>
                    <td>{m.created_at ? new Date(m.created_at).toLocaleString() : '—'}</td>
                    <td>{m.movement_type}</td>
                    <td>{m.item_name || '—'}</td>
                    <td>{m.quantity}</td>
                    <td>{m.location_name || '—'}</td>
                    <td>{m.reference_number || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
};

export default Reports;
