// Secure API Client - Industry Standard
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Environment-based configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_TIMEOUT = 30000; // 30 seconds

// ---- Token Helpers ----
const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

const getAccessToken = () => localStorage.getItem(ACCESS_KEY);
const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);
const setTokens = (access, refresh) => {
  if (access) localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
};
const clearTokens = () => {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

let refreshInFlight = null; // Promise
let requestQueue = []; // queued resolvers while refresh happens

const decodeExp = (token) => {
  try {
    const dec = jwtDecode(token);
    return dec.exp ? dec.exp * 1000 : null;
  } catch {
    return null;
  }
};

const willExpireSoon = (token, bufferMs = 90_000) => {
  const expMs = decodeExp(token);
  if (!expMs) return true; // No expiry means invalid token, should refresh
  return Date.now() + bufferMs >= expMs; // within buffer window or already expired
};

// Proactively refresh if token close to expiry before sending request
const ensureFreshToken = async () => {
  const access = getAccessToken();
  const refresh = getRefreshToken();
  if (!access && !refresh) {
    // No tokens at all
    return null;
  }
  if (!access && refresh) {
    // Have refresh token but no access token, try to get one
    await performRefresh();
    return getAccessToken();
  }
  if (!willExpireSoon(access)) return access; // still valid beyond buffer
  // trigger refresh (will self-queue if already running)
  try {
    await performRefresh();
    return getAccessToken();
  } catch (e) {
    console.error('Failed to refresh token proactively:', e);
    return access; // Return current token and let interceptor handle it
  }
};

const performRefresh = async () => {
  if (refreshInFlight) return refreshInFlight; // reuse existing
  const refresh = getRefreshToken();
  if (!refresh) {
    clearTokens();
    return null;
  }
  refreshInFlight = new Promise(async (resolve, reject) => {
    try {
      const resp = await axios.post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refresh });
      const newAccess = resp.data?.access_token;
      const newRefresh = resp.data?.refresh_token || refresh; // backend may or may not rotate refresh token
      if (!newAccess) throw new Error('Invalid refresh response');
      setTokens(newAccess, newRefresh);
      // flush queued requests
      requestQueue.forEach(cb => cb.resolve(newAccess));
      requestQueue = [];
      resolve(newAccess);
    } catch (e) {
      console.error('Token refresh failed:', e);
      requestQueue.forEach(cb => cb.reject(e));
      requestQueue = [];
      clearTokens();
      reject(e);
    } finally {
      refreshInFlight = null;
    }
  });
  return refreshInFlight;
};

// Create axios instance with security defaults
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Attempt proactive refresh if near expiry
    const fresh = await ensureFreshToken();
    if (fresh) config.headers.Authorization = `Bearer ${fresh}`;
    config.headers['X-Timestamp'] = Date.now().toString();
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    // If unauthorized and we have a refresh token, attempt single refresh sequence
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        // No refresh token available, redirect to login
        clearTokens();
        window.location.href = '/';
        return Promise.reject(error);
      }

      try {
        if (!refreshInFlight) {
          // Start refresh (will set refreshInFlight)
          await performRefresh();
        } else {
          // Queue until refresh finishes
          await new Promise((resolve, reject) => {
            requestQueue.push({ resolve, reject });
          });
        }
        const newAccess = getAccessToken();
        if (newAccess) {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return apiClient(originalRequest);
        } else {
          // Refresh succeeded but no token (should not happen)
          throw new Error('No access token after refresh');
        }
      } catch (e) {
        // Refresh failed, redirect to login
        console.error('Token refresh failed in interceptor:', e);
        clearTokens();
        window.location.href = '/';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

// Expose manual refresh trigger (e.g., for background interval or visibility change)
export const forceRefreshIfNeeded = async () => {
  const token = getAccessToken();
  const refresh = getRefreshToken();
  
  // If no tokens at all, can't refresh
  if (!token && !refresh) return false;
  
  // If we have a refresh token but no access token, or token is expired/will expire soon
  if (!token || willExpireSoon(token, 120_000)) {
    try {
      await performRefresh();
      return true;
    } catch (e) {
      console.error('Force refresh failed:', e);
      return false;
    }
  }
  return true; // Token is still valid
};

// Optional: background proactive refresh every 5 minutes
if (typeof window !== 'undefined') {
  // Check every 5 minutes (300 seconds)
  setInterval(() => {
    forceRefreshIfNeeded().catch(err => {
      console.error('Background token refresh failed:', err);
    });
  }, 5 * 60 * 1000); // 5 minutes
  
  // Also check when page becomes visible again
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      forceRefreshIfNeeded().catch(err => {
        console.error('Visibility change token refresh failed:', err);
      });
    }
  });
}

// Secure API methods with input validation
export const workletAPI = {
  // Get worklets with pagination and filtering
  getWorklets: async (params = {}) => {
    try {
      // Validate and sanitize parameters
      const sanitizedParams = {
        page: Math.max(1, parseInt(params.page) || 1),
        limit: Math.min(100, Math.max(1, parseInt(params.limit) || 20)),
        status: params.status?.replace(/[^a-zA-Z\s]/g, '') || '',
        search: params.search?.slice(0, 100) || '', // Limit search length
      };

      const response = await apiClient.get('/api/worklets', { params: sanitizedParams });
      
      // Validate response data
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid worklets data format');
      }

      return response.data.map(worklet => ({
        id: worklet.worklet_id || worklet.id,
        title: String(worklet.title || '').slice(0, 200), // Sanitize title
        description: String(worklet.description || '').slice(0, 1000), // Sanitize description
        status: worklet.status,
        created_at: new Date(worklet.created_at),
        updated_at: new Date(worklet.updated_at),
        // Only include safe fields
      }));
    } catch (error) {
      console.error('Failed to fetch worklets:', error);
      throw new Error('Failed to load worklets');
    }
  },

  // Get single worklet by ID
  getWorklet: async (id) => {
    // Validate ID (should be positive integer)
    const workletId = parseInt(id);
    if (!workletId || workletId <= 0) {
      throw new Error('Invalid worklet ID');
    }

    try {
      const response = await apiClient.get(`/api/worklets/${workletId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Worklet not found');
      }
      throw new Error('Failed to load worklet details');
    }
  },
};

// User API methods
export const userAPI = {
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (error) {
      throw new Error('Failed to get user information');
    }
  },

  updateProfile: async (data) => {
    // Sanitize input data
    const sanitizedData = {
      name: String(data.name || '').slice(0, 100),
      email: String(data.email || '').toLowerCase(),
      // Add other safe fields
    };

    try {
      const response = await apiClient.patch('/auth/profile', sanitizedData);
      return response.data;
    } catch (error) {
      throw new Error('Failed to update profile');
    }
  },
};

export default apiClient;