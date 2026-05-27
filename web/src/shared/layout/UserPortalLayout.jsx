import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useMemo, useState, useEffect, createContext, useContext } from 'react';
import { getMyRegistrations, getStaffOffices } from '../services/queueService';
import NearbyAlert from '../../features/customer/NearbyAlert';
import './UserPortal.css';

// Context to share approved office data with child pages
export const PartnerContext = createContext(null);
export const usePartner = () => useContext(PartnerContext);

// Context for staff portal
export const StaffContext = createContext(null);
export const useStaff = () => useContext(StaffContext);

export default function UserPortalLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const isPartner = localStorage.getItem('partnerRole') === 'partner';

  // Partner status: 'loading' | 'none' | 'pending' | 'approved'
  const [partnerStatus, setPartnerStatus] = useState(isPartner ? 'loading' : 'customer');
  const [approvedOffice, setApprovedOffice] = useState(null);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);

  // Staff portal
  const [staffOffice, setStaffOffice] = useState(null);
  const [staffChecked, setStaffChecked] = useState(false);

  useEffect(() => {
    if (!isPartner) return;

    const checkStatus = async () => {
      try {
        const regs = await getMyRegistrations();
        if (!regs || regs.length === 0) {
          setPartnerStatus('none');
          return;
        }

        const approved = regs.find(r => r.approvalStatus === 'APPROVED');
        if (approved) {
          setApprovedOffice(approved);
          setPartnerStatus('approved');
          return;
        }

        const pending = regs.filter(r => r.approvalStatus === 'PENDING');
        if (pending.length > 0) {
          setPendingRegistrations(pending);
          setPartnerStatus('pending');
          return;
        }

        // All rejected or no valid state
        setPartnerStatus('none');
      } catch {
        setPartnerStatus('none');
      }
    };

    checkStatus();
  }, [isPartner, location.pathname]);

  // Fallback: if user appears to be a customer, still check for registrations
  // This handles the case where partnerRole was lost (e.g. after logout + login)
  useEffect(() => {
    if (isPartner) return; // already in partner mode

    const detectPartner = async () => {
      try {
        const regs = await getMyRegistrations();
        if (regs && regs.length > 0) {
          // User has registrations — restore partner mode
          localStorage.setItem('partnerRole', 'partner');
          window.location.reload();
        }
      } catch {
        // Ignore — stay in customer mode
      }
    };

    detectPartner();
  }, []); // only run once on mount

  // Detect if this user is a staff member of any office
  useEffect(() => {
    if (isPartner) { setStaffChecked(true); return; }

    const detectStaff = async () => {
      try {
        const offices = await getStaffOffices();
        if (offices && offices.length > 0) {
          setStaffOffice(offices[0]); // use first assigned office
        }
      } catch { /* stay in customer mode */ }
      finally { setStaffChecked(true); }
    };

    detectStaff();
  }, [isPartner]);

  const displayName = useMemo(() => user.name || 'User', [user.name]);

  // Redirect enforcement
  useEffect(() => {
    if (!isPartner || partnerStatus === 'loading' || partnerStatus === 'customer') return;

    if (partnerStatus === 'none') {
      if (location.pathname !== '/dashboard/register-business') {
        navigate('/dashboard/register-business', { replace: true });
      }
    } else if (partnerStatus === 'pending') {
      const allowed = ['/dashboard/pending', '/dashboard/register-business'];
      if (!allowed.includes(location.pathname)) {
        navigate('/dashboard/pending', { replace: true });
      }
    }
    // approved partners can go anywhere in their dashboard
  }, [isPartner, partnerStatus, location.pathname, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeTicketId');
    localStorage.removeItem('partnerRole');
    navigate('/');
  };

  /* ─── Sidebar rendering based on state ─── */

  // STATE 1: Partner with no registration yet
  if (isPartner && (partnerStatus === 'none' || partnerStatus === 'loading')) {
    return (
      <div className="portal-root">
        <aside className="portal-sidebar">
          <div className="portal-brand">
            <span className="portal-brand-logo">Q</span>
            <div>
              <h2>QuickQueue</h2>
              <p>Partner Portal</p>
            </div>
          </div>

          <div className="portal-status-badge none">🔒 Registration Required</div>

          <nav className="portal-nav">
            <NavLink to="/dashboard/register-business" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
              <span className="portal-nav-icon">🏢</span>
              Register Branch
            </NavLink>
          </nav>

          <button type="button" className="portal-logout" onClick={handleLogout}>
            Logout
          </button>
        </aside>
        <main className="portal-main">
          <header className="portal-topbar">
            <div>
              <h1>Register Your Branch</h1>
              <p>Submit your business details to get started</p>
            </div>
            <div className="portal-user-chip">🏢 {displayName}</div>
          </header>
          <section className="portal-content"><Outlet /></section>
        </main>
      </div>
    );
  }

  // STATE 2: Partner with pending application
  if (isPartner && partnerStatus === 'pending') {
    return (
      <div className="portal-root">
        <aside className="portal-sidebar">
          <div className="portal-brand">
            <span className="portal-brand-logo">Q</span>
            <div>
              <h2>QuickQueue</h2>
              <p>Partner Portal</p>
            </div>
          </div>

          <div className="portal-status-badge pending">⏳ Pending Approval</div>

          <nav className="portal-nav">
            <NavLink to="/dashboard/pending" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
              <span className="portal-nav-icon">📋</span>
              Application Status
            </NavLink>
          </nav>

          <button type="button" className="portal-logout" onClick={handleLogout}>
            Logout
          </button>
        </aside>
        <main className="portal-main">
          <header className="portal-topbar">
            <div>
              <h1>Application Submitted</h1>
              <p>Waiting for admin approval</p>
            </div>
            <div className="portal-user-chip">🏢 {displayName}</div>
          </header>
          <section className="portal-content"><Outlet /></section>
        </main>
      </div>
    );
  }

  // STATE 3: Approved partner — full dashboard
  if (isPartner && partnerStatus === 'approved' && approvedOffice) {
    return (
      <PartnerContext.Provider value={approvedOffice}>
        <div className="portal-root">
          <aside className="portal-sidebar">
            <div className="portal-brand">
              <span className="portal-brand-logo">Q</span>
              <div>
                <h2>QuickQueue</h2>
                <p>Partner Portal</p>
              </div>
            </div>

            <div className="portal-status-badge approved">✅ {approvedOffice.name}</div>

            <nav className="portal-nav">
              <NavLink to="/dashboard/queue" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
                <span className="portal-nav-icon">🎫</span>
                Queue
              </NavLink>
              <NavLink to="/dashboard/customers" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
                <span className="portal-nav-icon">👥</span>
                Customers
              </NavLink>
              <NavLink to="/dashboard/analytics" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
                <span className="portal-nav-icon">📊</span>
                Analytics
              </NavLink>
              <NavLink to="/dashboard/settings" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
                <span className="portal-nav-icon">⚙️</span>
                Settings
              </NavLink>
              <NavLink to="/dashboard/profile" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
                <span className="portal-nav-icon">👤</span>
                Profile
              </NavLink>
            </nav>

            <button type="button" className="portal-logout" onClick={handleLogout}>
              Logout
            </button>
          </aside>
          <main className="portal-main">
            <header className="portal-topbar">
              <div>
                <h1>{approvedOffice.name}</h1>
                <p>{approvedOffice.category || approvedOffice.type} · {approvedOffice.address}</p>
              </div>
              <div className="portal-user-chip">🏢 {displayName}</div>
            </header>
            <section className="portal-content"><Outlet /></section>
          </main>
        </div>
      </PartnerContext.Provider>
    );
  }

  // STATE 4: Staff portal — user is assigned as staff to a business
  if (!isPartner && staffChecked && staffOffice) {
    return (
      <StaffContext.Provider value={staffOffice}>
        <div className="portal-root">
          <aside className="portal-sidebar">
            <div className="portal-brand">
              <span className="portal-brand-logo">Q</span>
              <div>
                <h2>QuickQueue</h2>
                <p>Staff Portal</p>
              </div>
            </div>

            <div className="portal-status-badge approved">🛎 {staffOffice.name}</div>

            <nav className="portal-nav">
              <NavLink to="/dashboard/staff-queue" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
                <span className="portal-nav-icon">🎫</span>
                Queue Controls
              </NavLink>
              <NavLink to="/dashboard/profile" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
                <span className="portal-nav-icon">👤</span>
                Profile
              </NavLink>
            </nav>

            <button type="button" className="portal-logout" onClick={handleLogout}>
              Logout
            </button>
          </aside>
          <main className="portal-main">
            <header className="portal-topbar">
              <div>
                <h1>{staffOffice.name}</h1>
                <p>Staff access — {staffOffice.category || staffOffice.type} · {staffOffice.address}</p>
              </div>
              <div className="portal-user-chip">🛎 {displayName}</div>
            </header>
            <section className="portal-content"><Outlet /></section>
          </main>
        </div>
      </StaffContext.Provider>
    );
  }

  // STATE 5: Customer — normal view
  return (
    <div className="portal-root">
      <NearbyAlert />
      <aside className="portal-sidebar">
        <div className="portal-brand">
          <span className="portal-brand-logo">Q</span>
          <div>
            <h2>QuickQueue</h2>
            <p>Customer Portal</p>
          </div>
        </div>

        <nav className="portal-nav">
          <NavLink to="/dashboard/home" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
            <span className="portal-nav-icon">🏠</span>
            Home
          </NavLink>
          <NavLink to="/dashboard/map" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
            <span className="portal-nav-icon">📍</span>
            Map
          </NavLink>
          <NavLink to="/dashboard/queues" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
            <span className="portal-nav-icon">📋</span>
            My Queues
          </NavLink>
          <NavLink to="/dashboard/profile" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
            <span className="portal-nav-icon">👤</span>
            Profile
          </NavLink>
        </nav>

        <button type="button" className="portal-logout" onClick={handleLogout}>
          Logout
        </button>
      </aside>
      <main className="portal-main">
        <header className="portal-topbar">
          <div>
            <h1>Welcome back, {displayName}</h1>
            <p>Find, join, and manage your queues</p>
          </div>
          <div className="portal-user-chip">👤 {displayName}</div>
        </header>
        <section className="portal-content"><Outlet /></section>
      </main>
    </div>
  );
}