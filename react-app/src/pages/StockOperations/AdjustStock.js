import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiSliders, FiRefreshCw } from 'react-icons/fi';
import { stockAPI, batchesAPI, itemsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import './StockOperations.css';

const AdjustStock = () => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [items, setItems] = useState([]);
  const [batches, setBatches] = useState([]);

  const [form, setForm] = useState({
    item_id: '',
    batch_id: '',
    adjustment_quantity: '',
    reason: '',
    reference_number: '',
  });

  const canUse = hasPermission('adjust_stock');

  const fetchLookups = async () => {
    try {
      setLoading(true);
      const [itemsRes, batchesRes] = await Promise.all([itemsAPI.getItems(), batchesAPI.getBatches()]);
      const nextItems = Array.isArray(itemsRes?.data) ? itemsRes.data : [];
      const nextBatches = Array.isArray(batchesRes?.data) ? batchesRes.data : [];
      setItems(nextItems);
      setBatches(nextBatches);

      const firstBatch = nextBatches?.[0];
      setForm((p) => ({
        ...p,
        item_id: p.item_id || String(firstBatch?.item_id || nextItems?.[0]?.id || ''),
        batch_id: p.batch_id || String(firstBatch?.id || ''),
      }));
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLookups();
  }, []);

  const filteredBatches = useMemo(() => {
    return (batches || []).filter((b) => String(b.item_id) === String(form.item_id));
  }, [batches, form.item_id]);

  useEffect(() => {
    if (!form.batch_id && filteredBatches.length) {
      setForm((p) => ({ ...p, batch_id: String(filteredBatches[0].id) }));
    }
  }, [filteredBatches, form.batch_id]);

  const genRef = () => `ADJ-${Date.now()}`;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canUse) {
      toast.error('Permission denied');
      return;
    }

    try {
      setSaving(true);
      await stockAPI.adjustStock({
        batch_id: Number(form.batch_id),
        adjustment_quantity: Number(form.adjustment_quantity),
        reason: form.reason.trim(),
        reference_number: form.reference_number.trim() || genRef(),
      });
      toast.success('Stock adjusted');
      setForm((p) => ({ ...p, adjustment_quantity: '', reason: '', reference_number: '' }));
      await fetchLookups();
    } catch (e2) {
      toast.error(e2?.response?.data?.detail || 'Failed to adjust stock');
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
        title="Adjust Stock"
        subtitle="Increase or decrease stock for a batch with a reason"
        icon={FiSliders}
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
              <select className="input" value={form.item_id} onChange={(e) => setForm((p) => ({ ...p, item_id: e.target.value, batch_id: '' }))}>
                {items.map((it) => (
                  <option key={it.id} value={String(it.id)}>
                    {it.name} ({it.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group full">
              <label>Batch</label>
              <select className="input" value={form.batch_id} onChange={(e) => setForm((p) => ({ ...p, batch_id: e.target.value }))}>
                {filteredBatches.map((b) => (
                  <option key={b.id} value={String(b.id)}>
                    {b.batch_number} | qty={b.quantity} | exp={b.expiry_date} | loc={b.location?.name || b.location_id}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Adjustment Quantity</label>
              <input className="input" type="number" value={form.adjustment_quantity} onChange={(e) => setForm((p) => ({ ...p, adjustment_quantity: e.target.value }))} required placeholder="e.g. +10 or -5" />
              <div className="helper">Use positive to add stock, negative to reduce stock.</div>
            </div>

            <div className="form-group">
              <label>Reason</label>
              <input className="input" value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} required placeholder="e.g. Count correction" />
            </div>

            <div className="form-group full">
              <label>Reference Number</label>
              <input className="input" value={form.reference_number} onChange={(e) => setForm((p) => ({ ...p, reference_number: e.target.value }))} placeholder={genRef()} />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Adjust Stock'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AdjustStock;
