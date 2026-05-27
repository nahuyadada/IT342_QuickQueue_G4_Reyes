/**
 * Facade Pattern (Frontend) — Centralized API Client
 *
 * Provides a unified interface for all HTTP requests.
 * BEFORE: Each service file hardcoded 'http://localhost:8080' and
 *         duplicated fetch configuration (headers, error handling).
 * AFTER:  One centralized client handles base URL, auth headers,
 *         and error parsing. Services just call apiClient.post('/path', data).
 */

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080/api';

/**
 * Parse JSON response and throw on errors.
 */
const parseResponse = async (res) => {
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // Handle SDD-format errors: { success: false, error: { code, message } }
    if (data.error && data.error.message) {
      throw new Error(data.error.message);
    }
    // Spring Boot default error format: { status, error: "Not Found", message?, path }
    if (typeof data.error === 'string') {
      throw new Error(`${data.error} (${res.status}) — ${data.path || res.url}`);
    }
    // Fallback for legacy format
    throw new Error(data.message || `Request failed (HTTP ${res.status})`);
  }

  // Return the data field if using SDD format, otherwise return raw
  return data.data !== undefined ? data.data : data;
};

/**
 * Get auth headers if a token exists in localStorage.
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * API client facade — unified interface for all HTTP methods.
 */
const apiClient = {
  get: async (path) => {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: getAuthHeaders(),
    });
    return parseResponse(res);
  },

  post: async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    return parseResponse(res);
  },

  patch: async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return parseResponse(res);
  },

  delete: async (path) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return parseResponse(res);
  },
};

export default apiClient;
