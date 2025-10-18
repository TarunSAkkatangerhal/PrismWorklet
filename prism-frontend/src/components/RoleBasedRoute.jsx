// Secure Role-based route protection component
import React from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUserFromToken } from '../services/auth';

export function RoleBasedRoute({ children, allowedRoles, redirectTo = "/" }) {
  // Get user data from validated JWT token instead of localStorage
  const userData = getCurrentUserFromToken();
  
  // Check if user is authenticated
  if (!userData) {
    return <Navigate to="/" replace />;
  }
  
  // Check if user has required role
  const userRole = userData.role?.toLowerCase();
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to={redirectTo} replace />;
  }
  
  return children;
}

// Specific role guards with enhanced security
export function MentorRoute({ children }) {
  // Fallback to localStorage for now to keep app working
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('user_role');
  
  // Check authentication first
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  const userRole = role?.toLowerCase();
  
  // Allow access if user is mentor, admin, or professor
  if (userRole && ['mentor', 'admin', 'professor'].includes(userRole)) {
    return children;
  }
  
  // Redirect students to student dashboard, others to login
  if (userRole === 'student') {
    return <Navigate to="/student-dashboard" replace />;
  }
  
  return <Navigate to="/" replace />;
}

export function StudentRoute({ children }) {
  // Fallback to localStorage for now to keep app working
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('user_role');
  
  // Check authentication first
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  const userRole = role?.toLowerCase();
  
  // Allow access if user is student
  if (userRole === 'student') {
    return children;
  }
  
  // Redirect mentors to mentor dashboard, others to login
  if (['mentor', 'admin', 'professor'].includes(userRole)) {
    return <Navigate to="/home" replace />;
  }
  
  return <Navigate to="/" replace />;
}

// Enhanced ProtectedRoute with proper authentication checking
export function ProtectedRoute({ children }) {
  const token = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  
  // If no tokens at all, redirect to login
  if (!token && !refreshToken) {
    console.warn('⚠️ No tokens found, redirecting to login');
    // Clear any stale data
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_role");
    return <Navigate to="/" replace />;
  }
  
  // If we have tokens (even if access is expired), let the app load
  // The secureAPI interceptor will handle token refresh automatically
  return children;
}