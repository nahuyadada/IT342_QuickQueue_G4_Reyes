import { useState, useEffect, useCallback } from 'react';
import { usePartner } from '../../shared/UserPortalLayout';
import { toggleOffice, getOfficeStaff, addOfficeStaff, removeOfficeStaff } from './queueService';
import './BusinessDashboardPage.css';

export default function PartnerSettingsPage() {
  const office = usePartner();
  const [officeState, setOfficeState] = useState(office);
  const [toggling, setToggling] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // Settings state (local for now)
  const [counterCount, setCounterCount] = useState(3);
  const [queueCapacity, setQueueCapacity] = useState(50);
  const [advanceBooking, setAdvanceBooking] = useState(false);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Staff management
  const [staffList, setStaffList] = useState([]);
  const [staffEmail, setStaffEmail] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffMsg, setStaffMsg] = useState({ type: '', text: '' });

  const loadStaff = useCallback(async () => {
    if (!office) return;
    try {
      const data = await getOfficeStaff(office.officeId);
      setStaffList(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }, [office]);

  useEffect(() => { loadStaff(); }, [loadStaff]);

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!staffEmail.trim()) return;
    setStaffLoading(true);
    setStaffMsg({ type: '', text: '' });
    try {
      await addOfficeStaff(office.officeId, staffEmail.trim());
      setStaffEmail('');
      setStaffMsg({ type: 'success', text: 'Staff member added successfully.' });
      await loadStaff();
    } catch (err) {
      setStaffMsg({ type: 'error', text: err.message });
    } finally {
      setStaffLoading(false);
    }
  };

  const handleRemoveStaff = async (staffId) => {
    setStaffMsg({ type: '', text: '' });
    try {
      await removeOfficeStaff(office.officeId, staffId);
      setStaffMsg({ type: 'success', text: 'Staff member removed.' });
      await loadStaff();
    } catch (err) {
      setStaffMsg({ type: 'error', text: err.message });
    }
  };

  if (!office) return null;

  let hours = null;
  if (officeState?.businessHours) {
    try { hours = JSON.parse(officeState.businessHours); } catch { /* ignore */ }
  }

  const handleToggle = async () => {
    setToggling(true);
    setActionMsg('');
    try {
      const updated = await toggleOffice(officeState.officeId);
      setOfficeState(prev => ({ ...prev, ...updated }));
      setActionMsg(`Business is now ${updated.isActive ? 'OPEN' : 'CLOSED'}.`);
    } catch (err) { setActionMsg(err.message); }
    finally { setToggling(false); }
  };

  return (
    <div className="bdash-root">
      {actionMsg && <div className="bdash-action-toast">{actionMsg}</div>}

      {/* Business Details */}
      <div className="bdash-card" style={{ marginBottom: '1rem' }}>
        <h3>Branch Details</h3>
        <p className="bdash-card-sub">Your business information</p>
        <div className="bdash-details-grid">
          <div className="bdash-detail">
            <span className="bdash-detail-label">Business Name</span>
            <span className="bdash-detail-value">{officeState.name}</span>
          </div>
          <div className="bdash-detail">
            <span className="bdash-detail-label">Category</span>
            <span className="bdash-detail-value">{officeState.category || '—'}</span>
          </div>
          <div className="bdash-detail">
            <span className="bdash-detail-label">Type</span>
            <span className="bdash-detail-value">{officeState.type}</span>
          </div>
          <div className="bdash-detail">
            <span className="bdash-detail-label">Address</span>
            <span className="bdash-detail-value">{officeState.address || '—'}</span>
          </div>
          <div className="bdash-detail">
            <span className="bdash-detail-label">Phone</span>
            <span className="bdash-detail-value">{officeState.phoneNumber || '—'}</span>
          </div>
          <div className="bdash-detail">
            <span className="bdash-detail-label">Website</span>
            <span className="bdash-detail-value">{officeState.website || '—'}</span>
          </div>
        </div>
      </div>

      {/* Operating Hours */}
      {hours && (
        <div className="bdash-card" style={{ marginBottom: '1rem' }}>
          <h3>Operating Hours</h3>
          <p className="bdash-card-sub">Current schedule</p>
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

      {/* Queue Configuration */}
      <div className="bdash-card" style={{ marginBottom: '1rem' }}>
        <h3>Queue Configuration</h3>
        <p className="bdash-card-sub">Control how your queue operates</p>

        <div className="bdash-settings-field">
          <div className="bdash-settings-field-info">
            <strong>Active Counters</strong>
            <small>Number of service windows currently staffed</small>
          </div>
          <div className="bdash-settings-stepper">
            <button onClick={() => setCounterCount(Math.max(1, counterCount - 1))}>−</button>
            <span>{counterCount}</span>
            <button onClick={() => setCounterCount(counterCount + 1)}>+</button>
          </div>
        </div>

        <div className="bdash-settings-field">
          <div className="bdash-settings-field-info">
            <strong>Queue Capacity Limit</strong>
            <small>Max customers allowed in queue at once</small>
          </div>
          <div className="bdash-settings-stepper">
            <button onClick={() => setQueueCapacity(Math.max(5, queueCapacity - 5))}>−</button>
            <span>{queueCapacity}</span>
            <button onClick={() => setQueueCapacity(queueCapacity + 5)}>+</button>
          </div>
        </div>

        <div className="bdash-settings-field">
          <div className="bdash-settings-field-info">
            <strong>Advance Booking</strong>
            <small>Allow customers to reserve a queue slot ahead of time</small>
          </div>
          <label className="bdash-switch">
            <input type="checkbox" checked={advanceBooking} onChange={(e) => setAdvanceBooking(e.target.checked)} />
            <span className="bdash-switch-slider" />
          </label>
        </div>
      </div>

      {/* Notifications */}
      <div className="bdash-card" style={{ marginBottom: '1rem' }}>
        <h3>Notification Preferences</h3>
        <p className="bdash-card-sub">How you want to receive alerts</p>

        <div className="bdash-settings-field">
          <div className="bdash-settings-field-info">
            <strong>SMS Notifications</strong>
            <small>Receive queue alerts via text message</small>
          </div>
          <label className="bdash-switch">
            <input type="checkbox" checked={smsNotifications} onChange={(e) => setSmsNotifications(e.target.checked)} />
            <span className="bdash-switch-slider" />
          </label>
        </div>

        <div className="bdash-settings-field">
          <div className="bdash-settings-field-info">
            <strong>Email Notifications</strong>
            <small>Receive daily summary reports via email</small>
          </div>
          <label className="bdash-switch">
            <input type="checkbox" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} />
            <span className="bdash-switch-slider" />
          </label>
        </div>
      </div>

      {/* Staff Management */}
      <div className="bdash-card" style={{ marginBottom: '1rem' }}>
        <h3>Staff Management</h3>
        <p className="bdash-card-sub">
          Add staff members by their registered email. Staff can open/close the queue,
          call the next customer, and skip no-shows.
        </p>

        {staffMsg.text && (
          <div className={`bdash-alert ${staffMsg.type === 'error' ? 'bdash-alert-error' : 'bdash-alert-success'}`}>
            {staffMsg.text}
          </div>
        )}

        <form className="bdash-staff-form" onSubmit={handleAddStaff}>
          <input
            className="bdash-staff-input"
            type="email"
            placeholder="Staff member email address"
            value={staffEmail}
            onChange={(e) => setStaffEmail(e.target.value)}
            disabled={staffLoading}
          />
          <button
            type="submit"
            className="bdash-ctrl-btn bdash-ctrl-advance bdash-staff-add-btn"
            disabled={staffLoading || !staffEmail.trim()}
          >
            {staffLoading ? 'Adding...' : '+ Add Staff'}
          </button>
        </form>

        {staffList.length === 0 ? (
          <div className="bdash-empty" style={{ padding: '1rem' }}>
            <p>No staff members yet. Add someone using their email above.</p>
          </div>
        ) : (
          <div className="bdash-staff-list">
            {staffList.map((member) => (
              <div key={member.id} className="bdash-staff-row">
                <div className="bdash-staff-avatar">
                  {(member.userName || member.userEmail || '?')[0].toUpperCase()}
                </div>
                <div className="bdash-staff-info">
                  <strong>{member.userName || '—'}</strong>
                  <small>{member.userEmail}</small>
                </div>
                <span className="bdash-staff-role">{member.role}</span>
                <button
                  type="button"
                  className="bdash-staff-remove"
                  onClick={() => handleRemoveStaff(member.id)}
                  title="Remove staff member"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Queue Status Control */}
      <div className="bdash-card">
        <h3>Queue Status</h3>
        <p className="bdash-card-sub">Temporarily close or reopen your queue</p>
        <div className="bdash-settings-actions">
          <button
            type="button"
            className={`bdash-ctrl-btn ${officeState.isActive ? 'bdash-ctrl-pause' : 'bdash-ctrl-resume'}`}
            onClick={handleToggle}
            disabled={toggling}
          >
            {officeState.isActive ? '⏸ Temporarily Close Queue' : '▶ Reopen Queue'}
          </button>
        </div>
      </div>
    </div>
  );
}
