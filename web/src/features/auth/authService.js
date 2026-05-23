/**
 * Auth Service — Refactored to use apiClient facade.
 *
 * BEFORE: Each function hardcoded 'http://localhost:8080/api/auth' and
 *         duplicated fetch options (method, headers, body, error parsing).
 * AFTER:  Uses apiClient which handles base URL, headers, and error parsing.
 */
import apiClient from '../../shared/apiClient';

export const register = async (name, email, password) => {
  return apiClient.post('/auth/register', { name, email, password });
};

export const login = async (email, password) => {
  return apiClient.post('/auth/login', { email, password });
};

export const adminLogin = async (email, password) => {
  return apiClient.post('/auth/admin/login', { email, password });
};

export const getGoogleClientId = async () => {
  return apiClient.get('/auth/google/client-id');
};

export const googleLogin = async (credential) => {
  return apiClient.post('/auth/google', { credential });
};

export const getCurrentUserProfile = async () => {
  return apiClient.get('/auth/me');
};

export const updateCurrentUserProfile = async ({ name }) => {
  return apiClient.patch('/auth/me', { name });
};

export const changePassword = async (oldPassword, newPassword) => {
  return apiClient.patch('/auth/password', { oldPassword, newPassword });
};
