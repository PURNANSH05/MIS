import React, { useEffect, useState } from 'react';
import {
  FiAlertTriangle,
  FiCalendar,
  FiDollarSign,
  FiDownload,
  FiFilter,
  FiMapPin,
  FiPackage,
  FiRefreshCw,
  FiTrendingDown,
  FiTrendingUp,
} from 'react-icons/fi';
import { dashboardAPI, reportsAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import './Dashboard.css';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('7days');
  const [showFilters, setShowFilters] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const [dashboardRes, reportsRes, activityRes] = await Promise.all([
        dashboardAPI.getDashboardData(),
        reportsAPI.getReports(),
        dashboardAPI.getRecentActivity(),
      ]);

      setDashboardData(dashboardRes.data);

      const reports = reportsRes?.data || {};
      const lowStock = Array.isArray(reports.low_stock) ? reports.low_stock : [];
      const expiring = Array.isArray(reports.expiring_items) ? reports.expiring_items : [];

      const nextAlerts = [];
      lowStock.slice(0, 4).forEach((x, idx) => {
        nextAlerts.push({
          id: `low-${idx}`,
          type: 'warning',
          message: `Low stock: ${x.name} (${x.quantity}/${x.reorder_level})`,
          time: 'Now',
        });
      });
      expiring.slice(0, 4).forEach((x, idx) => {
        nextAlerts.push({
          id: `exp-${idx}`,
          type: 'critical',
          message: `Expiring soon: ${x.name} (by ${x.expiry_date})`,
          time: 'Now',
        });
      });
      setAlerts(nextAlerts.slice(0, 6));

      const movements = Array.isArray(activityRes?.data) ? activityRes.data : [];
      const mappedActivities = movements.slice(0, 8).map((m) => ({
        id: m.id,
        type: m.movement_type,
        item: m.item_name,
        quantity: m.quantity,
        location: m.location_name,
        time: m.created_at,
        reference: m.reference_number,
      }));
      setRecentActivities(mappedActivities);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const handleExport = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Items', String(dashboardData?.total_items || 0)],
      ['Low Stock Count', String(dashboardData?.low_stock_count || 0)],
      ['Locations', String(dashboardData?.total_locations || 0)],
      ['Expiring Soon', String(dashboardData?.expiring_soon_count || 0)],
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dashboard-summary.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const valueK = `$${((dashboardData?.total_stock_value || 0) / 1000).toFixed(1)}K`;
  const kpiData = [
    { title: 'Total Items', value: dashboardData?.total_items || 0, Icon: FiPackage },
    { title: 'Low Stock', value: dashboardData?.low_stock_count || 0, Icon: FiAlertTriangle },
    { title: 'Total Value', value: valueK, Icon: FiDollarSign },
    { title: 'Locations', value: dashboardData?.total_locations || 0, Icon: FiMapPin },
    { title: 'Expiring Soon', value: dashboardData?.expiring_soon_count || 0, Icon: FiCalendar },
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" aria-label="Loading dashboard" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <FiAlertTriangle className="error-icon" />
        <h2>Dashboard Error</h2>
        <p>{error}</p>
        <button onClick={fetchDashboardData} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <PageHeader
        title="Medical Inventory Dashboard"
        subtitle="Real-time overview of your healthcare inventory management system"
        actions={
          <>
            <div className="date-range-selector">
              <FiCalendar className="calendar-icon" />
              <select
                value={dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                className="input date-select"
              >
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="1year">Last Year</option>
              </select>
            </div>

            <button onClick={() => setShowFilters(!showFilters)} className="btn btn-outline btn-sm">
              <FiFilter /> Filters
            </button>

            <button onClick={handleExport} className="btn btn-outline btn-sm">
              <FiDownload /> Export
            </button>

            <button onClick={handleRefresh} className={`btn btn-primary btn-sm ${refreshing ? 'refreshing' : ''}`} disabled={refreshing}>
              <FiRefreshCw className={refreshing ? 'spinning' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </>
        }
      />

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Category</label>
              <select className="input">
                <option>All Categories</option>
                <option>Medications</option>
                <option>Equipment</option>
                <option>Supplies</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Location</label>
              <select className="input">
                <option>All Locations</option>
                <option>Main Store</option>
                <option>Emergency</option>
                <option>Pharmacy</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Status</label>
              <select className="input">
                <option>All Status</option>
                <option>In Stock</option>
                <option>Low Stock</option>
                <option>Out of Stock</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Priority</label>
              <select className="input">
                <option>All Priorities</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpiData.map((kpi) => (
          <div key={kpi.title} className="kpi-card">
            <div className="kpi-card-icon">
              <kpi.Icon />
            </div>
            <div className="kpi-card-content">
              <div className="kpi-card-title">{kpi.title}</div>
              <div className="kpi-card-value">{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <Card className="dashboard-panel">
          <div className="dashboard-panel-header">Alerts</div>
          <div className="dashboard-panel-body">
            {alerts.length === 0 ? (
              <div className="dashboard-empty">No alerts</div>
            ) : (
              <ul className="dashboard-list">
                {alerts.map((a) => (
                  <li key={a.id} className="dashboard-list-item">
                    <span className={`alert-dot alert-dot-${a.type}`} />
                    <div className="dashboard-list-main">
                      <div className="dashboard-list-title">{a.message}</div>
                      <div className="dashboard-list-subtitle">{a.time}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card className="dashboard-panel">
          <div className="dashboard-panel-header">Recent Activity</div>
          <div className="dashboard-panel-body">
            {recentActivities.length === 0 ? (
              <div className="dashboard-empty">No recent activity</div>
            ) : (
              <ul className="dashboard-list">
                {recentActivities.map((act) => (
                  <li key={act.id} className="dashboard-list-item">
                    <div className="dashboard-list-main">
                      <div className="dashboard-list-title">
                        <span className={`activity-pill ${String(act.type).toLowerCase()}`}> {act.type} </span>
                        {act.item}
                      </div>
                      <div className="dashboard-list-subtitle">
                        {act.location} · {act.quantity > 0 ? <FiTrendingUp className="trend-up" /> : <FiTrendingDown className="trend-down" />} {act.quantity}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
