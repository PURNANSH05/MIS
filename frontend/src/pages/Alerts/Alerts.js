import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiAlertTriangle, FiCheckCircle, FiRefreshCw, FiSearch } from 'react-icons/fi';
import { alertsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './Alerts.css';

const Alerts = () => {
  const { hasPermission } = useAuth();
  const canAcknowledgeAlerts = hasPermission('acknowledge_alerts') || hasPermission('manage_alerts');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ackLoadingId, setAckLoadingId] = useState(null);

  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('');
  const [ackFilter, setAckFilter] = useState('unack');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [alertsRes, statsRes] = await Promise.all([alertsAPI.getAlerts(), alertsAPI.getAlertStats()]);
      setAlerts(Array.isArray(alertsRes?.data) ? alertsRes.data : []);
      setStats(statsRes?.data || null);
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to load alerts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (alerts || []).filter((a) => {
      if (ackFilter === 'unack' && a.is_acknowledged) return false;
      if (ackFilter === 'ack' && !a.is_acknowledged) return false;
      if (severity && String(a.severity || '').toLowerCase() !== severity.toLowerCase()) return false;
      if (!q) return true;
      const hay = [a.alert_type, a.severity, a.message].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [alerts, search, severity, ackFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const acknowledge = async (alertId) => {
    if (!canAcknowledgeAlerts) {
      toast.error('Permission denied');
      return;
    }
    try {
      setAckLoadingId(alertId);
      await alertsAPI.acknowledgeAlert(alertId);
      toast.success('Alert acknowledged');
      await fetchData();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to acknowledge alert');
    } finally {
      setAckLoadingId(null);
    }
  };

  if (!hasPermission('view_alerts')) {
    return (
      <div className="alerts-page">
        <div className="alerts-error">Permission denied</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="alerts-page">
        <div className="loading-spinner" aria-label="Loading alerts" />
      </div>
    );
  }

  return (
    <div className="alerts-page">
      <div className="alerts-header">
        <div className="header-left">
          <h1 className="page-title">
            <FiAlertTriangle /> Alerts
          </h1>
          <p className="page-subtitle">Low stock and expiry alerts</p>
        </div>

        <div className="header-right">
          <div className="alerts-search">
            <FiSearch className="search-icon" />
            <input className="search-input" placeholder="Search alerts..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <button className="btn btn-outline btn-sm" onClick={handleRefresh} disabled={refreshing}>
            <FiRefreshCw /> {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="alerts-stats">
        <div className="stat-card">
          <div className="stat-title">Total</div>
          <div className="stat-value">{stats?.total_alerts ?? alerts.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Unacknowledged</div>
          <div className="stat-value">{stats?.unacknowledged_alerts ?? (alerts || []).filter((a) => !a.is_acknowledged).length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Critical</div>
          <div className="stat-value">{stats?.critical_alerts ?? (alerts || []).filter((a) => String(a.severity).toLowerCase() === 'critical').length}</div>
        </div>
      </div>

      <div className="alerts-filters">
        <select className="input" value={ackFilter} onChange={(e) => setAckFilter(e.target.value)}>
          <option value="unack">Unacknowledged</option>
          <option value="ack">Acknowledged</option>
          <option value="all">All</option>
        </select>

        <select className="input" value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      <div className="alerts-table-card">
        <table className="alerts-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Severity</th>
              <th>Message</th>
              <th>Created</th>
              <th>Status</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="alerts-empty">
                  No alerts found
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr key={a.id}>
                  <td>{a.alert_type}</td>
                  <td>
                    <span className={`pill severity ${String(a.severity || '').toLowerCase()}`}>{a.severity}</span>
                  </td>
                  <td className="message">{a.message}</td>
                  <td>{a.created_at ? new Date(a.created_at).toLocaleString() : '—'}</td>
                  <td>
                    <span className={`pill ${a.is_acknowledged ? 'ack' : 'unack'}`}>
                      {a.is_acknowledged ? 'Acknowledged' : 'Unacknowledged'}
                    </span>
                  </td>
                  <td className="actions-col">
                    {!a.is_acknowledged && canAcknowledgeAlerts ? (
                      <button className="btn btn-outline btn-sm" onClick={() => acknowledge(a.id)} disabled={ackLoadingId === a.id}>
                        <FiCheckCircle /> {ackLoadingId === a.id ? 'Saving...' : 'Acknowledge'}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Alerts;
