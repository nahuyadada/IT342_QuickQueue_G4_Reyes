import { useEffect, useState } from 'react';
import { getCurrentUserProfile } from '../services/authService';

export default function ProfilePage() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const syncProfile = async () => {
      setLoading(true);
      setError('');
      try {
        const profile = await getCurrentUserProfile();
        const mergedUser = {
          ...user,
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
        };
        localStorage.setItem('user', JSON.stringify(mergedUser));
        setUser(mergedUser);
      } catch (err) {
        setError(err.message || 'Unable to sync profile.');
      } finally {
        setLoading(false);
      }
    };

    syncProfile();
  }, []);

  return (
    <div className="portal-grid">
      {error && <div className="portal-alert portal-alert-error">{error}</div>}

      <div className="portal-panel portal-panel-wide">
        <h3>Profile</h3>
        <p className="portal-muted">Your account information</p>

        <div className="portal-profile-grid">
          <div>
            <span>User ID</span>
            <strong>{loading ? 'Loading...' : (user.id ?? '-')}</strong>
          </div>
          <div>
            <span>Name</span>
            <strong>{loading ? 'Loading...' : (user.name || '-')}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{loading ? 'Loading...' : (user.email || '-')}</strong>
          </div>
          <div>
            <span>Role</span>
            <strong>{loading ? 'Loading...' : (user.role || '-')}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}