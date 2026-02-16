// prism-frontend/src/services/auth.js - Secure Version
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import DOMPurify from 'dompurify';
import { forceRefreshIfNeeded } from './secureAPI';

const BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

// Secure token management
const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

// Input sanitization
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [] 
  });
};

// Token validation
const validateToken = (token) => {
  if (!token) return null;
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    if (decoded.exp < currentTime) {
      return null; // Token expired
    }
    
    return {
      userId: decoded.sub,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name,
      exp: decoded.exp
    };
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
};

// Secure storage helpers
const secureStorage = {
  setTokens: (accessToken, refreshToken) => {
    try {
      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_KEY, refreshToken);
    } catch (error) {
      console.error('Storage error:', error);
    }
  },
  
  getToken: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  
  getRefreshToken: () => {
    try {
      return localStorage.getItem(REFRESH_KEY);
    } catch {
      return null;
    }
  },
  
  clearTokens: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_name');
      localStorage.removeItem('user_role');
    } catch (error) {
      console.error('Storage cleanup error:', error);
    }
  }
};

// Secure login function
export const login = async (email, password, role) => {
  // Input validation and sanitization
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  
  const sanitizedEmail = sanitizeInput(email).toLowerCase().trim();
  // Normalize role to match backend format (capitalize first letter)
  const sanitizedRole = role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : '';
  
  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitizedEmail)) {
    throw new Error('Invalid email format');
  }
  
  // Password strength validation
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const params = new URLSearchParams();
  params.append("username", sanitizedEmail);
  params.append("password", password); // Don't sanitize password
  if (sanitizedRole) {
    params.append("scope", sanitizedRole);
  }

  try {
    const response = await axios.post(`${BASE}/auth/login`, params, {
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Timestamp": Date.now().toString()
      },
      timeout: 10000 // 10 second timeout
    });
    
    const data = response.data;
    
    // Validate response structure
    if (!data.access_token || !data.refresh_token) {
      throw new Error('Invalid login response');
    }
    
    // Validate and decode tokens
    const userData = validateToken(data.access_token);
    if (!userData) {
      throw new Error('Invalid access token received');
    }
    
    // Securely store tokens and user data
    secureStorage.setTokens(data.access_token, data.refresh_token);
    localStorage.setItem('user_email', userData.email);
    localStorage.setItem('user_name', userData.name || '');
    localStorage.setItem('user_role', userData.role || '');
    
    return {
      ...data,
      user: userData
    };
  } catch (error) {
    // Clear any existing tokens on login failure
    secureStorage.clearTokens();
    
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        throw new Error('Invalid credentials');
      } else if (status === 403) {
        throw new Error('You are not registered as the selected role. Please select the correct role.');
      } else if (status === 429) {
        throw new Error('Too many login attempts. Please try again later.');
      } else if (status >= 500) {
        throw new Error('Server error. Please try again later.');
      }
    }
    
    throw new Error(error.message || 'Login failed');
  }
};
// Secure getCurrentUser function
export const getCurrentUser = async () => {
  const token = secureStorage.getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  // Validate token before making request
  const userData = validateToken(token);
  if (!userData) {
    throw new Error('Invalid or expired token');
  }

  try {
    const response = await axios.get(`${BASE}/auth/me`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        "X-Timestamp": Date.now().toString()
      },
      timeout: 10000
    });
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      // Token expired, try refresh
      await refreshToken();
      // Retry with new token
      const newToken = secureStorage.getToken();
      const response = await axios.get(`${BASE}/auth/me`, {
        headers: { 
          Authorization: `Bearer ${newToken}`,
          "X-Timestamp": Date.now().toString()
        }
      });
      return response.data;
    }
    throw error;
  }
};

// Secure token refresh
// Refresh is centralized in secureAPI interceptor now; retain legacy export for compatibility.
export const refreshToken = async () => {
  const success = await forceRefreshIfNeeded();
  if (!success) throw new Error('Session expired. Please log in again.');
  return { access_token: secureStorage.getToken(), refresh_token: secureStorage.getRefreshToken() };
};

// Secure logout
export const logout = () => {
  secureStorage.clearTokens();
  // Redirect to login
  window.location.href = '/';
};

// Get current user from token (without API call)
export const getCurrentUserFromToken = () => {
  const token = secureStorage.getToken();
  return validateToken(token);
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

// Forgot password: request reset OTP
export const forgotPassword = async (email) => {
  const response = await axios.post(`${BASE}/auth/forgot-password`, { email });
  return response.data;
};

// Reset password: submit email + OTP + new password
export const resetPassword = async (payloadOrEmail, maybeOtp, maybeNewPassword) => {
  // Support both signatures:
  // 1) resetPassword({ email, otp_code, new_password })
  // 2) resetPassword(email, otp_code, new_password)
  let payload = {};
  if (typeof payloadOrEmail === 'object' && payloadOrEmail !== null) {
    payload = payloadOrEmail;
  } else {
    payload = { email: payloadOrEmail, otp_code: maybeOtp, new_password: maybeNewPassword };
  }
  const response = await axios.post(`${BASE}/auth/reset-password`, payload);
  return response.data;
};

// Verify reset OTP before setting new password
export const resetPasswordOtp = async (email, otp_code) => {
  const response = await axios.post(`${BASE}/auth/reset-password-otp`, { email, otp_code });
  return response.data;
};

// Alias with the name expected by the ForgotPassword page
export const verifyResetPasswordOtp = resetPasswordOtp;



export const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }
};