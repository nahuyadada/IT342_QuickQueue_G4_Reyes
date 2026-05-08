import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getMyRegistrations, getStaffOffices,
  toggleOffice, advanceQueue,
  getOfficeStaff, addOfficeStaff, removeOfficeStaff
} from './queueService';
import './BusinessDashboardPage.css';

export default function BusinessDashboardPage() {
  const { officeId } = useParams();
  const navigate = useNavigate();

  const [office, setOffice] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const loadOffice = async () => {
    setLoading(true);
    setError('');
    try {
      // Check owned offices first
      const owned = await getMyRegistrations();
      let match = owned.find((r) => String(r.officeId) === String(officeId));
      let ownerFlag = !!match;

      // If not owned, check staff offices
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

  return (
    <div className="bdash-root">
      {/* ── Header ── */}
      <div className="bdash-header">
        <button type="button" className="bdash-back" onClick={() => navigate('/dashboard/my-registrations')}>
          ← My Businesses
        </button>
        <div className="bdash-header-info">
          <h1>{office.name}</h1>
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

      {actionMsg && (
        <div className="portal-alert portal-alert-success">{actionMsg}</div>
      )}

      {/* ── Control Panel ── */}
      <div className="bdash-grid">
        {/* Queue Controls */}
        <div className="bdash-card bdash-card-primary">
          <div className="bdash-card-icon">🎫</div>
          <h3>Queue Management</h3>
          <p>Control the flow of your queue</p>

          <div className="bdash-control-actions">
            <button
              type="button"
              className="bdash-btn bdash-btn-advance"
              onClick={handleAdvanceQueue}
              disabled={advancing || !office.isActive}
              title={!office.isActive ? 'Open your business first' : ''}
            >
              {advancing ? 'Advancing...' : '⏭️ Serve Next Customer'}
            </button>

            <button
              type="button"
              className={`bdash-btn ${office.isActive ? 'bdash-btn-close' : 'bdash-btn-open'}`}
              onClick={handleToggle}
              disabled={toggling}
            >
              {toggling
                ? 'Updating...'
                : office.isActive
                  ? '🔒 Close Business'
                  : '🔓 Open Business'
              }
            </button>
          </div>
        </div>

        {/* Staff Management */}
        <div className="bdash-card">
          <div className="bdash-card-icon">👥</div>
          <h3>Staff Members</h3>
          <p>{isOwner ? 'Add users by email to help manage your queue' : 'Current team members'}</p>

          {staffError && <div className="bdash-staff-alert bdash-staff-alert-error">{staffError}</div>}
          {staffSuccess && <div className="bdash-staff-alert bdash-staff-alert-success">{staffSuccess}</div>}

          {/* Add Staff Form — owner only */}
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
                className="bdash-btn bdash-btn-advance bdash-staff-add-btn"
                disabled={addingStaff || !staffEmail.trim()}
              >
                {addingStaff ? 'Adding...' : '+ Add'}
              </button>
            </form>
          )}

          {/* Staff List */}
          {staff.length === 0 ? (
            <div className="bdash-staff-empty">
              <div className="bdash-staff-empty-icon">👤</div>
              <span>No staff members yet</span>
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

        {/* Business Info */}
        <div className="bdash-card bdash-card-wide">
          <div className="bdash-card-icon">📊</div>
          <h3>Business Details</h3>

          <div className="bdash-details-grid">
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
              <span className="bdash-detail-label">Type</span>
              <span className="bdash-detail-value">{office.type}</span>
            </div>
            <div className="bdash-detail">
              <span className="bdash-detail-label">Category</span>
              <span className="bdash-detail-value">{office.category || '—'}</span>
            </div>
            <div className="bdash-detail">
              <span className="bdash-detail-label">Status</span>
              <span className="bdash-detail-value">{office.approvalStatus}</span>
            </div>
          </div>
        </div>

        {/* Business Hours */}
        {hours && (
          <div className="bdash-card bdash-card-wide">
            <div className="bdash-card-icon">🕐</div>
            <h3>Business Hours</h3>

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
      </div>
    </div>
  );
}
