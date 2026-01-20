import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import secureAPI from '../services/secureAPI';
import { getCurrentUser } from '../services/auth';

/**
 * RequireRegistration wrapper component
 * Checks if student has completed registration and redirects to registration form if not
 */
export default function RequireRegistration({ children }) {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        const currentUser = getCurrentUser();
        
        // Only check for students
        if (currentUser?.role?.toLowerCase() !== 'student') {
          setIsRegistered(true);
          setIsChecking(false);
          return;
        }

        // Check registration status from backend
        const response = await secureAPI.get('/api/students/registration-status');
        
        if (response.data.profile_completed) {
          setIsRegistered(true);
        } else {
          // Redirect to registration form if not completed
          navigate('/student-registration', { replace: true });
        }
      } catch (error) {
        console.error('Error checking registration status:', error);
        // On error, allow access but log the issue
        setIsRegistered(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkRegistrationStatus();
  }, [navigate]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render children only if registered
  return isRegistered ? children : null;
}
