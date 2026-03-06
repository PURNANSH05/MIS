import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  FiHome,
  FiPackage,
  FiLogOut,
  FiMenu,
  FiX,
  FiDatabase,
  FiMapPin,
  FiTruck,
  FiUsers,
  FiUserCheck,
  FiBell,
  FiBarChart2,
  FiFileText,
  FiArrowDownCircle,
  FiArrowUpCircle,
  FiRepeat,
  FiSliders,
  FiTrash,
} from 'react-icons/fi';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout, hasPermission } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.dataset.sidebarCollapsed = sidebarCollapsed ? 'true' : 'false';
  }, [sidebarCollapsed]);

  const menuItems = [
    {
      path: '/app/dashboard',
      icon: FiHome,
      label: 'Dashboard',
      permission: null, // Everyone can see dashboard
    },
    {
      path: '/app/inventory',
      icon: FiPackage,
      label: 'Inventory',
      permission: 'view_items',
    },
    {
      path: '/app/locations',
      icon: FiMapPin,
      label: 'Locations',
      permission: 'create_location',
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
      label: 'Admin Management',
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
      path: '/app/stock/receive',
      icon: FiArrowDownCircle,
      label: 'Receive Stock',
      permission: 'receive_stock',
    },
    {
      path: '/app/stock/issue',
      icon: FiArrowUpCircle,
      label: 'Issue Stock',
      permission: 'issue_stock',
    },
    {
      path: '/app/stock/transfer',
      icon: FiRepeat,
      label: 'Transfer Stock',
      permission: 'transfer_stock',
    },
    {
      path: '/app/stock/dispose',
      icon: FiTrash,
      label: 'Dispose Stock',
      permission: 'dispose_stock',
    },
    {
      path: '/app/stock/adjust',
      icon: FiSliders,
      label: 'Adjust Stock',
      permission: 'adjust_stock',
    },
    {
      path: '/app/audit-logs',
      icon: FiFileText,
      label: 'Audit Logs',
      permission: 'view_audit_logs',
    },
  ];

  // Filter menu items based on permissions
  const filteredMenuItems = menuItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
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
        {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
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
          <div className="logo">
            <FiDatabase className="logo-icon" />
            {!sidebarCollapsed && (
              <span className="logo-text">MedInventory</span>
            )}
          </div>
          <button
            className="sidebar-toggle hidden-mobile"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? <FiMenu size={20} /> : <FiX size={20} />}
          </button>
        </div>

        {/* User Info */}
        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          {!sidebarCollapsed && (
            <div className="user-info">
              <div className="user-name">{user?.username}</div>
              <div className="user-role">{user?.role?.name}</div>
            </div>
          )}
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
                    {!sidebarCollapsed && (
                      <span className="nav-text">{item.label}</span>
                    )}
                    {isActive(item.path) && !sidebarCollapsed && (
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
            {!sidebarCollapsed && (
              <span className="logout-text">Logout</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
