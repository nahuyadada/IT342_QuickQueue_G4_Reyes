import { useEffect, useState } from 'react';
import { getCurrentUserProfile } from '../auth/authService';
import { cancelTicket, getQueueStatus } from './queueService';

export default function ActiveQueuesPage() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [ticketStatus, setTicketStatus] = useState(null);
  const [activeTicketId, setActiveTicketId] = useState(localStorage.getItem('activeTicketId') || '');
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

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