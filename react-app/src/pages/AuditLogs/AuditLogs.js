import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiFileText, FiRefreshCw, FiSearch } from 'react-icons/fi';
import { auditAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './AuditLogs.css';

const AuditLogs = () => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logs, setLogs] = useState([]);

  const [search, setSearch] = useState('');
  const [module, setModule] = useState('');
  const [status, setStatus] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await auditAPI.getAuditLogs();
      setLogs(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to load audit logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const modules = useMemo(() => {
    const set = new Set((logs || []).map((l) => l.module).filter(Boolean));
    return Array.from(set).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (logs || []).filter((l) => {
      if (module && l.module !== module) return false;
      if (status && String(l.status || '').toLowerCase() !== status.toLowerCase()) return false;
      if (!q) return true;
      const hay = [l.action, l.module, l.remarks, l.old_value, l.new_value, String(l.record_id || '')]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [logs, search, module, status]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
  };

  if (!hasPermission('view_audit_logs')) {
    return (
      <div className="audit-page">
        <div className="audit-error">Permission denied</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="audit-page">
        <div className="loading-spinner" aria-label="Loading audit logs" />
      </div>
    );
  }

  return (
    <div className="audit-page">
      <div className="audit-header">
        <div className="header-left">
          <h1 className="page-title">
            <FiFileText /> Audit Logs
          </h1>
          <p className="page-subtitle">Immutable activity and compliance records</p>
        </div>

        <div className="header-right">
          <div className="audit-search">
            <FiSearch className="search-icon" />
            <input className="search-input" placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <button className="btn btn-outline btn-sm" onClick={handleRefresh} disabled={refreshing}>
            <FiRefreshCw /> {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="audit-filters">
        <select className="input" value={module} onChange={(e) => setModule(e.target.value)}>
          <option value="">All Modules</option>
          {modules.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILED">FAILED</option>
        </select>
      </div>

      <div className="audit-table-card">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Module</th>
              <th>Record</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="audit-empty">
                  No logs found
                </td>
              </tr>
            ) : (
              filtered.map((l) => (
                <tr key={l.id}>
                  <td>{l.timestamp ? new Date(l.timestamp).toLocaleString() : l.created_at ? new Date(l.created_at).toLocaleString() : '—'}</td>
                  <td>{l.action}</td>
                  <td>{l.module}</td>
                  <td>
                    {l.record_id ? (
                      <span className="mono">{l.record_id}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <span className={`pill ${String(l.status || '').toLowerCase()}`}>{l.status || '—'}</span>
                  </td>
                  <td className="remarks">{l.remarks || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogs;
