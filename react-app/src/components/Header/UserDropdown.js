import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const UserDropdown = ({ onClose }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    if (onClose) {
      onClose();
    }
    navigate('/login');
  };

  return (
    <div className="user-dropdown">
      <div className="user-dropdown-header">
        <div className="user-dropdown-name">{user?.username || 'User'}</div>
        <div className="user-dropdown-role">{user?.role?.name || '—'}</div>
      </div>

      <div className="user-dropdown-actions">
        <button className="user-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default UserDropdown;
