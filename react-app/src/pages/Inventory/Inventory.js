import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FiPackage, FiTrash2, FiSearch, FiFilter, FiDownload, FiEye, FiX, FiRefreshCw, FiPlus, FiCheckCircle } from 'react-icons/fi';
import { itemsAPI, batchesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import { downloadReport } from '../../services/reportGenerator';
import './Inventory.css';

const Inventory = () => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [creatingItem, setCreatingItem] = useState(false);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedItems, setSelectedItems] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [quickFilter, setQuickFilter] = useState('all');

  const [batchesByItemId, setBatchesByItemId] = useState(new Map());
  const [detailsItem, setDetailsItem] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    sku: '',
    category: 'Medications',
    unit: 'Box',
    reorder_level: 10,
    description: '',
  });

  const categories = ['all', 'PPE', 'Equipment', 'Medications', 'Supplies', 'Devices'];
  const itemCategories = ['Medications', 'PPE', 'Equipment', 'Supplies', 'Devices'];
  const unitOptions = ['Box', 'Bottle', 'Strip', 'Pack', 'Piece', 'Vial', 'Tablet', 'Capsule'];
  const [locations, setLocations] = useState(['all']);
  const statuses = ['all', 'in-stock', 'low-stock', 'out-of-stock'];
  const canCreateItem = hasPermission('create_item');

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    filterAndSortItems();
  }, [items, searchTerm, selectedCategory, selectedLocation, selectedStatus, sortBy, sortOrder, quickFilter]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const [itemsRes, batchesRes] = await Promise.all([
        itemsAPI.getItems(),
        batchesAPI.getBatches(),
      ]);

      const rawItems = itemsRes?.data || [];
      const batches = batchesRes?.data || [];

      const locationNameSet = new Set();

      const qtyByItemId = new Map();
      const locationsByItemId = new Map();
      const nearestExpiryByItemId = new Map();

      const nextBatchesByItemId = new Map();

      batches.forEach((b) => {
        const itemId = b.item_id;
        const qty = Number(b.quantity || 0);
        qtyByItemId.set(itemId, (qtyByItemId.get(itemId) || 0) + qty);

        const list = nextBatchesByItemId.get(itemId) || [];
        list.push(b);
        nextBatchesByItemId.set(itemId, list);

        const locName = b.location?.name;
        if (locName) {
          locationNameSet.add(locName);
          const set = locationsByItemId.get(itemId) || new Set();
          set.add(locName);
          locationsByItemId.set(itemId, set);
        }

        const expiry = b.expiry_date;
        if (expiry) {
          const existing = nearestExpiryByItemId.get(itemId);
          if (!existing || String(expiry) < String(existing)) {
            nearestExpiryByItemId.set(itemId, expiry);
          }
        }
      });

      const mappedItems = rawItems.map((it) => {
        const quantity = qtyByItemId.get(it.id) || 0;
        const reorderLevel = it.reorder_level ?? 10;
        const status = quantity === 0 ? 'out-of-stock' : quantity < reorderLevel ? 'low-stock' : 'in-stock';
        const locSet = locationsByItemId.get(it.id);
        const locArray = locSet && locSet.size ? Array.from(locSet).sort((a, b) => a.localeCompare(b)) : [];
        const locLabel = locArray.length ? locArray.slice(0, 2).join(', ') : '—';

        return {
          id: it.id,
          name: it.name,
          sku: it.sku,
          category: it.category,
          unit: it.unit,
          description: it.description || '',
          minStock: reorderLevel,
          quantity,
          status,
          location: locLabel,
          locations: locArray,
          expiryDate: nearestExpiryByItemId.get(it.id) || null,
          lastUpdated: it.updated_at,
        };
      });

      setItems(mappedItems);
      setBatchesByItemId(nextBatchesByItemId);
      setLocations(['all', ...Array.from(locationNameSet).sort((a, b) => a.localeCompare(b))]);
    } catch (error) {
      toast.error('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortItems = () => {
    let filtered = items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesLocation =
        selectedLocation === 'all' ||
        (Array.isArray(item.locations) && item.locations.includes(selectedLocation));
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

      const expiryBucket = getExpiryBucket(item.expiryDate);
      const matchesQuick =
        quickFilter === 'all' ||
        (quickFilter === 'low' && item.status === 'low-stock') ||
        (quickFilter === 'near' && (expiryBucket === 'near' || expiryBucket === 'expired'));
      
      return matchesSearch && matchesCategory && matchesLocation && matchesStatus && matchesQuick;
    });

    // Sort items
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredItems(filtered);
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await itemsAPI.deleteItem(itemId);
        setItems(items.filter(item => item.id !== itemId));
        toast.success('Item deleted successfully');
      } catch (error) {
        toast.error(error?.response?.data?.detail || 'Failed to delete item');
      }
    }
  };

  const openDetails = (item) => {
    setDetailsItem(item);
  };

  const closeDetails = () => {
    setDetailsItem(null);
  };

  const resetCreateForm = () => {
    setCreateForm({
      name: '',
      sku: '',
      category: 'Medications',
      unit: 'Box',
      reorder_level: 10,
      description: '',
    });
  };

  const closeCreateModal = () => {
    if (creatingItem) return;
    setShowCreateModal(false);
    resetCreateForm();
  };

  const openCreateModal = () => {
    if (!canCreateItem) {
      toast.error('You do not have permission to create items');
      return;
    }
    setShowCreateModal(true);
  };

  const handleCreateFormChange = (field, value) => {
    setCreateForm((prev) => ({
      ...prev,
      [field]: field === 'sku' ? String(value).toUpperCase() : value,
    }));
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();

    if (!canCreateItem) {
      toast.error('You do not have permission to create items');
      return;
    }

    const payload = {
      name: createForm.name.trim(),
      sku: createForm.sku.trim().toUpperCase(),
      category: createForm.category,
      unit: createForm.unit,
      reorder_level: Number(createForm.reorder_level) || 0,
      description: createForm.description.trim() || null,
    };

    if (!payload.name || !payload.sku || !payload.category || !payload.unit) {
      toast.error('Please fill all required item details');
      return;
    }

    try {
      setCreatingItem(true);
      await itemsAPI.createItem(payload);
      await fetchItems();
      setShowCreateModal(false);
      resetCreateForm();
      toast.success('Item created successfully. You can now receive stock for it.');
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Failed to create item');
    } finally {
      setCreatingItem(false);
    }
  };

  const getExpiryBucket = (isoDate) => {
    if (!isoDate) return 'none';
    const d = new Date(String(isoDate));
    if (Number.isNaN(d.getTime())) return 'none';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'expired';
    if (diffDays <= 30) return 'near';
    return 'ok';
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      toast.warning('No items selected');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} items?`)) {
      try {
        await Promise.all(selectedItems.map((id) => itemsAPI.deleteItem(id)));
        setItems(items.filter(item => !selectedItems.includes(item.id)));
        setSelectedItems([]);
        toast.success(`${selectedItems.length} items deleted successfully`);
      } catch (error) {
        toast.error(error?.response?.data?.detail || 'Failed to delete items');
      }
    }
  };

  const handleExport = () => {
    const reportData = {
      title: 'INVENTORY STOCK REPORT',
      subtitle: 'Complete Medical Inventory Listing with Status',
      generatedAt: new Date(),
      columns: ['Name', 'SKU', 'Category', 'Locations', 'Total Quantity', 'Unit', 'Reorder Level', 'Status', 'Nearest Expiry'],
      data: filteredItems.map(item => ({
        Name: item.name,
        SKU: item.sku,
        Category: item.category,
        Locations: Array.isArray(item.locations) ? item.locations.join(' | ') : item.location,
        'Total Quantity': item.quantity,
        Unit: item.unit,
        'Reorder Level': item.minStock,
        Status: item.status,
        'Nearest Expiry': item.expiryDate || 'N/A',
      })),
      summaryStats: [
        { label: 'Total Items Listed', value: filteredItems.length },
        { label: 'Total Stock Value', value: `$${(filteredItems.reduce((sum, item) => sum + (item.quantity * (item.unitPrice || 0)), 0)).toFixed(2)}` },
        { label: 'Average Stock Level', value: Math.round(filteredItems.reduce((sum, item) => sum + item.quantity, 0) / filteredItems.length || 0) },
        { label: 'Filter Applied', value: `Category: ${selectedCategory}, Status: ${selectedStatus}` },
      ],
      footer: 'This inventory report contains current stock information. All quantities, prices, and dates are as of the report generation time.',
    };
    
    downloadReport(`inventory-report-${Date.now()}.csv`, reportData);
    toast.success('Inventory report exported successfully');
  };

  const downloadBatchesCsv = (item) => {
    const batches = batchesByItemId.get(item.id) || [];
    const reportData = {
      title: 'BATCH DETAILS REPORT',
      subtitle: `Batch Information for: ${item.name} (${item.sku})`,
      generatedAt: new Date(),
      columns: ['Medicine', 'SKU', 'Batch Number', 'Location', 'Quantity', 'Manufacturing Date', 'Expiry Date'],
      data: batches.map((b) => ({
        Medicine: item.name,
        SKU: item.sku,
        'Batch Number': b.batch_number,
        Location: b.location?.name || b.location_name || String(b.location_id || 'Unknown'),
        Quantity: String(b.quantity ?? 0),
        'Manufacturing Date': b.manufacturing_date || 'N/A',
        'Expiry Date': b.expiry_date || 'N/A',
      })),
      summaryStats: [
        { label: 'Total Batches', value: batches.length },
        { label: 'Total Quantity', value: batches.reduce((sum, b) => sum + (b.quantity || 0), 0) },
        { label: 'Product', value: item.name },
        { label: 'Product SKU', value: item.sku },
      ],
      footer: 'This batch report provides detailed information about all batches for the specified medical item.',
    };
    
    downloadReport(`batch-details-${item.sku || item.id}-${Date.now()}.csv`, reportData);
    toast.success('Batch report exported successfully');
  };

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleAllItems = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="inventory-page">
        <div className="loading-spinner" aria-label="Loading inventory" />
      </div>
    );
  }

  return (
    <div className="inventory-page">
      <PageHeader
        title="Medicines Inventory"
        subtitle="Manage item records, stock posture, locations, and expiry exposure from one workspace."
        icon={FiPackage}
        actions={
          <>
            <button onClick={fetchItems} className="btn btn-outline btn-sm">
              <FiRefreshCw /> Refresh
            </button>
            {canCreateItem ? (
              <button
                onClick={openCreateModal}
                className="btn btn-primary btn-sm"
              >
                <FiPlus /> Add Item
              </button>
            ) : null}
            <button
              onClick={handleExport}
              className="btn btn-outline btn-sm"
            >
              <FiDownload /> Export
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-outline btn-sm"
            >
              <FiFilter /> Filters
            </button>
          </>
        }
      />

      {/* Statistics */}
      <div className="inventory-stats">
        <div className="stat-card">
          <div className="stat-label">Total Items</div>
          <div className="stat-value">{items.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Low Stock</div>
          <div className="stat-value">{items.filter(i => i.status === 'low-stock').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Out of Stock</div>
          <div className="stat-value">{items.filter(i => i.status === 'out-of-stock').length}</div>
        </div>
      </div>

      <div className="quick-filters">
        <button className={`chip ${quickFilter === 'all' ? 'active' : ''}`} onClick={() => setQuickFilter('all')}>
          All
        </button>
        <button className={`chip ${quickFilter === 'low' ? 'active' : ''}`} onClick={() => setQuickFilter('low')}>
          Low Stock
        </button>
        <button className={`chip ${quickFilter === 'near' ? 'active' : ''}`} onClick={() => setQuickFilter('near')}>
          Near Expiry
        </button>
      </div>

      <Card className="inventory-cta-card">
        <div className="inventory-cta-copy">
          <div className="inventory-cta-eyebrow">Item Master Setup</div>
          <h2>Add a new medicine or supply item</h2>
          <p>
            Create the item profile with name, SKU, category, unit, and reorder level. After saving it,
            use Receive Stock to add batches and quantities.
          </p>
          <div className="inventory-cta-points">
            <span><FiCheckCircle /> Professional item record</span>
            <span><FiCheckCircle /> Ready for stock receiving</span>
            <span><FiCheckCircle /> Visible instantly in inventory</span>
          </div>
        </div>
        <div className="inventory-cta-actions">
          {canCreateItem ? (
            <button type="button" className="btn btn-primary" onClick={openCreateModal}>
              <FiPlus /> Create New Item
            </button>
          ) : (
            <div className="inventory-cta-note">
              Your account needs the <span className="mono">create_item</span> permission to add medicines.
            </div>
          )}
        </div>
      </Card>

      {/* Filters */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-grid">
            <div className="filter-group">
              <label>Search</label>
              <div className="search-box">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
            <div className="filter-group">
              <label>Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="filter-select"
              >
                {locations.map(loc => (
                  <option key={loc} value={loc}>
                    {loc === 'all' ? 'All Locations' : loc}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="filter-select"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Status' : status.replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="name">Name</option>
                <option value="sku">SKU</option>
                <option value="category">Category</option>
                <option value="location">Location</option>
                <option value="quantity">Quantity</option>
                <option value="price">Price</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="filter-select"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="bulk-actions">
          <div className="bulk-info">
            <span>{selectedItems.length} items selected</span>
          </div>
          <div className="bulk-buttons">
            <button
              onClick={toggleAllItems}
              className="btn btn-outline btn-sm"
            >
              {selectedItems.length === filteredItems.length ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={handleBulkDelete}
              className="btn btn-danger btn-sm"
            >
              <FiTrash2 /> Delete Selected
            </button>
          </div>
        </div>
      )}

      <div className="view-controls">
        <div className="view-info">
          <span>Showing {currentItems.length} of {filteredItems.length} medicines</span>
        </div>
      </div>

      <div className="inventory-table-card">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Medicine</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Locations</th>
              <th>Total Stock</th>
              <th>Reorder</th>
              <th>Nearest Expiry</th>
              <th>Status</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={9} className="inventory-empty">
                  <div className="inventory-empty-state">
                    <strong>No medicines found</strong>
                    <span>Create your first item, then receive stock to make it available in operations.</span>
                    {canCreateItem ? (
                      <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal}>
                        <FiPlus /> Add First Item
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ) : (
              currentItems.map((item) => {
                const expiryBucket = getExpiryBucket(item.expiryDate);
                return (
                  <tr key={item.id}>
                    <td className="medicine-name">{item.name}</td>
                    <td className="mono">{item.sku}</td>
                    <td>{item.category}</td>
                    <td className="muted">{Array.isArray(item.locations) && item.locations.length ? item.locations.join(', ') : '—'}</td>
                    <td>
                      <span className="qty">
                        {item.quantity} <span className="muted">{item.unit}</span>
                      </span>
                    </td>
                    <td>{item.minStock}</td>
                    <td>
                      {item.expiryDate ? (
                        <span className={`pill expiry ${expiryBucket}`}>{item.expiryDate}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <span className={`pill status ${item.status}`}>{item.status.replace('-', ' ')}</span>
                    </td>
                    <td className="actions-col">
                      <button className="btn btn-outline btn-sm" onClick={() => openDetails(item)}>
                        <FiEye /> Batches
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteItem(item.id)}>
                        <FiTrash2 /> Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}

      {detailsItem ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-title">Batches: {detailsItem.name}</div>
              <button className="modal-close" onClick={closeDetails} aria-label="Close">
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-subtitle">
                SKU: <span className="mono">{detailsItem.sku}</span>
              </div>
              <div className="batches-table-card">
                <table className="batches-table">
                  <thead>
                    <tr>
                      <th>Batch</th>
                      <th>Location</th>
                      <th>Qty</th>
                      <th>MFG</th>
                      <th>Expiry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(batchesByItemId.get(detailsItem.id) || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="inventory-empty">No batches found</td>
                      </tr>
                    ) : (
                      (batchesByItemId.get(detailsItem.id) || [])
                        .slice()
                        .sort((a, b) => String(a.expiry_date || '').localeCompare(String(b.expiry_date || '')))
                        .map((b) => {
                          const bucket = getExpiryBucket(b.expiry_date);
                          return (
                            <tr key={b.id}>
                              <td className="mono">{b.batch_number}</td>
                              <td>{b.location?.name || b.location_name || b.location_id}</td>
                              <td>{b.quantity}</td>
                              <td>{b.manufacturing_date || '—'}</td>
                              <td>
                                {b.expiry_date ? (
                                  <span className={`pill expiry ${bucket}`}>{b.expiry_date}</span>
                                ) : (
                                  '—'
                                )}
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => downloadBatchesCsv(detailsItem)}>
                  <FiDownload /> Download CSV
                </button>
                <button type="button" className="btn btn-outline" onClick={closeDetails}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showCreateModal ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card inventory-create-modal">
            <div className="modal-header">
              <div>
                <div className="modal-title">Create New Item</div>
                <div className="modal-subtitle modal-subtitle-tight">
                  Add the master item record here, then use Receive Stock to enter quantity and batch details.
                </div>
              </div>
              <button className="modal-close" onClick={closeCreateModal} aria-label="Close" disabled={creatingItem}>
                <FiX />
              </button>
            </div>

            <form className="modal-body inventory-create-form" onSubmit={handleCreateItem}>
              <div className="inventory-create-grid">
                <div className="inventory-field inventory-field-wide">
                  <label htmlFor="item-name">Item Name</label>
                  <input
                    id="item-name"
                    type="text"
                    className="inventory-input"
                    placeholder="Paracetamol 500mg"
                    value={createForm.name}
                    onChange={(e) => handleCreateFormChange('name', e.target.value)}
                    required
                  />
                </div>

                <div className="inventory-field">
                  <label htmlFor="item-sku">SKU Code</label>
                  <input
                    id="item-sku"
                    type="text"
                    className="inventory-input inventory-input-mono"
                    placeholder="MED-001"
                    value={createForm.sku}
                    onChange={(e) => handleCreateFormChange('sku', e.target.value)}
                    required
                  />
                </div>

                <div className="inventory-field">
                  <label htmlFor="item-category">Category</label>
                  <select
                    id="item-category"
                    className="inventory-input"
                    value={createForm.category}
                    onChange={(e) => handleCreateFormChange('category', e.target.value)}
                  >
                    {itemCategories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="inventory-field">
                  <label htmlFor="item-unit">Unit</label>
                  <select
                    id="item-unit"
                    className="inventory-input"
                    value={createForm.unit}
                    onChange={(e) => handleCreateFormChange('unit', e.target.value)}
                  >
                    {unitOptions.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>

                <div className="inventory-field">
                  <label htmlFor="item-reorder">Reorder Level</label>
                  <input
                    id="item-reorder"
                    type="number"
                    min="0"
                    className="inventory-input"
                    value={createForm.reorder_level}
                    onChange={(e) => handleCreateFormChange('reorder_level', e.target.value)}
                    required
                  />
                </div>

                <div className="inventory-field inventory-field-wide">
                  <label htmlFor="item-description">Description</label>
                  <textarea
                    id="item-description"
                    className="inventory-input inventory-textarea"
                    placeholder="Optional notes about dosage, packaging, or usage"
                    value={createForm.description}
                    onChange={(e) => handleCreateFormChange('description', e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              <div className="modal-actions inventory-create-actions">
                <button type="button" className="btn btn-outline" onClick={closeCreateModal} disabled={creatingItem}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creatingItem}>
                  {creatingItem ? 'Creating...' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Inventory;
