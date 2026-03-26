import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  FiActivity,
  FiAlertTriangle,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiEye,
  FiFileText,
  FiFilter,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrendingDown,
} from 'react-icons/fi';
import { alertsAPI, auditAPI, dashboardAPI, reportsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { downloadReport, formatDateTime as reportFormatDateTime } from '../../services/reportGenerator';
import './AuditLogs.css';

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const downloadCsv = (filename, rows) => {
  const escapeValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const content = rows.map((row) => row.map(escapeValue).join(',')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

const buildFindingTone = (level) => {
  if (level === 'high') return 'high';
  if (level === 'medium') return 'medium';
  return 'low';
};

const AuditLogs = () => {
  const { hasPermission, hasRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [dashboard, setDashboard] = useState(null);
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [expiryItems, setExpiryItems] = useState([]);
  const [movements, setMovements] = useState([]);

  const [search, setSearch] = useState('');
  const [module, setModule] = useState('');
  const [action, setAction] = useState('');
  const [status, setStatus] = useState('');
  const [actor, setActor] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAllLogs, setShowAllLogs] = useState(false);

  const fetchAuditCenter = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const auditParams = {
        limit: showAllLogs ? 500 : 150,
      };
      if (search.trim()) auditParams.search = search.trim();
      if (module) auditParams.module = module;
      if (action) auditParams.action = action;
      if (status) auditParams.status = status;
      if (startDate) auditParams.start_date = startDate;
      if (endDate) auditParams.end_date = endDate;

      const requests = [
        dashboardAPI.getDashboardData(),
        auditAPI.getAuditLogs(auditParams),
        alertsAPI.getAlerts({ limit: 100 }),
        reportsAPI.getStockReport(),
        reportsAPI.getExpiryReport({ days_threshold: 45 }),
        reportsAPI.getMovementReport({ limit: 120 }),
      ];

      const [dashboardRes, auditRes, alertsRes, stockRes, expiryRes, movementRes] = await Promise.all(requests);

      setDashboard(dashboardRes?.data || null);
      setLogs(Array.isArray(auditRes?.data) ? auditRes.data : []);
      setAlerts(Array.isArray(alertsRes?.data) ? alertsRes.data : []);
      setStockItems(Array.isArray(stockRes?.data?.items) ? stockRes.data.items : []);

      const expired = Array.isArray(expiryRes?.data?.expired_items) ? expiryRes.data.expired_items : [];
      const expiringSoon = Array.isArray(expiryRes?.data?.expiring_soon_items) ? expiryRes.data.expiring_soon_items : [];
      setExpiryItems([...expired, ...expiringSoon]);

      setMovements(Array.isArray(movementRes?.data) ? movementRes.data : []);
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Failed to load the audit center');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [action, endDate, module, search, showAllLogs, startDate, status]);

  useEffect(() => {
    fetchAuditCenter();
  }, [fetchAuditCenter]);

  const actorOptions = useMemo(() => {
    const users = new Set(
      logs
        .map((log) => log.username || (log.user_id ? `User #${log.user_id}` : 'System'))
        .filter(Boolean)
    );
    return Array.from(users).sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const modules = useMemo(() => {
    const values = new Set(logs.map((log) => log.module).filter(Boolean));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const actions = useMemo(() => {
    const values = new Set(logs.map((log) => log.action).filter(Boolean));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    if (!actor) return logs;
    const actorKey = normalizeText(actor);
    return logs.filter((log) => {
      const logActor = log.username || (log.user_id ? `User #${log.user_id}` : 'System');
      return normalizeText(logActor) === actorKey;
    });
  }, [actor, logs]);

  const failedLogs = useMemo(
    () => filteredLogs.filter((log) => normalizeText(log.status) === 'failed'),
    [filteredLogs]
  );

  const openAlerts = useMemo(
    () => alerts.filter((alert) => !alert.is_acknowledged),
    [alerts]
  );

  const criticalAlerts = useMemo(
    () => alerts.filter((alert) => normalizeText(alert.severity) === 'critical' && !alert.is_acknowledged),
    [alerts]
  );

  const lowStockItems = useMemo(
    () => stockItems.filter((item) => ['low', 'out_of_stock'].includes(normalizeText(item.status))),
    [stockItems]
  );

  const expiredItems = useMemo(
    () => expiryItems.filter((item) => normalizeText(item.status) === 'expired'),
    [expiryItems]
  );

  const expiringSoonItems = useMemo(
    () => expiryItems.filter((item) => normalizeText(item.status) === 'expiring_soon'),
    [expiryItems]
  );

  const recentMovements = useMemo(() => movements.slice(0, 8), [movements]);

  const summaryCards = useMemo(() => [
    {
      key: 'records',
      label: 'Audit Records',
      value: filteredLogs.length,
      helper: showAllLogs ? 'Expanded review scope' : 'Most recent review scope',
      icon: FiFileText,
      tone: 'neutral',
    },
    {
      key: 'actors',
      label: 'Actors Covered',
      value: new Set(filteredLogs.map((log) => log.username || log.user_id || 'system')).size,
      helper: 'Distinct users in current result set',
      icon: FiShield,
      tone: 'neutral',
    },
    {
      key: 'failures',
      label: 'Failed Actions',
      value: failedLogs.length,
      helper: 'Needs follow-up review',
      icon: FiAlertTriangle,
      tone: failedLogs.length ? 'danger' : 'success',
    },
    {
      key: 'alerts',
      label: 'Open Alerts',
      value: openAlerts.length,
      helper: `${criticalAlerts.length} critical still open`,
      icon: FiEye,
      tone: openAlerts.length ? 'warning' : 'success',
    },
    {
      key: 'low-stock',
      label: 'Low Stock Lines',
      value: lowStockItems.length,
      helper: `${dashboard?.low_stock_count ?? lowStockItems.length} item groups flagged`,
      icon: FiTrendingDown,
      tone: lowStockItems.length ? 'warning' : 'success',
    },
    {
      key: 'expiry',
      label: 'Expiry Exposure',
      value: expiredItems.length + expiringSoonItems.length,
      helper: `${expiredItems.length} expired, ${expiringSoonItems.length} expiring soon`,
      icon: FiCalendar,
      tone: expiredItems.length ? 'danger' : expiringSoonItems.length ? 'warning' : 'success',
    },
  ], [criticalAlerts.length, dashboard?.low_stock_count, expiredItems.length, expiringSoonItems.length, failedLogs.length, filteredLogs, lowStockItems.length, openAlerts.length, showAllLogs]);

  const findings = useMemo(() => {
    const items = [];

    if (failedLogs.length) {
      const latestFailure = failedLogs[0];
      items.push({
        title: `${failedLogs.length} failed action${failedLogs.length === 1 ? '' : 's'} detected`,
        detail: `${latestFailure.action} in ${latestFailure.module} at ${formatDateTime(latestFailure.timestamp)}`,
        tone: 'high',
      });
    }

    if (criticalAlerts.length) {
      items.push({
        title: `${criticalAlerts.length} critical alert${criticalAlerts.length === 1 ? '' : 's'} remain open`,
        detail: criticalAlerts[0]?.message || 'Critical alert requires review',
        tone: 'high',
      });
    }

    if (expiredItems.length) {
      items.push({
        title: `${expiredItems.length} expired batch${expiredItems.length === 1 ? '' : 'es'} still in stock`,
        detail: `${expiredItems[0]?.item_name || 'Item'} at ${expiredItems[0]?.location || 'assigned location'}`,
        tone: 'high',
      });
    }

    if (expiringSoonItems.length) {
      items.push({
        title: `${expiringSoonItems.length} batch${expiringSoonItems.length === 1 ? '' : 'es'} expiring within 45 days`,
        detail: `${expiringSoonItems[0]?.item_name || 'Item'} expires on ${formatDate(expiringSoonItems[0]?.expiry_date)}`,
        tone: 'medium',
      });
    }

    if (lowStockItems.length) {
      items.push({
        title: `${lowStockItems.length} low stock line${lowStockItems.length === 1 ? '' : 's'} need monitoring`,
        detail: `${lowStockItems[0]?.item_name || 'Item'} at ${lowStockItems[0]?.location || 'location'} is ${lowStockItems[0]?.status || 'flagged'}`,
        tone: 'medium',
      });
    }

    if (!items.length) {
      items.push({
        title: 'No immediate exceptions in the current audit view',
        detail: 'Recent logs, alerts, stock exposure, and expiry checks are clean for the selected filters.',
        tone: 'low',
      });
    }

    return items.slice(0, 5);
  }, [criticalAlerts, expiredItems, expiringSoonItems, failedLogs, lowStockItems]);

  const handleRefresh = async () => {
    await fetchAuditCenter(true);
  };

  const handleExport = () => {
    const reportData = {
      title: 'SYSTEM AUDIT LOG REPORT',
      subtitle: 'Complete Audit Trail and Activity Log',
      generatedAt: new Date(),
      columns: ['Timestamp', 'Actor', 'Action', 'Module', 'Record ID', 'Status', 'IP Address', 'Remarks', 'Old Value', 'New Value'],
      data: filteredLogs.map((log) => ({
        Timestamp: formatDateTime(log.timestamp),
        Actor: log.username || (log.user_id ? `User #${log.user_id}` : 'System'),
        Action: log.action,
        Module: log.module,
        'Record ID': log.record_id ?? '',
        Status: log.status || '',
        'IP Address': log.ip_address || '',
        Remarks: log.remarks || '',
        'Old Value': log.old_value || '',
        'New Value': log.new_value || '',
      })),
      summaryStats: [
        { label: 'Total Records', value: filteredLogs.length },
        { label: 'Report Period', value: 'Full Audit History' },
        { label: 'Export Type', value: 'Audit Trail - Complete' },
        { label: 'Data Classification', value: 'Confidential' },
      ],
      footer: 'This audit report contains sensitive system activity information and should be handled according to data protection policies.',
    };

    downloadReport(`audit-report-${Date.now()}.csv`, reportData);
    toast.success('Audit report exported successfully');
  };

  const isAuditor = hasRole('Auditor') || hasRole('auditor');

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
        <div className="loading-spinner" aria-label="Loading audit center" />
      </div>
    );
  }

  return (
    <div className="audit-page audit-center">
      <div className="audit-hero">
        <div className="audit-hero-copy">
          <div className="audit-kicker">{isAuditor ? 'Auditor workspace' : 'Compliance workspace'}</div>
          <h1 className="page-title">
            <FiShield /> Audit Center
          </h1>
          <p className="page-subtitle">
            Review compliance activity, exception signals, inventory exposure, and operational changes from one place.
          </p>
        </div>

        <div className="audit-hero-actions">
          <button className="btn btn-outline btn-sm" onClick={() => setShowAllLogs((value) => !value)}>
            <FiFilter /> {showAllLogs ? 'Focused Log Set' : 'Load More Logs'}
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleExport}>
            <FiDownload /> Export Logs
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleRefresh} disabled={refreshing}>
            <FiRefreshCw className={refreshing ? 'spinning' : ''} /> {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="audit-summary-grid">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.key} className={`audit-summary-card tone-${card.tone}`}>
              <div className="summary-icon">
                <Icon />
              </div>
              <div className="summary-value">{card.value}</div>
              <div className="summary-label">{card.label}</div>
              <div className="summary-helper">{card.helper}</div>
            </div>
          );
        })}
      </div>

      <div className="audit-grid audit-grid-top">
        <section className="audit-panel">
          <div className="audit-panel-header">
            <div>
              <h2>Key Findings</h2>
              <p>Priority issues surfaced from logs, alerts, expiry, and stock risk.</p>
            </div>
          </div>

          <div className="findings-list">
            {findings.map((finding, index) => (
              <div key={`${finding.title}-${index}`} className={`finding-card tone-${buildFindingTone(finding.tone)}`}>
                <div className="finding-title">
                  <FiAlertTriangle />
                  <span>{finding.title}</span>
                </div>
                <div className="finding-detail">{finding.detail}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="audit-panel">
          <div className="audit-panel-header">
            <div>
              <h2>Control Snapshot</h2>
              <p>Fast health check for operational review.</p>
            </div>
          </div>

          <div className="control-list">
            <div className="control-item">
              <span className="control-label">Inventory items</span>
              <span className="control-value">{dashboard?.total_items ?? stockItems.length}</span>
            </div>
            <div className="control-item">
              <span className="control-label">Locations</span>
              <span className="control-value">{dashboard?.total_locations ?? '—'}</span>
            </div>
            <div className="control-item">
              <span className="control-label">Movement records reviewed</span>
              <span className="control-value">{movements.length}</span>
            </div>
            <div className="control-item">
              <span className="control-label">Unacknowledged alerts</span>
              <span className="control-value">{openAlerts.length}</span>
            </div>
            <div className="control-item">
              <span className="control-label">Successful audit events</span>
              <span className="control-value">{filteredLogs.length - failedLogs.length}</span>
            </div>
            <div className="control-item">
              <span className="control-label">Failed audit events</span>
              <span className="control-value danger">{failedLogs.length}</span>
            </div>
          </div>
        </section>
      </div>

      <div className="audit-grid audit-grid-middle">
        <section className="audit-panel">
          <div className="audit-panel-header">
            <div>
              <h2>Open Alerts</h2>
              <p>Current compliance and inventory warnings.</p>
            </div>
          </div>

          <div className="mini-table">
            {(openAlerts.length ? openAlerts : alerts.slice(0, 5)).map((alert) => (
              <div key={alert.id} className="mini-row">
                <div>
                  <div className="mini-title">{alert.message}</div>
                  <div className="mini-subtitle">{alert.alert_type} · {formatDateTime(alert.created_at)}</div>
                </div>
                <span className={`pill severity ${normalizeText(alert.severity)}`}>{alert.severity}</span>
              </div>
            ))}
            {!alerts.length ? <div className="panel-empty">No alerts available</div> : null}
          </div>
        </section>

        <section className="audit-panel">
          <div className="audit-panel-header">
            <div>
              <h2>Expiry Watch</h2>
              <p>Expired and near-expiry batches still present in stock.</p>
            </div>
          </div>

          <div className="mini-table">
            {expiryItems.slice(0, 5).map((item, index) => (
              <div key={`${item.batch_number}-${index}`} className="mini-row">
                <div>
                  <div className="mini-title">{item.item_name}</div>
                  <div className="mini-subtitle">{item.location} · Batch {item.batch_number} · {formatDate(item.expiry_date)}</div>
                </div>
                <span className={`pill ${normalizeText(item.status)}`}>{item.status}</span>
              </div>
            ))}
            {!expiryItems.length ? <div className="panel-empty">No expiry exposure in the current report</div> : null}
          </div>
        </section>

        <section className="audit-panel">
          <div className="audit-panel-header">
            <div>
              <h2>Recent Movements</h2>
              <p>Latest stock movement evidence for sampling and trace review.</p>
            </div>
          </div>

          <div className="mini-table">
            {recentMovements.map((movement) => (
              <div key={movement.id} className="mini-row">
                <div>
                  <div className="mini-title">{movement.item_name}</div>
                  <div className="mini-subtitle">{movement.location_name} · Ref {movement.reference_number || '—'} · {formatDateTime(movement.created_at)}</div>
                </div>
                <span className="pill neutral">{movement.movement_type}</span>
              </div>
            ))}
            {!recentMovements.length ? <div className="panel-empty">No movement records available</div> : null}
          </div>
        </section>
      </div>

      <section className="audit-panel">
        <div className="audit-panel-header">
          <div>
            <h2>Audit Trail</h2>
            <p>Filter and review detailed activity records with actor, change trace, and status context.</p>
          </div>
          <div className="audit-result-note">
            <FiClock /> Showing {filteredLogs.length} record{filteredLogs.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className="audit-filters">
          <label className="filter-search">
            <FiSearch className="search-icon" />
            <input
              className="search-input"
              placeholder="Search action, remarks, values, actor..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <select className="input" value={module} onChange={(event) => setModule(event.target.value)}>
            <option value="">All Modules</option>
            {modules.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>

          <select className="input" value={action} onChange={(event) => setAction(event.target.value)}>
            <option value="">All Actions</option>
            {actions.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>

          <select className="input" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All Status</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
          </select>

          <select className="input" value={actor} onChange={(event) => setActor(event.target.value)}>
            <option value="">All Actors</option>
            {actorOptions.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>

          <input className="input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          <input className="input" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </div>

        <div className="audit-table-card">
          <table className="audit-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Module</th>
                <th>Record</th>
                <th>Status</th>
                <th>IP</th>
                <th>Remarks</th>
                <th>Change Trace</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="audit-empty">
                    No audit records match the current filters
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const actorLabel = log.username || (log.user_id ? `User #${log.user_id}` : 'System');
                  return (
                    <tr key={log.id}>
                      <td>{formatDateTime(log.timestamp)}</td>
                      <td>{actorLabel}</td>
                      <td className="strong-cell">{log.action}</td>
                      <td>{log.module}</td>
                      <td>{log.record_id ? <span className="mono">{log.record_id}</span> : '—'}</td>
                      <td>
                        <span className={`pill ${normalizeText(log.status) || 'neutral'}`}>
                          {normalizeText(log.status) === 'success' ? <FiCheckCircle /> : normalizeText(log.status) === 'failed' ? <FiAlertTriangle /> : <FiActivity />}
                          {log.status || '—'}
                        </span>
                      </td>
                      <td>{log.ip_address || '—'}</td>
                      <td className="remarks">{log.remarks || '—'}</td>
                      <td className="change-trace">
                        {log.old_value || log.new_value ? (
                          <>
                            <div><strong>From:</strong> {log.old_value || '—'}</div>
                            <div><strong>To:</strong> {log.new_value || '—'}</div>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AuditLogs;
