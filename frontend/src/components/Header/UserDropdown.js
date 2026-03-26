import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiLogOut, FiShield, FiUser } from 'react-icons/fi';

const UserDropdown = ({ onClose }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const resolvedRole =
    typeof user?.role === 'string'
      ? user.role
      : user?.role?.name || 'User';

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
        <div className="user-dropdown-avatar">
          {user?.username?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="user-dropdown-info">
          <div className="user-dropdown-name">{user?.username || 'User'}</div>
          <div className="user-dropdown-role">{resolvedRole}</div>
        </div>
      </div>

      <div className="user-dropdown-menu">
        <div className="user-dropdown-item static">
          <FiUser className="user-dropdown-icon" />
          <span>{user?.username || 'User'}</span>
        </div>
        <div className="user-dropdown-item static">
          <FiShield className="user-dropdown-icon" />
          <span>{resolvedRole}</span>
        </div>
      </div>

      <div className="user-dropdown-footer">
        <button className="danger" onClick={handleLogout}>
          <FiLogOut className="user-dropdown-icon" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default UserDropdown;
