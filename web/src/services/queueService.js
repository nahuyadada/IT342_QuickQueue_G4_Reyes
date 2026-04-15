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
import apiClient from './apiClient';

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

export const registerOffice = async ({ name, address, type }) => {
  return apiClient.post('/offices/register', { name, address, type });
};

export const getHolidays = async (country = 'PH', year = 2026) => {
  return apiClient.get(`/integration/holidays?country=${country}&year=${year}`);
};
