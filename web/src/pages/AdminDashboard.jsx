import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="dash-root">
      <div className="dash-navbar dash-navbar-admin">
        <div className="dash-nav-brand">
          <span className="dash-nav-logo dash-nav-logo-admin">A</span>
          QuickQueue Admin
        </div>
        <div className="dash-nav-user">
          <span>🛡️ {user.name || 'Admin'}</span>
          <button className="dash-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>
      <div className="dash-content">
        <div className="dash-welcome-card dash-welcome-admin">
          <h1>Admin Dashboard 🛡️</h1>
          <p>Logged in as <strong>{user.email}</strong> &mdash; Role: <strong>ADMIN</strong></p>
        </div>
        <div className="dash-cards">
          <div className="dash-card">
            <div className="dash-card-icon">👥</div>
            <h3>Manage Users</h3>
            <p>View and manage registered users</p>
          </div>
          <div className="dash-card">
            <div className="dash-card-icon">📊</div>
            <h3>Queue Analytics</h3>
            <p>Monitor queue statistics and metrics</p>
          </div>
          <div className="dash-card">
            <div className="dash-card-icon">⚙️</div>
            <h3>Settings</h3>
            <p>Configure system preferences</p>
          </div>
        </div>
      </div>
    </div>
  );
}
