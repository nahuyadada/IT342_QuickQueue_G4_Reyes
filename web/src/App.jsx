import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

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

// Profile feature
import ProfilePage from './features/profile/ProfilePage';

// Shared layout
import UserPortalLayout from './shared/UserPortalLayout';

function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) return <Navigate to="/" replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  const token = localStorage.getItem('token');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserPortalLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="map" element={<MapViewPage />} />
          <Route path="queues" element={<ActiveQueuesPage />} />
          <Route path="register-business" element={<BusinessRegistrationPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={token ? '/dashboard/home' : '/'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
