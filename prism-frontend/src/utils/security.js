// Security Configuration and Utilities
import DOMPurify from 'dompurify';

// Security constants
export const SECURITY_CONFIG = {
  // Token settings
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
  MAX_TOKEN_AGE: 24 * 60 * 60 * 1000, // 24 hours
  
  // Input validation
  MAX_INPUT_LENGTH: {
    SEARCH: 100,
    TITLE: 200,
    DESCRIPTION: 1000,
    NAME: 50,
    EMAIL: 254
  },
  
  // Rate limiting
  MAX_REQUESTS_PER_MINUTE: 60,
  
  // File upload (if needed)
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'],
  
  // Content Security Policy
  CSP_DIRECTIVES: {
    'default-src': "'self'",
    'script-src': "'self' 'unsafe-inline'",
    'style-src': "'self' 'unsafe-inline'",
    'img-src': "'self' data: https:",
    'connect-src': "'self' http://localhost:8000 https:",
    'font-src': "'self'",
    'object-src': "'none'",
    'media-src': "'self'",
    'frame-src': "'none'"
  }
};

// Input sanitization utilities
export const sanitizeInput = (input, options = {}) => {
  if (typeof input !== 'string') return input;
  
  const maxLength = options.maxLength || SECURITY_CONFIG.MAX_INPUT_LENGTH.DESCRIPTION;
  const allowedTags = options.allowedTags || [];
  const allowedAttrs = options.allowedAttrs || [];
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttrs,
    MAX_INPUT_LENGTH: maxLength
  }).slice(0, maxLength);
};

// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= SECURITY_CONFIG.MAX_INPUT_LENGTH.EMAIL;
};

// Password strength validation
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return {
    isValid: password.length >= minLength && hasUppercase && hasLowercase && hasNumbers && hasSpecial,
    requirements: {
      minLength: password.length >= minLength,
      hasUppercase,
      hasLowercase,
      hasNumbers,
      hasSpecial
    }
  };
};

// XSS protection
export const escapeHTML = (str) => {
  if (typeof str !== 'string') return str;
  
  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  return str.replace(/[&<>"'/]/g, (match) => htmlEntities[match]);
};

// Rate limiting utility
class RateLimiter {
  constructor(maxRequests = SECURITY_CONFIG.MAX_REQUESTS_PER_MINUTE) {
    this.maxRequests = maxRequests;
    this.requests = new Map();
  }
  
  canMakeRequest(identifier = 'global') {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const userRequests = this.requests.get(identifier);
    
    // Remove old requests
    while (userRequests.length > 0 && userRequests[0] < windowStart) {
      userRequests.shift();
    }
    
    if (userRequests.length >= this.maxRequests) {
      return false;
    }
    
    userRequests.push(now);
    return true;
  }
}

export const rateLimiter = new RateLimiter();

// Secure storage utilities
export const secureStorage = {
  setItem: (key, value) => {
    try {
      const sanitizedKey = sanitizeInput(key, { maxLength: 50 });
      const timestamp = Date.now();
      const data = { value, timestamp };
      localStorage.setItem(sanitizedKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to store item:', error);
    }
  },
  
  getItem: (key, maxAge = SECURITY_CONFIG.MAX_TOKEN_AGE) => {
    try {
      const sanitizedKey = sanitizeInput(key, { maxLength: 50 });
      const stored = localStorage.getItem(sanitizedKey);
      
      if (!stored) return null;
      
      const data = JSON.parse(stored);
      const age = Date.now() - data.timestamp;
      
      if (age > maxAge) {
        localStorage.removeItem(sanitizedKey);
        return null;
      }
      
      return data.value;
    } catch (error) {
      console.error('Failed to retrieve item:', error);
      return null;
    }
  },
  
  removeItem: (key) => {
    try {
      const sanitizedKey = sanitizeInput(key, { maxLength: 50 });
      localStorage.removeItem(sanitizedKey);
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }
};

// Security headers utility
export const addSecurityHeaders = (config) => {
  return {
    ...config,
    headers: {
      ...config.headers,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  };
};

// Error logging (avoid sensitive data)
export const secureLog = {
  error: (message, context = {}) => {
    const sanitizedContext = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.pathname,
      // Don't log sensitive data
      ...Object.fromEntries(
        Object.entries(context).filter(([key]) => 
          !['password', 'token', 'email', 'phone'].includes(key.toLowerCase())
        )
      )
    };
    
    console.error(sanitizeInput(message), sanitizedContext);
  },
  
  info: (message, context = {}) => {
    console.info(sanitizeInput(message), context);
  }
};

export default {
  SECURITY_CONFIG,
  sanitizeInput,
  isValidEmail,
  validatePassword,
  escapeHTML,
  rateLimiter,
  secureStorage,
  addSecurityHeaders,
  secureLog
};