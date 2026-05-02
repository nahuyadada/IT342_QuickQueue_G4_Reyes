import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserProfile } from '../auth/authService';
import { getOffices, joinQueue } from './queueService';

export default function MapViewPage() {
  const navigate = useNavigate();
  const [offices, setOffices] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedOfficeId, setSelectedOfficeId] = useState(null);
  const [joiningOfficeId, setJoiningOfficeId] = useState(null);
  const [officeToConfirm, setOfficeToConfirm] = useState(null);
  const [queueMessage, setQueueMessage] = useState('');
  const [queueError, setQueueError] = useState('');

  const loadOffices = async () => {
    setLoading(true);
    setError('');
    try {
      const officeList = await getOffices();
      setOffices(officeList || []);
    } catch (err) {
      setError(err.message || 'Unable to load registered offices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffices();
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return offices;
    const normalized = query.toLowerCase();
    return offices.filter((office) => `${office.name} ${office.type} ${office.address || ''}`.toLowerCase().includes(normalized));
  }, [offices, query]);

  const selectedOffice = offices.find((office) => office.id === selectedOfficeId) || null;

  const resolveUserProfile = async () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (currentUser.id) {
      return currentUser;
    }

    const profile = await getCurrentUserProfile();
    const mergedUser = {
      ...currentUser,
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
    };

    localStorage.setItem('user', JSON.stringify(mergedUser));
    return mergedUser;
  };

  const requestJoinFromOffice = (office) => {
    setSelectedOfficeId(office.id);
    setOfficeToConfirm(office);
  };

  const closeJoinConfirm = () => {
    if (joiningOfficeId) return;
    setOfficeToConfirm(null);
  };

  const confirmJoinFromOffice = async () => {
    if (!officeToConfirm) return;

    const office = officeToConfirm;
    setQueueMessage('');
    setQueueError('');
    setJoiningOfficeId(office.id);

    try {
      const user = await resolveUserProfile();
      if (!user.id) {
        throw new Error('Unable to identify your account. Please log in again.');
      }

      const ticket = await joinQueue(user.id, office.id);
      localStorage.setItem('activeTicketId', String(ticket.ticketId));
      setQueueMessage(`Joined ${office.name}. Ticket ${ticket.ticketNumber} created.`);
      setOfficeToConfirm(null);
    } catch (err) {
      setQueueError(err.message || 'Unable to join this queue.');
    } finally {
      setJoiningOfficeId(null);
    }
  };

  return (
    <div className="portal-grid portal-grid-map">
      {error && <div className="portal-alert portal-alert-error">{error}</div>}
      {queueMessage && <div className="portal-alert portal-alert-success">{queueMessage}</div>}
      {queueError && <div className="portal-alert portal-alert-error">{queueError}</div>}

      <div className="portal-panel">
        <div className="portal-panel-head">
          <h3>Map View</h3>
          <button type="button" className="portal-btn" onClick={loadOffices} disabled={loading}>
            {loading ? 'Loading...' : 'Reload'}
          </button>
        </div>

        <input
          className="portal-input"
          type="text"
          placeholder="Search office..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="portal-map-board">
          {filtered.length === 0 && <p className="portal-muted">No registered offices found.</p>}
          {filtered.map((office, index) => (
            <div
              key={office.id}
              className={`portal-map-marker ${selectedOfficeId === office.id ? 'active' : ''}`}
              style={{ left: `${10 + ((index * 17) % 75)}%`, top: `${15 + ((index * 11) % 65)}%` }}
              onClick={() => requestJoinFromOffice(office)}
              title={`Join queue at ${office.name} - ${office.address || 'No address provided'}`}
            >
              <span>📍</span>
              <small>{joiningOfficeId === office.id ? 'Joining...' : office.name}</small>
            </div>
          ))}
        </div>
        {selectedOffice && (
          <div className="portal-selected-place">
            <strong>{selectedOffice.name}</strong>
            <span>{selectedOffice.address || 'No business location provided'}</span>
          </div>
        )}
        <p className="portal-muted portal-inline-hint">Click any place marker to start joining that queue.</p>
      </div>

      <div className="portal-panel">
        <div className="portal-panel-head">
          <h3>Registered Offices</h3>
          <button
            type="button"
            className="portal-btn portal-btn-primary"
            onClick={() => navigate('/dashboard/register-business')}
          >
            Register Your Business
          </button>
        </div>
        <div className="portal-list">
          {filtered.map((office) => (
            <div
              key={office.id}
              className={`portal-list-item portal-list-item-clickable ${selectedOfficeId === office.id ? 'active' : ''}`}
              onClick={() => requestJoinFromOffice(office)}
              title={`Join queue at ${office.name} - ${office.address || 'No address provided'}`}
            >
              <div className="portal-list-main">
                <strong>{office.name}</strong>
                <small>{office.address || 'No business location provided'}</small>
              </div>
              <span>{joiningOfficeId === office.id ? 'Joining...' : office.type}</span>
            </div>
          ))}
          {filtered.length === 0 && <p className="portal-muted">No offices to display.</p>}
        </div>
      </div>

      {officeToConfirm && (
        <div className="portal-modal-backdrop" role="dialog" aria-modal="true">
          <div className="portal-modal">
            <h3>Confirm Queue Join</h3>
            <p className="portal-muted">Join queue at <strong>{officeToConfirm.name}</strong>?</p>
            <p className="portal-muted">Place: {officeToConfirm.address || 'No business location provided'}</p>

            <div className="portal-btn-row portal-modal-actions">
              <button type="button" className="portal-btn" onClick={closeJoinConfirm} disabled={!!joiningOfficeId}>
                Cancel
              </button>
              <button type="button" className="portal-btn portal-btn-primary" onClick={confirmJoinFromOffice} disabled={!!joiningOfficeId}>
                {joiningOfficeId === officeToConfirm.id ? 'Joining...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}