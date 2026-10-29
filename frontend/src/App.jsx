import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import HowItWorksPage from './pages/public/HowItWorksPage';
import CategoriesPage from './pages/public/CategoriesPage';
import BusinessDirectoryPage from './pages/public/BusinessDirectoryPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import MyAssetsPage from './pages/customer/MyAssetsPage';
import AddAssetPage from './pages/customer/AddAssetPage';
import NewRepairRequestPage from './pages/customer/NewRepairRequestPage';
import MyRepairJobsPage from './pages/customer/MyRepairJobsPage';
import RepairJobDetailPage from './pages/customer/RepairJobDetailPage';
import RepairPassportPage from './pages/customer/RepairPassportPage';
import WarrantiesPage from './pages/customer/WarrantiesPage';
import SharingGrantsPage from './pages/customer/SharingGrantsPage';
import AccountSettingsPage from './pages/customer/AccountSettingsPage';

// Business Pages
import BusinessDashboard from './pages/business/BusinessDashboard';
import BusinessJobDetailPage from './pages/business/BusinessJobDetailPage';
import StaffManagementPage from './pages/business/StaffManagementPage';
import BusinessProfilePage from './pages/business/BusinessProfilePage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-xs text-slate-400">Verifying security token...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500">Your account does not have permission to view this section.</p>
        <Navigate to="/" replace />
      </div>
    );
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/directory" element={<BusinessDirectoryPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Customer Routes */}
                <Route
                  path="/customer/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['customer', 'admin']}>
                      <CustomerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/assets"
                  element={
                    <ProtectedRoute allowedRoles={['customer', 'admin']}>
                      <MyAssetsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/assets/new"
                  element={
                    <ProtectedRoute allowedRoles={['customer', 'admin']}>
                      <AddAssetPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/assets/:assetId"
                  element={
                    <ProtectedRoute allowedRoles={['customer', 'business_owner', 'technician', 'admin']}>
                      <RepairPassportPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/requests/new"
                  element={
                    <ProtectedRoute allowedRoles={['customer', 'admin']}>
                      <NewRepairRequestPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/jobs"
                  element={
                    <ProtectedRoute allowedRoles={['customer', 'admin']}>
                      <MyRepairJobsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/jobs/:jobId"
                  element={
                    <ProtectedRoute allowedRoles={['customer', 'business_owner', 'technician', 'admin']}>
                      <RepairJobDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/passports/:assetId"
                  element={
                    <ProtectedRoute allowedRoles={['customer', 'business_owner', 'technician', 'admin']}>
                      <RepairPassportPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/warranties"
                  element={
                    <ProtectedRoute allowedRoles={['customer', 'admin']}>
                      <WarrantiesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/sharing"
                  element={
                    <ProtectedRoute allowedRoles={['customer', 'admin']}>
                      <SharingGrantsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/customer/settings"
                  element={
                    <ProtectedRoute allowedRoles={['customer', 'business_owner', 'technician', 'admin']}>
                      <AccountSettingsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Business Routes */}
                <Route
                  path="/business/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['business_owner', 'technician', 'admin']}>
                      <BusinessDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/business/jobs"
                  element={
                    <ProtectedRoute allowedRoles={['business_owner', 'technician', 'admin']}>
                      <BusinessDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/business/jobs/:jobId"
                  element={
                    <ProtectedRoute allowedRoles={['business_owner', 'technician', 'admin']}>
                      <BusinessJobDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/business/staff"
                  element={
                    <ProtectedRoute allowedRoles={['business_owner', 'admin']}>
                      <StaffManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/business/profile"
                  element={
                    <ProtectedRoute allowedRoles={['business_owner', 'admin']}>
                      <BusinessProfilePage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/audit"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Catch all fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
