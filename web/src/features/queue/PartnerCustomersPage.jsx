import { useState } from 'react';
import { usePartner } from '../../shared/UserPortalLayout';
import './BusinessDashboardPage.css';

export default function PartnerCustomersPage() {
  const office = usePartner();
  const [filter, setFilter] = useState('all');

  const customers = [
    { id: 1, ticketNumber: 'Q-001', name: 'Juan Dela Cruz', priority: null, status: 'SERVING', joinedAt: '9:02 AM', estimatedWait: 'Now' },
    { id: 2, ticketNumber: 'Q-002', name: 'Maria Santos', priority: 'PWD', status: 'WAITING', joinedAt: '9:15 AM', estimatedWait: '~5 min' },
    { id: 3, ticketNumber: 'Q-003', name: 'Pedro Reyes', priority: 'ELDERLY', status: 'WAITING', joinedAt: '9:22 AM', estimatedWait: '~12 min' },
    { id: 4, ticketNumber: 'Q-004', name: 'Ana Garcia', priority: null, status: 'WAITING', joinedAt: '9:30 AM', estimatedWait: '~20 min' },
    { id: 5, ticketNumber: 'Q-005', name: 'Rosa Flores', priority: 'PREGNANT', status: 'WAITING', joinedAt: '9:45 AM', estimatedWait: '~28 min' },
    { id: 6, ticketNumber: 'Q-006', name: 'Carlos Mendoza', priority: null, status: 'WAITING', joinedAt: '10:01 AM', estimatedWait: '~35 min' },
    { id: 7, ticketNumber: 'Q-007', name: 'Lisa Tan', priority: null, status: 'SERVED', joinedAt: '8:30 AM', estimatedWait: 'Done' },
    { id: 8, ticketNumber: 'Q-008', name: 'Marco Villanueva', priority: null, status: 'NO_SHOW', joinedAt: '8:45 AM', estimatedWait: '—' },
  ];

  const filtered = filter === 'all' ? customers : customers.filter(c => {
    if (filter === 'waiting') return c.status === 'WAITING';
    if (filter === 'priority') return c.priority !== null;
    if (filter === 'served') return c.status === 'SERVED' || c.status === 'NO_SHOW';
    return true;
  });

  const statusStyle = (status) => {
    switch (status) {
      case 'SERVING': return { background: '#dbeafe', color: '#1e40af' };
      case 'WAITING': return { background: '#f1f5f9', color: '#475569' };
      case 'SERVED': return { background: '#dcfce7', color: '#166534' };
      case 'NO_SHOW': return { background: '#fef2f2', color: '#991b1b' };
      default: return {};
    }
  };

  if (!office) return null;

  return (
    <div className="bdash-root">
      <div className="bdash-card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>Customer Queue</h3>
            <p className="bdash-card-sub" style={{ marginBottom: 0 }}>All customers currently in your queue</p>
          </div>
          <span className="bdash-badge">{customers.filter(c => c.status === 'WAITING').length} waiting</span>
        </div>

        {/* Filter tabs */}
        <div className="bdash-tabs" style={{ marginBottom: '1rem' }}>
          {[
            { key: 'all', label: 'All', count: customers.length },
            { key: 'waiting', label: 'Waiting', count: customers.filter(c => c.status === 'WAITING').length },
            { key: 'priority', label: 'Priority', count: customers.filter(c => c.priority).length },
            { key: 'served', label: 'Served', count: customers.filter(c => c.status === 'SERVED' || c.status === 'NO_SHOW').length },
          ].map(f => (
            <button
              key={f.key}
              className={`bdash-tab ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* Customer list */}
        <div className="bdash-queue-items">
          {filtered.map((c) => (
            <div key={c.id} className="bdash-queue-item" style={{ padding: '0.85rem' }}>
              <div className="bdash-queue-pos" style={{
                ...(c.status === 'SERVING' ? { background: '#2563eb', color: '#fff' } : {}),
              }}>
                {c.status === 'SERVING' ? '▶' : c.status === 'SERVED' ? '✓' : c.status === 'NO_SHOW' ? '✕' : filtered.indexOf(c) + 1}
              </div>
              <div className="bdash-queue-info" style={{ flex: 1 }}>
                <strong>{c.ticketNumber} — {c.name}</strong>
                <small>Joined: {c.joinedAt} · Est. wait: {c.estimatedWait}</small>
              </div>
              {c.priority && (
                <span className={`bdash-priority-tag ${c.priority.toLowerCase()}`}>
                  {c.priority}
                </span>
              )}
              <span style={{
                padding: '0.2rem 0.55rem',
                borderRadius: 6,
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                ...statusStyle(c.status),
              }}>
                {c.status === 'NO_SHOW' ? 'No-Show' : c.status.charAt(0) + c.status.slice(1).toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
