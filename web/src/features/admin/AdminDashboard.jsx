import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  advanceQueue,
  approveOfficeRegistration,
  getOffices,
  getPendingOfficeRegistrations,
  rejectOfficeRegistration,
} from '../queue/queueService';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [offices, setOffices] = useState([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState('');
  const [latestServing, setLatestServing] = useState(null);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [loadingOffices, setLoadingOffices] = useState(false);
  const [loadingPending, setLoadingPending] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [processingOfficeId, setProcessingOfficeId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeTicketId');
    navigate('/');
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const loadOffices = async () => {
    setLoadingOffices(true);
    setError('');
    try {
      const officeList = await getOffices();
      setOffices(officeList || []);
      if (!selectedOfficeId && officeList?.length) {
        setSelectedOfficeId(String(officeList[0].id));
      }
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to backend. Make sure the server is running on http://localhost:8080.'
          : (err.message || 'Unable to load offices.')
      );
    } finally {
      setLoadingOffices(false);
    }
  };

  const loadPendingRegistrations = async () => {
    setLoadingPending(true);
    setError('');
    try {
      const pending = await getPendingOfficeRegistrations();
      setPendingRegistrations(pending || []);
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to backend. Make sure the server is running on http://localhost:8080.'
          : (err.message || 'Unable to load pending registrations.')
      );
    } finally {
      setLoadingPending(false);
    }
  };

  const handleAdvanceQueue = async () => {
    clearMessages();

    if (!selectedOfficeId) {
      setError('Please choose a service office first.');
      return;
    }

    setAdvancing(true);
    try {
      const result = await advanceQueue(Number(selectedOfficeId));
      setLatestServing(result);
      setSuccess(`Now serving ${result.ticketNumber} at ${result.officeName}.`);
    } catch (err) {
      setError(err.message || 'Unable to advance queue.');
    } finally {
      setAdvancing(false);
    }
  };

  const handleDecision = async (officeId, action) => {
    clearMessages();
    setProcessingOfficeId(officeId);
    try {
      if (action === 'approve') {
        await approveOfficeRegistration(officeId);
        setSuccess('Registration approved successfully.');
      } else {
        await rejectOfficeRegistration(officeId);
        setSuccess('Registration rejected.');
      }

      await Promise.all([loadPendingRegistrations(), loadOffices()]);
    } catch (err) {
      setError(err.message || 'Unable to process registration request.');
    } finally {
      setProcessingOfficeId(null);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      await Promise.all([loadOffices(), loadPendingRegistrations()]);
    };
    bootstrap();
  }, []);

  const selectedOffice = offices.find((office) => String(office.id) === selectedOfficeId);

  return (
    <div className="admin-root">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-logo">Q</span>
          <span>QuickQueue</span>
        </div>

        <nav className="admin-nav">
          <button type="button" className="admin-nav-item active">Queue Control</button>
          <button type="button" className="admin-nav-item">Analytics</button>
          <button type="button" className="admin-nav-item">History</button>
          <button type="button" className="admin-nav-item">Settings</button>
          <button type="button" className="admin-nav-item">Staff Management</button>
        </nav>

        <button type="button" className="admin-logout" onClick={handleLogout}>Logout</button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-user">🛡️ {user.name || 'Admin User'}</div>
          <span>{user.role || 'ADMIN'}</span>
        </header>

        {error && <div className="admin-alert admin-alert-error">{error}</div>}
        {success && <div className="admin-alert admin-alert-success">{success}</div>}

        <section className="admin-stats-grid">
          <article className="admin-stat-card">
            <span>Now Serving</span>
            <strong>{latestServing?.ticketNumber || '—'}</strong>
            <p>{latestServing?.officeName || 'Select office'}</p>
          </article>
          <article className="admin-stat-card">
            <span>Waiting</span>
            <strong>{latestServing?.waitingCount ?? 0}</strong>
            <p>in queue</p>
          </article>
          <article className="admin-stat-card">
            <span>Avg Wait Time</span>
            <strong>{latestServing?.waitingCount ? `${latestServing.waitingCount * 5}m` : '0m'}</strong>
            <p>estimated</p>
          </article>
          <article className="admin-stat-card">
            <span>Pending Registrations</span>
            <strong>{pendingRegistrations.length}</strong>
            <p>for approval</p>
          </article>
        </section>

        <section className="admin-content-grid">
          <div className="admin-panel admin-panel-main">
            <div className="admin-panel-head">
              <h3>Current Service</h3>
            </div>

            <div className="admin-current-service">
              <strong>{latestServing?.ticketNumber || '—'}</strong>
              <span>{selectedOffice?.name || latestServing?.officeName || 'No active serving ticket'}</span>
              <div className="admin-current-meta">
                <div>
                  <span>Service Type</span>
                  <p>{selectedOffice?.type || latestServing?.officeType || '—'}</p>
                </div>
                <div>
                  <span>Status</span>
                  <p>{latestServing?.status || '—'}</p>
                </div>
                <div>
                  <span>Position</span>
                  <p>{latestServing?.position ?? '—'}</p>
                </div>
              </div>
            </div>

            <div className="admin-actions-row">
              <select
                className="admin-select"
                value={selectedOfficeId}
                onChange={(e) => setSelectedOfficeId(e.target.value)}
                disabled={loadingOffices || offices.length === 0}
              >
                {offices.length === 0 && <option value="">No offices found</option>}
                {offices.map((office) => (
                  <option key={office.id} value={office.id}>
                    {office.name} ({office.type})
                  </option>
                ))}
              </select>
              <button type="button" className="admin-btn" onClick={loadOffices} disabled={loadingOffices}>
                {loadingOffices ? 'Loading...' : 'Reload Offices'}
              </button>
              <button type="button" className="admin-btn admin-btn-primary" onClick={handleAdvanceQueue} disabled={advancing || !selectedOfficeId}>
                {advancing ? 'Advancing...' : 'Call Next'}
              </button>
            </div>
          </div>

          <div className="admin-panel admin-panel-side">
            <div className="admin-panel-head">
              <h3>Quick Actions</h3>
            </div>
            <div className="admin-side-buttons">
              <button type="button" className="admin-btn">Add Walk-In Customer</button>
              <button type="button" className="admin-btn">Pause Queue</button>
              <button type="button" className="admin-btn">Broadcast Message</button>
              <button type="button" className="admin-btn" onClick={loadPendingRegistrations} disabled={loadingPending}>
                {loadingPending ? 'Loading...' : 'Refresh Requests'}
              </button>
            </div>
          </div>

          <div className="admin-panel admin-panel-main">
            <div className="admin-panel-head">
              <h3>Registration Requests</h3>
              <span>{pendingRegistrations.length} pending</span>
            </div>

            <div className="admin-request-list">
              {pendingRegistrations.length === 0 && <p className="admin-empty">No pending registration requests.</p>}

              {pendingRegistrations.map((request) => (
                <div key={request.officeId} className="admin-request-item">
                  <div>
                    <strong>{request.name}</strong>
                    <p>{request.address}</p>
                    <small>Type: {request.type}</small>
                  </div>
                  <div className="admin-request-actions">
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary"
                      onClick={() => handleDecision(request.officeId, 'approve')}
                      disabled={processingOfficeId === request.officeId}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-danger"
                      onClick={() => handleDecision(request.officeId, 'reject')}
                      disabled={processingOfficeId === request.officeId}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-panel admin-panel-side">
            <div className="admin-panel-head">
              <h3>Active Offices</h3>
            </div>
            <div className="admin-simple-list">
              {offices.slice(0, 6).map((office) => (
                <div key={office.id}>
                  <strong>{office.name}</strong>
                  <span>{office.type}</span>
                </div>
              ))}
              {offices.length === 0 && <p className="admin-empty">No active offices.</p>}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
