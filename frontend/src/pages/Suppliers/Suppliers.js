import React, { useEffect, useMemo, useState } from 'react';
import { FiPlus, FiRefreshCw, FiSearch, FiX, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { suppliersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './Suppliers.css';

const Suppliers = () => {
  const { hasPermission } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
  });

  const fetchSuppliers = async () => {
    try {
      setError(null);
      const res = await suppliersAPI.getSuppliers();
      setSuppliers(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      console.error('Suppliers fetch error:', e);
      setError('Failed to load suppliers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter((s) => {
      const hay = [s.name, s.email, s.phone, s.address, s.city]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [suppliers, search]);

  const openCreate = () => {
    setForm({ name: '', email: '', phone: '', address: '', city: '' });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const onChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const validate = () => {
    if (!form.name.trim()) return 'Supplier name is required';
    return null;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setSaving(true);
      await suppliersAPI.createSupplier({
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
      });
      toast.success('Supplier created');
      setModalOpen(false);
      setRefreshing(true);
      await fetchSuppliers();
    } catch (e2) {
      console.error('Supplier create error:', e2);
      toast.error(e2?.response?.data?.detail || 'Failed to create supplier');
    } finally {
      setSaving(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSuppliers();
  };

  const handleDelete = async (supplier) => {
    if (!hasPermission('create_item')) {
      toast.error('Permission denied');
      return;
    }
    if (!window.confirm(`Delete supplier "${supplier?.name}"? This will deactivate it.`)) {
      return;
    }
    try {
      setRefreshing(true);
      await suppliersAPI.deleteSupplier(supplier.id);
      toast.success('Supplier deleted');
      await fetchSuppliers();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to delete supplier');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="suppliers-loading">
        <div className="loading-spinner" aria-label="Loading suppliers" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="suppliers-error">
        <div className="suppliers-error-title">Suppliers</div>
        <div className="suppliers-error-text">{error}</div>
        <button className="btn btn-primary btn-sm" onClick={fetchSuppliers}>
          <FiRefreshCw /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="suppliers-page">
      <div className="suppliers-header">
        <div>
          <h1 className="dashboard-title">Suppliers</h1>
          <p className="dashboard-subtitle">Manage vendors and contact details</p>
        </div>

        <div className="header-right">
          <div className="suppliers-search">
            <FiSearch className="search-icon" />
            <input
              className="search-input"
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            className="btn btn-outline btn-sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <FiRefreshCw className={refreshing ? 'spinning' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <FiPlus /> Add Supplier
          </button>
        </div>
      </div>

      <div className="suppliers-table-card">
        <table className="suppliers-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="suppliers-empty">No suppliers found</div>
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="supplier-name">{s.name}</div>
                    {s.city ? <div className="supplier-sub">{s.city}</div> : null}
                  </td>
                  <td className="supplier-sub">{s.email || '-'}</td>
                  <td className="supplier-sub">{s.phone || '-'}</td>
                  <td className="supplier-sub">{s.address || '-'}</td>
                  <td className="actions-col">
                    <button className="btn btn-outline btn-sm" onClick={() => handleDelete(s)} disabled={refreshing}>
                      <FiTrash2 /> Delete
                    </button>
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
              <div className="modal-title">Add Supplier</div>
              <button className="modal-close" onClick={closeModal} aria-label="Close">
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleCreate}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Supplier Name</label>
                    <input className="input" value={form.name} onChange={onChange('name')} />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input className="input" value={form.email} onChange={onChange('email')} />
                  </div>

                  <div className="form-group">
                    <label>Phone</label>
                    <input className="input" value={form.phone} onChange={onChange('phone')} />
                  </div>

                  <div className="form-group">
                    <label>City</label>
                    <input className="input" value={form.city} onChange={onChange('city')} />
                  </div>

                  <div className="form-group full">
                    <label>Address</label>
                    <input className="input" value={form.address} onChange={onChange('address')} />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-outline btn-sm" onClick={closeModal} disabled={saving}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
