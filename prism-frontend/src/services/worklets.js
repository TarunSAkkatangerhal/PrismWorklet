import axios from "axios";
const BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const getAllWorklets = async () => {
  const response = await axios.get(`${BASE}/worklets`);
  return response.data;
};

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

// Fetch ongoing worklets using associations endpoint by mentor user id
export const getMentorOngoingWorkletsById = async (mentorUserId) => {
  const response = await axios.get(`${BASE}/api/associations/mentor/${mentorUserId}/ongoing-worklets`);
  return response.data; // expected shape: { ongoing_worklets: [...] }
};

// Fetch all (ongoing + completed) worklets for mentor
export const getMentorAllWorkletsById = async (mentorUserId) => {
  const response = await axios.get(`${BASE}/api/associations/mentor/${mentorUserId}/all-worklets`);
  return response.data; // shape: { all_worklets, total_worklets, total_mentees, ... }
};

export const getWorkletById = async (id) => {
  const response = await axios.get(`${BASE}/worklets/${id}`);
  return response.data;
};
