import { useEffect, useMemo, useState } from 'react';
import { getOffices, registerOffice } from '../services/queueService';

export default function MapViewPage() {
  const [offices, setOffices] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState('');
  const [registrationError, setRegistrationError] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessType, setBusinessType] = useState('');

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

  const openRegisterForm = () => {
    setRegistrationMessage('');
    setRegistrationError('');
    setShowRegisterForm(true);
  };

  const closeRegisterForm = () => {
    if (registering) return;
    setShowRegisterForm(false);
  };

  const handleRegisterBusiness = async (e) => {
    e.preventDefault();
    setRegistrationMessage('');
    setRegistrationError('');

    if (!businessName.trim() || !businessAddress.trim() || !businessType.trim()) {
      setRegistrationError('Please complete all fields.');
      return;
    }

    setRegistering(true);
    try {
      const office = await registerOffice({
        name: businessName,
        address: businessAddress,
        type: businessType,
      });

      setRegistrationMessage(`Registered successfully: ${office.name}`);
      setBusinessName('');
      setBusinessAddress('');
      setBusinessType('');
      await loadOffices();
      setShowRegisterForm(false);
    } catch (err) {
      setRegistrationError(err.message || 'Unable to register business.');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="portal-grid portal-grid-map">
      {error && <div className="portal-alert portal-alert-error">{error}</div>}
      {registrationMessage && <div className="portal-alert portal-alert-success">{registrationMessage}</div>}

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
        <div className="portal-panel-head">
          <h3>Registered Offices</h3>
          <button type="button" className="portal-btn portal-btn-primary" onClick={openRegisterForm}>
            Register
          </button>
        </div>
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

      {showRegisterForm && (
        <div className="portal-modal-backdrop" role="dialog" aria-modal="true">
          <div className="portal-modal">
            <h3>Register Business</h3>
            <p className="portal-muted">Fill out the form to register your office.</p>

            {registrationError && <div className="portal-alert portal-alert-error">{registrationError}</div>}

            <form className="portal-controls" onSubmit={handleRegisterBusiness}>
              <input
                className="portal-input"
                type="text"
                placeholder="Business / Office Name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
              <input
                className="portal-input"
                type="text"
                placeholder="Business Address"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
              />
              <input
                className="portal-input"
                type="text"
                placeholder="Business Type (e.g. CLINIC, BANK, SALON)"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
              />

              <div className="portal-btn-row">
                <button type="button" className="portal-btn" onClick={closeRegisterForm} disabled={registering}>
                  Cancel
                </button>
                <button type="submit" className="portal-btn portal-btn-primary" disabled={registering}>
                  {registering ? 'Registering...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}