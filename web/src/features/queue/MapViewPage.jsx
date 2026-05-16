import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserProfile } from '../auth/authService';
import { getOffices, joinQueue } from './queueService';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapViewPage.css';

/* ── Category helpers ── */
const CATEGORY_EMOJI = {
  'Restaurant': '🍽️',
  'Salon & Spa': '💇',
  'Repair Shop': '🔧',
  'Medical Clinic': '🏥',
  'Dental Clinic': '🦷',
  'Bank & Finance': '🏦',
  'Government Office': '🏛️',
  'Pharmacy': '💊',
  'Grocery & Retail': '🏪',
  'Education': '📚',
  'Legal Services': '⚖️',
  'Real Estate': '🏠',
  'Automotive': '🚗',
  'Fitness & Gym': '💪',
  'Other': '📋',
};

const getCategoryEmoji = (category) => CATEGORY_EMOJI[category] || '📍';
const ALL_CATEGORIES = ['All', ...Object.keys(CATEGORY_EMOJI)];

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
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 013-3h14a3 3 0 013 3v0a3 3 0 01-3 3h0a3 3 0 000 6h0a3 3 0 013-3v0a3 3 0 01-3 3H5a3 3 0 01-3-3v0a3 3 0 013-3h0a3 3 0 000-6H5a3 3 0 01-3 3z" />
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

  // Leaflet refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

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

  // ── Filtered offices ──
  const filtered = useMemo(() => {
    let result = offices;

    if (activeCategory !== 'All') {
      result = result.filter((office) => office.category === activeCategory);
    }

    if (query.trim()) {
      const normalized = query.toLowerCase();
      result = result.filter((office) =>
        `${office.name} ${office.type} ${office.address || ''} ${office.category || ''}`
          .toLowerCase()
          .includes(normalized)
      );
    }

    return result;
  }, [offices, query, activeCategory]);

  // ── Unique categories present in the data ──
  const availableCategories = useMemo(() => {
    const cats = new Set(offices.map((o) => o.category).filter(Boolean));
    return ['All', ...Array.from(cats).sort()];
  }, [offices]);

  // ── Initialize Leaflet map ──
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Fix default Leaflet icon paths
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView([10.3157, 123.8854], 13); // Cebu City default

    // Zoom control in top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Stylish tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Try to center on user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.setView([pos.coords.latitude, pos.coords.longitude], 14);
        },
        () => { /* ignore */ },
        { timeout: 5000 }
      );
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // ── Update markers when filtered list changes ──
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;

    markersLayerRef.current.clearLayers();

    const bounds = [];

    filtered.forEach((office) => {
      const lat = office.latitude;
      const lng = office.longitude;
      if (lat == null || lng == null) return;

      bounds.push([lat, lng]);

      const emoji = getCategoryEmoji(office.category);

      // Custom colored icon
      const customIcon = L.divIcon({
        html: `<div style="
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          width: 34px;
          height: 34px;
          border-radius: 50% 50% 50% 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
          border: 2px solid white;
          transform: rotate(-45deg);
          transition: transform 0.2s;
        "><span style="transform: rotate(45deg); display: block;">${emoji}</span></div>`,
        className: '',
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Popup content
      const popupContent = document.createElement('div');
      popupContent.className = 'mapview-popup';
      popupContent.innerHTML = `
        <div class="mapview-popup-name">${office.name}</div>
        <div class="mapview-popup-category">${emoji} ${office.category || office.type}</div>
        <div class="mapview-popup-address">${office.address || 'No address provided'}</div>
      `;

      const btn = document.createElement('button');
      btn.className = 'mapview-popup-btn';
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9a3 3 0 013-3h14a3 3 0 013 3v0a3 3 0 01-3 3h0a3 3 0 000 6h0a3 3 0 013-3v0a3 3 0 01-3 3H5a3 3 0 01-3-3v0a3 3 0 013-3h0a3 3 0 000-6H5a3 3 0 01-3 3z"/></svg> Join Queue`;
      btn.addEventListener('click', () => {
        requestJoinFromOffice(office);
      });

      popupContent.appendChild(btn);

      marker.bindPopup(popupContent, {
        maxWidth: 260,
        closeButton: true,
      });

      marker.on('click', () => {
        setSelectedOfficeId(office.id);
      });

      marker.addTo(markersLayerRef.current);
    });

    // Fit bounds to show all markers
    if (bounds.length > 1) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else if (bounds.length === 1) {
      mapInstanceRef.current.setView(bounds[0], 15);
    }
  }, [filtered]);

  // ── Fly to selected office ──
  const flyToOffice = useCallback((office) => {
    if (!mapInstanceRef.current || !office.latitude || !office.longitude) return;
    mapInstanceRef.current.flyTo([office.latitude, office.longitude], 16, { duration: 0.8 });
    setSelectedOfficeId(office.id);

    // Open popup for this marker
    if (markersLayerRef.current) {
      markersLayerRef.current.eachLayer((layer) => {
        if (layer.getLatLng) {
          const ll = layer.getLatLng();
          if (Math.abs(ll.lat - office.latitude) < 0.0001 && Math.abs(ll.lng - office.longitude) < 0.0001) {
            layer.openPopup();
          }
        }
      });
    }
  }, []);

  // ── Queue joining ──
  const resolveUserProfile = async () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (currentUser.id) return currentUser;

    const profile = await getCurrentUserProfile();
    const mergedUser = {
      ...currentUser,
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
    };
    localStorage.setItem('user', JSON.stringify(mergedUser));
    return mergedUser;
  };

  const requestJoinFromOffice = (office) => {
    setSelectedOfficeId(office.id);
    setOfficeToConfirm(office);
  };

  const closeJoinConfirm = () => {
    if (joiningOfficeId) return;
    setOfficeToConfirm(null);
  };

  const confirmJoinFromOffice = async () => {
    if (!officeToConfirm) return;

    const office = officeToConfirm;
    setQueueMessage('');
    setQueueError('');
    setJoiningOfficeId(office.id);

    try {
      const user = await resolveUserProfile();
      if (!user.id) {
        throw new Error('Unable to identify your account. Please log in again.');
      }

      const ticket = await joinQueue(user.id, office.id);
      localStorage.setItem('activeTicketId', String(ticket.ticketId));
      setQueueMessage(`🎉 Joined ${office.name}! Ticket #${ticket.ticketNumber} created.`);
      setOfficeToConfirm(null);

      // Auto-clear success message
      setTimeout(() => setQueueMessage(''), 5000);
    } catch (err) {
      setQueueError(err.message || 'Unable to join this queue.');
      setTimeout(() => setQueueError(''), 5000);
    } finally {
      setJoiningOfficeId(null);
    }
  };

  const officesWithCoords = filtered.filter((o) => o.latitude != null && o.longitude != null).length;

  return (
    <div className="mapview-root" id="mapview-root">
      {/* ── Map Panel ── */}
      <div className="mapview-map-panel">
        <div className="mapview-map-header">
          <div className="mapview-map-header-left">
            <div className="mapview-map-icon">
              <MapPinIcon />
            </div>
            <div>
              <h3>Discover Businesses</h3>
              <p>{officesWithCoords} locations on map</p>
            </div>
          </div>

          <div className="mapview-search-wrapper">
            <span className="mapview-search-icon">
              <SearchIcon />
            </span>
            <input
              id="mapview-search"
              className="mapview-search-input"
              type="text"
              placeholder="Search businesses, categories..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Category filter chips */}
        <div className="mapview-filters">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              className={`mapview-filter-chip ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat !== 'All' && getCategoryEmoji(cat)} {cat}
            </button>
          ))}
        </div>

        {/* Leaflet map */}
        <div ref={mapContainerRef} className="mapview-map-container" id="mapview-map" />

        {loading && (
          <div className="mapview-map-loading">
            <div className="mapview-map-loading-spinner" />
            <p>Loading businesses...</p>
          </div>
        )}

        {/* Floating alerts */}
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
        {/* Quick stats */}
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

        {/* Office list */}
        <div className="mapview-list-panel">
          <div className="mapview-list-head">
            <h3>Nearby Businesses</h3>
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

            {filtered.map((office) => (
              <div
                key={office.id}
                className={`mapview-office-card ${selectedOfficeId === office.id ? 'active' : ''}`}
                onClick={() => flyToOffice(office)}
                id={`office-card-${office.id}`}
              >
                <div className="mapview-office-top">
                  <span className="mapview-office-name">
                    {getCategoryEmoji(office.category)} {office.name}
                  </span>
                  <span className="mapview-office-tag">{office.type}</span>
                </div>
                <div className="mapview-office-address">
                  {office.address || 'No address provided'}
                </div>
                <div className="mapview-office-meta">
                  {office.category && (
                    <span className="mapview-office-meta-item">
                      <ClockIcon /> {office.category}
                    </span>
                  )}
                  {office.phoneNumber && (
                    <span className="mapview-office-meta-item">
                      <PhoneIcon /> {office.phoneNumber}
                    </span>
                  )}
                </div>
                <button
                  className="mapview-office-join-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    requestJoinFromOffice(office);
                  }}
                  disabled={joiningOfficeId === office.id}
                >
                  <TicketIcon />
                  {joiningOfficeId === office.id ? 'Joining...' : 'Join Queue'}
                </button>
              </div>
            ))}
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
                <div className="mapview-modal-office-cat">
                  {officeToConfirm.category || officeToConfirm.type}
                </div>
                <div className="mapview-modal-office-address">
                  📍 {officeToConfirm.address || 'No business location provided'}
                </div>
              </div>
            </div>

            <div className="mapview-modal-actions">
              <button
                className="mapview-modal-btn mapview-modal-btn-cancel"
                onClick={closeJoinConfirm}
                disabled={!!joiningOfficeId}
              >
                Cancel
              </button>
              <button
                className="mapview-modal-btn mapview-modal-btn-confirm"
                onClick={confirmJoinFromOffice}
                disabled={!!joiningOfficeId}
              >
                {joiningOfficeId === officeToConfirm.id ? (
                  <><span className="mapview-spinner" /> Joining...</>
                ) : (
                  <>🎫 Confirm Join</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}