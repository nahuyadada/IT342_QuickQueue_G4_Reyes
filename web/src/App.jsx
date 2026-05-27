import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Landing feature
import LandingPage from './features/landing/LandingPage';

// Auth feature
import AuthPage from './features/auth/AuthPage';
import AuthCallback from './features/auth/AuthCallback';

// Admin feature
import AdminDashboard from './features/admin/AdminDashboard';

// Customer feature
import HomePage from './features/customer/HomePage';
import MapViewPage from './features/customer/MapViewPage';
import ActiveQueuesPage from './features/customer/ActiveQueuesPage';
import MyRegistrationsPage from './features/customer/MyRegistrationsPage';
import BranchDetailPage from './features/customer/BranchDetailPage';

// Business feature
import BusinessRegistrationPage from './features/business/BusinessRegistrationPage';
import BusinessDashboardPage from './features/business/BusinessDashboardPage';
import PendingApplicationPage from './features/business/PendingApplicationPage';

// Partner feature
import PartnerQueuePage from './features/partner/PartnerQueuePage';
import PartnerCustomersPage from './features/partner/PartnerCustomersPage';
import PartnerAnalyticsPage from './features/partner/PartnerAnalyticsPage';
import PartnerSettingsPage from './features/partner/PartnerSettingsPage';

// Staff feature
import StaffQueuePage from './features/staff/StaffQueuePage';

// Profile feature
import ProfilePage from './features/profile/ProfilePage';

// Shared layout
import UserPortalLayout from './shared/layout/UserPortalLayout';

function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) return <Navigate to="/auth" replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return children;
}

function DashboardRedirect() {
  const partnerRole = localStorage.getItem('partnerRole');
  if (partnerRole === 'partner') {
    return <Navigate to="/dashboard/register-business" replace />;
  }
  // Staff users are detected asynchronously in UserPortalLayout;
  // default to home and the layout will handle the redirect via nav.
  return <Navigate to="/dashboard/home" replace />;
}

function App() {
  const token = localStorage.getItem('token');

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected user dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserPortalLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardRedirect />} />

          {/* Customer routes */}
          <Route path="home" element={<HomePage />} />
          <Route path="map" element={<MapViewPage />} />
          <Route path="queues" element={<ActiveQueuesPage />} />
          <Route path="my-registrations" element={<MyRegistrationsPage />} />
          <Route path="business/:officeId" element={<BusinessDashboardPage />} />
          <Route path="branch/:officeId" element={<BranchDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />

          {/* Staff routes */}
          <Route path="staff-queue" element={<StaffQueuePage />} />

          {/* Partner routes */}
          <Route path="register-business" element={<BusinessRegistrationPage />} />
          <Route path="pending" element={<PendingApplicationPage />} />
          <Route path="queue" element={<PartnerQueuePage />} />
          <Route path="customers" element={<PartnerCustomersPage />} />
          <Route path="analytics" element={<PartnerAnalyticsPage />} />
          <Route path="settings" element={<PartnerSettingsPage />} />
        </Route>

        {/* Admin dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={token ? '/dashboard/home' : '/'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
