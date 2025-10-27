import axios from "axios";
const BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const getAllWorklets = async () => {
  const response = await axios.get(`${BASE}/worklets`);
  return response.data;
};

// DEPRECATED: Use getMentorWorkletsById instead
// Fetch worklets for a specific mentor by email
// opts: { onlyOngoing: boolean }
export const getMentorWorklets = async (mentorEmail, opts = {}) => {
  const params = new URLSearchParams();
  if (opts.onlyOngoing) params.append("only_ongoing", "true");
  const qs = params.toString();
  const encodedEmail = encodeURIComponent(mentorEmail);
  const url = `${BASE}/worklets/mentor/${encodedEmail}/worklets${qs ? `?${qs}` : ""}`;
  const response = await axios.get(url);
  return response.data;
};

/**
 * UNIFIED API - Fetch worklets for a mentor by user ID
 * @param {number} mentorUserId - The mentor's user ID
 * @param {Object} options - Optional filters
 * @param {string} options.statusFilter - Filter by status: "ongoing", "completed", "all", or null
 * @param {boolean} options.includePerformance - Include performance data (default: true)
 * @returns {Promise} Response with worklets data
 */
export const getMentorWorkletsById = async (mentorUserId, options = {}) => {
  const { statusFilter = null, includePerformance = true } = options;
  
  const params = new URLSearchParams();
  if (statusFilter) params.append("status_filter", statusFilter);
  params.append("include_performance", includePerformance.toString());
  
  const qs = params.toString();
  const url = `${BASE}/api/associations/mentor/${mentorUserId}/worklets${qs ? `?${qs}` : ""}`;
  const response = await axios.get(url);
  return response.data;
};

// DEPRECATED: Use getMentorWorkletsById with statusFilter="ongoing"
// Kept for backward compatibility
export const getMentorOngoingWorkletsById = async (mentorUserId) => {
  return getMentorWorkletsById(mentorUserId, { statusFilter: "ongoing" });
};

// DEPRECATED: Use getMentorWorkletsById with statusFilter="all" or null
// Kept for backward compatibility
export const getMentorAllWorkletsById = async (mentorUserId) => {
  return getMentorWorkletsById(mentorUserId, { statusFilter: "all" });
};

export const getWorkletById = async (id) => {
  const response = await axios.get(`${BASE}/worklets/${id}`);
  return response.data;
};
