import { useEffect, useState } from 'react';
import { getMyRegistrations } from './queueService';

export default function PendingApplicationPage() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getMyRegistrations();
        setRegistrations(data || []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '1rem', color: '#64748b' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <p>Loading application status...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Waiting illustration */}
      <div style={{ textAlign: 'center', padding: '2rem 1rem 1.5rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '0.75rem' }}>⏳</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>
          Your Application is Under Review
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6 }}>
          Our admin team is reviewing your branch registration.
          You'll be notified once it's approved, and your full dashboard will unlock automatically.
        </p>
      </div>

      {/* Application cards */}
      {registrations.map((reg) => {
        const isPending = reg.approvalStatus === 'PENDING';
        const isRejected = reg.approvalStatus === 'REJECTED';
        const isApproved = reg.approvalStatus === 'APPROVED';

        return (
          <div
            key={reg.officeId}
            style={{
              background: '#fff',
              border: `1px solid ${isPending ? '#fde68a' : isRejected ? '#fecaca' : '#bbf7d0'}`,
              borderRadius: 14,
              padding: '1.25rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a' }}>{reg.name}</h3>
                <span style={{
                  display: 'inline-block',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '0.2rem 0.55rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  marginTop: '0.3rem',
                }}>{reg.category || reg.type}</span>
              </div>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.3rem 0.7rem',
                borderRadius: 999,
                fontSize: '0.78rem',
                fontWeight: 600,
                background: isPending ? '#fffbeb' : isRejected ? '#fef2f2' : '#f0fdf4',
                color: isPending ? '#d97706' : isRejected ? '#dc2626' : '#16a34a',
                border: `1px solid ${isPending ? '#fde68a' : isRejected ? '#fecaca' : '#bbf7d0'}`,
              }}>
                {isPending ? '⏳ Pending Review' : isRejected ? '❌ Rejected' : '✅ Approved'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem', color: '#475569' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📍</span> <span>{reg.address || 'No address'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📞</span> <span>{reg.phoneNumber || '—'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🕐</span> <span>Submitted: {reg.createdAt ? new Date(reg.createdAt).toLocaleDateString() : '—'}</span>
              </div>
            </div>

            {/* Status message */}
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              borderRadius: 10,
              background: isPending ? '#fffbeb' : isRejected ? '#fef2f2' : '#f0fdf4',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem',
              color: isPending ? '#92400e' : isRejected ? '#991b1b' : '#166534',
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: isPending ? '#f59e0b' : isRejected ? '#dc2626' : '#16a34a',
                animation: isPending ? 'pulse 1.5s ease-in-out infinite' : 'none',
              }} />
              {isPending && 'Your registration is being reviewed by an administrator. This usually takes 1-2 business days.'}
              {isRejected && 'Your registration was not approved. Please contact support for more details.'}
              {isApproved && 'Your branch has been approved! Refreshing your dashboard...'}
            </div>
          </div>
        );
      })}

      {registrations.length === 0 && (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
          <p>No applications found. Please register your branch first.</p>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
