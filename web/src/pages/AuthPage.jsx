import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../services/authService';
import './AuthPage.css';

/* ── SVG Icon Components ── */
function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M1 12C2.73 7.61 6.99 4.5 12 4.5C17.01 4.5 21.27 7.61 23 12C21.27 16.39 17.01 19.5 12 19.5C6.99 19.5 2.73 16.39 1 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M2 2L22 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M10.58 10.58C10.21 10.95 10 11.46 10 12C10 13.1 10.9 14 12 14C12.54 14 13.05 13.79 13.42 13.42" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.88 5.08C10.57 4.88 11.28 4.77 12 4.77C17.01 4.77 21.27 7.88 23 12.27C22.39 13.82 21.47 15.2 20.32 16.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.46 6.46C4.32 7.83 2.62 9.89 1.8 12.27C3.53 16.66 7.79 19.77 12.8 19.77C14.22 19.77 15.59 19.52 16.86 19.06" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M2 7L12 13L22 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M4 21C4 17.134 7.582 14 12 14C16.418 14 20 17.134 20 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 2L3 7V12C3 17.25 6.8 22.13 12 23C17.2 22.13 21 17.25 21 12V7L12 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ── Splash Screen ── */
function SplashScreen({ visible, fading }) {
  if (!visible) return null;
  return (
    <div className={`splash-overlay${fading ? ' splash-fade-out' : ''}`}>
      <div className="splash-circles">
        <div className="splash-circle splash-circle-1" />
        <div className="splash-circle splash-circle-2" />
        <div className="splash-circle splash-circle-3" />
      </div>
      <div className="splash-content">
        <div className="splash-logo">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <rect width="56" height="56" rx="14" fill="white" fillOpacity="0.18" />
            <path d="M14 18h28M14 28h21M14 38h14" stroke="white" strokeWidth="3.2" strokeLinecap="round" />
            <circle cx="42" cy="35" r="9" fill="white" fillOpacity="0.92" />
            <text x="42" y="39.5" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1e40af">Q</text>
          </svg>
        </div>
        <h1 className="splash-title">QuickQueue</h1>
        <p className="splash-subtitle">Smart Queue Management System</p>
      </div>
    </div>
  );
}

/* ── Main Component ── */
export default function AuthPage() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);

  /* Splash state */
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setSplashFading(true), 2200);
    const hideTimer = setTimeout(() => setShowSplash(false), 3000);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackError = params.get('error');

    if (callbackError) {
      setError(decodeURIComponent(callbackError).replace(/\+/g, ' '));
      params.delete('error');
      const nextQuery = params.toString();
      window.history.replaceState({}, '', `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}`);
    }
  }, []);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirm, setShowSignupConfirm] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const clearMessages = () => { setError(''); setSuccess(''); };

  const persistAuth = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({ id: data.id, name: data.name, email: data.email, role: data.role }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!loginEmail || !loginPassword) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const data = await login(loginEmail, loginPassword);
      persistAuth(data);
      navigate(data.role === 'ADMIN' ? '/admin/dashboard' : '/dashboard/home');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!signupName || !signupEmail || !signupPassword || !signupConfirm) {
      setError('Please fill in all fields.');
      return;
    }
    if (signupPassword !== signupConfirm) {
      setError('Passwords do not match.');
      return;
    }
    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const data = await register(signupName, signupEmail, signupPassword);
      persistAuth(data);
      setSuccess('Account created successfully! Redirecting...');
      setTimeout(() => navigate('/dashboard/home'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (signupMode) => {
    setIsSignup(signupMode);
    clearMessages();
  };

  const handleGoogleOAuthRedirect = () => {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  };

  const renderGoogleSignIn = () => (
    <>
      <div className="auth-divider">
        <span>Or continue with</span>
      </div>

      <div className="auth-google-container">
        <button type="button" className="auth-google-btn" onClick={handleGoogleOAuthRedirect}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 001 12c0 1.94.46 3.77 1.18 5.07l3.66-2.98z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>Continue with Google</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Splash Screen */}
      <SplashScreen visible={showSplash} fading={splashFading} />

      {/* Auth Page */}
      <div className={`auth-root${showSplash ? ' auth-hidden' : ' auth-visible'}`}>
        <div className="auth-page">
          <div className="auth-card">
            {/* Avatar icon */}
            <div className="auth-avatar">
              <UserIcon />
            </div>

            {/* Header */}
            <div className="auth-form-header">
              <h2>{isSignup ? 'Create Account' : 'Login'}</h2>
              <p>{isSignup ? 'Join QuickQueue today' : 'Access your QuickQueue dashboard'}</p>
            </div>

            {/* Messages */}
            {error && <div className="auth-alert auth-alert-error">{error}</div>}
            {success && <div className="auth-alert auth-alert-success">{success}</div>}

            {/* Login Form */}
            {!isSignup && (
              <form className="auth-form" onSubmit={handleLogin}>
                <div className="auth-field">
                  <label htmlFor="login-email">Email Address</label>
                  <div className="auth-input-wrap">
                    <input
                      id="login-email"
                      type="email"
                      placeholder="admin@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      autoComplete="email"
                    />
                    <span className="auth-input-icon"><MailIcon /></span>
                  </div>
                </div>
                <div className="auth-field">
                  <label htmlFor="login-password">Password</label>
                  <div className="auth-input-wrap">
                    <input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="auth-input-icon-btn"
                      onClick={() => setShowLoginPassword((prev) => !prev)}
                      aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    >
                      {showLoginPassword ? <EyeIcon /> : <EyeOffIcon />}
                    </button>
                  </div>
                </div>

                <div className="auth-options-row">
                  <label className="auth-checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me</span>
                  </label>
                  <button type="button" className="auth-forgot-link">Forgot password?</button>
                </div>

                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? <span className="auth-spinner" /> : 'Sign in'}
                </button>

                {renderGoogleSignIn()}
                {/* Security Notice */}

                <p className="auth-switch">
                  Don't have an account?{' '}
                  <button type="button" className="auth-link" onClick={() => switchMode(true)}>
                    Create one
                  </button>
                </p>
              </form>
            )}

            {/* Sign Up Form */}
            {isSignup && (
              <form className="auth-form" onSubmit={handleSignup}>
                <div className="auth-field">
                  <label htmlFor="signup-name">Full Name</label>
                  <div className="auth-input-wrap">
                    <input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      autoComplete="name"
                    />
                    <span className="auth-input-icon"><UserIcon /></span>
                  </div>
                </div>
                <div className="auth-field">
                  <label htmlFor="signup-email">Email Address</label>
                  <div className="auth-input-wrap">
                    <input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      autoComplete="email"
                    />
                    <span className="auth-input-icon"><MailIcon /></span>
                  </div>
                </div>
                <div className="auth-field">
                  <label htmlFor="signup-password">Password</label>
                  <div className="auth-input-wrap">
                    <input
                      id="signup-password"
                      type={showSignupPassword ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="auth-input-icon-btn"
                      onClick={() => setShowSignupPassword((prev) => !prev)}
                      aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                    >
                      {showSignupPassword ? <EyeIcon /> : <EyeOffIcon />}
                    </button>
                  </div>
                </div>
                <div className="auth-field">
                  <label htmlFor="signup-confirm">Confirm Password</label>
                  <div className="auth-input-wrap">
                    <input
                      id="signup-confirm"
                      type={showSignupConfirm ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      value={signupConfirm}
                      onChange={(e) => setSignupConfirm(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="auth-input-icon-btn"
                      onClick={() => setShowSignupConfirm((prev) => !prev)}
                      aria-label={showSignupConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showSignupConfirm ? <EyeIcon /> : <EyeOffIcon />}
                    </button>
                  </div>
                </div>
                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? <span className="auth-spinner" /> : 'Create Account'}
                </button>

                {renderGoogleSignIn()}

                <p className="auth-switch">
                  Already have an account?{' '}
                  <button type="button" className="auth-link" onClick={() => switchMode(false)}>
                    Sign in
                  </button>
                </p>
              </form>
            )}
          </div>

          </div>
      </div>

      {/* Footer - always at bottom */}
      <footer className="auth-footer">
        <p>&copy; 2025 QuickQueue. All rights reserved.</p>
        <div className="auth-footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Support</a>
        </div>
      </footer>
    </>
  );
}
