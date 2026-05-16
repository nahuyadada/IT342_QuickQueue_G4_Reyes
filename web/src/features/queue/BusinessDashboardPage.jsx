import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getMyRegistrations, getStaffOffices,
  toggleOffice, advanceQueue,
  getOfficeStaff, addOfficeStaff, removeOfficeStaff
} from './queueService';
import './BusinessDashboardPage.css';

/* ── Tab definitions ── */
const TABS = [
  { key: 'queue', label: 'Queue', icon: '🎫' },
  { key: 'analytics', label: 'Analytics', icon: '📊' },
  { key: 'staff', label: 'Staff', icon: '👥' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function BusinessDashboardPage() {
  const { officeId } = useParams();
  const navigate = useNavigate();

  const [office, setOffice] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('queue');

  // Queue & toggle
  const [toggling, setToggling] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // Staff
  const [staff, setStaff] = useState([]);
  const [staffEmail, setStaffEmail] = useState('');
  const [addingStaff, setAddingStaff] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [staffSuccess, setStaffSuccess] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Mock queue data for demonstration
  const [queueList] = useState([
    { id: 1, ticketNumber: 'Q-001', name: 'Juan Dela Cruz', priority: null, status: 'SERVING', joinedAt: '9:02 AM' },
    { id: 2, ticketNumber: 'Q-002', name: 'Maria Santos', priority: 'PWD', status: 'WAITING', joinedAt: '9:15 AM' },
    { id: 3, ticketNumber: 'Q-003', name: 'Pedro Reyes', priority: 'ELDERLY', status: 'WAITING', joinedAt: '9:22 AM' },
    { id: 4, ticketNumber: 'Q-004', name: 'Ana Garcia', priority: null, status: 'WAITING', joinedAt: '9:30 AM' },
    { id: 5, ticketNumber: 'Q-005', name: 'Rosa Flores', priority: 'PREGNANT', status: 'WAITING', joinedAt: '9:45 AM' },
    { id: 6, ticketNumber: 'Q-006', name: 'Carlos Mendoza', priority: null, status: 'WAITING', joinedAt: '10:01 AM' },
  ]);

  // Mock analytics data
  const analyticsData = useMemo(() => ({
    dailyVolume: [
      { day: 'Mon', count: 42 }, { day: 'Tue', count: 58 }, { day: 'Wed', count: 35 },
      { day: 'Thu', count: 65 }, { day: 'Fri', count: 48 }, { day: 'Sat', count: 22 }, { day: 'Sun', count: 0 },
    ],
    avgServiceTime: '8.3 min',
    totalServedToday: 23,
    noShowRate: '12%',
    peakHour: '10:00 AM',
    avgWaitTime: '14.2 min',
  }), []);

  const loadOffice = async () => {
    setLoading(true);
    setError('');
    try {
      const owned = await getMyRegistrations();
      let match = owned.find((r) => String(r.officeId) === String(officeId));
      let ownerFlag = !!match;

      if (!match) {
        const staffOffices = await getStaffOffices();
        match = staffOffices.find((r) => String(r.officeId) === String(officeId));
      }

      if (!match) {
        setError('Business not found or you do not have access.');
        return;
      }
      if (match.approvalStatus !== 'APPROVED') {
        setError('This business has not been approved yet.');
        return;
      }

      setOffice(match);
      setIsOwner(ownerFlag);
    } catch (err) {
      setError(err.message || 'Failed to load business data.');
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      const data = await getOfficeStaff(officeId);
      setStaff(data || []);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    loadOffice();
    loadStaff();
  }, [officeId]);

  const handleToggle = async () => {
    setToggling(true);
    setActionMsg('');
    try {
      const updated = await toggleOffice(officeId);
      setOffice((prev) => ({ ...prev, ...updated }));
      setActionMsg(`Business is now ${updated.isActive ? 'OPEN' : 'CLOSED'}.`);
    } catch (err) {
      setActionMsg(err.message || 'Failed to toggle status.');
    } finally {
      setToggling(false);
    }
  };

  const handleAdvanceQueue = async () => {
    setAdvancing(true);
    setActionMsg('');
    try {
      const result = await advanceQueue(officeId);
      setActionMsg(`Now serving ticket ${result.ticketNumber}. ${result.waitingCount} still waiting.`);
    } catch (err) {
      setActionMsg(err.message || 'No waiting tickets.');
    } finally {
      setAdvancing(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!staffEmail.trim()) return;
    setAddingStaff(true);
    setStaffError('');
    setStaffSuccess('');
    try {
      await addOfficeStaff(officeId, staffEmail.trim());
      setStaffSuccess(`${staffEmail} has been added as staff.`);
      setStaffEmail('');
      await loadStaff();
    } catch (err) {
      setStaffError(err.message || 'Failed to add staff member.');
    } finally {
      setAddingStaff(false);
    }
  };

  const handleRemoveStaff = async (staffId, name) => {
    if (!window.confirm(`Remove ${name} from your staff?`)) return;
    setStaffError('');
    setStaffSuccess('');
    try {
      await removeOfficeStaff(officeId, staffId);
      setStaffSuccess(`${name} has been removed.`);
      await loadStaff();
    } catch (err) {
      setStaffError(err.message || 'Failed to remove staff member.');
    }
  };

  let hours = null;
  if (office?.businessHours) {
    try {
      hours = JSON.parse(office.businessHours);
    } catch { /* ignore */ }
  }

  const maxBarValue = Math.max(...analyticsData.dailyVolume.map(d => d.count), 1);

  if (loading) {
    return (
      <div className="bdash-loading">
        <div className="bdash-spinner" />
        <p>Loading business dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bdash-error-page">
        <div className="portal-alert portal-alert-error">{error}</div>
        <button type="button" className="portal-btn" onClick={() => navigate('/dashboard/my-registrations')}>
          ← Back to My Businesses
        </button>
      </div>
    );
  }

  const servingNow = queueList.find(q => q.status === 'SERVING');
  const waitingList = queueList.filter(q => q.status === 'WAITING');

  return (
    <div className="bdash-root">
      {/* ── Header ── */}
      <div className="bdash-header">
        <button type="button" className="bdash-back" onClick={() => navigate('/dashboard/my-registrations')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          My Businesses
        </button>
        <div className="bdash-header-info">
          <h1>{office.name}</h1>
          <div className="bdash-header-meta">
            <span className="bdash-type-badge">{office.category || office.type}</span>
            <div className={`bdash-live-badge ${office.isActive ? 'open' : 'closed'}`}>
              <div className="bdash-live-dot" />
              {office.isActive ? 'Open for Queues' : 'Closed'}
            </div>
            {!isOwner && (
              <span className="bdash-role-badge">Staff</span>
            )}
          </div>
        </div>
      </div>

      {actionMsg && (
        <div className="bdash-action-toast">{actionMsg}</div>
      )}

      {/* ── Tab Bar ── */}
      <div className="bdash-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`bdash-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="bdash-tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Queue Tab ── */}
      {activeTab === 'queue' && (
        <div className="bdash-tab-content">
          {/* Quick Stats */}
          <div className="bdash-quick-stats">
            <div className="bdash-qstat">
              <span className="bdash-qstat-value">{waitingList.length}</span>
              <span className="bdash-qstat-label">In Queue</span>
            </div>
            <div className="bdash-qstat">
              <span className="bdash-qstat-value">{servingNow ? '1' : '0'}</span>
              <span className="bdash-qstat-label">Now Serving</span>
            </div>
            <div className="bdash-qstat">
              <span className="bdash-qstat-value">{analyticsData.totalServedToday}</span>
              <span className="bdash-qstat-label">Served Today</span>
            </div>
            <div className="bdash-qstat">
              <span className="bdash-qstat-value">{analyticsData.avgWaitTime}</span>
              <span className="bdash-qstat-label">Avg Wait</span>
            </div>
          </div>

          <div className="bdash-queue-layout">
            {/* Controls */}
            <div className="bdash-card bdash-card-controls">
              <h3>Queue Controls</h3>
              <p className="bdash-card-sub">Manage queue flow for your customers</p>

              <div className="bdash-control-group">
                <button
                  type="button"
                  className="bdash-ctrl-btn bdash-ctrl-advance"
                  onClick={handleAdvanceQueue}
                  disabled={advancing || !office.isActive}
                  title={!office.isActive ? 'Open your business first' : ''}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l14 9-14 9V3z"/></svg>
                  {advancing ? 'Calling...' : 'Call Next'}
                </button>

                <button
                  type="button"
                  className={`bdash-ctrl-btn ${office.isActive ? 'bdash-ctrl-pause' : 'bdash-ctrl-resume'}`}
                  onClick={handleToggle}
                  disabled={toggling}
                >
                  {office.isActive ? (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                      {toggling ? 'Pausing...' : 'Pause Queue'}
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l14 9-14 9V3z"/></svg>
                      {toggling ? 'Resuming...' : 'Resume Queue'}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="bdash-ctrl-btn bdash-ctrl-skip"
                  onClick={() => setActionMsg('No-show marked. Moving to next customer.')}
                  disabled={!office.isActive}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4l10 8-10 8V4z"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
                  Skip (No-Show)
                </button>
              </div>

              {/* Currently Serving */}
              {servingNow && (
                <div className="bdash-now-serving">
                  <div className="bdash-serving-label">Now Serving</div>
                  <div className="bdash-serving-ticket">
                    <strong>{servingNow.ticketNumber}</strong>
                    <span>{servingNow.name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Queue List */}
            <div className="bdash-card bdash-card-queue-list">
              <div className="bdash-card-head">
                <h3>Waiting List</h3>
                <span className="bdash-badge">{waitingList.length} waiting</span>
              </div>

              {waitingList.length === 0 ? (
                <div className="bdash-empty">
                  <span>🎉</span>
                  <p>No customers waiting. Queue is clear!</p>
                </div>
              ) : (
                <div className="bdash-queue-items">
                  {waitingList.map((q, idx) => (
                    <div key={q.id} className="bdash-queue-item">
                      <div className="bdash-queue-pos">{idx + 1}</div>
                      <div className="bdash-queue-info">
                        <strong>{q.ticketNumber}</strong>
                        <span>{q.name}</span>
                        <small>Joined: {q.joinedAt}</small>
                      </div>
                      {q.priority && (
                        <span className={`bdash-priority-tag ${q.priority.toLowerCase()}`}>
                          {q.priority}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Analytics Tab ── */}
      {activeTab === 'analytics' && (
        <div className="bdash-tab-content">
          <div className="bdash-analytics-stats">
            <div className="bdash-astat">
              <div className="bdash-astat-icon blue">📊</div>
              <div>
                <span className="bdash-astat-value">{analyticsData.totalServedToday}</span>
                <span className="bdash-astat-label">Served Today</span>
              </div>
            </div>
            <div className="bdash-astat">
              <div className="bdash-astat-icon green">⏱️</div>
              <div>
                <span className="bdash-astat-value">{analyticsData.avgServiceTime}</span>
                <span className="bdash-astat-label">Avg Service Time</span>
              </div>
            </div>
            <div className="bdash-astat">
              <div className="bdash-astat-icon amber">❌</div>
              <div>
                <span className="bdash-astat-value">{analyticsData.noShowRate}</span>
                <span className="bdash-astat-label">No-Show Rate</span>
              </div>
            </div>
            <div className="bdash-astat">
              <div className="bdash-astat-icon purple">🕐</div>
              <div>
                <span className="bdash-astat-value">{analyticsData.peakHour}</span>
                <span className="bdash-astat-label">Peak Hour</span>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bdash-card bdash-chart-card">
            <h3>Daily Queue Volume</h3>
            <p className="bdash-card-sub">Number of customers served per day this week</p>
            <div className="bdash-bar-chart">
              {analyticsData.dailyVolume.map(d => (
                <div key={d.day} className="bdash-bar-col">
                  <span className="bdash-bar-value">{d.count}</span>
                  <div className="bdash-bar-track">
                    <div
                      className="bdash-bar-fill"
                      style={{ height: `${(d.count / maxBarValue) * 100}%` }}
                    />
                  </div>
                  <span className="bdash-bar-label">{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Staff Tab ── */}
      {activeTab === 'staff' && (
        <div className="bdash-tab-content">
          <div className="bdash-card">
            <h3>Staff Members</h3>
            <p className="bdash-card-sub">{isOwner ? 'Add users by email to help manage your queue' : 'Current team members'}</p>

            {staffError && <div className="bdash-alert bdash-alert-error">{staffError}</div>}
            {staffSuccess && <div className="bdash-alert bdash-alert-success">{staffSuccess}</div>}

            {isOwner && (
              <form className="bdash-staff-form" onSubmit={handleAddStaff}>
                <input
                  type="email"
                  className="bdash-staff-input"
                  placeholder="Enter user email to add..."
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="bdash-ctrl-btn bdash-ctrl-advance bdash-staff-add-btn"
                  disabled={addingStaff || !staffEmail.trim()}
                >
                  {addingStaff ? 'Adding...' : '+ Add'}
                </button>
              </form>
            )}

            {staff.length === 0 ? (
              <div className="bdash-empty">
                <span>👤</span>
                <p>No staff members yet</p>
                {isOwner && <small>Add team members by their QuickQueue email above.</small>}
              </div>
            ) : (
              <div className="bdash-staff-list">
                {staff.map((s) => (
                  <div key={s.id} className="bdash-staff-row">
                    <div className="bdash-staff-avatar">
                      {s.userName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="bdash-staff-info">
                      <strong>{s.userName}</strong>
                      <small>{s.userEmail}</small>
                    </div>
                    <span className="bdash-staff-role">{s.role}</span>
                    {isOwner && (
                      <button
                        type="button"
                        className="bdash-staff-remove"
                        onClick={() => handleRemoveStaff(s.id, s.userName)}
                        title="Remove staff member"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Settings Tab ── */}
      {activeTab === 'settings' && (
        <div className="bdash-tab-content">
          {/* Business Details */}
          <div className="bdash-card">
            <h3>Business Details</h3>
            <p className="bdash-card-sub">View and manage your business information</p>
            <div className="bdash-details-grid">
              <div className="bdash-detail">
                <span className="bdash-detail-label">Business Name</span>
                <span className="bdash-detail-value">{office.name}</span>
              </div>
              <div className="bdash-detail">
                <span className="bdash-detail-label">Category</span>
                <span className="bdash-detail-value">{office.category || '—'}</span>
              </div>
              <div className="bdash-detail">
                <span className="bdash-detail-label">Type</span>
                <span className="bdash-detail-value">{office.type}</span>
              </div>
              <div className="bdash-detail">
                <span className="bdash-detail-label">Status</span>
                <span className="bdash-detail-value">{office.approvalStatus}</span>
              </div>
              <div className="bdash-detail">
                <span className="bdash-detail-label">Address</span>
                <span className="bdash-detail-value">{office.address || '—'}</span>
              </div>
              <div className="bdash-detail">
                <span className="bdash-detail-label">Phone</span>
                <span className="bdash-detail-value">{office.phoneNumber || '—'}</span>
              </div>
              <div className="bdash-detail">
                <span className="bdash-detail-label">Website</span>
                <span className="bdash-detail-value">{office.website || '—'}</span>
              </div>
              <div className="bdash-detail">
                <span className="bdash-detail-label">Queue Status</span>
                <span className="bdash-detail-value">{office.isActive ? '✅ Active' : '⛔ Inactive'}</span>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          {hours && (
            <div className="bdash-card">
              <h3>Business Hours</h3>
              <p className="bdash-card-sub">Current operating schedule</p>
              <div className="bdash-hours-list">
                {Object.entries(hours).map(([day, time]) => (
                  <div key={day} className={`bdash-hour-row ${time === 'Closed' ? 'closed' : ''}`}>
                    <span className="bdash-hour-day">{day}</span>
                    <span className="bdash-hour-time">{time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bdash-card">
            <h3>Quick Actions</h3>
            <p className="bdash-card-sub">Manage your queue listing</p>
            <div className="bdash-settings-actions">
              <button
                type="button"
                className={`bdash-ctrl-btn ${office.isActive ? 'bdash-ctrl-pause' : 'bdash-ctrl-resume'}`}
                onClick={handleToggle}
                disabled={toggling}
              >
                {office.isActive ? '⏸ Temporarily Close' : '▶ Reopen Business'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
