import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import './UserPortal.css';

export default function UserPortalLayout() {
  const navigate = useNavigate();
  const [user] = useState(JSON.parse(localStorage.getItem('user') || '{}'));

  const displayName = useMemo(() => user.name || 'User', [user.name]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeTicketId');
    navigate('/');
  };

  return (
    <div className="portal-root">
      <aside className="portal-sidebar">
        <div className="portal-brand">
          <span className="portal-brand-logo">Q</span>
          <div>
            <h2>QuickQueue</h2>
            <p>Service Portal</p>
          </div>
        </div>

        <nav className="portal-nav">
          <NavLink to="/dashboard/home" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
            Home
          </NavLink>
          <NavLink to="/dashboard/map" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
            Map View
          </NavLink>
          <NavLink to="/dashboard/queues" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
            Active Queues
          </NavLink>
          <NavLink to="/dashboard/profile" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
            Profile
          </NavLink>
        </nav>

        <button type="button" className="portal-logout" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="portal-main">
        <header className="portal-topbar">
          <div>
            <h1>Welcome back</h1>
            <p>{displayName}</p>
          </div>
          <div className="portal-user-chip">👤 {displayName}</div>
        </header>

        <section className="portal-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}