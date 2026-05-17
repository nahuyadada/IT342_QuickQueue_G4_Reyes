import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserProfile } from '../auth/authService';
import { getOffices, joinQueue } from './queueService';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapViewPage.css';
import './CustomerPortal.css';

/* ── Category helpers ── */
const CATEGORY_EMOJI = {
  'Government Office': '🏛️', 'Bank & Finance': '🏦', 'Medical Clinic': '🏥',
  'Dental Clinic': '🦷', 'Hospital': '🏥', 'Pharmacy': '💊',
  'Utility Office': '💡', 'Telecommunications': '📱',
  'Admissions Office': '🏫', 'Transport Terminal': '🚌', 'Other': '📋',
};
const getCategoryEmoji = (category) => CATEGORY_EMOJI[category] || '📍';



const ADVANCE_BOOKING_CATEGORIES = ['Government Office', 'Medical Clinic', 'Dental Clinic'];

/* ── SVG icons ── */
function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

export default function MapViewPage() {
  const navigate = useNavigate();
  const [offices, setOffices] = useState([]);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOfficeId, setSelectedOfficeId] = useState(null);
  const [joiningOfficeId, setJoiningOfficeId] = useState(null);
  const [officeToConfirm, setOfficeToConfirm] = useState(null);
  const [queueMessage, setQueueMessage] = useState('');
  const [queueError, setQueueError] = useState('');

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const loadOffices = async () => {
    setLoading(true); setError('');
    try {
      const list = await getOffices();
      setOffices(list || []);
    } catch (err) {
      setError(err.message || 'Unable to load offices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOffices(); }, []);

  const filtered = useMemo(() => {
    let result = offices;
    if (activeCategory !== 'All') result = result.filter(o => o.category === activeCategory);
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(o =>
        `${o.name} ${o.type} ${o.address || ''} ${o.category || ''}`.toLowerCase().includes(q)
      );
    }
    return result;
  }, [offices, query, activeCategory]);

  const availableCategories = useMemo(() => {
    const cats = new Set(offices.map(o => o.category).filter(Boolean));
    return ['All', ...Array.from(cats).sort()];
  }, [offices]);

  // ── Initialize Leaflet map ──
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([14.5995, 120.9842], 12); // Manila default
    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], 13),
        () => {},
        { timeout: 5000 }
      );
    }

    return () => { map.remove(); mapInstanceRef.current = null; markersLayerRef.current = null; };
  }, []);

  // ── Update markers ──
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;
    markersLayerRef.current.clearLayers();
    const bounds = [];

    filtered.forEach((office) => {
      const lat = office.latitude, lng = office.longitude;
      if (lat == null || lng == null) return;
      bounds.push([lat, lng]);

      const emoji = getCategoryEmoji(office.category);

      // Branded blue marker
      const customIcon = L.divIcon({
        html: `<div style="
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          width: 32px; height: 32px;
          border-radius: 50% 50% 50% 4px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
          box-shadow: 0 3px 10px rgba(37,99,235,0.35);
          border: 2px solid white;
          transform: rotate(-45deg);
        "><span style="transform: rotate(45deg); display: block;">${emoji}</span></div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -34],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Tooltip on hover — real data only
      marker.bindTooltip(
        `<strong>${office.name}</strong><br/>
         <span style="color:#64748b;">${office.category || office.type}</span>`,
        { direction: 'top', offset: [0, -36], className: 'mapview-tooltip' }
      );

      // Popup on click — real data only
      const popupContent = document.createElement('div');
      popupContent.className = 'mapview-popup';
      popupContent.innerHTML = `
        <div class="mapview-popup-name">${office.name}</div>
        <div class="mapview-popup-category">${emoji} ${office.category || office.type}</div>
        <div class="mapview-popup-address">${office.address || 'No address provided'}</div>
      `;
      const btn = document.createElement('button');
      btn.className = 'mapview-popup-btn';
      btn.textContent = '🎫 Join Queue';
      btn.addEventListener('click', () => requestJoinFromOffice(office));
      popupContent.appendChild(btn);

      marker.bindPopup(popupContent, { maxWidth: 280, closeButton: true });
      marker.on('click', () => setSelectedOfficeId(office.id));
      marker.addTo(markersLayerRef.current);
    });

    if (bounds.length > 1) mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    else if (bounds.length === 1) mapInstanceRef.current.setView(bounds[0], 15);
  }, [filtered]);

  const flyToOffice = useCallback((office) => {
    if (!mapInstanceRef.current || !office.latitude || !office.longitude) return;
    mapInstanceRef.current.flyTo([office.latitude, office.longitude], 16, { duration: 0.8 });
    setSelectedOfficeId(office.id);
    if (markersLayerRef.current) {
      markersLayerRef.current.eachLayer((layer) => {
        if (layer.getLatLng) {
          const ll = layer.getLatLng();
          if (Math.abs(ll.lat - office.latitude) < 0.0001 && Math.abs(ll.lng - office.longitude) < 0.0001) layer.openPopup();
        }
      });
    }
  }, []);

  // ── Queue joining ──
  const resolveUserProfile = async () => {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    if (u.id) return u;
    const profile = await getCurrentUserProfile();
    const merged = { ...u, id: profile.id, name: profile.name, email: profile.email, role: profile.role };
    localStorage.setItem('user', JSON.stringify(merged));
    return merged;
  };

  const requestJoinFromOffice = (office) => { setSelectedOfficeId(office.id); setOfficeToConfirm(office); };
  const closeJoinConfirm = () => { if (!joiningOfficeId) setOfficeToConfirm(null); };

  const confirmJoinFromOffice = async () => {
    if (!officeToConfirm) return;
    const office = officeToConfirm;
    setQueueMessage(''); setQueueError(''); setJoiningOfficeId(office.id);
    try {
      const user = await resolveUserProfile();
      if (!user.id) throw new Error('Please log in again.');
      const ticket = await joinQueue(user.id, office.id);
      localStorage.setItem('activeTicketId', String(ticket.ticketId));
      setQueueMessage(`🎉 Joined ${office.name}! Ticket #${ticket.ticketNumber}`);
      setOfficeToConfirm(null);
      setTimeout(() => setQueueMessage(''), 5000);
    } catch (err) {
      setQueueError(err.message || 'Unable to join.');
      setTimeout(() => setQueueError(''), 5000);
    } finally { setJoiningOfficeId(null); }
  };

  const officesWithCoords = filtered.filter(o => o.latitude != null && o.longitude != null).length;

  return (
    <div className="mapview-root" id="mapview-root">
      {/* ── Map Panel ── */}
      <div className="mapview-map-panel">
        <div className="mapview-map-header">
          <div className="mapview-map-header-left">
            <div className="mapview-map-icon"><MapPinIcon /></div>
            <div>
              <h3>Discover Businesses</h3>
              <p>{officesWithCoords} locations on map</p>
            </div>
          </div>
          <div className="mapview-search-wrapper">
            <span className="mapview-search-icon"><SearchIcon /></span>
            <input id="mapview-search" className="mapview-search-input" type="text"
              placeholder="Search businesses, categories..."
              value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>

        {/* Category filter chips */}
        <div className="mapview-filters">
          {availableCategories.map(cat => (
            <button key={cat} className={`mapview-filter-chip ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}>
              {cat !== 'All' && getCategoryEmoji(cat)} {cat}
            </button>
          ))}
        </div>

        <div ref={mapContainerRef} className="mapview-map-container" id="mapview-map" />



        {loading && (
          <div className="mapview-map-loading">
            <div className="mapview-map-loading-spinner" />
            <p>Loading businesses...</p>
          </div>
        )}

        {(queueMessage || queueError || error) && (
          <div className="mapview-alerts">
            {queueMessage && <div className="mapview-alert mapview-alert-success">✅ {queueMessage}</div>}
            {queueError && <div className="mapview-alert mapview-alert-error">⚠️ {queueError}</div>}
            {error && <div className="mapview-alert mapview-alert-error">⚠️ {error}</div>}
          </div>
        )}
      </div>

      {/* ── Sidebar ── */}
      <div className="mapview-sidebar">
        <div className="mapview-stats">
          <div className="mapview-stat-card">
            <div className="mapview-stat-icon blue">🏢</div>
            <strong>{offices.length}</strong>
            <span>Total Businesses</span>
          </div>
          <div className="mapview-stat-card">
            <div className="mapview-stat-icon purple">📍</div>
            <strong>{officesWithCoords}</strong>
            <span>On Map</span>
          </div>
        </div>

        <div className="mapview-list-panel">
          <div className="mapview-list-head">
            <h3>All Locations</h3>
            <span className="mapview-list-head-count">{filtered.length}</span>
          </div>

          <div className="mapview-list-body">
            {filtered.length === 0 && (
              <div className="mapview-empty">
                <div className="mapview-empty-icon">🔍</div>
                <p>No businesses found</p>
                <small>Try a different search or category</small>
              </div>
            )}

            {filtered.map(office => {
              const hasAdvanceBooking = ADVANCE_BOOKING_CATEGORIES.includes(office.category);
              return (
                <div key={office.id}
                  className={`mapview-office-card ${selectedOfficeId === office.id ? 'active' : ''}`}
                  onClick={() => flyToOffice(office)} id={`office-card-${office.id}`}>
                  <div className="mapview-office-top">
                    <span className="mapview-office-name">
                      {getCategoryEmoji(office.category)} {office.name}
                    </span>
                    <span className="mapview-office-tag">{office.type}</span>
                  </div>
                  <div className="mapview-office-address">{office.address || 'No address'}</div>
                  <div className="mapview-office-meta">
                    <span className="cust-estab-meta-item muted">
                      {getCategoryEmoji(office.category)} {office.category || office.type}
                    </span>
                    {hasAdvanceBooking && (
                      <span className="cust-advance-badge">📅 Advance Booking</span>
                    )}
                  </div>
                  <button className="mapview-office-join-btn"
                    onClick={(e) => { e.stopPropagation(); requestJoinFromOffice(office); }}
                    disabled={joiningOfficeId === office.id}>
                    🎫 {joiningOfficeId === office.id ? 'Joining...' : 'Join Queue'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Confirmation Modal ── */}
      {officeToConfirm && (
        <div className="mapview-modal-backdrop" role="dialog" aria-modal="true" onClick={closeJoinConfirm}>
          <div className="mapview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mapview-modal-header">
              <div className="mapview-modal-icon">🎫</div>
              <h3>Join Queue</h3>
            </div>
            <div className="mapview-modal-body">
              <p style={{ fontSize: '0.88rem', color: '#475569', textAlign: 'center', marginBottom: '0.75rem' }}>
                You're about to join the queue at this business:
              </p>
              <div className="mapview-modal-office-preview">
                <div className="mapview-modal-office-name">
                  {getCategoryEmoji(officeToConfirm.category)} {officeToConfirm.name}
                </div>
                <div className="mapview-modal-office-cat">{officeToConfirm.category || officeToConfirm.type}</div>
                <div className="mapview-modal-office-address">
                  📍 {officeToConfirm.address || 'No business location provided'}
                </div>
              </div>
            </div>
            <div className="mapview-modal-actions">
              <button className="mapview-modal-btn mapview-modal-btn-cancel" onClick={closeJoinConfirm} disabled={!!joiningOfficeId}>Cancel</button>
              <button className="mapview-modal-btn mapview-modal-btn-confirm" onClick={confirmJoinFromOffice} disabled={!!joiningOfficeId}>
                {joiningOfficeId === officeToConfirm.id ? (<><span className="mapview-spinner" /> Joining...</>) : (<>🎫 Confirm Join</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}