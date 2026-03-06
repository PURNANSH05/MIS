import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiArrowDownCircle, FiRefreshCw } from 'react-icons/fi';
import { stockAPI, itemsAPI, locationsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import './StockOperations.css';

const ReceiveStock = () => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);

  const [form, setForm] = useState({
    item_id: '',
    batch_number: '',
    manufacturing_date: '',
    expiry_date: '',
    location_id: '',
    quantity: '',
    reference_number: '',
    remarks: '',
  });

  const canUse = hasPermission('receive_stock');

  const fetchLookups = async () => {
    try {
      setLoading(true);
      const [itemsRes, locRes] = await Promise.all([itemsAPI.getItems(), locationsAPI.getLocations()]);
      const nextItems = Array.isArray(itemsRes?.data) ? itemsRes.data : [];
      const nextLocs = Array.isArray(locRes?.data) ? locRes.data : [];
      setItems(nextItems);
      setLocations(nextLocs);

      setForm((p) => ({
        ...p,
        item_id: p.item_id || String(nextItems?.[0]?.id || ''),
        location_id: p.location_id || String(nextLocs?.[0]?.id || ''),
      }));
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to load items/locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLookups();
  }, []);

  const itemLabel = useMemo(() => {
    const it = items.find((x) => String(x.id) === String(form.item_id));
    return it ? `${it.name} (${it.sku})` : '';
  }, [items, form.item_id]);

  const genRef = () => {
    const ts = Date.now();
    return `RCV-${ts}`;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canUse) {
      toast.error('Permission denied');
      return;
    }

    if (!form.item_id || !form.location_id) {
      toast.error('Item and location are required');
      return;
    }

    try {
      setSaving(true);
      await stockAPI.receiveStock({
        item_id: Number(form.item_id),
        batch_number: form.batch_number.trim(),
        manufacturing_date: form.manufacturing_date,
        expiry_date: form.expiry_date,
        location_id: Number(form.location_id),
        quantity: Number(form.quantity),
        reference_number: form.reference_number.trim() || genRef(),
        remarks: form.remarks?.trim() || null,
      });
      toast.success('Stock received');
      setForm((p) => ({
        ...p,
        batch_number: '',
        quantity: '',
        reference_number: '',
        remarks: '',
      }));
    } catch (e2) {
      toast.error(e2?.response?.data?.detail || 'Failed to receive stock');
    } finally {
      setSaving(false);
    }
  };

  if (!canUse) {
    return (
      <div className="stock-page">
        <div className="stock-error">Permission denied</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="stock-page">
        <div className="loading-spinner" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="stock-page">
      <PageHeader
        title="Receive Stock"
        subtitle="Add new stock into inventory (creates/updates batches)"
        icon={FiArrowDownCircle}
        actions={
          <button className="btn btn-outline btn-sm" onClick={fetchLookups} disabled={saving}>
            <FiRefreshCw /> Refresh
          </button>
        }
      />

      <Card className="stock-card">
        <form onSubmit={onSubmit} className="stock-form">
          <div className="form-grid">
            <div className="form-group full">
              <label>Item</label>
              <select className="input" value={form.item_id} onChange={(e) => setForm((p) => ({ ...p, item_id: e.target.value }))}>
                {items.map((it) => (
                  <option key={it.id} value={String(it.id)}>
                    {it.name} ({it.sku})
                  </option>
                ))}
              </select>
              <div className="helper">Selected: {itemLabel}</div>
            </div>

            <div className="form-group">
              <label>Batch Number</label>
              <input className="input" value={form.batch_number} onChange={(e) => setForm((p) => ({ ...p, batch_number: e.target.value }))} required />
            </div>

            <div className="form-group">
              <label>Quantity</label>
              <input className="input" type="number" min="1" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} required />
            </div>

            <div className="form-group">
              <label>Manufacturing Date</label>
              <input className="input" type="date" value={form.manufacturing_date} onChange={(e) => setForm((p) => ({ ...p, manufacturing_date: e.target.value }))} required />
            </div>

            <div className="form-group">
              <label>Expiry Date</label>
              <input className="input" type="date" value={form.expiry_date} onChange={(e) => setForm((p) => ({ ...p, expiry_date: e.target.value }))} required />
            </div>

            <div className="form-group full">
              <label>Location</label>
              <select className="input" value={form.location_id} onChange={(e) => setForm((p) => ({ ...p, location_id: e.target.value }))}>
                {locations.map((l) => (
                  <option key={l.id} value={String(l.id)}>
                    {l.name} ({l.location_type})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Reference Number</label>
              <input className="input" value={form.reference_number} onChange={(e) => setForm((p) => ({ ...p, reference_number: e.target.value }))} placeholder={genRef()} />
            </div>

            <div className="form-group">
              <label>Remarks</label>
              <input className="input" value={form.remarks} onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))} placeholder="Optional" />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Receive Stock'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ReceiveStock;
