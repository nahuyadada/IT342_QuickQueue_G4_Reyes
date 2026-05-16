import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserProfile } from '../auth/authService';
import { getOffices, joinQueue } from './queueService';
import './CustomerPortal.css';

/* ── Category helpers ── */
const CATEGORY_EMOJI = {
  'Bank & Finance': '🏦', 'Medical Clinic': '🏥', 'Government Office': '🏛️',
  'Restaurant': '🍽️', 'Salon & Spa': '💇', 'Dental Clinic': '🦷',
  'Pharmacy': '💊', 'Grocery & Retail': '🏪', 'Education': '📚',
  'Repair Shop': '🔧', 'Legal Services': '⚖️', 'Real Estate': '🏠',
  'Automotive': '🚗', 'Fitness & Gym': '💪', 'Other': '📋',
};
const getCategoryEmoji = (cat) => CATEGORY_EMOJI[cat] || '🏢';



/* ── SVG Icons ── */
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
  </svg>
);
const CompareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const TicketIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 5v2M15 11v2M15 17v2M5 5h14a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3a2 2 0 000-4V7a2 2 0 012-2z"/>
  </svg>
);
const PhoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
  </svg>
);
const MapPinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

export default function HomePage() {
  const navigate = useNavigate();
  const [offices, setOffices] = useState([]);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const loadOffices = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await getOffices();
      setOffices(list || []);
    } catch (err) {
      setError(err.message || 'Unable to load establishments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOffices(); }, []);

  const availableCategories = useMemo(() => {
    const cats = new Set(offices.map(o => o.category).filter(Boolean));
    return ['All', ...Array.from(cats).sort()];
  }, [offices]);

  const filtered = useMemo(() => {
    let result = offices;
    if (activeCategory !== 'All') {
      result = result.filter(o => o.category === activeCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(o =>
        `${o.name} ${o.type} ${o.address || ''} ${o.category || ''}`.toLowerCase().includes(q)
      );
    }
    return result;
  }, [offices, query, activeCategory]);

  const resolveUser = async () => {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    if (u.id) return u;
    const profile = await getCurrentUserProfile();
    const merged = { ...u, id: profile.id, name: profile.name, email: profile.email, role: profile.role };
    localStorage.setItem('user', JSON.stringify(merged));
    return merged;
  };

  const handleJoin = async (office) => {
    setSuccess(''); setError('');
    setJoiningId(office.id);
    try {
      const user = await resolveUser();
      if (!user.id) throw new Error('Please log in again.');
      const ticket = await joinQueue(user.id, office.id);
      localStorage.setItem('activeTicketId', String(ticket.ticketId));
      setSuccess(`🎉 Joined ${office.name}! Ticket #${ticket.ticketNumber}`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to join queue.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="cust-page" id="customer-home">
      {error && <div className="cust-alert cust-alert-error">⚠️ {error}</div>}
      {success && <div className="cust-alert cust-alert-success">✅ {success}</div>}

      {/* Search Bar */}
      <div className="cust-search-bar">
        <span className="cust-search-icon"><SearchIcon /></span>
        <input
          id="home-search"
          className="cust-search-input"
          type="text"
          placeholder="Search establishments, services, locations..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Category Filters */}
      <div className="cust-category-chips">
        {availableCategories.map(cat => (
          <button
            key={cat}
            className={`cust-chip ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat !== 'All' && getCategoryEmoji(cat)} {cat}
          </button>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="cust-quick-actions">
        <button className="cust-quick-action" onClick={() => navigate('/dashboard/map')}>
          <CompareIcon /> Compare Branches
        </button>
        <button className="cust-quick-action" onClick={() => navigate('/dashboard/queues')}>
          <TicketIcon /> My Tickets
        </button>
      </div>

      {/* Establishment List */}
      <div className="cust-section-label">
        {loading ? 'Loading...' : `${filtered.length} Available Establishments`}
      </div>

      <div className="cust-estab-list">
        {!loading && filtered.length === 0 && (
          <div className="cust-empty-state">
            <div className="cust-empty-icon">🔍</div>
            <h3>No establishments found</h3>
            <p>Try a different search or category</p>
          </div>
        )}

        {filtered.map(office => (
          <div key={office.id} className="cust-estab-card" onClick={() => navigate('/dashboard/map')}>
            <div className="cust-estab-bar green" />
            <div className="cust-estab-body">
              <div className="cust-estab-header">
                <span className="cust-estab-name">
                  {getCategoryEmoji(office.category)} {office.name}
                </span>
                <span className="cust-estab-type-tag">{office.type}</span>
              </div>
              <div className="cust-estab-address">
                {office.address || 'No address provided'}
              </div>
              <div className="cust-estab-meta">
                {office.category && (
                  <span className="cust-estab-meta-item muted">
                    {getCategoryEmoji(office.category)} {office.category}
                  </span>
                )}
                {office.phoneNumber && (
                  <span className="cust-estab-meta-item muted">
                    <PhoneIcon /> {office.phoneNumber}
                  </span>
                )}
                {office.latitude != null && office.longitude != null && (
                  <span className="cust-estab-meta-item muted">
                    <MapPinIcon /> On Map
                  </span>
                )}
              </div>
            </div>
            <div className="cust-estab-actions">
              <button
                className="cust-estab-join-btn"
                onClick={(e) => { e.stopPropagation(); handleJoin(office); }}
                disabled={joiningId === office.id}
              >
                <TicketIcon />
                {joiningId === office.id ? 'Joining...' : 'Join Queue'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}