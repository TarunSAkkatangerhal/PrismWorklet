// Secure API Client - Industry Standard
import axios from 'axios';

// Environment-based configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_TIMEOUT = 30000; // 30 seconds

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
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for replay attack protection
    config.headers['X-Timestamp'] = Date.now().toString();
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle auth errors
apiClient.interceptors.response.use(
  (response) => {
    // Validate response structure
    if (response.data && typeof response.data === 'object') {
      return response;
    }
    throw new Error('Invalid response format');
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt token refresh
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken
          });
          
          const newToken = response.data.access_token;
          localStorage.setItem('access_token', newToken);
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.clear();
        window.location.href = '/';
      }
    }

    // Handle other errors
    if (error.response?.status >= 500) {
      console.error('Server error:', error);
    }

    return Promise.reject(error);
  }
);

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