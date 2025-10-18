// Secure Authentication Hook - Industry Standard
import { useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

// Secure token management
const TOKEN_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

// Use httpOnly cookies in production instead of localStorage
const secureStorage = {
  getToken: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  
  setToken: (token) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Handle storage errors
    }
  },
  
  removeToken: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
    } catch {
      // Handle storage errors
    }
  }
};

// Token validation and role extraction
const validateAndDecodeToken = (token) => {
  if (!token) return null;
  
  try {
    const decoded = jwtDecode(token);
    
    // Check if token is expired
    const currentTime = Date.now() / 1000;
    if (decoded.exp < currentTime) {
      return null; // Token expired
    }
    
    return {
      userId: decoded.sub,
      role: decoded.role,
      email: decoded.email,
      exp: decoded.exp
    };
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const logout = useCallback(() => {
    secureStorage.removeToken();
    setUser(null);
    // Redirect to login
    window.location.href = '/';
  }, []);

  const refreshToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_KEY);
      if (!refreshToken) throw new Error('No refresh token');

      const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) throw new Error('Refresh failed');

      const data = await response.json();
      secureStorage.setToken(data.access_token);
      localStorage.setItem(REFRESH_KEY, data.refresh_token);
      
      const userData = validateAndDecodeToken(data.access_token);
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return false;
    }
  }, [logout]);

  const checkAuth = useCallback(async () => {
    setLoading(true);
    setError(null);

    const token = secureStorage.getToken();
    const userData = validateAndDecodeToken(token);

    if (userData) {
      setUser(userData);
      setLoading(false);
    } else {
      // Token is expired or invalid, try to refresh
      const refreshToken = localStorage.getItem(REFRESH_KEY);
      if (!refreshToken) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      // Try to refresh token
      try {
        const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        const response = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!response.ok) {
          throw new Error('Refresh failed');
        }

        const data = await response.json();
        secureStorage.setToken(data.access_token);
        localStorage.setItem(REFRESH_KEY, data.refresh_token);
        
        const newUserData = validateAndDecodeToken(data.access_token);
        setUser(newUserData);
      } catch (error) {
        console.error('Token refresh failed in checkAuth:', error);
        setError('Authentication required');
        secureStorage.removeToken();
      }
      setLoading(false);
    }
  }, []); // Empty dependency array - only create once

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  return {
    user,
    loading,
    error,
    logout,
    isAuthenticated: !!user,
    isStudent: user?.role?.toLowerCase() === 'student',
    isMentor: user?.role && ['mentor', 'admin', 'professor'].includes(user.role.toLowerCase())
  };
};