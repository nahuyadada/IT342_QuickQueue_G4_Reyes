import { useEffect, useMemo, useState } from 'react';
import { getOffices } from '../services/queueService';

export default function MapViewPage() {
  const [offices, setOffices] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    return offices.filter((office) => `${office.name} ${office.type}`.toLowerCase().includes(normalized));
  }, [offices, query]);

  return (
    <div className="portal-grid portal-grid-map">
      {error && <div className="portal-alert portal-alert-error">{error}</div>}

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
              className="portal-map-marker"
              style={{ left: `${10 + ((index * 17) % 75)}%`, top: `${15 + ((index * 11) % 65)}%` }}
            >
              <span>📍</span>
              <small>{office.name}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="portal-panel">
        <h3>Registered Offices</h3>
        <div className="portal-list">
          {filtered.map((office) => (
            <div key={office.id} className="portal-list-item">
              <strong>{office.name}</strong>
              <span>{office.type}</span>
            </div>
          ))}
          {filtered.length === 0 && <p className="portal-muted">No offices to display.</p>}
        </div>
      </div>
    </div>
  );
}