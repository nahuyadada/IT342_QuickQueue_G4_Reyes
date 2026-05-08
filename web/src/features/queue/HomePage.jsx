import { useEffect, useMemo, useState } from 'react';
import { getCurrentUserProfile } from '../auth/authService';
import { getOffices, getQueueStatus, joinQueue } from './queueService';

export default function HomePage() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [officesCount, setOfficesCount] = useState(0);
  const [activeQueueCount, setActiveQueueCount] = useState(0);
  const [estimatedWait, setEstimatedWait] = useState('-');
  const [currentTicket, setCurrentTicket] = useState('-');
  const [offices, setOffices] = useState([]);
  const [officeQuery, setOfficeQuery] = useState('');
  const [selectedOfficeId, setSelectedOfficeId] = useState('');
  const [loadingOffices, setLoadingOffices] = useState(false);
  const [joining, setJoining] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const filteredOffices = useMemo(() => {
    if (!officeQuery.trim()) return offices;
    const query = officeQuery.toLowerCase();
    return offices.filter((office) => (`${office.name} ${office.type} ${office.address || ''}`).toLowerCase().includes(query));
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

  const loadOffices = async () => {
    setLoadingOffices(true);
    setError('');
    try {
      const officeList = await getOffices();
      setOffices(officeList || []);
      setOfficesCount(officeList?.length || 0);
      if (!selectedOfficeId && officeList?.length) {
        setSelectedOfficeId(String(officeList[0].id));
      }
    } catch (err) {
      setError(err.message || 'Unable to load office summary.');
    } finally {
      setLoadingOffices(false);
    }
  };

  const handleJoinQueue = async () => {
    setSuccess('');
    setError('');

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
      localStorage.setItem('activeTicketId', String(createdTicket.ticketId));
      setCurrentTicket(createdTicket.ticketNumber || '-');
      setActiveQueueCount(1);
      setSuccess(`Ticket ${createdTicket.ticketNumber} created successfully.`);

      try {
        const status = await getQueueStatus(Number(createdTicket.ticketId));
        setEstimatedWait(status.estimatedWaitMinutes ?? '-');
      } catch {
        setEstimatedWait('-');
      }
    } catch (err) {
      setError(err.message || 'Failed to join queue.');
    } finally {
      setJoining(false);
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      await loadOffices();

      const ticketId = localStorage.getItem('activeTicketId');
      if (!ticketId) return;

      try {
        const status = await getQueueStatus(Number(ticketId));
        setCurrentTicket(status.ticketNumber || '-');
        setEstimatedWait(status.estimatedWaitMinutes ?? '-');
        if (['WAITING', 'SERVING'].includes(status.status)) {
          setActiveQueueCount(1);
        } else {
          setActiveQueueCount(0);
        }
      } catch {
        localStorage.removeItem('activeTicketId');
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="portal-grid">
      {error && <div className="portal-alert portal-alert-error">{error}</div>}
      {success && <div className="portal-alert portal-alert-success">{success}</div>}

      <div className="portal-stat-card">
        <span>Current Ticket</span>
        <strong>{currentTicket}</strong>
        <p>Latest active queue ticket</p>
      </div>
      <div className="portal-stat-card">
        <span>Registered Offices</span>
        <strong>{officesCount}</strong>
        <p>All available service offices</p>
      </div>
      <div className="portal-stat-card">
        <span>Active Queues</span>
        <strong>{activeQueueCount}</strong>
        <p>Your active queue sessions</p>
      </div>
      <div className="portal-stat-card">
        <span>Avg Wait Time</span>
        <strong>{estimatedWait === '-' ? '-' : `${estimatedWait}m`}</strong>
        <p>Based on your current ticket</p>
      </div>

      <div className="portal-panel portal-panel-wide">
        <h3>Join Queue</h3>
        <p className="portal-muted">Select an office and get your queue ticket.</p>

        <div className="portal-controls">
          <input
            className="portal-input"
            type="text"
            placeholder="Search office or place..."
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
                {office.name} — {office.address || 'No location'} ({office.type})
              </option>
            ))}
          </select>

          <div className="portal-btn-row">
            <button type="button" className="portal-btn" onClick={loadOffices} disabled={loadingOffices}>
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
    </div>
  );
}