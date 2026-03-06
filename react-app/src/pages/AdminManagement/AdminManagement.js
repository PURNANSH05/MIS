import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiRefreshCw, FiSearch, FiUser, FiX, FiKey, FiTrash2, FiUserCheck } from 'react-icons/fi';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './AdminManagement.css';

const AdminManagement = () => {
  const { hasPermission } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  const [search, setSearch] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [resetUser, setResetUser] = useState(null);

  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
  });

  const [resetForm, setResetForm] = useState({
    new_password: '',
    confirm_password: '',
  });

  const [promoteUserId, setPromoteUserId] = useState('');

  const adminRoleId = useMemo(() => {
    const r = (roles || []).find((x) => x?.name === 'Admin');
    return r?.id || null;
  }, [roles]);

  const superAdminRoleId = useMemo(() => {
    const r = (roles || []).find((x) => x?.name === 'Super Admin');
    return r?.id || null;
  }, [roles]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([usersAPI.getUsers(), usersAPI.getRoles()]);
      setUsers(Array.isArray(usersRes?.data) ? usersRes.data : []);
      setRoles(Array.isArray(rolesRes?.data) ? rolesRes.data : []);
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to load admin management data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!promoteUserId) {
      const first = (users || []).find(
        (u) =>
          u?.role?.name !== 'Admin' &&
          u?.role?.name !== 'Super Admin' &&
          u?.role_id !== adminRoleId &&
          u?.role_id !== superAdminRoleId
      );
      if (first) setPromoteUserId(String(first.id));
    }
  }, [users, adminRoleId, superAdminRoleId, promoteUserId]);

  const adminUsers = useMemo(() => {
    const base = (users || []).filter(
      (u) =>
        u?.role?.name === 'Admin' ||
        (adminRoleId && u?.role_id === adminRoleId) ||
        u?.role?.name === 'Super Admin' ||
        (superAdminRoleId && u?.role_id === superAdminRoleId)
    );
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter((u) => {
      const hay = [u.username, u.email].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [users, search, adminRoleId, superAdminRoleId]);

  const nonAdminUsers = useMemo(() => {
    return (users || []).filter(
      (u) =>
        u?.role?.name !== 'Admin' &&
        u?.role?.name !== 'Super Admin' &&
        (!adminRoleId || u?.role_id !== adminRoleId) &&
        (!superAdminRoleId || u?.role_id !== superAdminRoleId)
    );
  }, [users, adminRoleId, superAdminRoleId]);

  const closeCreate = () => {
    if (saving) return;
    setCreateOpen(false);
    setCreateForm({ username: '', email: '', password: '' });
  };

  const openCreate = () => {
    setResetUser(null);
    setCreateForm({ username: '', email: '', password: '' });
    setCreateOpen(true);
  };

  const openResetPassword = (u) => {
    setResetUser(u);
    setResetForm({ new_password: '', confirm_password: '' });
  };

  const closeResetPassword = () => {
    if (saving) return;
    setResetUser(null);
  };

  const onCreateAdmin = async (e) => {
    e.preventDefault();

    if (!hasPermission('create_user')) {
      toast.error('Permission denied');
      return;
    }

    if (!adminRoleId) {
      toast.error('Admin role not found');
      return;
    }

    if (!createForm.username.trim() || !createForm.email.trim() || !createForm.password) {
      toast.error('All fields are required');
      return;
    }

    try {
      setSaving(true);
      await usersAPI.createUser({
        username: createForm.username.trim(),
        email: createForm.email.trim(),
        role_id: Number(adminRoleId),
        password: createForm.password,
      });
      toast.success('Admin created');
      closeCreate();
      await fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to create admin');
    } finally {
      setSaving(false);
    }
  };

  const onPromote = async () => {
    if (!hasPermission('update_user')) {
      toast.error('Permission denied');
      return;
    }
    if (!adminRoleId) {
      toast.error('Admin role not found');
      return;
    }
    if (!promoteUserId) {
      toast.error('Select a user');
      return;
    }

    try {
      setSaving(true);
      await usersAPI.updateUser(Number(promoteUserId), { role_id: Number(adminRoleId) });
      toast.success('User promoted to Admin');
      await fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to promote user');
    } finally {
      setSaving(false);
    }
  };

  const onResetPassword = async (e) => {
    e.preventDefault();
    if (!resetUser) return;

    if (!hasPermission('change_user_password')) {
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
      toast.success('Password reset');
      closeResetPassword();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to reset password');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (u) => {
    if (!hasPermission('delete_user')) {
      toast.error('Permission denied');
      return;
    }
    if (u?.username === 'admin') {
      toast.error('Default admin cannot be deleted');
      return;
    }
    if (!window.confirm(`Delete admin "${u?.username}"? This will deactivate the account.`)) {
      return;
    }

    try {
      setSaving(true);
      await usersAPI.deleteUser(u.id);
      toast.success('Admin deleted');
      await fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to delete admin');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-mgmt-page">
        <div className="loading-spinner" aria-label="Loading admin management" />
      </div>
    );
  }

  return (
    <div className="admin-mgmt-page">
      <div className="admin-mgmt-header">
        <div className="header-left">
          <h1 className="page-title">
            <FiUser /> Admin Management
          </h1>
          <p className="page-subtitle">Create and manage multiple admins safely</p>
        </div>

        <div className="header-right">
          <div className="admin-mgmt-search">
            <FiSearch className="search-icon" />
            <input
              className="search-input"
              placeholder="Search admins..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button className="btn btn-outline btn-sm" onClick={fetchData} disabled={saving}>
            <FiRefreshCw /> Refresh
          </button>

          {hasPermission('create_user') ? (
            <button className="btn btn-primary btn-sm" onClick={openCreate} disabled={saving}>
              <FiPlus /> Add Admin
            </button>
          ) : null}
        </div>
      </div>

      <div className="admin-mgmt-panels">
        <div className="admin-mgmt-card">
          <div className="card-title">Promote User to Admin</div>
          <div className="card-subtitle">Select an existing user and promote to Admin role</div>

          <div className="promote-row">
            <select
              className="input"
              value={promoteUserId}
              onChange={(e) => setPromoteUserId(e.target.value)}
              disabled={saving || nonAdminUsers.length === 0}
            >
              {nonAdminUsers.length === 0 ? <option value="">No eligible users</option> : null}
              {nonAdminUsers.map((u) => (
                <option key={u.id} value={String(u.id)}>
                  {u.username} ({u.email})
                </option>
              ))}
            </select>

            <button className="btn btn-outline btn-sm" onClick={onPromote} disabled={saving || !promoteUserId}>
              <FiUserCheck /> Promote
            </button>
          </div>
        </div>
      </div>

      <div className="admin-mgmt-table-card">
        <table className="admin-mgmt-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {adminUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="admin-mgmt-empty">
                  No admins found
                </td>
              </tr>
            ) : (
              adminUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{u.role?.name || u.role_id}</td>
                  <td>
                    <span className={`status-pill ${u.is_active ? 'active' : 'inactive'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="actions-col">
                    {hasPermission('change_user_password') ? (
                      <button className="btn btn-outline btn-sm" onClick={() => openResetPassword(u)}>
                        <FiKey /> Reset
                      </button>
                    ) : null}
                    {hasPermission('delete_user') && u?.username !== 'admin' && u?.role?.name !== 'Super Admin' ? (
                      <button className="btn btn-outline btn-sm" onClick={() => onDelete(u)} disabled={saving}>
                        <FiTrash2 /> Delete
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {createOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title">Add Admin</div>
              <button className="modal-close" onClick={closeCreate} aria-label="Close">
                <FiX />
              </button>
            </div>

            <form onSubmit={onCreateAdmin} className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Username</label>
                  <input
                    className="input"
                    value={createForm.username}
                    onChange={(e) => setCreateForm((p) => ({ ...p, username: e.target.value }))}
                    type="text"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    className="input"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                    type="email"
                    required
                  />
                </div>

                <div className="form-group full">
                  <label>Password</label>
                  <input
                    className="input"
                    value={createForm.password}
                    onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                    type="password"
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeCreate} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetUser && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title">Reset Password: {resetUser.username}</div>
              <button className="modal-close" onClick={closeResetPassword} aria-label="Close">
                <FiX />
              </button>
            </div>

            <form onSubmit={onResetPassword} className="modal-body">
              <div className="form-grid">
                <div className="form-group full">
                  <label>New Password</label>
                  <input
                    className="input"
                    value={resetForm.new_password}
                    onChange={(e) => setResetForm((p) => ({ ...p, new_password: e.target.value }))}
                    type="password"
                    required
                  />
                </div>

                <div className="form-group full">
                  <label>Confirm Password</label>
                  <input
                    className="input"
                    value={resetForm.confirm_password}
                    onChange={(e) => setResetForm((p) => ({ ...p, confirm_password: e.target.value }))}
                    type="password"
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeResetPassword} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
