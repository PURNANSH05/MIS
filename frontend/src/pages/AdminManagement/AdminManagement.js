import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  FiEdit3,
  FiFilter,
  FiKey,
  FiLayers,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './AdminManagement.css';

const ROLE_PERMISSION_GROUPS = {
  'Super Admin': {
    label: 'Full system access',
    permissions: [
      'create_user', 'update_user', 'delete_user', 'list_users',
      'manage_roles', 'change_user_password',
      'create_item', 'update_item', 'delete_item', 'view_items', 'list_items',
      'create_location', 'update_location', 'delete_location', 'list_locations',
      'receive_stock', 'issue_stock', 'transfer_stock', 'dispose_stock',
      'adjust_stock', 'approve_adjustment', 'view_stock_movements',
      'view_stock_report', 'view_expiry_report', 'view_movement_report',
      'view_audit_logs', 'export_reports',
      'system_config', 'manage_alerts', 'acknowledge_alerts', 'view_alerts',
    ],
  },
  Admin: {
    label: 'Administrative operations',
    permissions: [
      'create_user', 'update_user', 'delete_user', 'list_users',
      'manage_roles', 'change_user_password',
      'create_item', 'update_item', 'delete_item', 'view_items', 'list_items',
      'create_location', 'update_location', 'delete_location', 'list_locations',
      'receive_stock', 'issue_stock', 'transfer_stock', 'dispose_stock',
      'adjust_stock', 'approve_adjustment', 'view_stock_movements',
      'view_stock_report', 'view_expiry_report', 'view_movement_report',
      'view_audit_logs', 'export_reports',
      'manage_alerts', 'acknowledge_alerts', 'view_alerts',
    ],
  },
  'Inventory Manager': {
    label: 'Inventory control and reports',
    permissions: [
      'create_item', 'update_item', 'view_items', 'list_items',
      'create_location', 'update_location', 'list_locations',
      'receive_stock', 'issue_stock', 'transfer_stock', 'dispose_stock',
      'adjust_stock', 'approve_adjustment', 'view_stock_movements',
      'view_stock_report', 'view_expiry_report', 'view_movement_report',
      'view_audit_logs', 'export_reports',
      'view_alerts', 'acknowledge_alerts',
    ],
  },
  Pharmacist: {
    label: 'Dispensing and stock visibility',
    permissions: [
      'view_items', 'list_items',
      'receive_stock', 'issue_stock', 'view_stock_movements',
      'view_stock_report', 'view_expiry_report', 'export_reports',
      'view_alerts',
    ],
  },
  Storekeeper: {
    label: 'Warehouse handling',
    permissions: [
      'view_items', 'list_items',
      'receive_stock', 'issue_stock', 'transfer_stock', 'view_stock_movements',
      'view_stock_report', 'export_reports',
      'view_alerts',
    ],
  },
  Auditor: {
    label: 'Read-only compliance review',
    permissions: [
      'view_items', 'list_items', 'list_locations',
      'view_stock_report', 'view_expiry_report', 'view_movement_report',
      'view_audit_logs', 'export_reports', 'view_alerts',
    ],
  },
};

const ROLE_ORDER = ['Super Admin', 'Admin', 'Inventory Manager', 'Pharmacist', 'Storekeeper', 'Auditor'];

const getRoleName = (user) => (typeof user?.role === 'string' ? user.role : user?.role?.name) || 'Unknown';

const ACCESS_SECTIONS = [
  {
    key: 'user_admin',
    title: 'User Administration',
    description: 'Create, update, secure, and deactivate user accounts.',
    permissions: ['create_user', 'update_user', 'delete_user', 'list_users', 'manage_roles', 'change_user_password'],
  },
  {
    key: 'inventory_control',
    title: 'Inventory Control',
    description: 'Maintain items, locations, and operational stock actions.',
    permissions: [
      'create_item', 'update_item', 'delete_item', 'view_items', 'list_items',
      'create_location', 'update_location', 'delete_location', 'list_locations',
      'receive_stock', 'issue_stock', 'transfer_stock', 'dispose_stock', 'adjust_stock', 'approve_adjustment', 'view_stock_movements',
    ],
  },
  {
    key: 'reporting_audit',
    title: 'Reporting and Audit',
    description: 'Review stock, expiry, movement, and audit evidence.',
    permissions: ['view_stock_report', 'view_expiry_report', 'view_movement_report', 'view_audit_logs', 'export_reports'],
  },
  {
    key: 'alerts_system',
    title: 'Alerts and System',
    description: 'Handle alerts and higher-level system administration.',
    permissions: ['system_config', 'manage_alerts', 'acknowledge_alerts', 'view_alerts'],
  },
];

const AdminManagement = () => {
  const { user, hasPermission, getUserRole, hasRole } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [editUser, setEditUser] = useState(null);

  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    role_id: '',
  });

  const [resetForm, setResetForm] = useState({
    new_password: '',
    confirm_password: '',
  });

  const [editForm, setEditForm] = useState({
    email: '',
    role_id: '',
    is_active: true,
  });

  const canCreateUsers = hasPermission('create_user');
  const canUpdateUsers = hasPermission('update_user');
  const canDeleteUsers = hasPermission('delete_user');
  const canResetPassword = hasPermission('change_user_password');
  const canManageRoles = hasPermission('manage_roles') || canUpdateUsers;
  const currentRole = getUserRole();
  const isSuperAdmin = hasRole('Super Admin');

  const sortedRoles = useMemo(() => {
    const priority = new Map(ROLE_ORDER.map((name, index) => [name, index]));
    return [...roles].sort((a, b) => {
      const aOrder = priority.has(a.name) ? priority.get(a.name) : 999;
      const bOrder = priority.has(b.name) ? priority.get(b.name) : 999;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.name.localeCompare(b.name);
    });
  }, [roles]);

  const roleMap = useMemo(() => new Map(sortedRoles.map((role) => [role.id, role])), [sortedRoles]);

  const fetchData = async (showRefreshState = false) => {
    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [usersRes, rolesRes] = await Promise.all([usersAPI.getUsers(), usersAPI.getRoles()]);
      const nextUsers = Array.isArray(usersRes?.data) ? usersRes.data : [];
      const nextRoles = Array.isArray(rolesRes?.data) ? rolesRes.data : [];

      setUsers(nextUsers);
      setRoles(nextRoles);
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Failed to load role access data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedRoleId && sortedRoles.length) {
      setSelectedRoleId(String(sortedRoles[0].id));
    }
  }, [selectedRoleId, sortedRoles]);

  const usersWithResolvedRole = useMemo(
    () =>
      users.map((entry) => ({
        ...entry,
        resolvedRoleName: getRoleName(entry) || roleMap.get(entry.role_id)?.name || 'Unknown',
      })),
    [roleMap, users]
  );

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return usersWithResolvedRole.filter((entry) => {
      if (roleFilter && entry.resolvedRoleName !== roleFilter) return false;
      if (!query) return true;
      const haystack = [entry.username, entry.email, entry.resolvedRoleName].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [roleFilter, search, usersWithResolvedRole]);

  const roleCards = useMemo(
    () =>
      sortedRoles.map((role) => {
        const usersInRole = usersWithResolvedRole.filter((entry) => entry.role_id === role.id || entry.resolvedRoleName === role.name);
        const activeUsers = usersInRole.filter((entry) => entry.is_active).length;
        const permissions = ROLE_PERMISSION_GROUPS[role.name]?.permissions || [];
        return {
          ...role,
          permissions,
          summary: ROLE_PERMISSION_GROUPS[role.name]?.label || role.description || 'Role access profile',
          totalUsers: usersInRole.length,
          activeUsers,
        };
      }),
    [sortedRoles, usersWithResolvedRole]
  );

  const selectedRole = useMemo(
    () => sortedRoles.find((role) => String(role.id) === String(selectedRoleId)) || null,
    [selectedRoleId, sortedRoles]
  );

  const selectedRolePermissions = useMemo(
    () => (selectedRole ? ROLE_PERMISSION_GROUPS[selectedRole.name]?.permissions || [] : []),
    [selectedRole]
  );

  const selectedRoleAccessSections = useMemo(
    () =>
      ACCESS_SECTIONS.map((section) => {
        const matchedPermissions = section.permissions.filter((permission) => selectedRolePermissions.includes(permission));
        return {
          ...section,
          count: matchedPermissions.length,
          enabled: matchedPermissions.length > 0,
        };
      }),
    [selectedRolePermissions]
  );

  const summaryStats = useMemo(() => {
    const activeUsers = usersWithResolvedRole.filter((entry) => entry.is_active).length;
    const inactiveUsers = usersWithResolvedRole.length - activeUsers;
    const privilegedUsers = usersWithResolvedRole.filter((entry) => ['Super Admin', 'Admin'].includes(entry.resolvedRoleName)).length;
    return [
      { label: 'Total Roles', value: sortedRoles.length, tone: 'neutral' },
      { label: 'Active Users', value: activeUsers, tone: 'success' },
      { label: 'Inactive Users', value: inactiveUsers, tone: inactiveUsers ? 'warning' : 'neutral' },
      { label: 'Privileged Users', value: privilegedUsers, tone: privilegedUsers ? 'danger' : 'neutral' },
    ];
  }, [sortedRoles.length, usersWithResolvedRole]);

  const closeCreate = () => {
    if (saving) return;
    setCreateOpen(false);
    setCreateForm({ username: '', email: '', password: '', role_id: selectedRole?.id || '' });
  };

  const openCreate = () => {
    setCreateForm({
      username: '',
      email: '',
      password: '',
      role_id: selectedRole?.id || sortedRoles[0]?.id || '',
    });
    setCreateOpen(true);
  };

  const openResetPassword = (entry) => {
    setResetUser(entry);
    setResetForm({ new_password: '', confirm_password: '' });
  };

  const closeResetPassword = () => {
    if (saving) return;
    setResetUser(null);
  };

  const openEditUser = (entry) => {
    setEditUser(entry);
    setEditForm({
      email: entry.email || '',
      role_id: entry.role_id || '',
      is_active: Boolean(entry.is_active),
    });
  };

  const closeEditUser = () => {
    if (saving) return;
    setEditUser(null);
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();

    if (!canCreateUsers) {
      toast.error('Permission denied');
      return;
    }

    if (!createForm.username.trim() || !createForm.email.trim() || !createForm.password || !createForm.role_id) {
      toast.error('All fields are required');
      return;
    }

    try {
      setSaving(true);
      await usersAPI.createUser({
        username: createForm.username.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role_id: Number(createForm.role_id),
      });
      toast.success('User created successfully');
      closeCreate();
      await fetchData(true);
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUserAccess = async (event) => {
    event.preventDefault();
    if (!editUser) return;

    if (!canUpdateUsers) {
      toast.error('Permission denied');
      return;
    }

    try {
      setSaving(true);
      await usersAPI.updateUser(editUser.id, {
        email: editForm.email.trim(),
        role_id: Number(editForm.role_id),
        is_active: Boolean(editForm.is_active),
      });
      toast.success('User access updated');
      closeEditUser();
      await fetchData(true);
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Failed to update user access');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    if (!resetUser) return;

    if (!canResetPassword) {
      toast.error('Permission denied');
      return;
    }

    if (!resetForm.new_password || !resetForm.confirm_password) {
      toast.error('Password fields are required');
      return;
    }

    try {
      setSaving(true);
      await usersAPI.resetPassword(resetUser.id, {
        new_password: resetForm.new_password,
        confirm_password: resetForm.confirm_password,
      });
      toast.success('Password reset successfully');
      closeResetPassword();
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Failed to reset password');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (entry) => {
    if (!canDeleteUsers) {
      toast.error('Permission denied');
      return;
    }

    if (entry.username === 'admin') {
      toast.error('Default admin cannot be deleted');
      return;
    }

    if (!window.confirm(`Deactivate user "${entry.username}"?`)) {
      return;
    }

    try {
      setSaving(true);
      await usersAPI.deleteUser(entry.id);
      toast.success('User deactivated');
      await fetchData(true);
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Failed to deactivate user');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-mgmt-page">
        <div className="loading-spinner" aria-label="Loading role access" />
      </div>
    );
  }

  return (
    <div className="admin-mgmt-page role-access-page">
      <div className="role-access-hero">
        <div className="hero-copy">
          <div className="hero-kicker">Role-based access control</div>
          <h1 className="page-title">
            <FiShield /> Role Access Management
          </h1>
          <p className="page-subtitle">
            Manage user roles, review permission coverage, and control access professionally across the system.
          </p>
        </div>

        <div className="hero-actions">
          <button className="btn btn-outline btn-sm" onClick={() => fetchData(true)} disabled={refreshing || saving}>
            <FiRefreshCw className={refreshing ? 'spinning' : ''} /> {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          {canCreateUsers ? (
            <button className="btn btn-primary btn-sm" onClick={openCreate} disabled={saving}>
              <FiPlus /> Add User
            </button>
          ) : null}
        </div>
      </div>

      <div className="summary-grid">
        {summaryStats.map((item) => (
          <div key={item.label} className={`summary-card tone-${item.tone}`}>
            <div className="summary-value">{item.value}</div>
            <div className="summary-label">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="role-access-layout">
        <section className="role-panel role-directory">
          <div className="panel-header">
            <div>
              <h2>Role Directory</h2>
              <p>Review each role and the number of users currently assigned.</p>
            </div>
          </div>

          <div className="role-card-grid">
            {roleCards.map((role) => (
              <button
                key={role.id}
                type="button"
                className={`role-card ${String(selectedRoleId) === String(role.id) ? 'active' : ''}`}
                onClick={() => setSelectedRoleId(String(role.id))}
              >
                <div className="role-card-header">
                  <span className="role-card-name">{role.name}</span>
                  <span className="role-card-count">{role.totalUsers}</span>
                </div>
                <div className="role-card-summary">{role.summary}</div>
                <div className="role-card-meta">{role.activeUsers} active users</div>
              </button>
            ))}
          </div>
        </section>

        <section className="role-panel permission-panel">
          <div className="panel-header">
            <div>
              <h2>Access Scope</h2>
              <p>{selectedRole ? `${selectedRole.name} role coverage` : 'Select a role to review access'}</p>
            </div>
          </div>

          {selectedRole ? (
            <>
              <div className="permission-summary">
                <div className="permission-summary-title">{selectedRole.name}</div>
                <div className="permission-summary-subtitle">
                  {ROLE_PERMISSION_GROUPS[selectedRole.name]?.label || selectedRole.description || 'Role access profile'}
                </div>
              </div>

              <div className="scope-grid">
                {selectedRoleAccessSections.map((section) => (
                  <div key={section.key} className={`scope-card ${section.enabled ? 'enabled' : 'disabled'}`}>
                    <div className="scope-card-icon">
                      <FiLayers />
                    </div>
                    <div className="scope-card-content">
                      <div className="scope-card-title">{section.title}</div>
                      <div className="scope-card-description">{section.description}</div>
                    </div>
                    <div className="scope-card-count">{section.count}</div>
                  </div>
                ))}
              </div>

              {!selectedRolePermissions.length ? <div className="empty-note">No permission mapping available for this role yet.</div> : null}
            </>
          ) : (
            <div className="empty-note">No role selected.</div>
          )}
        </section>
      </div>

      <section className="role-panel access-policy-panel">
        <div className="panel-header">
          <div>
            <h2>Access Policy</h2>
            <p>Current operator profile and guardrails for this page.</p>
          </div>
        </div>

        <div className="policy-grid">
          <div className="policy-item">
            <span className="policy-label">Current role</span>
            <span className="policy-value">{currentRole}</span>
          </div>
          <div className="policy-item">
            <span className="policy-label">Can create users</span>
            <span className="policy-value">{canCreateUsers ? 'Yes' : 'No'}</span>
          </div>
          <div className="policy-item">
            <span className="policy-label">Can update access</span>
            <span className="policy-value">{canUpdateUsers ? 'Yes' : 'No'}</span>
          </div>
          <div className="policy-item">
            <span className="policy-label">Can reset passwords</span>
            <span className="policy-value">{canResetPassword ? 'Yes' : 'No'}</span>
          </div>
          <div className="policy-item">
            <span className="policy-label">Can deactivate users</span>
            <span className="policy-value">{canDeleteUsers ? 'Yes' : 'No'}</span>
          </div>
          <div className="policy-item">
            <span className="policy-label">Highest access tier</span>
            <span className="policy-value">{isSuperAdmin ? 'Super Admin' : 'Standard admin scope'}</span>
          </div>
        </div>
      </section>

      <section className="role-panel user-access-panel">
        <div className="panel-header">
          <div>
            <h2>User Access Directory</h2>
            <p>Search, filter, and manage user role assignments.</p>
          </div>
        </div>

        <div className="toolbar-row">
          <label className="search-field">
            <FiSearch className="search-icon" />
            <input
              className="search-input"
              placeholder="Search by username, email, or role..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <select className="input filter-input" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="">All Roles</option>
            {sortedRoles.map((role) => (
              <option key={role.id} value={role.name}>{role.name}</option>
            ))}
          </select>

          <div className="toolbar-note">
            <FiFilter /> {filteredUsers.length} user{filteredUsers.length === 1 ? '' : 's'}
          </div>
        </div>

        <div className="user-table-card">
          <table className="user-access-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty">No users match the current filters</td>
                </tr>
              ) : (
                filteredUsers.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <div className="user-cell">
                        <span className="user-avatar">{entry.username?.charAt(0)?.toUpperCase() || 'U'}</span>
                        <div>
                          <div className="user-name">{entry.username}</div>
                          <div className="user-meta">ID #{entry.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{entry.email}</td>
                    <td>
                      <span className="role-pill">{entry.resolvedRoleName}</span>
                    </td>
                    <td>
                      <span className={`status-pill ${entry.is_active ? 'active' : 'inactive'}`}>
                        {entry.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{entry.created_at ? new Date(entry.created_at).toLocaleDateString() : '—'}</td>
                    <td className="actions-col">
                      {canManageRoles ? (
                        <button className="btn btn-outline btn-sm" onClick={() => openEditUser(entry)} disabled={saving}>
                          <FiEdit3 /> Edit Access
                        </button>
                      ) : null}
                      {canResetPassword ? (
                        <button className="btn btn-outline btn-sm" onClick={() => openResetPassword(entry)} disabled={saving}>
                          <FiKey /> Reset
                        </button>
                      ) : null}
                      {canDeleteUsers && entry.username !== 'admin' ? (
                        <button className="btn btn-outline btn-sm" onClick={() => handleDeleteUser(entry)} disabled={saving}>
                          <FiTrash2 /> Deactivate
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {createOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title">Create User Access</div>
              <button className="modal-close" onClick={closeCreate} aria-label="Close">
                <FiX />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Username</label>
                  <input
                    className="input"
                    value={createForm.username}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, username: event.target.value }))}
                    type="text"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    className="input"
                    value={createForm.email}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                    type="email"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Role</label>
                  <select
                    className="input"
                    value={createForm.role_id}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, role_id: event.target.value }))}
                    required
                  >
                    <option value="">Select role</option>
                    {sortedRoles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input
                    className="input"
                    value={createForm.password}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
                    type="password"
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeCreate} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editUser ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title">Edit Access: {editUser.username}</div>
              <button className="modal-close" onClick={closeEditUser} aria-label="Close">
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSaveUserAccess} className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    className="input"
                    value={editForm.email}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
                    type="email"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Role</label>
                  <select
                    className="input"
                    value={editForm.role_id}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, role_id: event.target.value }))}
                    required
                  >
                    {sortedRoles.map((role) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group full">
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={editForm.is_active}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                    />
                    <span>Keep this user active</span>
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeEditUser} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {resetUser ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title">Reset Password: {resetUser.username}</div>
              <button className="modal-close" onClick={closeResetPassword} aria-label="Close">
                <FiX />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="modal-body">
              <div className="form-grid">
                <div className="form-group full">
                  <label>New Password</label>
                  <input
                    className="input"
                    value={resetForm.new_password}
                    onChange={(event) => setResetForm((prev) => ({ ...prev, new_password: event.target.value }))}
                    type="password"
                    required
                  />
                </div>

                <div className="form-group full">
                  <label>Confirm Password</label>
                  <input
                    className="input"
                    value={resetForm.confirm_password}
                    onChange={(event) => setResetForm((prev) => ({ ...prev, confirm_password: event.target.value }))}
                    type="password"
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeResetPassword} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminManagement;
