import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserProfile, updateCurrentUserProfile, changePassword } from '../auth/authService';
import { getMyTickets } from '../../shared/services/queueService';
import '../customer/CustomerPortal.css';

/* ── Notification Utilities (shared with other pages via import) ── */
const WEB_NOTIF_KEY = 'qq_notifications';
const NOTIF_PREFS_KEY = 'qq_notif_prefs';

export function addWebNotification({ type = 'blue', icon = '🔔', title, subtitle }) {
  try {
    const existing = JSON.parse(localStorage.getItem(WEB_NOTIF_KEY) || '[]');
    existing.unshift({ id: Date.now(), type, icon, title, subtitle, timeMillis: Date.now(), isRead: false });
    localStorage.setItem(WEB_NOTIF_KEY, JSON.stringify(existing.slice(0, 50)));
  } catch {}
}

function getStoredNotifications() {
  try { return JSON.parse(localStorage.getItem(WEB_NOTIF_KEY) || '[]'); } catch { return []; }
}

function formatRelTime(ms) {
  const d = Date.now() - ms;
  if (d < 60000) return 'just now';
  if (d < 3600000) return `${Math.floor(d / 60000)} min ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)} hr ago`;
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getNotifPrefs() {
  try { return JSON.parse(localStorage.getItem(NOTIF_PREFS_KEY) || '{}'); } catch { return {}; }
}

/* ── SVG Icons ── */
const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/>
  </svg>
);
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

/* ── Toggle Row Sub-component ── */
function ToggleRow({ label, sub, checked, onChange }) {
  return (
    <div className="prof-toggle-row">
      <div>
        <div className="prof-toggle-label">{label}</div>
        {sub && <div className="prof-toggle-sub">{sub}</div>}
      </div>
      <label className="prof-toggle">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="prof-toggle-slider" />
      </label>
    </div>
  );
}

/* ── Status Badge Helper ── */
function StatusBadge({ status }) {
  const cls = {
    WAITING: 'prof-status-waiting',
    SERVING: 'prof-status-serving',
    COMPLETED: 'prof-status-completed',
    CANCELLED: 'prof-status-cancelled',
  }[status] || 'prof-status-completed';
  return <span className={`prof-status-badge ${cls}`}>{status}</span>;
}

/* ── Main Component ── */
export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeSection, setActiveSection] = useState(null);

  // Settings state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [notifPush, setNotifPush] = useState(true);
  const [notifEmailPref, setNotifEmailPref] = useState(true);
  const [notifSms, setNotifSms] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Password dialog
  const [showPwDialog, setShowPwDialog] = useState(false);
  const [pwOld, setPwOld] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');

  // Notifications
  const [notifications, setNotifications] = useState([]);

  // History
  const [tickets, setTickets] = useState([]);
  const [histLoading, setHistLoading] = useState(false);

  useEffect(() => {
    const syncProfile = async () => {
      setLoading(true);
      try {
        const profile = await getCurrentUserProfile();
        const merged = { ...user, id: profile.id, name: profile.name, email: profile.email, role: profile.role };
        localStorage.setItem('user', JSON.stringify(merged));
        setUser(merged);
      } catch {}
      finally { setLoading(false); }
    };
    syncProfile();
  }, []);

  const openSettings = () => {
    const prefs = getNotifPrefs();
    setEditName(user.name || '');
    setEditEmail(user.email || '');
    setEditPhone(user.phone || '');
    setEditLocation(user.location || '');
    setNotifPush(prefs.push !== false);
    setNotifEmailPref(prefs.email !== false);
    setNotifSms(prefs.sms === true);
    setError(''); setSuccess('');
    setActiveSection('settings');
  };

  const openNotifications = () => {
    setNotifications(getStoredNotifications());
    setError(''); setSuccess('');
    setActiveSection('notifications');
  };

  const openHistory = async () => {
    setError(''); setSuccess('');
    setActiveSection('history');
    setHistLoading(true);
    setTickets([]);
    try {
      const data = await getMyTickets(user.id);
      setTickets(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || 'Failed to load queue history.');
    } finally { setHistLoading(false); }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true); setError(''); setSuccess('');
    try {
      let updatedName = editName;
      if (editName.trim() !== (user.name || '').trim()) {
        const res = await updateCurrentUserProfile({ name: editName.trim() });
        updatedName = res.name || editName.trim();
      }
      const merged = { ...user, name: updatedName, email: editEmail, phone: editPhone, location: editLocation };
      localStorage.setItem('user', JSON.stringify(merged));
      localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify({ push: notifPush, email: notifEmailPref, sms: notifSms }));
      setUser(merged);
      setSuccess('Settings saved successfully!');
    } catch (e) {
      setError(e.message || 'Failed to save settings.');
    } finally { setIsSaving(false); }
  };

  const handleChangePassword = async () => {
    if (pwNew !== pwConfirm) { setPwError('New passwords do not match.'); return; }
    if (pwNew.length < 6) { setPwError('Password must be at least 6 characters.'); return; }
    setPwSaving(true); setPwError('');
    try {
      await changePassword(pwOld, pwNew);
      setShowPwDialog(false);
      setPwOld(''); setPwNew(''); setPwConfirm('');
      setSuccess('Password changed successfully!');
    } catch (e) {
      setPwError(e.message || 'Failed to change password.');
    } finally { setPwSaving(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeTicketId');
    localStorage.removeItem('partnerRole');
    navigate('/');
  };

  const displayName = user.name || 'User';
  const initials = displayName.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const unreadCount = getStoredNotifications().filter(n => !n.isRead).length;

  /* ── Settings Section ── */
  if (activeSection === 'settings') {
    return (
      <div className="cust-page prof-panel">
        {error && <div className="cust-alert cust-alert-error">⚠️ {error}</div>}
        {success && <div className="cust-alert cust-alert-success">✅ {success}</div>}

        <div className="prof-panel-header">
          <button className="prof-back-btn" onClick={() => setActiveSection(null)}><BackIcon /></button>
          <span className="prof-panel-title">Account Settings</span>
          <span className="prof-panel-sub">Manage your profile and preferences</span>
        </div>

        <div className="prof-card">
          <div className="prof-section-title">Profile Information</div>
          <div className="prof-form-group">
            <label className="prof-form-label">Full Name</label>
            <input className="prof-form-input" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Enter your full name" />
          </div>
          <div className="prof-form-group">
            <label className="prof-form-label">Email Address</label>
            <input className="prof-form-input" type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="Enter your email" />
          </div>
          <div className="prof-form-group">
            <label className="prof-form-label">Phone Number</label>
            <input className="prof-form-input" type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="e.g. +63 912 345 6789" />
          </div>
          <div className="prof-form-group">
            <label className="prof-form-label">Location</label>
            <input className="prof-form-input" value={editLocation} onChange={e => setEditLocation(e.target.value)} placeholder="City, Region" />
          </div>
        </div>

        <div className="prof-card">
          <div className="prof-section-title">Notification Preferences</div>
          <ToggleRow label="Push Notifications" sub="Queue updates and status alerts" checked={notifPush} onChange={setNotifPush} />
          <ToggleRow label="Email Notifications" sub="Status updates sent to your email" checked={notifEmailPref} onChange={setNotifEmailPref} />
          <ToggleRow label="SMS Alerts" sub="Text messages for urgent updates" checked={notifSms} onChange={setNotifSms} />
        </div>

        <div className="prof-card">
          <button className="prof-save-btn" onClick={handleSaveSettings} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
          <button className="prof-change-pw-btn" onClick={() => { setShowPwDialog(true); setPwError(''); setPwOld(''); setPwNew(''); setPwConfirm(''); }}>
            Change Password
          </button>
        </div>

        {showPwDialog && (
          <div className="prof-dialog-overlay" onClick={e => { if (e.target === e.currentTarget) setShowPwDialog(false); }}>
            <div className="prof-dialog">
              <h3>Change Password</h3>
              {pwError && <div className="cust-alert cust-alert-error" style={{ marginBottom: '0.75rem' }}>⚠️ {pwError}</div>}
              <div className="prof-form-group">
                <label className="prof-form-label">Current Password</label>
                <input className="prof-form-input" type="password" value={pwOld} onChange={e => setPwOld(e.target.value)} placeholder="Enter current password" />
              </div>
              <div className="prof-form-group">
                <label className="prof-form-label">New Password</label>
                <input className="prof-form-input" type="password" value={pwNew} onChange={e => setPwNew(e.target.value)} placeholder="Minimum 6 characters" />
              </div>
              <div className="prof-form-group">
                <label className="prof-form-label">Confirm New Password</label>
                <input className="prof-form-input" type="password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} placeholder="Repeat new password" />
              </div>
              <div className="prof-dialog-actions">
                <button className="prof-dialog-cancel" onClick={() => setShowPwDialog(false)}>Cancel</button>
                <button className="prof-dialog-confirm" onClick={handleChangePassword} disabled={pwSaving}>
                  {pwSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Notifications Section ── */
  if (activeSection === 'notifications') {
    const hasUnread = notifications.some(n => !n.isRead);
    return (
      <div className="cust-page prof-panel">
        <div className="prof-panel-header">
          <button className="prof-back-btn" onClick={() => setActiveSection(null)}><BackIcon /></button>
          <span className="prof-panel-title">Notifications</span>
          {hasUnread && (
            <button className="prof-notif-clear-btn" onClick={() => {
              localStorage.setItem(WEB_NOTIF_KEY, JSON.stringify(
                getStoredNotifications().map(n => ({ ...n, isRead: true }))
              ));
              setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            }}>
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button className="prof-notif-clear-btn" style={{ marginLeft: hasUnread ? '0.5rem' : 'auto' }} onClick={() => {
              localStorage.setItem(WEB_NOTIF_KEY, '[]');
              setNotifications([]);
            }}>
              Clear all
            </button>
          )}
        </div>

        <div className="prof-card" style={{ padding: 0, overflow: 'hidden' }}>
          {notifications.length === 0 ? (
            <div className="prof-empty-state">
              <div className="prof-empty-icon">🔔</div>
              <div className="prof-empty-text">No notifications yet</div>
              <div className="prof-empty-hint">Queue updates will appear here</div>
            </div>
          ) : notifications.map(n => (
            <div className="prof-notif-item" key={n.id}>
              <div className="prof-notif-icon">{n.icon}</div>
              <div className="prof-notif-body">
                <div className="prof-notif-title">{n.title}</div>
                {n.subtitle && <div className="prof-notif-sub">{n.subtitle}</div>}
                <div className="prof-notif-time">{formatRelTime(n.timeMillis)}</div>
              </div>
              {!n.isRead && <div className="prof-notif-unread" />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── History Section ── */
  if (activeSection === 'history') {
    return (
      <div className="cust-page prof-panel">
        {error && <div className="cust-alert cust-alert-error">⚠️ {error}</div>}
        <div className="prof-panel-header">
          <button className="prof-back-btn" onClick={() => setActiveSection(null)}><BackIcon /></button>
          <span className="prof-panel-title">Queue History</span>
          <span className="prof-panel-sub">Your past queue visits</span>
        </div>

        <div className="prof-card" style={{ padding: 0, overflow: 'hidden' }}>
          {histLoading ? (
            <div className="prof-empty-state">
              <div className="prof-empty-text">Loading…</div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="prof-empty-state">
              <div className="prof-empty-icon">🎫</div>
              <div className="prof-empty-text">No queue history yet</div>
              <div className="prof-empty-hint">Your past and active queue tickets will appear here</div>
            </div>
          ) : tickets.map(t => (
            <div className="prof-hist-item" key={t.ticketId}>
              <div className="prof-hist-top">
                <span className="prof-hist-office">{t.officeName}</span>
                <StatusBadge status={t.status} />
              </div>
              <div className="prof-hist-meta">
                <span>#{t.ticketNumber}</span>
                <span>{new Date(t.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                {t.officeType && <span>{t.officeType}</span>}
                {t.estimatedWaitMinutes > 0 && t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && (
                  <span>~{t.estimatedWaitMinutes} min wait</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Main Profile View ── */
  return (
    <div className="cust-page" id="profile-page">
      {error && <div className="cust-alert cust-alert-error">⚠️ {error}</div>}
      {success && <div className="cust-alert cust-alert-success">✅ {success}</div>}

      <div className="cust-profile-header">
        <div className="cust-profile-avatar">{initials}</div>
        <div className="cust-profile-info">
          <h2>{loading ? 'Loading…' : displayName}</h2>
          <div className="cust-profile-contact">
            <span className="cust-profile-contact-item">
              <MailIcon /> {user.email || 'No email on file'}
            </span>
            {user.phone && (
              <span className="cust-profile-contact-item">
                <PhoneIcon /> {user.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="cust-profile-stats">
        <div className="cust-profile-stat-card">
          <div className="stat-icon">🆔</div>
          <strong>{user.id || '—'}</strong>
          <span>User ID</span>
        </div>
        <div className="cust-profile-stat-card">
          <div className="stat-icon">🛡️</div>
          <strong>{user.role || '—'}</strong>
          <span>Account Role</span>
        </div>
      </div>

      <div className="cust-profile-menu">
        <button className="cust-profile-menu-item" onClick={openSettings}>
          <SettingsIcon /> Account Settings <span className="menu-arrow"><ChevronIcon /></span>
        </button>
        <button className="cust-profile-menu-item" onClick={openNotifications}>
          <BellIcon />
          Notifications
          {unreadCount > 0 && (
            <span style={{ marginLeft: 6, background: 'var(--qq-blue)', color: '#fff', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700, padding: '1px 7px' }}>
              {unreadCount}
            </span>
          )}
          <span className="menu-arrow"><ChevronIcon /></span>
        </button>
        <button className="cust-profile-menu-item" onClick={openHistory}>
          <ClockIcon /> Queue History <span className="menu-arrow"><ChevronIcon /></span>
        </button>
        <button className="cust-profile-menu-item danger" onClick={handleLogout}>
          <LogOutIcon /> Log Out
        </button>
      </div>
    </div>
  );
}
