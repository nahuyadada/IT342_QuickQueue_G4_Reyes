import { useEffect, useState } from 'react';

export default function AuthCallback() {
  const [status, setStatus] = useState('Completing sign-in...');

  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const error = searchParams.get('error');
      const id = searchParams.get('id');
      const token = searchParams.get('token');
      const name = searchParams.get('name');
      const email = searchParams.get('email');
      const role = searchParams.get('role') || 'USER';

      if (error) {
        if (error.toLowerCase().includes('access_denied')) {
          window.location.replace('/');
          return;
        }

        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setStatus('Google sign-in failed. Redirecting...');
        window.location.replace(`/?error=${encodeURIComponent(error)}`);
        return;
      }

      if (!token) {
        setStatus('Missing sign-in token. Redirecting...');
        window.location.replace('/?error=oauth2_token_missing');
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        id: id ? Number(id) : null,
        name: name || 'User',
        email: email || '',
        role,
      }));

      setStatus('Sign-in successful. Redirecting...');
      window.location.replace(role === 'ADMIN' ? '/admin/dashboard' : '/dashboard/home');
    } catch (err) {
      console.error(err);
      setStatus('Unexpected callback error. Returning to login...');
      window.location.replace('/?error=oauth2_callback_failed');
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'Inter, sans-serif' }}>
      <p>{status}</p>
    </div>
  );
}