import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import {
  FiPackage,
  FiArrowDownCircle,
  FiArrowUpCircle,
  FiRepeat,
  FiTrash2,
  FiSliders,
  FiDatabase,
} from 'react-icons/fi';
import Inventory from './Inventory';
import ReceiveStock from './ReceiveStock';
import IssueStock from './IssueStock';
import TransferStock from './TransferStock';
import DisposeStock from './DisposeStock';
import AdjustStock from './AdjustStock';
import './Stock.css';

const Stock = () => {
  const { hasPermission, hasAnyPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('inventory');

  // Define tabs with their metadata and components
  const tabs = [
    {
      id: 'inventory',
      label: 'Inventory Overview',
      icon: FiDatabase,
      component: Inventory,
      permissions: ['view_items', 'list_items'],
    },
    {
      id: 'receive',
      label: 'Receive Stock',
      icon: FiArrowDownCircle,
      component: ReceiveStock,
      permissions: ['receive_stock'],
    },
    {
      id: 'issue',
      label: 'Issue Stock',
      icon: FiArrowUpCircle,
      component: IssueStock,
      permissions: ['issue_stock'],
    },
    {
      id: 'transfer',
      label: 'Transfer Stock',
      icon: FiRepeat,
      component: TransferStock,
      permissions: ['transfer_stock'],
    },
    {
      id: 'dispose',
      label: 'Dispose Stock',
      icon: FiTrash2,
      component: DisposeStock,
      permissions: ['dispose_stock'],
    },
    {
      id: 'adjust',
      label: 'Adjust Stock',
      icon: FiSliders,
      component: AdjustStock,
      permissions: ['adjust_stock'],
    },
  ];

  const visibleTabs = useMemo(
    () => tabs.filter((tab) => hasAnyPermission(tab.permissions)),
    [hasAnyPermission]
  );

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [activeTab, visibleTabs]);

  // Get current active component
  const activeTabData = visibleTabs.find((tab) => tab.id === activeTab) || visibleTabs[0];
  const ActiveComponent = activeTabData?.component;

  // If user doesn't have any stock permission
  if (!ActiveComponent) {
    return (
      <div className="stock-container">
        <PageHeader title="Stock Management" icon={FiPackage} />
        <div className="stock-error">
          <p>You don't have permission to access stock management features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stock-container">
      <PageHeader title="Stock Management" icon={FiPackage} />

      {/* Tab Navigation */}
      <div className="stock-tabs-wrapper">
        <div className="stock-tabs">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`stock-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
              >
                <Icon className="tab-icon" />
                <span className="tab-label">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Tab Content */}
      <div className="stock-content">
        <ActiveComponent />
      </div>
    </div>
  );
};

export default Stock;
