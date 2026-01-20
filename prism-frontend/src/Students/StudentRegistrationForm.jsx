import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import secureAPI from '../services/secureAPI';
import { getCurrentUser } from '../services/auth';
import prismLogo from '../assets/prism_logo.png';
import { User, Calendar, Phone, Building2, Award, BookOpen } from 'lucide-react';

export default function StudentRegistrationForm() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [colleges, setColleges] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    phone: '',
    college_name: '',
    college_roll_no: '',
    qualification: '',
    branch: '',
    batch_from: '',
    batch_to: ''
  });

  // Load current user and colleges on mount
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const response = await secureAPI.get('/api/colleges');
      setColleges(response.data || []);
    } catch (error) {
      console.error('Error fetching colleges:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validate required fields
    if (!formData.phone || !formData.college_name || !formData.college_roll_no || 
        !formData.qualification || !formData.branch || !formData.batch_from || !formData.batch_to) {
      setError('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    // Validate batch dates
    if (new Date(formData.batch_from) > new Date(formData.batch_to)) {
      setError('Batch From date must be before Batch To date');
      setIsLoading(false);
      return;
    }

    try {
      const response = await secureAPI.post('/api/students/complete-registration', {
        contact_number: formData.phone,
        college_name: formData.college_name,
        student_id: formData.college_roll_no,
        qualification: formData.qualification,
        program: formData.branch,
        batch_from: formData.batch_from,
        batch_to: formData.batch_to
      });

      if (response.data.profile_completed) {
        // Successfully completed registration, navigate to dashboard
        navigate('/student-dashboard');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.detail || 'Failed to complete registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
          <div className="flex items-center justify-center mb-4">
            <img src={prismLogo} alt="PRISM Logo" className="h-16 w-16" />
          </div>
          <h1 className="text-3xl font-bold text-center mb-2">Complete Your Profile</h1>
          <p className="text-center text-blue-100">Help us know you better to personalize your experience</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* BASIC INFO */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">BASIC INFO</h2>
            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={currentUser?.name || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={currentUser?.email || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* College Name and College Roll No */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    College Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="college_name"
                    value={formData.college_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select College</option>
                    {colleges.map((college) => (
                      <option key={college.college_id} value={college.college_name}>
                        {college.college_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    College Roll No <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="college_roll_no"
                    value={formData.college_roll_no}
                    onChange={handleChange}
                    placeholder="Enter roll number"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Qualification */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Qualification <span className="text-red-500">*</span>
                </label>
                <select
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Select Qualification</option>
                  <option value="B.Tech">B.Tech</option>
                  <option value="B.E">B.E</option>
                  <option value="M.Tech">M.Tech</option>
                  <option value="M.E">M.E</option>
                  <option value="BCA">BCA</option>
                  <option value="MCA">MCA</option>
                  <option value="B.Sc">B.Sc</option>
                  <option value="M.Sc">M.Sc</option>
                  <option value="PhD">PhD</option>
                </select>
              </div>

              {/* Branch */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch <span className="text-red-500">*</span>
                </label>
                <select
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Select Branch</option>
                  <option value="Computer Science Engineering">Computer Science Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics and Communication">Electronics and Communication</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Cyber Security">Cyber Security</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Batch From and To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="date"
                      name="batch_from"
                      value={formData.batch_from}
                      onChange={handleChange}
                      placeholder="Batch From"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="text-xs text-gray-500 mt-1 block">Batch From</span>
                  </div>
                  <div>
                    <input
                      type="date"
                      name="batch_to"
                      value={formData.batch_to}
                      onChange={handleChange}
                      placeholder="Batch To"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="text-xs text-gray-500 mt-1 block">Batch To</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className={`px-8 py-3 rounded-lg font-semibold text-white transition-all ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Completing Registration...
                </span>
              ) : (
                'Complete Registration'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
