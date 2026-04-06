const API_BASE = 'http://localhost:8080/api/auth';

const readJson = async (res) => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

export const register = async (name, email, password) => {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  return readJson(res);
};

export const login = async (email, password) => {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return readJson(res);
};

export const adminLogin = async (email, password) => {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return readJson(res);
};

export const getGoogleClientId = async () => {
  const res = await fetch(`${API_BASE}/google/client-id`);
  return readJson(res);
};

export const googleLogin = async (credential) => {
  const res = await fetch(`${API_BASE}/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });
  return readJson(res);
};
