import { useEffect, useMemo, useState } from 'react';
import { getCurrentUserProfile } from '../services/authService';
import { cancelTicket, getOffices, getQueueStatus, joinQueue } from '../services/queueService';

export default function ActiveQueuesPage() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [offices, setOffices] = useState([]);
  const [officeQuery, setOfficeQuery] = useState('');
  const [selectedOfficeId, setSelectedOfficeId] = useState('');
  const [ticketStatus, setTicketStatus] = useState(null);
  const [activeTicketId, setActiveTicketId] = useState(localStorage.getItem('activeTicketId') || '');
  const [loadingOffices, setLoadingOffices] = useState(false);
  const [joining, setJoining] = useState(false);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const hasActiveTicket = ticketStatus && ['WAITING', 'SERVING'].includes(ticketStatus.status);

  const filteredOffices = useMemo(() => {
    if (!officeQuery.trim()) return offices;
    const query = officeQuery.toLowerCase();
    return offices.filter((office) => (`${office.name} ${office.type}`).toLowerCase().includes(query));
  }, [offices, officeQuery]);

  const resolveUserProfile = async () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (currentUser.id) {
      setUser(currentUser);
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
    setUser(mergedUser);
    return mergedUser;
  };

  const fetchOffices = async () => {
    setLoadingOffices(true);
    try {
      const officeList = await getOffices();
      setOffices(officeList || []);
      if (!selectedOfficeId && officeList?.length) {
        setSelectedOfficeId(String(officeList[0].id));
      }
    } catch (err) {
      setError(err.message || 'Unable to load service offices.');
    } finally {
      setLoadingOffices(false);
    }
  };

  const refreshQueueStatus = async (ticketId = activeTicketId, { silent = false } = {}) => {
    if (!ticketId) return;
    if (!silent) {
      clearMessages();
      setRefreshingStatus(true);
    }

    try {
      const status = await getQueueStatus(Number(ticketId));
      setTicketStatus(status);
      setActiveTicketId(String(status.ticketId));
      localStorage.setItem('activeTicketId', String(status.ticketId));
      if (!silent) {
        setSuccess('Ticket status updated.');
      }
    } catch (err) {
      if (!silent) {
        setError(err.message || 'Unable to fetch ticket status.');
      }
      setTicketStatus(null);
      setActiveTicketId('');
      localStorage.removeItem('activeTicketId');
    } finally {
      if (!silent) {
        setRefreshingStatus(false);
      }
    }
  };

  const handleJoinQueue = async () => {
    clearMessages();

    if (hasActiveTicket) {
      setError('You already have an active ticket. Cancel or finish it before joining a new queue.');
      return;
    }

    if (!selectedOfficeId) {
      setError('Please select a service office first.');
      return;
    }

    setJoining(true);
    try {
      const profile = await resolveUserProfile();
      if (!profile.id) {
        throw new Error('Unable to identify your account. Please log out and log in again.');
      }

      const createdTicket = await joinQueue(profile.id, Number(selectedOfficeId));
      setTicketStatus(createdTicket);
      setActiveTicketId(String(createdTicket.ticketId));
      localStorage.setItem('activeTicketId', String(createdTicket.ticketId));
      setSuccess(`Ticket ${createdTicket.ticketNumber} created successfully.`);
      await refreshQueueStatus(createdTicket.ticketId, { silent: true });
    } catch (err) {
      setError(err.message || 'Failed to join queue.');
    } finally {
      setJoining(false);
    }
  };

  const handleCancelTicket = async () => {
    clearMessages();
    if (!activeTicketId) {
      setError('No active ticket found to cancel.');
      return;
    }

    setCancelling(true);
    try {
      const result = await cancelTicket(Number(activeTicketId));
      setTicketStatus((prev) => ({ ...(prev || {}), ...result, peopleAhead: 0, estimatedWaitMinutes: 0 }));
      setSuccess(`Ticket ${result.ticketNumber} has been cancelled.`);
      localStorage.removeItem('activeTicketId');
      setActiveTicketId('');
    } catch (err) {
      setError(err.message || 'Failed to cancel ticket.');
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await resolveUserProfile();
      } catch {
        // fallback to existing local user
      }

      await fetchOffices();

      if (activeTicketId) {
        await refreshQueueStatus(activeTicketId, { silent: true });
      }
    };

    bootstrap();
  }, []);

  return (
    <div className="portal-grid">
      {error && <div className="portal-alert portal-alert-error">{error}</div>}
      {success && <div className="portal-alert portal-alert-success">{success}</div>}

      <div className="portal-panel">
        <h3>Join Queue</h3>
        <p className="portal-muted">Select an office and get your queue ticket.</p>

        <div className="portal-controls">
          <input
            className="portal-input"
            type="text"
            placeholder="Search office..."
            value={officeQuery}
            onChange={(e) => setOfficeQuery(e.target.value)}
          />

          <select
            className="portal-input"
            value={selectedOfficeId}
            onChange={(e) => setSelectedOfficeId(e.target.value)}
            disabled={loadingOffices || filteredOffices.length === 0}
          >
            {filteredOffices.length === 0 && <option value="">No offices found</option>}
            {filteredOffices.map((office) => (
              <option key={office.id} value={office.id}>
                {office.name} ({office.type})
              </option>
            ))}
          </select>

          <div className="portal-btn-row">
            <button type="button" className="portal-btn" onClick={fetchOffices} disabled={loadingOffices}>
              {loadingOffices ? 'Loading...' : 'Reload Offices'}
            </button>
            <button
              type="button"
              className="portal-btn portal-btn-primary"
              onClick={handleJoinQueue}
              disabled={joining || loadingOffices || filteredOffices.length === 0}
            >
              {joining ? 'Creating Ticket...' : 'Take Ticket'}
            </button>
          </div>
        </div>
      </div>

      <div className="portal-panel">
        <h3>My Active Queue</h3>
        <p className="portal-muted">{user.name || 'User'} · {user.email || 'No email'}</p>

        {!ticketStatus && <div className="portal-empty">No active ticket yet. Join a queue to see status.</div>}

        {ticketStatus && (
          <div className="portal-ticket-grid">
            <div><span>Ticket Number</span><strong>{ticketStatus.ticketNumber || '-'}</strong></div>
            <div><span>Status</span><strong>{ticketStatus.status || '-'}</strong></div>
            <div><span>Office</span><strong>{ticketStatus.officeName || '-'}</strong></div>
            <div><span>People Ahead</span><strong>{ticketStatus.peopleAhead ?? '-'}</strong></div>
            <div><span>Est. Wait</span><strong>{ticketStatus.estimatedWaitMinutes ?? '-'} min</strong></div>
            <div><span>Position</span><strong>{ticketStatus.position ?? '-'}</strong></div>
          </div>
        )}

        <div className="portal-btn-row">
          <button
            type="button"
            className="portal-btn"
            onClick={() => refreshQueueStatus(activeTicketId)}
            disabled={!activeTicketId || refreshingStatus}
          >
            {refreshingStatus ? 'Refreshing...' : 'Refresh Status'}
          </button>
          <button
            type="button"
            className="portal-btn portal-btn-danger"
            onClick={handleCancelTicket}
            disabled={!activeTicketId || cancelling || ticketStatus?.status !== 'WAITING'}
          >
            {cancelling ? 'Cancelling...' : 'Cancel Ticket'}
          </button>
        </div>
      </div>
    </div>
  );
}