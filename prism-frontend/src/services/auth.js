// prism-frontend/src/services/auth.js
import axios from "axios";
const BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

// pass role as a parameter
export const login = async (email, password, role) => {
  const params = new URLSearchParams();
  params.append("username", email); // OAuth2PasswordRequestForm expects "username"
  params.append("password", password);
  if (role) {
    params.append("scope", role); // send role in OAuth2 "scope"
  }

  const response = await axios.post(`${BASE}/auth/login`, params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  const data = response.data;
  try {
    if (data?.user?.role) {
      localStorage.setItem('user_role', data.user.role);
    }
  } catch (_) { /* ignore storage errors */ }
  return data;
};
export const getCurrentUser = async () => {
  const response = await axios.get(`${BASE}/auth/me`);
  return response.data;
};

// Refresh token (if needed)
export const refreshToken = async () => {
  const refresh_token = localStorage.getItem("refresh_token");
  if (!refresh_token) throw new Error("No refresh token found");

  const response = await axios.post(`${BASE}/auth/refresh`, { refresh_token });
  const { access_token } = response.data;

  localStorage.setItem("access_token", access_token);
  return response.data;
};


// Request OTP for sign-up (backend currently only requires email; extra fields ignored)
export const requestOtp = async (email) => {
  const response = await axios.post(`${BASE}/auth/request-otp`, { email });
  return response.data;
};

// Verify OTP
export const verifyOtp = async (email, otp_code) => {
  const response = await axios.post(`${BASE}/auth/verify-otp`, { email, otp_code });
  return response.data;
};

// Set password after OTP verification (backend requires email, name, role, password)
export const setPassword = async (email, name, role, password) => {
  const response = await axios.post(`${BASE}/auth/set-password`, { email, name, role, password });
  return response.data;
};



export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }
};