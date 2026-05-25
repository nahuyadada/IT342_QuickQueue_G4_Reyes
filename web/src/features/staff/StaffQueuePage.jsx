import { useState, useEffect, useCallback } from 'react';
import { useStaff } from '../../shared/UserPortalLayout';
import { toggleOffice, advanceQueue } from './queueService';
import apiClient from '../../shared/apiClient';
import './BusinessDashboardPage.css';

export default function StaffQueuePage() {
  const office = useStaff();
  const [officeState, setOfficeState] = useState(office);
  const [toggling, setToggling] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [servingTicket, setServingTicket] = useState(null);
  const [waitingList, setWaitingList] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);

  useEffect(() => { setOfficeState(office); }, [office]);

  const flash = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 4000);
  };

  const loadQueue = useCallback(async () => {
    if (!officeState?.officeId) return;
    setLoadingQueue(true);
    try {
      const [countsData] = await Promise.all([
        apiClient.get('/offices/queue-counts'),
      ]);
      // counts is a map of officeId → waitingCount — use to refresh UI
      // For detailed ticket list we'd need a staff endpoint; show counts for now
      const count = countsData?.[officeState.officeId] ?? 0;
      // Update waiting count synthetic list
      if (!servingTicket) {
        setWaitingList(Array.from({ length: count }, (_, i) => ({ pos: i + 1 })));
      }
    } catch { /* ignore */ } finally {
      setLoadingQueue(false);
    }
  }, [officeState?.officeId, servingTicket]);

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 10000);
    return () => clearInterval(interval);
  }, [loadQueue]);

  if (!officeState) return null;

  const handleToggle = async () => {
    setToggling(true);
    try {
      const updated = await toggleOffice(officeState.officeId);
      setOfficeState((prev) => ({ ...prev, ...updated }));
      flash(`Queue is now ${updated.isActive ? 'OPEN' : 'CLOSED'}.`);
    } catch (err) { flash(err.message); }
    finally { setToggling(false); }
  };

  const handleCallNext = async () => {
    setAdvancing(true);
    try {
      const result = await advanceQueue(officeState.officeId);
      setServingTicket(result);
      const remaining = result.waitingCount ?? 0;
      setWaitingList(Array.from({ length: remaining }, (_, i) => ({ pos: i + 1 })));
      flash(`Now serving ticket ${result.ticketNumber}. ${remaining} still waiting.`);
    } catch (err) { flash(err.message); }
    finally { setAdvancing(false); }
  };

  const handleSkip = async () => {
    if (!servingTicket?.ticketId) {
      flash('No ticket is currently being served.');
      return;
    }
    setSkipping(true);
    try {
      await apiClient.post(`/queues/complete/${servingTicket.ticketId}`);
      flash(`Ticket ${servingTicket.ticketNumber} marked as no-show. Calling next...`);
      setServingTicket(null);
      // auto-advance is handled by completeTicket on backend
      await loadQueue();
    } catch (err) { flash(err.message); }
    finally { setSkipping(false); }
  };

  const isOpen = officeState.isActive;

  return (
    <div className="bdash-root">
      {/* Header */}
      <div className="bdash-branch-header">
        <div>
          <h2 className="bdash-branch-name">{officeState.name}</h2>
          <span className="bdash-branch-cat">{officeState.category || officeState.type}</span>
          <span className="bdash-role-badge" style={{ marginLeft: '0.5rem' }}>Staff</span>
        </div>
        <div className={`bdash-live-badge ${isOpen ? 'open' : 'closed'}`}>
          <div className="bdash-live-dot" />
          {isOpen ? 'Open for Queues' : 'Closed'}
        </div>
      </div>

      {actionMsg && <div className="bdash-action-toast">{actionMsg}</div>}

      {/* Stats */}
      <div className="bdash-quick-stats">
        <div className="bdash-qstat">
          <span className="bdash-qstat-value">{waitingList.length}</span>
          <span className="bdash-qstat-label">In Queue</span>
        </div>
        <div className="bdash-qstat">
          <span className="bdash-qstat-value">{servingTicket ? '1' : '0'}</span>
          <span className="bdash-qstat-label">Now Serving</span>
        </div>
        <div className="bdash-qstat">
          <span className="bdash-qstat-value">{isOpen ? 'Open' : 'Closed'}</span>
          <span className="bdash-qstat-label">Status</span>
        </div>
        <div className="bdash-qstat">
          <span className="bdash-qstat-value">{loadingQueue ? '...' : '✓'}</span>
          <span className="bdash-qstat-label">Live</span>
        </div>
      </div>

      <div className="bdash-queue-layout">
        {/* Controls */}
        <div className="bdash-card bdash-card-controls">
          <h3>Queue Controls</h3>
          <p className="bdash-card-sub">Manage the queue on behalf of this business</p>

          <div className="bdash-control-group">
            <button
              type="button"
              className="bdash-ctrl-btn bdash-ctrl-advance"
              onClick={handleCallNext}
              disabled={advancing || !isOpen}
              title={!isOpen ? 'Queue is closed' : ''}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
              {advancing ? 'Calling...' : 'Call Next Customer'}
            </button>

            <button
              type="button"
              className="bdash-ctrl-btn bdash-ctrl-skip"
              onClick={handleSkip}
              disabled={skipping || !servingTicket || !isOpen}
              title={!servingTicket ? 'No ticket currently being served' : 'Mark current customer as no-show'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 4l10 8-10 8V4z" /><line x1="19" y1="5" x2="19" y2="19" />
              </svg>
              {skipping ? 'Skipping...' : 'Skip / No-Show'}
            </button>

            <button
              type="button"
              className={`bdash-ctrl-btn ${isOpen ? 'bdash-ctrl-pause' : 'bdash-ctrl-resume'}`}
              onClick={handleToggle}
              disabled={toggling}
            >
              {isOpen
                ? (toggling ? 'Closing...' : '⏸ Close Queue')
                : (toggling ? 'Opening...' : '▶ Open Queue')}
            </button>
          </div>

          {/* Now Serving panel */}
          {servingTicket ? (
            <div className="bdash-now-serving">
              <div className="bdash-serving-label">Now Serving</div>
              <div className="bdash-serving-ticket">
                <strong>{servingTicket.ticketNumber}</strong>
                <span>{servingTicket.officeName}</span>
              </div>
            </div>
          ) : (
            <div style={{ background: '#f8fafc', border: '1px dashed #e2e8f0', borderRadius: '12px', padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              No ticket currently being served.<br />
              <small>Press "Call Next" to start serving.</small>
            </div>
          )}
        </div>

        {/* Queue size */}
        <div className="bdash-card">
          <div className="bdash-card-head">
            <h3>Waiting Queue</h3>
            <span className="bdash-badge">{waitingList.length} waiting</span>
          </div>
          <p className="bdash-card-sub" style={{ marginBottom: '0.75rem' }}>
            Live count updates every 10 seconds.
          </p>
          {waitingList.length === 0 ? (
            <div className="bdash-empty">
              <span>🎉</span>
              <p>No customers waiting!</p>
              <small>The queue is empty. Great job!</small>
            </div>
          ) : (
            <div className="bdash-queue-items">
              {waitingList.map((item) => (
                <div key={item.pos} className="bdash-queue-item">
                  <div className="bdash-queue-pos">{item.pos}</div>
                  <div className="bdash-queue-info">
                    <strong>Position {item.pos}</strong>
                    <span>Waiting in queue</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info note */}
      <div style={{ marginTop: '1rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.83rem', color: '#1e40af' }}>
        <strong>Staff access only.</strong> You can open/close the queue, call the next customer, and mark no-shows.
        Contact the business owner to make changes to settings or staff.
      </div>
    </div>
  );
}
