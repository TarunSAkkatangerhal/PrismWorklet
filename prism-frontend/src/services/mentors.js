import axios from "axios";
const BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const getAllMentors = async () => {
  const response = await axios.get(`${BASE}/mentors`);
  return response.data;
};
