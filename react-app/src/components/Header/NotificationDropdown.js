import React from 'react';
import { FiBell } from 'react-icons/fi';

const NotificationDropdown = ({ onClose }) => {
  return (
    <div className="notification-dropdown">
      <div className="notification-header">
        <div className="notification-title">Notifications</div>
        <div className="notification-actions">
          <button className="notification-action-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
      </div>

      <div className="notification-list">
        <div className="no-notifications">
          <FiBell className="no-notifications-icon" />
          <p>No notifications</p>
        </div>
      </div>
    </div>
  );
};

export default NotificationDropdown;
