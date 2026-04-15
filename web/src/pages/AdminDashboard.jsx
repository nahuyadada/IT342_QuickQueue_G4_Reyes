import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { advanceQueue, getOffices } from '../services/queueService';
import './Dashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [offices, setOffices] = useState([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState('');
  const [latestServing, setLatestServing] = useState(null);
  const [loadingOffices, setLoadingOffices] = useState(false);
  const [advancing, setAdvancing] = useState(false);
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
    clearMessages();
    try {
      const officeList = await getOffices();
      setOffices(officeList || []);
      if (!selectedOfficeId && officeList?.length) {
        setSelectedOfficeId(String(officeList[0].id));
      }
    } catch (err) {
      setError(err.message || 'Unable to load offices.');
    } finally {
      setLoadingOffices(false);
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

  useEffect(() => {
    loadOffices();
  }, []);

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

        {error && <div className="dash-alert dash-alert-error">{error}</div>}
        {success && <div className="dash-alert dash-alert-success">{success}</div>}

        <div className="dash-cards dash-cards-stack">
          <div className="dash-card dash-card-static">
            <div className="dash-card-header">
              <div className="dash-card-icon">🏢</div>
              <div>
                <h3>Queue Control</h3>
                <p>Select an office and advance the next waiting ticket.</p>
              </div>
            </div>

            <div className="dash-controls">
              <select
                className="dash-select"
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

              <div className="dash-btn-row">
                <button type="button" className="dash-btn" onClick={loadOffices} disabled={loadingOffices}>
                  {loadingOffices ? 'Loading...' : 'Reload Offices'}
                </button>
                <button type="button" className="dash-btn dash-btn-primary" onClick={handleAdvanceQueue} disabled={advancing || !selectedOfficeId}>
                  {advancing ? 'Advancing...' : 'Advance Queue'}
                </button>
              </div>
            </div>
          </div>

          <div className="dash-card dash-card-static">
            <div className="dash-card-header">
              <div className="dash-card-icon">📋</div>
              <div>
                <h3>Latest Serving Result</h3>
                <p>Shows the ticket moved to SERVING state.</p>
              </div>
            </div>

            {!latestServing && (
              <div className="dash-empty">No queue advancement yet. Use the action above to call the next ticket.</div>
            )}

            {latestServing && (
              <div className="dash-ticket-grid">
                <div><span>Ticket Number</span><strong>{latestServing.ticketNumber || '-'}</strong></div>
                <div><span>Status</span><strong>{latestServing.status || '-'}</strong></div>
                <div><span>Office</span><strong>{latestServing.officeName || '-'}</strong></div>
                <div><span>Waiting Count</span><strong>{latestServing.waitingCount ?? '-'}</strong></div>
                <div><span>Position</span><strong>{latestServing.position ?? '-'}</strong></div>
                <div><span>Created At</span><strong>{latestServing.createdAt || '-'}</strong></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
