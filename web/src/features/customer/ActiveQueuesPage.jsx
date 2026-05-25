import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserProfile } from '../auth/authService';
import { cancelTicket, completeTicket, getQueueStatus } from './queueService';
import './CustomerPortal.css';

const POLL_INTERVAL = 5000; // Auto-refresh every 5 seconds

export default function ActiveQueuesPage() {
  const navigate = useNavigate();
  const [ticketStatus, setTicketStatus] = useState(null);
  const [activeTicketId, setActiveTicketId] = useState(localStorage.getItem('activeTicketId') || '');
  const [cancelling, setCancelling] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const pollRef = useRef(null);

  const clearMessages = () => { setError(''); setSuccess(''); };

  const refreshQueueStatus = async (ticketId = activeTicketId) => {
    if (!ticketId) { setLoading(false); return; }
    try {
      const status = await getQueueStatus(Number(ticketId));
      setTicketStatus(status);
      setActiveTicketId(String(status.ticketId));
      localStorage.setItem('activeTicketId', String(status.ticketId));
    } catch {
      // Ticket may have been completed/cancelled — stop polling
      setTicketStatus(null); setActiveTicketId('');
      localStorage.removeItem('activeTicketId');
    } finally {
      setLoading(false);
    }
  };

  // ── Auto-polling ──
  useEffect(() => {
    const bootstrap = async () => {
      try { await getCurrentUserProfile(); } catch { /* use cached user */ }
      if (activeTicketId) {
        await refreshQueueStatus(activeTicketId);
      } else {
        setLoading(false);
      }
    };
    bootstrap();

    // Start polling if we have a ticket
    if (activeTicketId) {
      pollRef.current = setInterval(() => {
        refreshQueueStatus(activeTicketId);
      }, POLL_INTERVAL);
    }

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // Restart/stop polling when activeTicketId changes
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (activeTicketId) {
      pollRef.current = setInterval(() => {
        refreshQueueStatus(activeTicketId);
      }, POLL_INTERVAL);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeTicketId]);

  const handleCancelTicket = async () => {
    clearMessages();
    if (!activeTicketId) { setError('No active ticket found.'); return; }
    setCancelling(true);
    try {
      const result = await cancelTicket(Number(activeTicketId));
      setTicketStatus(prev => ({ ...(prev || {}), ...result, peopleAhead: 0, estimatedWaitMinutes: 0 }));
      setSuccess(`Ticket ${result.ticketNumber} has been cancelled.`);
      localStorage.removeItem('activeTicketId');
      setActiveTicketId('');
    } catch (err) {
      setError(err.message || 'Failed to cancel ticket.');
    } finally { setCancelling(false); }
  };

  const handleCompleteTicket = async () => {
    clearMessages();
    if (!activeTicketId) { setError('No active ticket found.'); return; }
    setCompleting(true);
    try {
      const result = await completeTicket(Number(activeTicketId));
      setTicketStatus(prev => ({ ...(prev || {}), status: 'COMPLETED' }));
      setSuccess(`Ticket ${result.ticketNumber} completed! The next customer in line has been called.`);
      localStorage.removeItem('activeTicketId');
      setActiveTicketId('');
    } catch (err) {
      setError(err.message || 'Failed to complete ticket.');
    } finally { setCompleting(false); }
  };

  const getStatusClass = (status) => {
    if (status === 'WAITING') return 'waiting';
    if (status === 'SERVING') return 'serving';
    return 'cancelled';
  };

  const hasActiveTicket = ticketStatus && ['WAITING', 'SERVING'].includes(ticketStatus.status);

  return (
    <div className="cust-page" id="my-queues-page">
      {error && <div className="cust-alert cust-alert-error">⚠️ {error}</div>}
      {success && <div className="cust-alert cust-alert-success">✅ {success}</div>}

      <div className="cust-section-label">
        {loading ? 'Loading...' : hasActiveTicket ? '1 Active Queue' : 'My Queues'}
      </div>

      {!loading && !hasActiveTicket && (
        <div className="cust-empty-state">
          <div className="cust-empty-icon">🎫</div>
          <h3>No active queues</h3>
          <p>You haven't joined any queues yet. Visit the Home or Map tab to find establishments and join a queue.</p>
        </div>
      )}

      {hasActiveTicket && (
        <div className="cust-tickets-list">
          <div className={`cust-ticket-card ${getStatusClass(ticketStatus.status)}`}>
            <div className="cust-ticket-top">
              <div>
                <div className="cust-ticket-office">{ticketStatus.officeName || 'Unknown Office'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`cust-ticket-badge ${getStatusClass(ticketStatus.status)}`}>
                  {ticketStatus.status}
                </span>
                {ticketStatus.status === 'WAITING' && (
                  <button
                    style={{
                      width: 28, height: 28, borderRadius: 8,
                      border: '1px solid #fecaca', background: '#fef2f2',
                      color: '#ef4444', cursor: 'pointer', display: 'grid', placeItems: 'center',
                      fontSize: '1rem', fontWeight: 700, transition: 'all 0.2s',
                    }}
                    title="Leave queue"
                    onClick={handleCancelTicket}
                    disabled={cancelling}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="cust-ticket-grid">
              <div className="cust-ticket-stat">
                <span>Ticket #</span>
                <strong className="blue">{ticketStatus.ticketNumber || '-'}</strong>
              </div>
              <div className="cust-ticket-stat">
                <span>Position</span>
                <strong>{ticketStatus.position ?? '-'}</strong>
              </div>
              <div className="cust-ticket-stat">
                <span>Ahead</span>
                <strong>{ticketStatus.peopleAhead ?? '-'}</strong>
              </div>
              <div className="cust-ticket-stat">
                <span>Est. Wait</span>
                <strong>{ticketStatus.estimatedWaitMinutes != null ? `${ticketStatus.estimatedWaitMinutes}m` : '-'}</strong>
              </div>
            </div>

            <div className="cust-ticket-actions">
              {ticketStatus.status === 'SERVING' && (
                <button className="cust-ticket-btn complete"
                  onClick={handleCompleteTicket}
                  disabled={completing}>
                  ✅ {completing ? 'Completing...' : 'Complete Queue'}
                </button>
              )}

              {ticketStatus.status === 'WAITING' && (
                <button className="cust-ticket-btn cancel"
                  onClick={handleCancelTicket}
                  disabled={cancelling}>
                  ✕ {cancelling ? 'Cancelling...' : 'Cancel Ticket'}
                </button>
              )}
            </div>

            {/* Live status indicator */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              marginTop: '0.5rem', paddingTop: '0.5rem',
              borderTop: '1px solid #f1f5f9',
              fontSize: '0.72rem', color: '#94a3b8',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: '#22c55e',
                animation: 'pulse 2s infinite',
              }} />
              Live — auto-refreshing every 5s
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}