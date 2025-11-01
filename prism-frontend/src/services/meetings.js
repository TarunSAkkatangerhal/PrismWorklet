// Meetings API Service
import api from './secureAPI';

const MEETINGS_BASE = '/api/meetings';

/**
 * Create a new meeting with multiple worklets
 * @param {Object} meetingData - Meeting creation data
 * @returns {Promise} Created meeting object
 */
export const createMeeting = async (meetingData) => {
  const response = await api.post(`${MEETINGS_BASE}/`, meetingData);
  return response.data;
};

/**
 * Get all meetings for the current user
 * @param {Object} filters - Optional filters (college_id, status)
 * @returns {Promise} Array of meetings
 */
export const getMeetings = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.college_id) params.append('college_id', filters.college_id);
  if (filters.status) params.append('status', filters.status);
  
  const queryString = params.toString();
  const response = await api.get(`${MEETINGS_BASE}/${queryString ? '?' + queryString : ''}`);
  return response.data;
};

/**
 * Get details of a specific meeting
 * @param {number} meetingId - Meeting ID
 * @returns {Promise} Meeting object
 */
export const getMeetingById = async (meetingId) => {
  const response = await api.get(`${MEETINGS_BASE}/${meetingId}`);
  return response.data;
};

/**
 * Reschedule a meeting
 * @param {number} meetingId - Meeting ID
 * @param {Object} rescheduleData - New datetime and optional duration/reason
 * @returns {Promise} Updated meeting object
 */
export const rescheduleMeeting = async (meetingId, rescheduleData) => {
  const response = await api.patch(`${MEETINGS_BASE}/${meetingId}/reschedule`, rescheduleData);
  return response.data;
};

/**
 * Cancel a meeting
 * @param {number} meetingId - Meeting ID to cancel
 * @returns {Promise} Cancellation confirmation
 */
export const cancelMeeting = async (meetingId) => {
  const response = await api.delete(`${MEETINGS_BASE}/${meetingId}/cancel`);
  return response.data;
};

/**
 * Get worklets assigned to the current mentor (for meeting creation)
 * @param {number} collegeId - Optional college filter
 * @returns {Promise} Array of worklets
 */
export const getMentorWorklets = async (collegeId = null) => {
  const params = collegeId ? `?college_id=${collegeId}` : '';
  const response = await api.get(`${MEETINGS_BASE}/mentor/worklets${params}`);
  return response.data;
};

/**
 * Get all colleges (for dropdown)
 * @returns {Promise} Array of colleges
 */
export const getColleges = async () => {
  const response = await api.get('/colleges/');
  return response.data;
};

const meetingsService = {
  createMeeting,
  getMeetings,
  getMeetingById,
  rescheduleMeeting,
  cancelMeeting,
  getMentorWorklets,
  getColleges
};

export default meetingsService;
