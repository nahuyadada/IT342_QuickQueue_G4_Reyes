import { useState, useEffect } from 'react';
import { usePartner } from '../../shared/UserPortalLayout';
import { toggleOffice, advanceQueue } from './queueService';
import './BusinessDashboardPage.css';

export default function PartnerQueuePage() {
  const office = usePartner();
  const [officeState, setOfficeState] = useState(office);
  const [toggling, setToggling] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => { setOfficeState(office); }, [office]);

  // Mock queue data
  const [queueList] = useState([
    { id: 1, ticketNumber: 'Q-001', name: 'Juan Dela Cruz', priority: null, status: 'SERVING', joinedAt: '9:02 AM' },
    { id: 2, ticketNumber: 'Q-002', name: 'Maria Santos', priority: 'PWD', status: 'WAITING', joinedAt: '9:15 AM' },
    { id: 3, ticketNumber: 'Q-003', name: 'Pedro Reyes', priority: 'ELDERLY', status: 'WAITING', joinedAt: '9:22 AM' },
    { id: 4, ticketNumber: 'Q-004', name: 'Ana Garcia', priority: null, status: 'WAITING', joinedAt: '9:30 AM' },
    { id: 5, ticketNumber: 'Q-005', name: 'Rosa Flores', priority: 'PREGNANT', status: 'WAITING', joinedAt: '9:45 AM' },
    { id: 6, ticketNumber: 'Q-006', name: 'Carlos Mendoza', priority: null, status: 'WAITING', joinedAt: '10:01 AM' },
  ]);

  if (!officeState) return null;

  const servingNow = queueList.find(q => q.status === 'SERVING');
  const waitingList = queueList.filter(q => q.status === 'WAITING');

  const handleToggle = async () => {
    setToggling(true);
    setActionMsg('');
    try {
      const updated = await toggleOffice(officeState.officeId);
      setOfficeState(prev => ({ ...prev, ...updated }));
      setActionMsg(`Queue is now ${updated.isActive ? 'OPEN' : 'CLOSED'}.`);
    } catch (err) { setActionMsg(err.message); }
    finally { setToggling(false); }
  };

  const handleAdvance = async () => {
    setAdvancing(true);
    setActionMsg('');
    try {
      const result = await advanceQueue(officeState.officeId);
      setActionMsg(`Now serving ticket ${result.ticketNumber}. ${result.waitingCount} still waiting.`);
    } catch (err) { setActionMsg(err.message); }
    finally { setAdvancing(false); }
  };

  return (
    <div className="bdash-root">
      {/* Branch header */}
      <div className="bdash-branch-header">
        <div>
          <h2 className="bdash-branch-name">{officeState.name}</h2>
          <span className="bdash-branch-cat">{officeState.category || officeState.type}</span>
        </div>
        <div className={`bdash-live-badge ${officeState.isActive ? 'open' : 'closed'}`}>
          <div className="bdash-live-dot" />
          {officeState.isActive ? 'Open for Queues' : 'Closed'}
        </div>
      </div>

      {actionMsg && <div className="bdash-action-toast">{actionMsg}</div>}

      {/* Quick Stats */}
      <div className="bdash-quick-stats">
        <div className="bdash-qstat">
          <span className="bdash-qstat-value">{waitingList.length}</span>
          <span className="bdash-qstat-label">In Queue</span>
        </div>
        <div className="bdash-qstat">
          <span className="bdash-qstat-value">{servingNow ? '1' : '0'}</span>
          <span className="bdash-qstat-label">Now Serving</span>
        </div>
        <div className="bdash-qstat">
          <span className="bdash-qstat-value">23</span>
          <span className="bdash-qstat-label">Served Today</span>
        </div>
        <div className="bdash-qstat">
          <span className="bdash-qstat-value">14.2 min</span>
          <span className="bdash-qstat-label">Avg Wait</span>
        </div>
      </div>

      <div className="bdash-queue-layout">
        {/* Controls */}
        <div className="bdash-card bdash-card-controls">
          <h3>Queue Controls</h3>
          <p className="bdash-card-sub">Manage queue flow for your customers</p>

          <div className="bdash-control-group">
            <button type="button" className="bdash-ctrl-btn bdash-ctrl-advance" onClick={handleAdvance} disabled={advancing || !officeState.isActive}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l14 9-14 9V3z"/></svg>
              {advancing ? 'Calling...' : 'Call Next'}
            </button>

            <button type="button" className={`bdash-ctrl-btn ${officeState.isActive ? 'bdash-ctrl-pause' : 'bdash-ctrl-resume'}`} onClick={handleToggle} disabled={toggling}>
              {officeState.isActive ? (
                <>{toggling ? 'Pausing...' : '⏸ Pause Queue'}</>
              ) : (
                <>{toggling ? 'Resuming...' : '▶ Resume Queue'}</>
              )}
            </button>

            <button type="button" className="bdash-ctrl-btn bdash-ctrl-skip" onClick={() => setActionMsg('No-show marked. Moving to next customer.')} disabled={!officeState.isActive}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4l10 8-10 8V4z"/><line x1="19" y1="5" x2="19" y2="19"/></svg>
              Skip (No-Show)
            </button>
          </div>

          {servingNow && (
            <div className="bdash-now-serving">
              <div className="bdash-serving-label">Now Serving</div>
              <div className="bdash-serving-ticket">
                <strong>{servingNow.ticketNumber}</strong>
                <span>{servingNow.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Next up */}
        <div className="bdash-card">
          <div className="bdash-card-head">
            <h3>Next in Queue</h3>
            <span className="bdash-badge">{waitingList.length} waiting</span>
          </div>
          {waitingList.length === 0 ? (
            <div className="bdash-empty"><span>🎉</span><p>No customers waiting!</p></div>
          ) : (
            <div className="bdash-queue-items">
              {waitingList.slice(0, 5).map((q, idx) => (
                <div key={q.id} className="bdash-queue-item">
                  <div className="bdash-queue-pos">{idx + 1}</div>
                  <div className="bdash-queue-info">
                    <strong>{q.ticketNumber}</strong>
                    <span>{q.name}</span>
                    <small>Joined: {q.joinedAt}</small>
                  </div>
                  {q.priority && <span className={`bdash-priority-tag ${q.priority.toLowerCase()}`}>{q.priority}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
