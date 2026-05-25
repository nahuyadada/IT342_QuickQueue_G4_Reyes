import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyRegistrations, getStaffOffices } from '../../shared/services/queueService';
import './MyRegistrationsPage.css';

const STATUS_CONFIG = {
  PENDING: { label: 'Pending Review', color: '#f59e0b', bg: '#fffbeb', icon: '⏳' },
  APPROVED: { label: 'Approved', color: '#16a34a', bg: '#f0fdf4', icon: '✅' },
  REJECTED: { label: 'Rejected', color: '#dc2626', bg: '#fef2f2', icon: '❌' },
};

export default function MyRegistrationsPage() {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [staffOffices, setStaffOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dismissedApprovals, setDismissedApprovals] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissedApprovals') || '[]');
    } catch {
      return [];
    }
  });

  const loadRegistrations = async () => {
    setLoading(true);
    setError('');
    try {
      const [ownedData, staffData] = await Promise.all([
        getMyRegistrations(),
        getStaffOffices(),
      ]);
      setRegistrations(ownedData || []);
      setStaffOffices(staffData || []);
    } catch (err) {
      setError(err.message || 'Failed to load registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, []);

  // Check for newly approved registrations (notification)
  const newApprovals = registrations.filter(
    (r) => r.approvalStatus === 'APPROVED' && !dismissedApprovals.includes(r.officeId)
  );

  const dismissApproval = (officeId) => {
    const updated = [...dismissedApprovals, officeId];
    setDismissedApprovals(updated);
    localStorage.setItem('dismissedApprovals', JSON.stringify(updated));
  };

  return (
    <div className="myreg-root">
      <div className="myreg-header">
        <div>
          <h2>My Business Registrations</h2>
          <p className="portal-muted">Track the status of your submitted businesses</p>
        </div>
        <button
          type="button"
          className="portal-btn portal-btn-primary"
          onClick={() => navigate('/dashboard/register-business')}
        >
          + Register New Business
        </button>
      </div>

      {/* ── Approval Notifications ── */}
      {newApprovals.map((reg) => (
        <div key={reg.officeId} className="myreg-notification">
          <div className="myreg-notification-icon">🎉</div>
          <div className="myreg-notification-content">
            <strong>Congratulations! "{reg.name}" has been approved!</strong>
            <p>Your business is now live. You can manage queues and settings from your Business Dashboard.</p>
          </div>
          <div className="myreg-notification-actions">
            <button
              type="button"
              className="portal-btn portal-btn-primary"
              onClick={() => navigate(`/dashboard/business/${reg.officeId}`)}
            >
              Go to Dashboard
            </button>
            <button
              type="button"
              className="portal-btn"
              onClick={() => dismissApproval(reg.officeId)}
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}

      {error && <div className="portal-alert portal-alert-error">{error}</div>}

      {loading ? (
        <div className="myreg-loading">
          <div className="myreg-spinner" />
          <p>Loading your registrations...</p>
        </div>
      ) : registrations.length === 0 && staffOffices.length === 0 ? (
        <div className="myreg-empty">
          <div className="myreg-empty-icon">📋</div>
          <h3>No registrations yet</h3>
          <p>Register your business to start accepting queues digitally.</p>
          <button
            type="button"
            className="portal-btn portal-btn-primary"
            onClick={() => navigate('/dashboard/register-business')}
          >
            Register Your Business
          </button>
        </div>
      ) : (
        <>
          {/* ── Owned Businesses ── */}
          {registrations.length > 0 && (
            <div className="myreg-grid">
              {registrations.map((reg) => {
                const status = STATUS_CONFIG[reg.approvalStatus] || STATUS_CONFIG.PENDING;

                return (
                  <div key={reg.officeId} className="myreg-card">
                    <div className="myreg-card-header">
                      <div>
                        <h3>{reg.name}</h3>
                        <span className="myreg-category">{reg.category || reg.type}</span>
                      </div>
                      <div
                        className="myreg-status-badge"
                        style={{ background: status.bg, color: status.color, borderColor: status.color }}
                      >
                        {status.icon} {status.label}
                      </div>
                    </div>

                    <div className="myreg-card-body">
                      <div className="myreg-info-row">
                        <span>📍</span>
                        <span>{reg.address || 'No address provided'}</span>
                      </div>
                      <div className="myreg-info-row">
                        <span>📞</span>
                        <span>{reg.phoneNumber || '—'}</span>
                      </div>
                      {reg.website && (
                        <div className="myreg-info-row">
                          <span>🌐</span>
                          <span>{reg.website}</span>
                        </div>
                      )}
                      <div className="myreg-info-row">
                        <span>🕐</span>
                        <span>{reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : '—'}</span>
                      </div>

                      {reg.isActive !== undefined && (
                        <div className="myreg-info-row">
                          <span>🏪</span>
                          <span className={reg.isActive ? 'myreg-open' : 'myreg-closed'}>
                            {reg.isActive ? 'Open for Queues' : 'Closed'}
                          </span>
                        </div>
                      )}
                    </div>

                    {reg.approvalStatus === 'APPROVED' && (
                      <div className="myreg-card-footer">
                        <button
                          type="button"
                          className="portal-btn portal-btn-primary myreg-manage-btn"
                          onClick={() => navigate(`/dashboard/business/${reg.officeId}`)}
                        >
                          Manage Business →
                        </button>
                      </div>
                    )}

                    {reg.approvalStatus === 'PENDING' && (
                      <div className="myreg-card-footer">
                        <div className="myreg-pending-msg">
                          <div className="myreg-pending-pulse" />
                          Your registration is being reviewed by an administrator.
                        </div>
                      </div>
                    )}

                    {reg.approvalStatus === 'REJECTED' && (
                      <div className="myreg-card-footer">
                        <p className="myreg-rejected-msg">
                          Your registration was not approved. Please review and re-submit.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Staff Offices ── */}
          {staffOffices.length > 0 && (
            <>
              <div className="myreg-section-divider">
                <h3>👥 Businesses I Work At</h3>
                <p className="portal-muted">You've been added as staff to these businesses</p>
              </div>
              <div className="myreg-grid">
                {staffOffices.map((office) => (
                  <div key={`staff-${office.officeId}`} className="myreg-card myreg-card-staff">
                    <div className="myreg-card-header">
                      <div>
                        <h3>{office.name}</h3>
                        <span className="myreg-category">{office.category || office.type}</span>
                      </div>
                      <div className="myreg-staff-badge">
                        👤 {office.staffRole}
                      </div>
                    </div>

                    <div className="myreg-card-body">
                      <div className="myreg-info-row">
                        <span>📍</span>
                        <span>{office.address || 'No address provided'}</span>
                      </div>
                      {office.isActive !== undefined && (
                        <div className="myreg-info-row">
                          <span>🏪</span>
                          <span className={office.isActive ? 'myreg-open' : 'myreg-closed'}>
                            {office.isActive ? 'Open for Queues' : 'Closed'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="myreg-card-footer">
                      <button
                        type="button"
                        className="portal-btn portal-btn-primary myreg-manage-btn"
                        onClick={() => navigate(`/dashboard/business/${office.officeId}`)}
                      >
                        Open Dashboard →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
