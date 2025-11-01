import axios from "axios";
const BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const getAllWorklets = async () => {
  const response = await axios.get(`${BASE}/worklets`);
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

export const getWorkletById = async (id) => {
  const response = await axios.get(`${BASE}/worklets/${id}`);
  return response.data;
};
