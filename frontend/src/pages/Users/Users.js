import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiRefreshCw, FiSearch, FiX, FiUser, FiKey, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './Users.css';

const Users = () => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);

  const [form, setForm] = useState({
    username: '',
    email: '',
    role_id: '',
    password: '',
    is_active: true,
  });

  const [resetForm, setResetForm] = useState({
    new_password: '',
    confirm_password: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([usersAPI.getUsers(), usersAPI.getRoles()]);
      setUsers(Array.isArray(usersRes?.data) ? usersRes.data : []);
      setRoles(Array.isArray(rolesRes?.data) ? rolesRes.data : []);
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (u) => {
    if (!hasPermission('delete_user')) {
      toast.error('Permission denied');
      return;
    }
    if (!window.confirm(`Delete user "${u?.username}"? This will deactivate the account.`)) {
      return;
    }

    try {
      setSaving(true);
      await usersAPI.deleteUser(u.id);
      toast.success('User deleted');
      await fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to delete user');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const hay = [u.username, u.email, u.role?.name].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [users, search]);

  const openCreate = () => {
    setEditingUser(null);
    setResetUser(null);
    setForm({ username: '', email: '', role_id: roles?.[0]?.id || '', password: '', is_active: true });
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditingUser(u);
    setResetUser(null);
    setForm({
      username: u.username,
      email: u.email,
      role_id: u.role_id,
      password: '',
      is_active: u.is_active,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingUser(null);
  };

  const openResetPassword = (u) => {
    setResetUser(u);
    setResetForm({ new_password: '', confirm_password: '' });
  };

  const closeResetPassword = () => {
    if (saving) return;
    setResetUser(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!form.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!form.role_id) {
      toast.error('Role is required');
      return;
    }

    try {
      setSaving(true);
      if (!editingUser) {
        if (!hasPermission('create_user')) {
          toast.error('Permission denied');
          return;
        }
        if (!form.username.trim()) {
          toast.error('Username is required');
          return;
        }
        if (!form.password) {
          toast.error('Password is required');
          return;
        }

        await usersAPI.createUser({
          username: form.username.trim(),
          email: form.email.trim(),
          role_id: Number(form.role_id),
          password: form.password,
        });
        toast.success('User created');
      } else {
        if (!hasPermission('update_user')) {
          toast.error('Permission denied');
          return;
        }
        await usersAPI.updateUser(editingUser.id, {
          email: form.email.trim(),
          role_id: Number(form.role_id),
          is_active: Boolean(form.is_active),
        });
        toast.success('User updated');
      }

      closeModal();
      await fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const onResetPassword = async (e) => {
    e.preventDefault();
    if (!resetUser) return;

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

  if (loading) {
    return (
      <div className="users-page">
        <div className="loading-spinner" aria-label="Loading users" />
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <div className="header-left">
          <h1 className="page-title">
            <FiUser /> Users
          </h1>
          <p className="page-subtitle">Manage users, roles, and access</p>
        </div>

        <div className="header-right">
          <div className="users-search">
            <FiSearch className="search-icon" />
            <input
              className="search-input"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button className="btn btn-outline btn-sm" onClick={fetchData} disabled={saving}>
            <FiRefreshCw /> Refresh
          </button>

          {hasPermission('create_user') ? (
            <button className="btn btn-primary btn-sm" onClick={openCreate} disabled={saving}>
              <FiPlus /> Add User
            </button>
          ) : null}
        </div>
      </div>

      <div className="users-table-card">
        <table className="users-table">
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
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="users-empty">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
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
                    {hasPermission('update_user') ? (
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(u)}>
                        <FiEdit2 /> Edit
                      </button>
                    ) : null}
                    {hasPermission('change_user_password') ? (
                      <button className="btn btn-outline btn-sm" onClick={() => openResetPassword(u)}>
                        <FiKey /> Reset
                      </button>
                    ) : null}
                    {hasPermission('delete_user') && u?.username !== 'admin' ? (
                      <button className="btn btn-outline btn-sm" onClick={() => handleDelete(u)} disabled={saving}>
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

      {modalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title">{editingUser ? 'Edit User' : 'Add User'}</div>
              <button className="modal-close" onClick={closeModal} aria-label="Close">
                <FiX />
              </button>
            </div>

            <form onSubmit={onSubmit} className="modal-body">
              <div className="form-grid">
                {!editingUser ? (
                  <>
                    <div className="form-group">
                      <label>Username</label>
                      <input
                        className="input"
                        value={form.username}
                        onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Password</label>
                      <input
                        className="input"
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                        required
                      />
                    </div>
                  </>
                ) : null}

                <div className="form-group">
                  <label>Email</label>
                  <input
                    className="input"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Role</label>
                  <select
                    className="input"
                    value={form.role_id}
                    onChange={(e) => setForm((p) => ({ ...p, role_id: e.target.value }))}
                    required
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {editingUser ? (
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      className="input"
                      value={String(form.is_active)}
                      onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.value === 'true' }))}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                ) : null}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
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
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    className="input"
                    type="password"
                    value={resetForm.new_password}
                    onChange={(e) => setResetForm((p) => ({ ...p, new_password: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    className="input"
                    type="password"
                    value={resetForm.confirm_password}
                    onChange={(e) => setResetForm((p) => ({ ...p, confirm_password: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={closeResetPassword} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
