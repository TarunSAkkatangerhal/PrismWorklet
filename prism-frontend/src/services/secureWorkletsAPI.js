// Secure Worklets API Client
// Re-exports the main API client with additional worklet-specific methods
import API from '../api';
import DOMPurify from 'dompurify';

// Input sanitization
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [] 
  });
};

// Secure worklets API using shared API client
export const secureWorkletsAPI = {
  getWorklets: async (params = {}) => {
    try {
      // Validate and sanitize parameters
      const sanitizedParams = {
        page: Math.max(1, parseInt(params.page) || 1),
        limit: Math.min(100, Math.max(1, parseInt(params.limit) || 20)),
        status: sanitizeInput(params.status || ''),
        search: sanitizeInput(params.search || '').slice(0, 100),
      };

      const response = await API.get('/api/worklets', { 
        params: sanitizedParams 
      });
      
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid worklets data format');
      }

      return response.data.map(worklet => ({
        id: worklet.worklet_id || worklet.id,
        title: sanitizeInput(worklet.title || '').slice(0, 200),
        description: sanitizeInput(worklet.description || '').slice(0, 1000),
        status: sanitizeInput(worklet.status || ''),
        created_at: new Date(worklet.created_at),
        updated_at: new Date(worklet.updated_at),
        college: sanitizeInput(worklet.college || ''),
      }));
    } catch (error) {
      console.error('Failed to fetch worklets:', error);
      throw new Error('Failed to load worklets');
    }
  },

  getWorklet: async (id) => {
    const workletId = parseInt(id);
    if (!workletId || workletId <= 0) {
      throw new Error('Invalid worklet ID');
    }

    try {
      const response = await API.get(`/api/worklets/${workletId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Worklet not found');
      }
      throw new Error('Failed to load worklet details');
    }
  },
};

// Re-export the main API client as default
export default API;