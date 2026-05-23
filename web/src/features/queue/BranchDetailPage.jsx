import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { getCurrentUserProfile } from '../auth/authService';
import { getOffices, getQueueCounts, joinQueue } from './queueService';
import './CustomerPortal.css';
import './BranchDetail.css';

/* ── Constants ── */
const DAY_NAMES  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const TIME_SLOTS = ['8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM'];

const PRIORITY_OPTIONS = [
  { value: 'regular',  label: 'Regular Queue',                  icon: '👤' },
  { value: 'pwd',      label: 'PWD (Person with Disability)',    icon: '♿' },
  { value: 'senior',   label: 'Senior Citizen (60 and above)',   icon: '👴' },
  { value: 'pregnant', label: 'Pregnant',                        icon: '🤱' },
];

const ID_TYPES = {
  pwd:      ['PWD ID', 'PWD Booklet', 'Medical Certificate'],
  senior:   ['Senior Citizen ID', 'OSCA ID', 'Gov't-issued ID with birthdate'],
  pregnant: ['Pregnancy Record / Prenatal Booklet', 'Medical Certificate'],
};

const OPERATING_HOURS = [
  { day: 'Monday – Friday', hours: '9:00 AM – 5:00 PM', closed: false },
  { day: 'Saturday',        hours: '9:00 AM – 12:00 PM', closed: false },
  { day: 'Sunday',          hours: 'Closed',              closed: true  },
];

function getServiceTypes(type = '') {
  const t = type.toUpperCase();
  if (t.includes('BANK') || t.includes('FINANCE'))  return ['Teller','New Account Opening','Loan Inquiry','Card Services','Cash Deposit / Withdrawal'];
  if (t.includes('HOSPITAL'))                        return ['General Consultation','Emergency','OPD – Cardiology','OPD – Pediatrics','Laboratory','Pharmacy'];
  if (t.includes('DENTAL'))                          return ['Consultation','Cleaning','Extraction','Orthodontics'];
  if (t.includes('CLINIC') || t.includes('MEDICAL')) return ['General Consultation','Laboratory','Pharmacy'];
  if (t.includes('GOV'))                             return ['Birth Certificate','ID Application / Renewal','License Renewal','Business Permit','Civil Registry'];
  if (t.includes('UTIL'))                            return ['Bill Payment','New Connection','Reconnection','Transfer of Account'];
  if (t.includes('TELECOM'))                         return ['Billing Concern','Plan Upgrade','SIM Replacement','Device Inquiry'];
  return ['Customer Service','Information Desk','General Inquiry'];
}

function getCategoryEmoji(cat = '') {
  const c = cat.toLowerCase();
  if (c.includes('bank') || c.includes('finance')) return '🏦';
  if (c.includes('hospital'))                      return '🏥';
  if (c.includes('dental'))                        return '🦷';
  if (c.includes('clinic') || c.includes('medical')) return '🏥';
  if (c.includes('gov'))                           return '🏛️';
  if (c.includes('pharma'))                        return '💊';
  if (c.includes('util'))                          return '💡';
  if (c.includes('telecom'))                       return '📱';
  return '🏢';
}

/* ── Circular Progress Ring (SVG) ── */
function ProgressRing({ count, max = 20 }) {
  const size = 130, sw = 11;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(count / max, 1);
  const offset = circ * (1 - pct);
  const color  = count >= 15 ? '#ef4444' : count >= 6 ? '#eab308' : '#22c55e';
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={sw} />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease' }}
      />
      <text x="50%" y="44%" textAnchor="middle" fontSize="26" fontWeight="800" fill="#0f172a">{count}</text>
      <text x="50%" y="61%" textAnchor="middle" fontSize="11" fontWeight="500" fill="#64748b">waiting</text>
    </svg>
  );
}

/* ── SVG Icons ── */
const BackIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>;
const MapPinIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const PhoneIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 015.19 15.7a19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 5h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 12.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>;
const BellIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>;
const ClockIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;

export default function BranchDetailPage() {
  const navigate = useNavigate();
  const { officeId } = useParams();
  const { state }    = useLocation();

  const [office,     setOffice]     = useState(state?.office || null);
  const [queueCount, setQueueCount] = useState(state?.queueCount ?? 0);
  const [loading,    setLoading]    = useState(!state?.office);

  /* form state */
  const [bookingType, setBookingType] = useState('now');
  const [priority,    setPriority]    = useState('regular');
  const [idType,      setIdType]      = useState('');
  const [idNumber,    setIdNumber]    = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [serviceType,  setServiceType]  = useState('');
  const [notifOn,      setNotifOn]      = useState(false);

  /* join state */
  const [joining,     setJoining]     = useState(false);
  const [joinSuccess, setJoinSuccess] = useState('');
  const [joinError,   setJoinError]   = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!office) {
          const list  = await getOffices();
          const found = list.find(o => String(o.id) === String(officeId));
          if (!cancelled) setOffice(found || null);
        }
        const counts = await getQueueCounts();
        if (!cancelled) setQueueCount(counts[String(officeId)] ?? 0);
      } catch (_) {}
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [officeId]);

  /* reset ID fields when priority changes */
  useEffect(() => { setIdType(''); setIdNumber(''); }, [priority]);
  /* reset date/time when switching to join now */
  useEffect(() => { if (bookingType === 'now') { setSelectedDate(''); setSelectedTime(''); } }, [bookingType]);

  const category      = office?.category || office?.type || '';
  const showBookingTabs = /hospital|gov/i.test(category);
  const serviceTypes  = useMemo(() => getServiceTypes(office?.type || ''), [office]);
  const currentIdTypes = ID_TYPES[priority] || [];

  const dates = useMemo(() => {
    const today = new Date(), arr = [];
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);

  const statusInfo = useMemo(() => {
    if (queueCount >= 15) return { label: 'Long Wait',  cls: 'long',     dot: '🔴' };
    if (queueCount >= 6)  return { label: 'Moderate',   cls: 'moderate', dot: '🟡' };
    return                       { label: 'Low Wait',   cls: 'low',      dot: '🟢' };
  }, [queueCount]);

  const starCount = queueCount >= 15 ? 2 : queueCount >= 6 ? 3 : 5;
  const starStr   = '★'.repeat(starCount) + '☆'.repeat(5 - starCount);

  const canJoin = useMemo(() => {
    if (!serviceType) return false;
    if (priority !== 'regular' && (!idType || !idNumber.trim())) return false;
    if (bookingType === 'advance' && (!selectedDate || !selectedTime)) return false;
    return true;
  }, [serviceType, priority, idType, idNumber, bookingType, selectedDate, selectedTime]);

  const joinLabel = joining ? 'Processing…'
    : priority !== 'regular' ? '✅ Confirm Priority Queue'
    : bookingType === 'advance' ? '📅 Confirm Booking'
    : '🎟️ Join Virtual Queue';

  const handleJoin = async () => {
    setJoining(true); setJoinError(''); setJoinSuccess('');
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      let userId = u.id;
      if (!userId) {
        const p = await getCurrentUserProfile();
        userId = p.id;
        localStorage.setItem('user', JSON.stringify({ ...u, ...p }));
      }
      const ticket = await joinQueue(userId, office.id);
      localStorage.setItem('activeTicketId', String(ticket.ticketId));
      setJoinSuccess(`🎉 Ticket #${ticket.ticketNumber} confirmed! Redirecting…`);
      setTimeout(() => navigate('/dashboard/queues'), 2000);
    } catch (e) {
      setJoinError(e.message || 'Failed to join queue.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) return (
    <div className="cust-page">
      <div className="cust-empty-state" style={{ minHeight: 200 }}>
        <p>Loading branch details…</p>
      </div>
    </div>
  );

  if (!office) return (
    <div className="cust-page">
      <button className="bd-back-btn" onClick={() => navigate(-1)}><BackIcon /> Back</button>
      <div className="cust-empty-state"><h3>Branch not found</h3></div>
    </div>
  );

  return (
    <div className="cust-page">
      {/* Back */}
      <button className="bd-back-btn" onClick={() => navigate(-1)}>
        <BackIcon /> Back to Establishments
      </button>

      {/* ── Header Card ── */}
      <div className="bd-header-card">
        <div className="bd-header-top">
          <div className="bd-icon">{getCategoryEmoji(category)}</div>
          <div className="bd-header-info">
            <span className="bd-type-badge">{office.type || office.category}</span>
            <div className="bd-name">{office.name}</div>
            <div className="bd-stars">{starStr}</div>
            <span className={`bd-status-badge ${statusInfo.cls}`}>
              {statusInfo.dot} {statusInfo.label}
            </span>
          </div>
        </div>

        <div className="bd-stats-row">
          <div className="bd-stat-box">
            <span className="bd-stat-value">{queueCount}</span>
            <span className="bd-stat-label">People Waiting</span>
          </div>
          <div className="bd-stat-box">
            <span className="bd-stat-value">{queueCount * 5}</span>
            <span className="bd-stat-label">Est. Wait (min)</span>
          </div>
        </div>

        <div className="bd-contact-row">
          {office.address && (
            <div className="bd-contact-item"><MapPinIcon />{office.address}</div>
          )}
          {office.phoneNumber && (
            <div className="bd-contact-item"><PhoneIcon />{office.phoneNumber}</div>
          )}
        </div>
      </div>

      {/* ── Booking Type (Hospital / Gov't only) ── */}
      {showBookingTabs && (
        <div className="bd-section">
          <div className="bd-section-title">Booking Type</div>
          <div className="bd-tab-switcher">
            <button className={`bd-tab ${bookingType === 'now' ? 'active' : ''}`} onClick={() => setBookingType('now')}>
              ⚡ Join Now
            </button>
            <button className={`bd-tab ${bookingType === 'advance' ? 'active' : ''}`} onClick={() => setBookingType('advance')}>
              📅 Advance Booking
            </button>
          </div>

          {bookingType === 'advance' && (
            <>
              <div className="bd-section-sub">Select Date</div>
              <div className="bd-date-scroll">
                {dates.map(d => {
                  const key = d.toDateString();
                  return (
                    <div
                      key={key}
                      className={`bd-date-chip ${selectedDate === key ? 'active' : ''}`}
                      onClick={() => setSelectedDate(selectedDate === key ? '' : key)}
                    >
                      <span className="bd-day-name">{DAY_NAMES[d.getDay()]}</span>
                      <span className="bd-day-num">{d.getDate()}</span>
                      <span className="bd-month">{MONTH_NAMES[d.getMonth()]}</span>
                    </div>
                  );
                })}
              </div>

              <div className="bd-section-sub">Select Time Slot</div>
              <div className="bd-time-grid">
                {TIME_SLOTS.map(t => (
                  <div
                    key={t}
                    className={`bd-time-chip ${selectedTime === t ? 'active' : ''}`}
                    onClick={() => setSelectedTime(selectedTime === t ? '' : t)}
                  >
                    {t}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Priority Queue ── */}
      <div className="bd-section">
        <div className="bd-section-title">Priority Queue</div>
        {PRIORITY_OPTIONS.map(opt => (
          <label
            key={opt.value}
            className={`bd-priority-option ${priority === opt.value ? 'active' : ''}`}
          >
            <input
              type="radio"
              name="priority"
              value={opt.value}
              checked={priority === opt.value}
              onChange={() => setPriority(opt.value)}
            />
            <span className="bd-priority-icon">{opt.icon}</span>
            <span className="bd-priority-label">{opt.label}</span>
          </label>
        ))}

        {priority !== 'regular' && (
          <div className="bd-id-form">
            <label>ID Type</label>
            <select value={idType} onChange={e => setIdType(e.target.value)}>
              <option value="">Select ID type…</option>
              {currentIdTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <label>ID Number / Reference Number</label>
            <input
              type="text"
              placeholder="Enter ID number or reference"
              value={idNumber}
              onChange={e => setIdNumber(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* ── Service Type ── */}
      <div className="bd-section">
        <div className="bd-section-title">Service Type</div>
        <select
          className="bd-service-select"
          value={serviceType}
          onChange={e => setServiceType(e.target.value)}
        >
          <option value="">Select a service…</option>
          {serviceTypes.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* ── Live Queue & Notifications ── */}
      <div className="bd-section">
        <div className="bd-section-title">Live Queue</div>
        <div className="bd-progress-section">
          <ProgressRing count={queueCount} />
          <div className="bd-ring-label"><ClockIcon /> Live waiting count</div>
          <div className="bd-notif-toggle">
            <span className="bd-notif-label"><BellIcon /> Enable Notifications</span>
            <input
              type="checkbox"
              checked={notifOn}
              onChange={e => setNotifOn(e.target.checked)}
            />
          </div>
        </div>
      </div>

      {/* ── Alerts ── */}
      {joinSuccess && <div className="cust-alert cust-alert-success">{joinSuccess}</div>}
      {joinError   && <div className="cust-alert cust-alert-error">⚠️ {joinError}</div>}

      {/* ── Join Button ── */}
      <button className="bd-join-btn" onClick={handleJoin} disabled={!canJoin || joining}>
        {joinLabel}
      </button>

      {/* ── Operating Hours ── */}
      <div className="bd-section">
        <div className="bd-section-title"><ClockIcon /> Operating Hours</div>
        {OPERATING_HOURS.map(({ day, hours, closed }) => (
          <div key={day} className="bd-hours-row">
            <span className="bd-hours-day">{day}</span>
            <span className={`bd-hours-time ${closed ? 'closed' : ''}`}>{hours}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
