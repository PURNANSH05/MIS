import React from 'react';

const NotificationDropdown = ({ onClose }) => {
  return (
    <div className="notification-dropdown">
      <div className="notification-dropdown-header">
        <div className="notification-dropdown-title">Notifications</div>
        <button className="notification-dropdown-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <div className="notification-dropdown-body">
        <div className="notification-empty">No notifications</div>
      </div>
    </div>
  );
};

export default NotificationDropdown;
