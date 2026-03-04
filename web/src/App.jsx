import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) return <Navigate to="/" replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
