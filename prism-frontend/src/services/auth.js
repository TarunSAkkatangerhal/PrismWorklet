// prism-frontend/src/services/auth.js
import API from "../api";

// pass role as a parameter
export const login = async (email, password, role) => {
  const params = new URLSearchParams();
  params.append("username", email); // OAuth2PasswordRequestForm expects "username"
  params.append("password", password);
  if (role) {
    params.append("scope", role); // send role in OAuth2 "scope"
  }

  const response = await API.post("/auth/login", params);
  return response.data;
};
export const getCurrentUser = async () => {
  const response = await API.get("/auth/me");
  return response.data;
};

// Refresh token (if needed)
export const refreshToken = async () => {
  const refresh_token = localStorage.getItem("refresh_token");
  if (!refresh_token) throw new Error("No refresh token found");

  const response = await API.post("/auth/refresh", { refresh_token });
  const { access_token } = response.data;

  localStorage.setItem("access_token", access_token);
  return response.data;
};


// Request OTP for sign-up
export const requestOtp = async (name, email, role) => {
  const response = await API.post("/auth/request-otp", { name, email, role });
  return response.data;
};

// Verify OTP
export const verifyOtp = async (email, otp_code) => {
  const response = await API.post("/auth/verify-otp", { email, otp_code });
  return response.data;
};

// Set password after OTP verification
export const setPassword = async (email, password) => {
  const response = await API.post("/auth/set-password", { email, password });
  return response.data;
};



export const setAuthToken = (token) => {
  if (token) {
    API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete API.defaults.headers.common["Authorization"];
  }
};