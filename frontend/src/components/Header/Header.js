import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FiBell, FiSearch, FiUser, FiChevronDown } from 'react-icons/fi';
import NotificationDropdown from './NotificationDropdown';
import UserDropdown from './UserDropdown';
import './Header.css';

const Header = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Search:', searchQuery);
  };

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    setShowUserMenu(false);
  };

  const handleUserMenuClick = () => {
    setShowUserMenu(!showUserMenu);
    setShowNotifications(false);
  };

  const handleClickOutside = (e) => {
    if (!e.target.closest('.notification-dropdown') && !e.target.closest('.notification-trigger')) {
      setShowNotifications(false);
    }
    if (!e.target.closest('.user-dropdown') && !e.target.closest('.user-menu-trigger')) {
      setShowUserMenu(false);
    }
  };

  React.useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const resolvedRole =
    typeof user?.role === 'string'
      ? user.role
      : user?.role?.name || 'User';

  return (
    <header className="header">
      <div className="header-content">
        {/* Search Bar */}
        <div className="search-container">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search items, locations, suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </form>
        </div>

        {/* Header Actions */}
        <div className="header-actions">
          {/* Notifications */}
          <div className="notification-wrapper">
            <button
              className="notification-trigger"
              onClick={handleNotificationClick}
              aria-label="Notifications"
            >
              <FiBell className="notification-icon" />
              <span className="notification-badge">3</span>
            </button>
            {showNotifications && (
              <NotificationDropdown onClose={() => setShowNotifications(false)} />
            )}
          </div>

          {/* User Menu */}
          <div className="user-menu-wrapper">
            <button
              className="user-menu-trigger"
              onClick={handleUserMenuClick}
              aria-label="User menu"
            >
              <div className="user-avatar">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <div className="user-name">{user?.username}</div>
                <div className="user-role">{resolvedRole}</div>
              </div>
              <FiChevronDown className="dropdown-icon" />
            </button>
            {showUserMenu && (
              <UserDropdown onClose={() => setShowUserMenu(false)} />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
