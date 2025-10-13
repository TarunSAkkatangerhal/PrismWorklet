// Secure Dashboard Analytics API Client
import DOMPurify from 'dompurify';
import secureAPI from './secureAPI';

// Input sanitization for analytics data
const sanitizeAnalyticsData = (data) => {
  if (!data || typeof data !== 'object') return {};
  
  return {
    ...data,
    labels: Array.isArray(data.labels) 
      ? data.labels.map(label => DOMPurify.sanitize(String(label), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }))
      : [],
    values: Array.isArray(data.values) 
      ? data.values.map(val => Math.max(0, parseFloat(val) || 0))
      : []
  };
};

export const secureDashboardAPI = {
  getAnalytics: async () => {
    try {
      const response = await secureAPI.get('/api/dashboard/analytics');
      return sanitizeAnalyticsData(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      throw new Error('Failed to load analytics data');
    }
  },

  getRecentActivity: async (limit = 10) => {
    try {
      const sanitizedLimit = Math.min(50, Math.max(1, parseInt(limit) || 10));
      const response = await secureAPI.get('/api/dashboard/activity', {
        params: { limit: sanitizedLimit }
      });

      if (!Array.isArray(response.data)) {
        throw new Error('Invalid activity data format');
      }

      return response.data.map(activity => ({
        id: activity.id,
        type: DOMPurify.sanitize(activity.type || '', { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }),
        message: DOMPurify.sanitize(activity.message || '', { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).slice(0, 200),
        timestamp: new Date(activity.timestamp),
        user: DOMPurify.sanitize(activity.user || '', { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
      }));
    } catch (error) {
      console.error('Failed to fetch activity:', error);
      throw new Error('Failed to load recent activity');
    }
  },

  getStats: async () => {
    try {
      const response = await secureAPI.get('/api/dashboard/stats');
      
      return {
        totalWorklets: Math.max(0, parseInt(response.data.totalWorklets) || 0),
        activeWorklets: Math.max(0, parseInt(response.data.activeWorklets) || 0),
        completedWorklets: Math.max(0, parseInt(response.data.completedWorklets) || 0),
        totalStudents: Math.max(0, parseInt(response.data.totalStudents) || 0),
        completionRate: Math.min(100, Math.max(0, parseFloat(response.data.completionRate) || 0))
      };
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      throw new Error('Failed to load dashboard statistics');
    }
  }
};

export default secureDashboardAPI;