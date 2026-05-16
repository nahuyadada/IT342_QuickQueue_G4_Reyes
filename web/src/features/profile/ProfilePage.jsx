import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserProfile, updateCurrentUserProfile } from '../auth/authService';
import '../queue/CustomerPortal.css';

/* ── SVG Icons ── */
const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
  </svg>
);
const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
);
const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
  </svg>
);
const LogOutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6"/>
  </svg>
);

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const syncProfile = async () => {
      setLoading(true); setError('');
      try {
        const profile = await getCurrentUserProfile();
        const merged = { ...user, id: profile.id, name: profile.name, email: profile.email, role: profile.role };
        localStorage.setItem('user', JSON.stringify(merged));
        setUser(merged);
      } catch (err) {
        setError(err.message || 'Unable to sync profile.');
      } finally { setLoading(false); }
    };
    syncProfile();
  }, []);

  const displayName = user.name || 'User';
  const initials = displayName.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeTicketId');
    localStorage.removeItem('partnerRole');
    navigate('/');
  };

  return (
    <div className="cust-page" id="profile-page">
      {error && <div className="cust-alert cust-alert-error">⚠️ {error}</div>}
      {success && <div className="cust-alert cust-alert-success">✅ {success}</div>}

      {/* ── Profile Header ── */}
      <div className="cust-profile-header">
        <div className="cust-profile-avatar">{initials}</div>
        <div className="cust-profile-info">
          <h2>{loading ? 'Loading...' : displayName}</h2>
          <div className="cust-profile-member-badge">⭐ {user.role === 'ADMIN' ? 'Admin' : 'Member'}</div>
          <div className="cust-profile-contact">
            <span className="cust-profile-contact-item">
              <MailIcon /> {user.email || 'No email on file'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Account Details ── */}
      <div className="cust-profile-stats">
        <div className="cust-profile-stat-card">
          <div className="stat-icon">🆔</div>
          <strong>{user.id || '-'}</strong>
          <span>User ID</span>
        </div>
        <div className="cust-profile-stat-card">
          <div className="stat-icon">🛡️</div>
          <strong>{user.role || '-'}</strong>
          <span>Account Role</span>
        </div>
      </div>

      {/* ── Menu Options ── */}
      <div className="cust-profile-menu">
        <button className="cust-profile-menu-item">
          <SettingsIcon /> Account Settings <span className="menu-arrow"><ChevronIcon /></span>
        </button>
        <button className="cust-profile-menu-item">
          <BellIcon /> Notifications <span className="menu-arrow"><ChevronIcon /></span>
        </button>
        <button className="cust-profile-menu-item" onClick={() => navigate('/dashboard/queues')}>
          <ClockIcon /> Queue History <span className="menu-arrow"><ChevronIcon /></span>
        </button>
        <button className="cust-profile-menu-item danger" onClick={handleLogout}>
          <LogOutIcon /> Log Out
        </button>
      </div>
    </div>
  );
}