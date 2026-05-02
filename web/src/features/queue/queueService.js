/**
 * Queue Service — Queue management API calls using apiClient facade.
 *
 * Matches SDD §5.2 endpoints:
 *   POST /api/queues/join — Join a queue
 *   GET  /api/queues/status/{id} — Get queue status
 *   PATCH /api/queues/tickets/{id} — Cancel ticket
 *   POST /api/queues/advance/{officeId} — Advance queue (staff)
 *   GET  /api/offices — List offices
 */
import apiClient from '../../shared/apiClient';

export const joinQueue = async (userId, officeId) => {
  return apiClient.post(`/queues/join?userId=${userId}&officeId=${officeId}`);
};

export const getQueueStatus = async (ticketId) => {
  return apiClient.get(`/queues/status/${ticketId}`);
};

export const cancelTicket = async (ticketId) => {
  return apiClient.patch(`/queues/tickets/${ticketId}`);
};

export const advanceQueue = async (officeId) => {
  return apiClient.post(`/queues/advance/${officeId}`);
};

export const getOffices = async () => {
  return apiClient.get('/offices');
};

export const registerOffice = async (data) => {
  return apiClient.post('/offices/register', data);
};

export const getPendingOfficeRegistrations = async () => {
  return apiClient.get('/admin/offices/registrations/pending');
};

export const approveOfficeRegistration = async (officeId) => {
  return apiClient.patch(`/admin/offices/registrations/${officeId}/approve`);
};

export const rejectOfficeRegistration = async (officeId) => {
  return apiClient.patch(`/admin/offices/registrations/${officeId}/reject`);
};

export const getMyRegistrations = async () => {
  return apiClient.get('/offices/my-registrations');
};

export const toggleOffice = async (officeId) => {
  return apiClient.patch(`/offices/${officeId}/toggle`);
};

// ── Staff Management ──

export const getOfficeStaff = async (officeId) => {
  return apiClient.get(`/offices/${officeId}/staff`);
};

export const addOfficeStaff = async (officeId, email) => {
  return apiClient.post(`/offices/${officeId}/staff`, { email });
};

export const removeOfficeStaff = async (officeId, staffId) => {
  return apiClient.delete(`/offices/${officeId}/staff/${staffId}`);
};

export const getStaffOffices = async () => {
  return apiClient.get('/offices/staff-offices');
};

export const getHolidays = async (country = 'PH', year = 2026) => {
  return apiClient.get(`/integration/holidays?country=${country}&year=${year}`);
};
