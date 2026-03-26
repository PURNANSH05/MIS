import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import PublicLayout from './pages/PublicLayout';
import Login from './pages/Auth/Login';
import Home from './pages/Home/Home';
import About from './pages/About/About';
import PublicPage from './pages/PublicPage/PublicPage';
import Dashboard from './pages/Dashboard/Dashboard';
import Stock from './pages/Stock/Stock';
import Locations from './pages/Locations/Locations';
import Suppliers from './pages/Suppliers/Suppliers';
import Users from './pages/Users/Users';
import AdminManagement from './pages/AdminManagement/AdminManagement';
import Alerts from './pages/Alerts/Alerts';
import AuditLogs from './pages/AuditLogs/AuditLogs';
import Reports from './pages/Reports/Reports';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex-center min-h-screen">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        {/* Public Routes with Navigation and Footer */}
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
        <Route path="/pricing" element={<PublicLayout><PublicPage title="Pricing" /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><PublicPage title="Contact" /></PublicLayout>} />
        <Route path="/signup" element={<PublicLayout><PublicPage title="Get Started" subtitle="Signup is not enabled in this build. Please contact your administrator." /></PublicLayout>} />

        {/* Navbar dropdown routes */}
        <Route path="/solutions/:slug" element={<PublicLayout><PublicPage /></PublicLayout>} />
        <Route path="/features/:slug" element={<PublicLayout><PublicPage /></PublicLayout>} />
        <Route path="/help" element={<PublicLayout><PublicPage title="Help Center" /></PublicLayout>} />
        <Route path="/docs" element={<PublicLayout><PublicPage title="Documentation" /></PublicLayout>} />
        <Route path="/blog" element={<PublicLayout><PublicPage title="Blog & Insights" /></PublicLayout>} />
        <Route path="/case-studies" element={<PublicLayout><PublicPage title="Case Studies" /></PublicLayout>} />
        
        {/* Auth Route */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login /> : <Navigate to="/app/dashboard" replace />} 
        />
        
        {/* Protected Routes with Layout */}
        <Route 
          path="/app/*" 
          element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="stock" element={<Stock />} />
          <Route path="locations" element={<Locations />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="users" element={<Users />} />
          <Route path="admin-management" element={<AdminManagement />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="reports" element={<Reports />} />
        </Route>
        
        {/* Catch all route */}
        <Route 
          path="*" 
          element={<Navigate to="/" replace />} 
        />
      </Routes>
    </div>
  );
}

export default App;
