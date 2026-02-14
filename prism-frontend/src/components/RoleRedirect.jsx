// Component to redirect users to their appropriate dashboard based on role
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUserFromToken } from '../services/auth';
import { secureLog } from '../utils/security';

export default function RoleRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const redirectBasedOnRole = async () => {
      try {
        const user = getCurrentUserFromToken();
        const currentPath = location.pathname;
        
        if (!user || !user.role) {
          // No valid user found, redirect to login
          secureLog.error('No valid user token found, redirecting to login');
          navigate('/', { replace: true });
          return;
        }
        
        // Avoid infinite redirects by checking current path
        if (user.role.toLowerCase() === 'student' && currentPath !== '/student-dashboard') {
          navigate('/student-dashboard', { replace: true });
        } else if (user.role.toLowerCase() === 'professor' && currentPath !== '/professor-dashboard') {
          navigate('/professor-dashboard', { replace: true });
        } else if (user.role.toLowerCase() === 'admin' && currentPath !== '/admin-dashboard') {
          navigate('/admin-dashboard', { replace: true });
        } else if (user.role.toLowerCase() === 'mentor' && currentPath !== '/home') {
          navigate('/home', { replace: true });
        }
      } catch (error) {
        secureLog.error('Error during role redirect', { error: error.message });
        navigate('/', { replace: true });
      }
    };

    redirectBasedOnRole();
  }, [navigate, location]);

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}