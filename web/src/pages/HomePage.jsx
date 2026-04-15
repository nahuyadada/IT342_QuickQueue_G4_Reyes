import { useEffect, useState } from 'react';
import { getOffices, getQueueStatus } from '../services/queueService';

export default function HomePage() {
  const [officesCount, setOfficesCount] = useState(0);
  const [activeQueueCount, setActiveQueueCount] = useState(0);
  const [estimatedWait, setEstimatedWait] = useState('-');
  const [currentTicket, setCurrentTicket] = useState('-');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const officeList = await getOffices();
        setOfficesCount(officeList?.length || 0);
      } catch {
        setError('Unable to load office summary.');
      }

      const ticketId = localStorage.getItem('activeTicketId');
      if (!ticketId) return;

      try {
        const status = await getQueueStatus(Number(ticketId));
        setCurrentTicket(status.ticketNumber || '-');
        setEstimatedWait(status.estimatedWaitMinutes ?? '-');
        if (['WAITING', 'SERVING'].includes(status.status)) {
          setActiveQueueCount(1);
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
        <h3>Queue Control</h3>
        <p>
          Use the navigation to manage your service journey:
          Map View shows all registered offices, Active Queues lets you take and monitor tickets, and Profile shows your account details.
        </p>
      </div>
    </div>
  );
}