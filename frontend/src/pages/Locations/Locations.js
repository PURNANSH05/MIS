import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiMapPin, FiPlus, FiEdit, FiRefreshCw, FiSearch, FiX, FiTrash2 } from 'react-icons/fi';
import { locationsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './Locations.css';

const Locations = () => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [locations, setLocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  const [form, setForm] = useState({
    name: '',
    location_type: 'Storage',
    description: '',
  });

  const filteredLocations = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter((l) => {
      const name = (l.name || '').toLowerCase();
      const type = (l.location_type || '').toLowerCase();
      const desc = (l.description || '').toLowerCase();
      return name.includes(q) || type.includes(q) || desc.includes(q);
    });
  }, [locations, searchTerm]);

  const fetchLocations = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await locationsAPI.getLocations();
      setLocations(res?.data || []);
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || 'Failed to load locations';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (loc) => {
    if (!hasPermission('delete_location')) {
      toast.error('Permission denied');
      return;
    }
    if (!window.confirm(`Delete location "${loc?.name}"? This will deactivate it.`)) {
      return;
    }

    try {
      setSaving(true);
      await locationsAPI.deleteLocation(loc.id);
      toast.success('Location deleted');
      await fetchLocations();
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to delete location';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const openCreate = () => {
    setEditingLocation(null);
    setForm({ name: '', location_type: 'Storage', description: '' });
    setIsModalOpen(true);
  };

  const openEdit = (loc) => {
    setEditingLocation(loc);
    setForm({
      name: loc?.name || '',
      location_type: loc?.location_type || 'Storage',
      description: loc?.description || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLocation(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const name = form.name.trim();
    if (!name) {
      toast.error('Location name is required');
      return;
    }

    try {
      setSaving(true);
      if (editingLocation?.id) {
        await locationsAPI.updateLocation(editingLocation.id, {
          name,
          location_type: form.location_type,
          description: form.description || null,
        });
        toast.success('Location updated');
      } else {
        await locationsAPI.createLocation({
          name,
          location_type: form.location_type,
          description: form.description || null,
        });
        toast.success('Location created');
      }

      closeModal();
      await fetchLocations();
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Failed to save location';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="locations-page">
        <div className="loading-spinner" aria-label="Loading locations" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="locations-page">
        <div className="locations-error">
          <div className="locations-error-title">Locations Error</div>
          <div className="locations-error-text">{error}</div>
          <button className="btn btn-primary btn-sm" onClick={fetchLocations}>
            <FiRefreshCw /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="locations-page">
      <div className="locations-header">
        <div className="header-left">
          <h1 className="page-title">
            <FiMapPin /> Locations
          </h1>
          <p className="page-subtitle">Manage storage and department locations</p>
        </div>
        <div className="header-right">
          <div className="locations-search">
            <FiSearch className="search-icon" />
            <input
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search locations..."
              type="text"
            />
          </div>
          <button className="btn btn-outline btn-sm" onClick={fetchLocations}>
            <FiRefreshCw /> Refresh
          </button>
          {hasPermission('create_location') ? (
            <button className="btn btn-primary btn-sm" onClick={openCreate}>
              <FiPlus /> Add Location
            </button>
          ) : null}
        </div>
      </div>

      <div className="locations-table-card">
        <table className="locations-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Description</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLocations.length === 0 ? (
              <tr>
                <td colSpan={4} className="locations-empty">
                  No locations found
                </td>
              </tr>
            ) : (
              filteredLocations.map((loc) => (
                <tr key={loc.id}>
                  <td className="location-name">{loc.name}</td>
                  <td>{loc.location_type}</td>
                  <td className="location-desc">{loc.description || '-'}</td>
                  <td className="actions-col">
                    {hasPermission('update_location') ? (
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(loc)}>
                        <FiEdit /> Edit
                      </button>
                    ) : null}
                    {hasPermission('delete_location') ? (
                      <button className="btn btn-outline btn-sm" onClick={() => handleDelete(loc)} disabled={saving}>
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

      {isModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title">{editingLocation ? 'Edit Location' : 'Add Location'}</div>
              <button className="modal-close" onClick={closeModal} aria-label="Close">
                <FiX />
              </button>
            </div>

            <form onSubmit={onSubmit} className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g., Main Store"
                    type="text"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Type</label>
                  <select
                    className="input"
                    value={form.location_type}
                    onChange={(e) => setForm((p) => ({ ...p, location_type: e.target.value }))}
                  >
                    <option value="Storage">Storage</option>
                    <option value="Department">Department</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Lab">Lab</option>
                    <option value="Ward">Ward</option>
                  </select>
                </div>

                <div className="form-group full">
                  <label>Description</label>
                  <textarea
                    className="input"
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Optional notes about this location"
                    rows={3}
                  />
                </div>
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
    </div>
  );
};

export default Locations;
