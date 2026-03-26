import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { FiRepeat, FiRefreshCw } from 'react-icons/fi';
import { stockAPI, batchesAPI, locationsAPI, itemsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import './StockOperations.css';

const TransferStock = () => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [items, setItems] = useState([]);
  const [batches, setBatches] = useState([]);
  const [locations, setLocations] = useState([]);

  const [form, setForm] = useState({
    item_id: '',
    batch_id: '',
    source_location_id: '',
    destination_location_id: '',
    quantity: '',
    reference_number: '',
    remarks: '',
  });

  const canUse = hasPermission('transfer_stock');

  const fetchLookups = async () => {
    try {
      setLoading(true);
      const [itemsRes, batchesRes, locRes] = await Promise.all([itemsAPI.getItems(), batchesAPI.getBatches(), locationsAPI.getLocations()]);
      const nextItems = Array.isArray(itemsRes?.data) ? itemsRes.data : [];
      const nextBatches = Array.isArray(batchesRes?.data) ? batchesRes.data : [];
      const nextLocs = Array.isArray(locRes?.data) ? locRes.data : [];
      setItems(nextItems);
      setBatches(nextBatches);
      setLocations(nextLocs);

      const firstBatch = nextBatches?.[0];
      setForm((p) => ({
        ...p,
        item_id: p.item_id || String(firstBatch?.item_id || nextItems?.[0]?.id || ''),
        batch_id: p.batch_id || String(firstBatch?.id || ''),
        source_location_id: p.source_location_id || String(firstBatch?.location_id || nextLocs?.[0]?.id || ''),
        destination_location_id: p.destination_location_id || String(nextLocs?.[1]?.id || nextLocs?.[0]?.id || ''),
      }));
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Failed to load batches/locations');
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
      const b = filteredBatches[0];
      setForm((p) => ({ ...p, batch_id: String(b.id), source_location_id: String(b.location_id) }));
    }
  }, [filteredBatches, form.batch_id]);

  const selectedBatch = useMemo(() => {
    return batches.find((b) => String(b.id) === String(form.batch_id));
  }, [batches, form.batch_id]);

  const genRef = () => `TRF-${Date.now()}`;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canUse) {
      toast.error('Permission denied');
      return;
    }

    if (String(form.source_location_id) === String(form.destination_location_id)) {
      toast.error('Source and destination must be different');
      return;
    }

    try {
      setSaving(true);
      await stockAPI.transferStock({
        batch_id: Number(form.batch_id),
        source_location_id: Number(form.source_location_id),
        destination_location_id: Number(form.destination_location_id),
        quantity: Number(form.quantity),
        reference_number: form.reference_number.trim() || genRef(),
        remarks: form.remarks?.trim() || null,
      });
      toast.success('Stock transferred');
      setForm((p) => ({ ...p, quantity: '', reference_number: '', remarks: '' }));
      await fetchLookups();
    } catch (e2) {
      toast.error(e2?.response?.data?.detail || 'Failed to transfer stock');
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
        title="Transfer Stock"
        subtitle="Move stock between locations (batch-level)"
        icon={FiRepeat}
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
              <select className="input" value={form.batch_id} onChange={(e) => {
                const b = batches.find((x) => String(x.id) === String(e.target.value));
                setForm((p) => ({ ...p, batch_id: e.target.value, source_location_id: String(b?.location_id || p.source_location_id) }));
              }}>
                {filteredBatches.map((b) => (
                  <option key={b.id} value={String(b.id)}>
                    {b.batch_number} | qty={b.quantity} | exp={b.expiry_date} | loc={b.location?.name || b.location_id}
                  </option>
                ))}
              </select>
              {selectedBatch ? <div className="helper">Selected batch qty: {selectedBatch.quantity}</div> : null}
            </div>

            <div className="form-group">
              <label>Source Location</label>
              <select className="input" value={form.source_location_id} onChange={(e) => setForm((p) => ({ ...p, source_location_id: e.target.value }))}>
                {locations.map((l) => (
                  <option key={l.id} value={String(l.id)}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Destination Location</label>
              <select className="input" value={form.destination_location_id} onChange={(e) => setForm((p) => ({ ...p, destination_location_id: e.target.value }))}>
                {locations.map((l) => (
                  <option key={l.id} value={String(l.id)}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Quantity</label>
              <input className="input" type="number" min="1" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} required />
            </div>

            <div className="form-group">
              <label>Reference Number</label>
              <input className="input" value={form.reference_number} onChange={(e) => setForm((p) => ({ ...p, reference_number: e.target.value }))} placeholder={genRef()} />
            </div>

            <div className="form-group full">
              <label>Remarks</label>
              <input className="input" value={form.remarks} onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))} placeholder="Optional" />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Transfer Stock'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default TransferStock;
