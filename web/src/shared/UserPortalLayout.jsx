import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';
import { getMyRegistrations } from '../features/queue/queueService';
import './UserPortal.css';

export default function UserPortalLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user] = useState(JSON.parse(localStorage.getItem('user') || '{}'));

  const isPartner = localStorage.getItem('partnerRole') === 'partner';

  // Partner approval gating
  const [partnerStatus, setPartnerStatus] = useState('loading'); // 'loading' | 'none' | 'pending' | 'approved' | 'rejected'

  useEffect(() => {
    if (!isPartner) {
      setPartnerStatus('not_partner');
      return;
    }

    // Check if partner has any approved businesses
    const checkPartnerApproval = async () => {
      try {
        const registrations = await getMyRegistrations();
        if (!registrations || registrations.length === 0) {
          setPartnerStatus('none'); // No branches registered yet
        } else {
          const hasApproved = registrations.some(r => r.approvalStatus === 'APPROVED');
          const hasPending = registrations.some(r => r.approvalStatus === 'PENDING');
          if (hasApproved) {
            setPartnerStatus('approved');
          } else if (hasPending) {
            setPartnerStatus('pending');
          } else {
            setPartnerStatus('none');
          }
        }
      } catch {
        // If API fails (e.g. first time, no registrations), treat as none
        setPartnerStatus('none');
      }
    };

    checkPartnerApproval();
  }, [isPartner, location.pathname]);

  const displayName = useMemo(() => user.name || 'User', [user.name]);

  // Determine if partner should be locked to registration-only view
  const isPartnerLocked = isPartner && (partnerStatus === 'none' || partnerStatus === 'pending' || partnerStatus === 'loading');
  const isPartnerPending = isPartner && partnerStatus === 'pending';

  // If partner is locked and tries to go anywhere else, redirect to register-business
  useEffect(() => {
    if (isPartnerLocked && partnerStatus !== 'loading') {
      const allowed = ['/dashboard/register-business', '/dashboard/my-registrations', '/dashboard/profile'];
      const isAllowed = allowed.some(p => location.pathname.startsWith(p));
      if (!isAllowed) {
        navigate('/dashboard/register-business', { replace: true });
      }
    }
  }, [isPartnerLocked, partnerStatus, location.pathname, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeTicketId');
    localStorage.removeItem('partnerRole');
    navigate('/');
  };

  // Build nav items based on role and approval status
  const renderNav = () => {
    // Partner locked view: only registration
    if (isPartnerLocked) {
      return (
        <nav className="portal-nav">
          <NavLink to="/dashboard/register-business" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
            <span className="portal-nav-icon">🏢</span>
            Register Branch
          </NavLink>
          {isPartnerPending && (
            <NavLink to="/dashboard/my-registrations" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
              <span className="portal-nav-icon">📋</span>
              My Applications
            </NavLink>
          )}
          <NavLink to="/dashboard/profile" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
            <span className="portal-nav-icon">👤</span>
            Profile
          </NavLink>
        </nav>
      );
    }

    // Partner approved view: partner-focused nav
    if (isPartner && partnerStatus === 'approved') {
      return (
        <nav className="portal-nav">
          <NavLink to="/dashboard/my-registrations" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
            <span className="portal-nav-icon">🏢</span>
            My Businesses
          </NavLink>
          <NavLink to="/dashboard/register-business" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
            <span className="portal-nav-icon">➕</span>
            Add Branch
          </NavLink>
          <NavLink to="/dashboard/home" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
            <span className="portal-nav-icon">🏠</span>
            Home
          </NavLink>
          <NavLink to="/dashboard/map" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
            <span className="portal-nav-icon">🗺️</span>
            Map View
          </NavLink>
          <NavLink to="/dashboard/profile" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
            <span className="portal-nav-icon">👤</span>
            Profile
          </NavLink>
        </nav>
      );
    }

    // Customer view: full nav
    return (
      <nav className="portal-nav">
        <NavLink to="/dashboard/home" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
          <span className="portal-nav-icon">🏠</span>
          Home
        </NavLink>
        <NavLink to="/dashboard/map" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
          <span className="portal-nav-icon">🗺️</span>
          Map View
        </NavLink>
        <NavLink to="/dashboard/queues" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
          <span className="portal-nav-icon">🎫</span>
          Active Queues
        </NavLink>
        <NavLink to="/dashboard/profile" className={({ isActive }) => `portal-nav-link ${isActive ? 'active' : ''}`}>
          <span className="portal-nav-icon">👤</span>
          Profile
        </NavLink>
      </nav>
    );
  };

  // Header message
  const getHeaderMessage = () => {
    if (isPartnerLocked && partnerStatus === 'none') {
      return { title: 'Set Up Your Branch', sub: 'Register your business to get started' };
    }
    if (isPartnerPending) {
      return { title: 'Application Pending', sub: 'Your branch is under review' };
    }
    if (isPartner && partnerStatus === 'approved') {
      return { title: 'Partner Dashboard', sub: displayName };
    }
    return { title: 'Welcome back', sub: displayName };
  };

  const header = getHeaderMessage();

  return (
    <div className="portal-root">
      <aside className="portal-sidebar">
        <div className="portal-brand">
          <span className="portal-brand-logo">Q</span>
          <div>
            <h2>QuickQueue</h2>
            <p>{isPartner ? 'Partner Portal' : 'Service Portal'}</p>
          </div>
        </div>

        {/* Partner status badge */}
        {isPartner && (
          <div className={`portal-status-badge ${partnerStatus}`}>
            {partnerStatus === 'loading' && '⏳ Checking status...'}
            {partnerStatus === 'none' && '🔒 Branch Required'}
            {partnerStatus === 'pending' && '⏳ Pending Approval'}
            {partnerStatus === 'approved' && '✅ Approved Partner'}
          </div>
        )}

        {renderNav()}

        <button type="button" className="portal-logout" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="portal-main">
        <header className="portal-topbar">
          <div>
            <h1>{header.title}</h1>
            <p>{header.sub}</p>
          </div>
          <div className="portal-user-chip">
            {isPartner ? '🏢' : '👤'} {displayName}
          </div>
        </header>

        <section className="portal-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}