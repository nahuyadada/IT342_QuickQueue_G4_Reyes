import { useEffect, useState } from 'react';
import { getCurrentUserProfile, updateCurrentUserProfile } from '../auth/authService';

export default function ProfilePage() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [loading, setLoading] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [success, setSuccess] = useState('');
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
        setNameInput(mergedUser.name || '');
      } catch (err) {
        setError(err.message || 'Unable to sync profile.');
      } finally {
        setLoading(false);
      }
    };

    syncProfile();
  }, []);

  const handleNameUpdate = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    const trimmedName = nameInput.trim();
    if (!trimmedName) {
      setError('Name is required.');
      return;
    }

    setSavingName(true);
    try {
      const updatedProfile = await updateCurrentUserProfile({ name: trimmedName });
      setUser(updatedProfile);
      localStorage.setItem('user', JSON.stringify(updatedProfile));
      setNameInput(updatedProfile.name || '');
      setSuccess('Name updated successfully.');
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Unable to update name.');
    } finally {
      setSavingName(false);
    }
  };

  const handleStartEdit = () => {
    setError('');
    setSuccess('');
    setNameInput(user.name || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setNameInput(user.name || '');
    setIsEditing(false);
  };

  return (
    <div className="portal-grid">
      {error && <div className="portal-alert portal-alert-error">{error}</div>}
      {success && <div className="portal-alert portal-alert-success">{success}</div>}

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

        <form className="portal-controls" onSubmit={handleNameUpdate}>
          <label htmlFor="profile-name" className="portal-muted">Change Name</label>
          <input
            id="profile-name"
            className="portal-input"
            type="text"
            placeholder="Enter your name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            disabled={!isEditing || savingName || loading}
          />
          <div className="portal-btn-row">
            {!isEditing && (
              <button type="button" className="portal-btn" onClick={handleStartEdit} disabled={loading}>
                Edit Profile
              </button>
            )}

            {isEditing && (
              <>
                <button type="button" className="portal-btn" onClick={handleCancelEdit} disabled={savingName}>
                  Cancel
                </button>
                <button type="submit" className="portal-btn portal-btn-primary" disabled={savingName || loading}>
                  {savingName ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}