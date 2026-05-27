import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  approveOfficeRegistration,
  deleteOffice,
  getAdminOffices,
  getOffices,
  getPendingOfficeRegistrations,
  rejectOfficeRegistration,
} from '../../shared/services/queueService';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [offices, setOffices] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [loadingOffices, setLoadingOffices] = useState(false);
  const [loadingPending, setLoadingPending] = useState(false);
  const [processingOfficeId, setProcessingOfficeId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingOfficeId, setDeletingOfficeId] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeTicketId');
    navigate('/');
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const normalizeOffice = (o) => ({
    ...o,
    officeId: o.officeId ?? o.id,
    id: o.id ?? o.officeId,
    isActive: o.isActive ?? o.active ?? false,
  });

  const loadOffices = async () => {
    setLoadingOffices(true);
    setError('');
    try {
      let officeList = [];
      try {
        officeList = await getAdminOffices();
      } catch {
        officeList = await getOffices();
      }
      setOffices((officeList || []).map(normalizeOffice));
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to backend. Make sure the server is running on http://localhost:8080.'
          : (err.message || 'Unable to load offices.')
      );
    } finally {
      setLoadingOffices(false);
    }
  };

  const loadPendingRegistrations = async () => {
    setLoadingPending(true);
    setError('');
    try {
      const pending = await getPendingOfficeRegistrations();
      setPendingRegistrations(pending || []);
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to backend. Make sure the server is running on http://localhost:8080.'
          : (err.message || 'Unable to load pending registrations.')
      );
    } finally {
      setLoadingPending(false);
    }
  };

  const handleDecision = async (officeId, action) => {
    clearMessages();
    setProcessingOfficeId(officeId);
    try {
      if (action === 'approve') {
        await approveOfficeRegistration(officeId);
        setSuccess('Registration approved successfully.');
      } else {
        await rejectOfficeRegistration(officeId);
        setSuccess('Registration rejected.');
      }
      await Promise.all([loadPendingRegistrations(), loadOffices()]);
    } catch (err) {
      setError(err.message || 'Unable to process registration request.');
    } finally {
      setProcessingOfficeId(null);
    }
  };

  const handleDeleteOffice = async (officeId) => {
    clearMessages();
    setDeletingOfficeId(officeId);
    try {
      await deleteOffice(officeId);
      setSuccess('Establishment deleted successfully.');
      setConfirmDeleteId(null);
      await loadOffices();
    } catch (err) {
      setError(err.message || 'Unable to delete establishment.');
    } finally {
      setDeletingOfficeId(null);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      await Promise.all([loadOffices(), loadPendingRegistrations()]);
    };
    bootstrap();
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'applications', label: 'Business Applications', icon: '📋' },
    { id: 'businesses', label: 'Businesses', icon: '🏢' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
  ];

  /* ── Tab content renderers ── */

  const renderDashboard = () => (
    <>
      <h2 className="admin-page-title">Dashboard Overview</h2>

      <section className="admin-stats-grid">
        <article className="admin-stat-card">
          <span>Total Businesses</span>
          <strong>{offices.length}</strong>
          <p>active on platform</p>
        </article>
        <article className="admin-stat-card accent-amber">
          <span>Pending Applications</span>
          <strong>{pendingRegistrations.length}</strong>
          <p>awaiting review</p>
        </article>
        <article className="admin-stat-card accent-green">
          <span>Approved</span>
          <strong>{offices.length}</strong>
          <p>businesses live</p>
        </article>
        <article className="admin-stat-card accent-blue">
          <span>Business Types</span>
          <strong>{[...new Set(offices.map(o => o.type))].length}</strong>
          <p>categories</p>
        </article>
      </section>

      {/* Recent activity */}
      <section className="admin-panel" style={{ marginTop: '0.9rem' }}>
        <div className="admin-panel-head">
          <h3>Recent Applications</h3>
          <span>{pendingRegistrations.length} pending</span>
        </div>
        <div className="admin-request-list">
          {pendingRegistrations.length === 0 && (
            <p className="admin-empty">No pending applications right now. 🎉</p>
          )}
          {pendingRegistrations.slice(0, 3).map((req) => (
            <div key={req.officeId} className="admin-request-item">
              <div>
                <strong>{req.name}</strong>
                <p>{req.address}</p>
                <small>Type: {req.type} · Category: {req.category || '—'}</small>
              </div>
              <div className="admin-request-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={() => handleDecision(req.officeId, 'approve')}
                  disabled={processingOfficeId === req.officeId}
                >Approve</button>
                <button
                  type="button"
                  className="admin-btn admin-btn-danger"
                  onClick={() => handleDecision(req.officeId, 'reject')}
                  disabled={processingOfficeId === req.officeId}
                >Reject</button>
              </div>
            </div>
          ))}
          {pendingRegistrations.length > 3 && (
            <button className="admin-btn" onClick={() => setActiveTab('applications')}>
              View all {pendingRegistrations.length} applications →
            </button>
          )}
        </div>
      </section>

      {/* Quick glance: businesses */}
      <section className="admin-panel" style={{ marginTop: '0.9rem' }}>
        <div className="admin-panel-head">
          <h3>Active Businesses</h3>
          <span>{offices.length} total</span>
        </div>
        <div className="admin-business-grid">
          {offices.slice(0, 6).map((office) => (
            <div key={office.officeId} className="admin-business-card">
              <strong>{office.name}</strong>
              <span>{office.type}</span>
            </div>
          ))}
          {offices.length === 0 && <p className="admin-empty">No active businesses yet.</p>}
          {offices.length > 6 && (
            <button className="admin-btn" onClick={() => setActiveTab('businesses')}>
              View all businesses →
            </button>
          )}
        </div>
      </section>
    </>
  );

  // Parses a doc field: returns { name, url } where url may be null for legacy data
  const parseDoc = (value) => {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && parsed.name) {
        return { name: parsed.name, url: parsed.url || null };
      }
    } catch { /* legacy plain filename */ }
    return { name: value, url: null };
  };

  const parsePhotos = (value) => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((p) => ({ name: p.name || 'photo', url: p.url || null }));
      }
    } catch { /* legacy comma-separated filenames */ }
    return value.split(',').filter(Boolean).map((name) => ({ name, url: null }));
  };

  const openDataUrl = (url, name) => {
    if (!url) return;
    const win = window.open();
    if (!win) return;
    win.document.title = name || 'Document';
    if (url.startsWith('data:application/pdf') || url.startsWith('data:image/')) {
      win.document.body.style.margin = '0';
      const tag = url.startsWith('data:image/') ? 'img' : 'iframe';
      win.document.body.innerHTML = `<${tag} src="${url}" style="width:100vw;height:100vh;border:0;${tag === 'img' ? 'object-fit:contain;background:#111;' : ''}" />`;
    } else {
      const link = win.document.createElement('a');
      link.href = url;
      link.download = name || 'document';
      win.document.body.appendChild(link);
      link.click();
    }
  };

  const renderDocuments = (request) => {
    const docs = [
      { label: 'Business Permit', doc: parseDoc(request.businessPermit) },
      { label: 'DTI/SEC Registration', doc: parseDoc(request.dtiSecRegistration) },
      { label: 'Utility Bill', doc: parseDoc(request.utilityBill) },
      { label: 'Lease Agreement', doc: parseDoc(request.leaseAgreement) },
      { label: 'Tax Document', doc: parseDoc(request.taxDocument) },
    ];
    const photos = parsePhotos(request.photos);
    const hasAnyDoc = docs.some(d => d.doc) || photos.length > 0;

    return (
      <div className="admin-docs-section">
        <div className="admin-docs-section-title">Submitted Documents</div>
        <div className="admin-docs-grid">
          {docs.map(({ label, doc }) => {
            const clickable = !!(doc && doc.url);
            return (
              <div
                key={label}
                className={`admin-doc-item ${doc ? 'has-file' : 'no-file'} ${clickable ? 'admin-doc-clickable' : ''}`}
                onClick={clickable ? () => openDataUrl(doc.url, doc.name) : undefined}
                title={clickable ? 'Click to view' : ''}
              >
                <span className="admin-doc-icon">{doc ? '📄' : '—'}</span>
                <div className="admin-doc-info">
                  <span className="admin-doc-label">{label}</span>
                  {doc && <span className="admin-doc-filename">{doc.name}</span>}
                </div>
                {clickable && <span className="admin-doc-view">View →</span>}
              </div>
            );
          })}
        </div>
        {photos.length > 0 && (
          <div>
            <div className="admin-docs-section-title" style={{ marginBottom: '0.35rem' }}>
              Photos ({photos.length})
            </div>
            <div className="admin-photos-row">
              {photos.map((photo, i) => {
                const clickable = !!photo.url;
                return clickable ? (
                  <button
                    key={i}
                    type="button"
                    className="admin-photo-chip admin-photo-clickable"
                    onClick={() => openDataUrl(photo.url, photo.name)}
                    title="Click to view"
                  >
                    🖼 {photo.name}
                  </button>
                ) : (
                  <span key={i} className="admin-photo-chip">🖼 {photo.name}</span>
                );
              })}
            </div>
            {photos.some(p => p.url) && (
              <div className="admin-photo-thumbs">
                {photos.filter(p => p.url).map((photo, i) => (
                  <img
                    key={i}
                    src={photo.url}
                    alt={photo.name}
                    className="admin-photo-thumb"
                    onClick={() => openDataUrl(photo.url, photo.name)}
                    title="Click to view"
                  />
                ))}
              </div>
            )}
          </div>
        )}
        {!hasAnyDoc && (
          <p className="admin-empty" style={{ margin: 0 }}>No documents submitted.</p>
        )}
      </div>
    );
  };

  const renderApplications = () => (
    <>
      <div className="admin-page-header">
        <h2 className="admin-page-title">Business Applications</h2>
        <button
          className="admin-btn"
          onClick={loadPendingRegistrations}
          disabled={loadingPending}
        >
          {loadingPending ? 'Loading...' : '↻ Refresh'}
        </button>
      </div>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h3>Pending Registration Requests</h3>
          <span>{pendingRegistrations.length} pending</span>
        </div>

        <div className="admin-request-list">
          {pendingRegistrations.length === 0 && (
            <p className="admin-empty">No pending registration requests. All caught up! 🎉</p>
          )}

          {pendingRegistrations.map((request) => (
            <div key={request.officeId} className="admin-request-item admin-request-expanded">
              <div className="admin-request-info">
                <strong>{request.name}</strong>
                <p>{request.address}</p>
                <div className="admin-request-meta">
                  <small>Type: {request.type}</small>
                  <small>Category: {request.category || '—'}</small>
                  <small>Phone: {request.phoneNumber || '—'}</small>
                  {request.website && <small>Web: {request.website}</small>}
                  <small>Submitted: {new Date(request.createdAt).toLocaleDateString()}</small>
                </div>
                {request.additionalNotes && (
                  <p className="admin-request-notes">Note: {request.additionalNotes}</p>
                )}
              </div>
              {renderDocuments(request)}
              <div className="admin-request-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={() => handleDecision(request.officeId, 'approve')}
                  disabled={processingOfficeId === request.officeId}
                >
                  {processingOfficeId === request.officeId ? '...' : '✓ Approve'}
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn-danger"
                  onClick={() => handleDecision(request.officeId, 'reject')}
                  disabled={processingOfficeId === request.officeId}
                >
                  {processingOfficeId === request.officeId ? '...' : '✕ Reject'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );

  const renderBusinesses = () => {
    const typeGroups = offices.reduce((acc, office) => {
      const t = office.type || 'OTHER';
      if (!acc[t]) acc[t] = [];
      acc[t].push(office);
      return acc;
    }, {});

    return (
      <>
        <div className="admin-page-header">
          <h2 className="admin-page-title">Businesses</h2>
          <button className="admin-btn" onClick={loadOffices} disabled={loadingOffices}>
            {loadingOffices ? 'Loading...' : '↻ Refresh'}
          </button>
        </div>

        {offices.length === 0 && (
          <div className="admin-panel">
            <p className="admin-empty">No approved businesses yet.</p>
          </div>
        )}

        {Object.entries(typeGroups).map(([type, list]) => (
          <section key={type} className="admin-panel" style={{ marginBottom: '0.9rem' }}>
            <div className="admin-panel-head">
              <h3>{type}</h3>
              <span>{list.length} business{list.length !== 1 ? 'es' : ''}</span>
            </div>
            <div className="admin-business-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((office) => (
                    <tr key={office.officeId}>
                      <td><strong>{office.name}</strong></td>
                      <td>{office.address}</td>
                      <td>{office.category || '—'}</td>
                      <td>
                        <span className={`admin-badge ${office.isActive ? 'badge-active' : 'badge-closed'}`}>
                          {office.isActive ? 'Open' : 'Closed'}
                        </span>
                      </td>
                      <td>
                        {confirmDeleteId === office.officeId ? (
                          <span className="admin-delete-confirm">
                            <span className="admin-delete-confirm-label">Delete?</span>
                            <button
                              type="button"
                              className="admin-btn admin-btn-danger admin-btn-xs"
                              onClick={() => handleDeleteOffice(office.officeId)}
                              disabled={deletingOfficeId === office.officeId}
                            >
                              {deletingOfficeId === office.officeId ? '...' : 'Yes'}
                            </button>
                            <button
                              type="button"
                              className="admin-btn admin-btn-xs"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="admin-btn admin-btn-xs admin-btn-ghost-danger"
                            onClick={() => { setConfirmDeleteId(office.officeId); clearMessages(); }}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </>
    );
  };

  const renderAnalytics = () => {
    const typeCount = offices.reduce((acc, o) => {
      const t = o.type || 'OTHER';
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});

    const openCount = offices.filter(o => o.isActive).length;
    const closedCount = offices.length - openCount;
    const maxTypeCount = Math.max(...Object.values(typeCount), 1);

    return (
      <>
        <h2 className="admin-page-title">Analytics</h2>

        <section className="admin-stats-grid">
          <article className="admin-stat-card">
            <span>Total Businesses</span>
            <strong>{offices.length}</strong>
            <p>registered</p>
          </article>
          <article className="admin-stat-card accent-green">
            <span>Currently Open</span>
            <strong>{openCount}</strong>
            <p>accepting queues</p>
          </article>
          <article className="admin-stat-card accent-amber">
            <span>Currently Closed</span>
            <strong>{closedCount}</strong>
            <p>not accepting</p>
          </article>
          <article className="admin-stat-card accent-blue">
            <span>Pending Applications</span>
            <strong>{pendingRegistrations.length}</strong>
            <p>awaiting review</p>
          </article>
        </section>

        <section className="admin-panel" style={{ marginTop: '0.9rem' }}>
          <div className="admin-panel-head">
            <h3>Businesses by Type</h3>
          </div>
          <div className="admin-chart">
            {Object.entries(typeCount)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div key={type} className="admin-chart-row">
                  <span className="admin-chart-label">{type}</span>
                  <div className="admin-chart-bar-wrap">
                    <div
                      className="admin-chart-bar"
                      style={{ width: `${(count / maxTypeCount) * 100}%` }}
                    />
                  </div>
                  <span className="admin-chart-value">{count}</span>
                </div>
              ))}
            {Object.keys(typeCount).length === 0 && (
              <p className="admin-empty">No data yet.</p>
            )}
          </div>
        </section>

        <section className="admin-panel" style={{ marginTop: '0.9rem' }}>
          <div className="admin-panel-head">
            <h3>Open vs Closed</h3>
          </div>
          <div className="admin-ratio-bar">
            {offices.length > 0 ? (
              <>
                <div
                  className="admin-ratio-segment ratio-open"
                  style={{ width: `${(openCount / offices.length) * 100}%` }}
                >
                  {openCount > 0 && `${openCount} Open`}
                </div>
                <div
                  className="admin-ratio-segment ratio-closed"
                  style={{ width: `${(closedCount / offices.length) * 100}%` }}
                >
                  {closedCount > 0 && `${closedCount} Closed`}
                </div>
              </>
            ) : (
              <p className="admin-empty" style={{ padding: '0.5rem' }}>No businesses to display.</p>
            )}
          </div>
        </section>
      </>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'applications': return renderApplications();
      case 'businesses': return renderBusinesses();
      case 'analytics': return renderAnalytics();
      default: return renderDashboard();
    }
  };

  return (
    <div className="admin-root">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-logo">Q</span>
          <div className="admin-brand-text">
            <h2>QuickQueue</h2>
            <p>Admin Portal</p>
          </div>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(item.id); clearMessages(); }}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <button type="button" className="admin-logout" onClick={handleLogout}>Logout</button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Manage businesses and applications</p>
          </div>
          <div className="admin-user-chip">🛡️ {user.name || 'Admin User'}</div>
        </header>

        {error && <div className="admin-alert admin-alert-error">{error}</div>}
        {success && <div className="admin-alert admin-alert-success">{success}</div>}

        {renderTabContent()}
      </main>
    </div>
  );
}
