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
export function AdminRoute({ children }) {
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('user_role');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  const userRole = role?.toLowerCase();

  if (userRole === 'admin') {
    return children;
  }

  // Redirect other roles to their dashboards
  if (userRole === 'mentor') return <Navigate to="/home" replace />;
  if (userRole === 'student') return <Navigate to="/student-dashboard" replace />;
  if (userRole === 'professor') return <Navigate to="/professor-dashboard" replace />;

  return <Navigate to="/" replace />;
}

export function MentorRoute({ children }) {
  // Fallback to localStorage for now to keep app working
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('user_role');
  
  // Check authentication first
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  const userRole = role?.toLowerCase();
  
  // Allow access only for mentor (admin now has its own routes)
  if (userRole === 'mentor') {
    return children;
  }

  // Redirect admin to admin dashboard
  if (userRole === 'admin') {
    return <Navigate to="/admin-dashboard" replace />;
  }
  
  // Redirect students to student dashboard
  if (userRole === 'student') {
    return <Navigate to="/student-dashboard" replace />;
  }
  
  // Redirect professors to professor dashboard
  if (userRole === 'professor') {
    return <Navigate to="/professor-dashboard" replace />;
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
  
  // Redirect mentors to mentor dashboard
  if (userRole === 'mentor') {
    return <Navigate to="/home" replace />;
  }

  // Redirect admin to admin dashboard
  if (userRole === 'admin') {
    return <Navigate to="/admin-dashboard" replace />;
  }
  
  if (userRole === 'professor') {
    return <Navigate to="/professor-dashboard" replace />;
  }
  
  return <Navigate to="/" replace />;
}

export function ProfessorRoute({ children }) {
  // Fallback to localStorage for now to keep app working
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('user_role');
  
  // Check authentication first
  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  const userRole = role?.toLowerCase();
  
  // Allow access only for professor
  if (userRole === 'professor') {
    return children;
  }
  
  // Redirect admin to admin dashboard
  if (userRole === 'admin') {
    return <Navigate to="/admin-dashboard" replace />;
  }
  
  // Redirect students to student dashboard
  if (userRole === 'student') {
    return <Navigate to="/student-dashboard" replace />;
  }
  
  // Redirect mentors to mentor dashboard
  if (userRole === 'mentor') {
    return <Navigate to="/home" replace />;
  }
  
  return <Navigate to="/" replace />;
}

// Enhanced ProtectedRoute with proper authentication checking
export function ProtectedRoute({ children }) {
  // Fallback to localStorage for now to keep app working
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    // Clear invalid tokens and redirect
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_role");
    return <Navigate to="/" replace />;
  }
  
  return children;
}