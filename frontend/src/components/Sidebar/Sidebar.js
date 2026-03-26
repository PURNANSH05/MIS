import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  FiChevronLeft,
  FiChevronRight,
  FiHome,
  FiDatabase,
  FiPackage,
  FiLogOut,
  FiMenu,
  FiMapPin,
  FiTruck,
  FiUsers,
  FiUserCheck,
  FiBell,
  FiBarChart2,
  FiFileText,
} from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout, hasPermission, hasAnyPermission } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const savedValue = localStorage.getItem('sidebarCollapsed');
    if (savedValue !== null) {
      setSidebarCollapsed(savedValue === 'true');
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.sidebarCollapsed = sidebarCollapsed ? 'true' : 'false';
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const stockPermissions = [
    'view_items',
    'list_items',
    'receive_stock',
    'issue_stock',
    'transfer_stock',
    'dispose_stock',
    'adjust_stock',
    'view_stock_movements',
  ];

  const menuItems = [
    {
      path: '/app/dashboard',
      icon: FiHome,
      label: 'Dashboard',
      permission: null, // Everyone can see dashboard
    },
    {
      path: '/app/stock',
      icon: FiPackage,
      label: 'Stock Management',
      visible: () => hasAnyPermission(stockPermissions),
    },
    {
      path: '/app/locations',
      icon: FiMapPin,
      label: 'Locations',
      permission: 'list_locations',
    },
    {
      path: '/app/suppliers',
      icon: FiTruck,
      label: 'Suppliers',
      permission: 'create_item',
    },
    {
      path: '/app/users',
      icon: FiUsers,
      label: 'Users',
      permission: 'list_users',
    },
    {
      path: '/app/admin-management',
      icon: FiUserCheck,
      label: 'Role Access',
      permission: 'list_users',
    },
    {
      path: '/app/alerts',
      icon: FiBell,
      label: 'Alerts',
      permission: 'view_alerts',
    },
    {
      path: '/app/reports',
      icon: FiBarChart2,
      label: 'Reports',
      permission: 'view_stock_report',
    },
    {
      path: '/app/audit-logs',
      icon: FiFileText,
      label: 'Audit Center',
      permission: 'view_audit_logs',
    },
  ];

  // Filter menu items based on permissions
  const filteredMenuItems = menuItems.filter(item => 
    item.visible ? item.visible() : (!item.permission || hasPermission(item.permission))
  );

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/login', { replace: true });
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleSidebarCollapse = () => {
    setSidebarCollapsed((value) => !value);
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        className="mobile-menu-toggle visible-mobile"
        onClick={handleMobileMenuToggle}
        aria-label="Toggle menu"
      >
        <FiMenu size={24} />
      </button>

      {/* Sidebar Overlay for Mobile */}
      {mobileMenuOpen && (
        <div
          className="sidebar-overlay visible-mobile"
          onClick={handleMobileMenuToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <FiDatabase className="sidebar-brand-icon" />
          </div>
          <button
            className="sidebar-collapse-toggle hidden-mobile"
            onClick={handleSidebarCollapse}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
          </button>
        </div>

        {/* User Info */}
        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.username}</div>
            <div className="user-role">{typeof user?.role === 'string' ? user.role : user?.role?.name}</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path} className="nav-item">
                  <NavLink
                    to={item.path}
                    className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="nav-icon" />
                    {!sidebarCollapsed ? <span className="nav-text">{item.label}</span> : null}
                    {isActive(item.path) && (
                      <div className="nav-indicator" />
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {/* Logout */}
          <button
            className="logout-btn"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <FiLogOut className="logout-icon" />
            {!sidebarCollapsed ? <span className="logout-text">Logout</span> : null}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
