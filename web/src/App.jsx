import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Landing page
import LandingPage from './features/landing/LandingPage';

// Auth feature
import AuthPage from './features/auth/AuthPage';
import AuthCallback from './features/auth/AuthCallback';

// Admin feature
import AdminDashboard from './features/admin/AdminDashboard';

// Queue feature
import HomePage from './features/queue/HomePage';
import MapViewPage from './features/queue/MapViewPage';
import ActiveQueuesPage from './features/queue/ActiveQueuesPage';
import BusinessRegistrationPage from './features/queue/BusinessRegistrationPage';
import MyRegistrationsPage from './features/queue/MyRegistrationsPage';
import BusinessDashboardPage from './features/queue/BusinessDashboardPage';

// Profile feature
import ProfilePage from './features/profile/ProfilePage';

// Shared layout
import UserPortalLayout from './shared/UserPortalLayout';

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
          <Route path="home" element={<HomePage />} />
          <Route path="map" element={<MapViewPage />} />
          <Route path="queues" element={<ActiveQueuesPage />} />
          <Route path="register-business" element={<BusinessRegistrationPage />} />
          <Route path="my-registrations" element={<MyRegistrationsPage />} />
          <Route path="business/:officeId" element={<BusinessDashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
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
