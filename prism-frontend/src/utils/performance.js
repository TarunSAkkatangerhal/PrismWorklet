/**
 * Performance Utility
 * Centralized performance mapping for consistent display across the application
 */

// Performance mapping - defined once
const PERFORMANCE_MAP = {
  0: 'NA',
  1: 'Poor',
  2: 'Average',
  3: 'Good',
  4: 'Very Good',
  5: 'Very Good'
};

/**
 * Normalize performance value
 * @param {string|number|null} performance - Raw performance value from backend
 * @returns {string|null} - Normalized performance string or null
 */
export const normalizePerformance = (performance) => {
  if (performance === null || performance === undefined) {
    return null;
  }

  // If it's already a string, return it directly
  if (typeof performance === 'string') {
    return performance;
  }

  // If it's a number, map it to string
  if (typeof performance === 'number') {
    return PERFORMANCE_MAP[performance] || null;
  }

  // Try to parse as int if it's a numeric string
  const numPerf = parseInt(performance);
  if (!isNaN(numPerf)) {
    return PERFORMANCE_MAP[numPerf] || null;
  }

  return null;
};

/**
 * Get Tailwind CSS classes for performance badge color
 * @param {string} performance - Normalized performance string
 * @returns {string} - Tailwind CSS classes for badge styling
 */
export const getPerformanceColor = (performance) => {
  if (!performance) {
    return 'bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700';
  }

  const perfLower = performance.toLowerCase();
  
  if (perfLower === 'na' || perfLower === 'not applicable') {
    return 'bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700';
  }
  
  if (perfLower === 'very good') {
    return 'bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700';
  }
  
  if (perfLower === 'good') {
    return 'bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700';
  }
  
  if (perfLower === 'average') {
    return 'bg-gradient-to-r from-yellow-500 to-amber-600 dark:from-yellow-600 dark:to-amber-700';
  }
  
  if (perfLower === 'poor') {
    return 'bg-gradient-to-r from-red-500 to-pink-600 dark:from-red-600 dark:to-pink-700';
  }

  // Default
  return 'bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-700';
};
