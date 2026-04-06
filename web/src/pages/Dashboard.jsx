import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="dash-root">
      <div className="dash-navbar">
        <div className="dash-nav-brand">
          <span className="dash-nav-logo">Q</span>
          QuickQueue
        </div>
        <div className="dash-nav-user">
          <span>👤 {user.name || 'User'}</span>
          <button className="dash-logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </div>
      <div className="dash-content">
        <div className="dash-welcome-card">
          <h1>Welcome, {user.name || 'User'}! 👋</h1>
          <p>You are logged in as <strong>{user.email}</strong></p>
        </div>
        <div className="dash-cards">
          <div className="dash-card">
            <div className="dash-card-icon">📋</div>
            <h3>My Queue</h3>
            <p>View and manage your current queue position</p>
          </div>
          <div className="dash-card">
            <div className="dash-card-icon">🕐</div>
            <h3>Wait Time</h3>
            <p>Check estimated wait times for services</p>
          </div>
          <div className="dash-card">
            <div className="dash-card-icon">🔔</div>
            <h3>Notifications</h3>
            <p>Get notified when it's your turn</p>
          </div>
        </div>
      </div>
    </div>
  );
}
