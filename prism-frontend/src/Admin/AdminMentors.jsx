import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AdminLeftSidebar } from './AdminSidebar';
import { ThemeContext } from '../context/ThemeContext';
import API from '../api';
import {
  Download, User, Mail, Users, ChevronLeft, ChevronRight, ChevronDown,
  Home, Loader2, AlertCircle
} from 'lucide-react';

const AdminMentors = () => {
  useDocumentTitle('PRISM Admin - Mentors');
  const { isDarkMode } = useContext(ThemeContext);

  // State
  const [mentors, setMentors] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [togglingId, setTogglingId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  // Add Mentor form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    college_id: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });

  // Fetch colleges for dropdown
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const res = await API.get('/api/admin/colleges');
        setColleges(res.data || []);
      } catch (err) {
        console.error('Failed to fetch colleges:', err);
      }
    };
    fetchColleges();
  }, []);

  // Fetch mentors
  const fetchMentors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, page_size: pageSize, role: 'Mentor' };
      if (search.trim()) params.search = search.trim();
      const res = await API.get('/api/admin/users', { params });
      setMentors(res.data.users || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to fetch mentors:', err);
      setError('Failed to load mentors');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error message when user starts typing
    if (submitMessage.type === 'error') {
      setSubmitMessage({ type: '', text: '' });
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setSubmitMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setSubmitMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    setSubmitting(true);
    setSubmitMessage({ type: '', text: '' });
    
    try {
      await API.post('/api/admin/mentors', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        college_id: formData.college_id ? parseInt(formData.college_id) : null
      });
      setSubmitMessage({ type: 'success', text: 'Mentor added successfully!' });
      setFormData({ name: '', email: '', college_id: '' });
      fetchMentors();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to add mentor';
      setSubmitMessage({ type: 'error', text: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle mentor status
  const toggleStatus = async (mentorId) => {
    setTogglingId(mentorId);
    try {
      await API.patch(`/api/admin/users/${mentorId}/toggle-active`);
      fetchMentors();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    } finally {
      setTogglingId(null);
    }
  };

  // Export mentors
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await API.get('/api/admin/users/export', {
        params: { role: 'Mentor' },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'mentors_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className={`flex min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <AdminLeftSidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} px-8 py-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h1 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              Add Mentor
            </h1>
            <div className={`flex items-center gap-1.5 text-sm`}>
              <Home className="w-4 h-4 text-teal-500" />
              <span className="text-teal-500">Home</span>
              <span className={isDarkMode ? 'text-slate-500' : 'text-gray-400'}>/</span>
              <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Add Mentor</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Add Mentor Form */}
          <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-sm p-6 mb-6`}>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                {/* Name Field */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Name:
                  </label>
                  <div className="relative">
                    <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter Full Name"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                        isDarkMode
                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all`}
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    UserID:
                  </label>
                  <div className="relative">
                    <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter Samsung EmailID Only"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                        isDarkMode
                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all`}
                    />
                  </div>
                </div>

                {/* College Field */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    Group Name:
                  </label>
                  <div className="relative">
                    <Users className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} />
                    <select
                      name="college_id"
                      value={formData.college_id}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-10 py-2.5 rounded-lg border appearance-none ${
                        isDarkMode
                          ? 'bg-slate-700 border-slate-600 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all`}
                    >
                      <option value="">Select Group</option>
                      {colleges.map(college => (
                        <option key={college.id} value={college.id}>{college.name}</option>
                      ))}
                    </select>
                    <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
                  </div>
                </div>

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-2.5 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit'
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Message */}
              {submitMessage.text && (
                <div className={`mt-4 px-4 py-3 rounded-lg flex items-center gap-2 text-sm ${
                  submitMessage.type === 'success'
                    ? isDarkMode ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-green-50 text-green-700 border border-green-200'
                    : isDarkMode ? 'bg-red-900/30 text-red-400 border border-red-800' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {submitMessage.text}
                </div>
              )}
            </form>
          </div>

          {/* All Mentors Section */}
          <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-sm overflow-hidden`}>
            {/* Section Header */}
            <div className="px-6 py-4">
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                All Mentors({total})
              </h2>
              <div className="mt-3 h-0.5 bg-blue-500 w-full rounded" />
            </div>

            {/* Search and Export Row */}
            <div className="px-6 py-4 flex items-center justify-between">
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search With name"
                className={`w-64 px-4 py-2 rounded-lg border ${
                  isDarkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm`}
              />

              <button
                onClick={handleExport}
                disabled={isExporting}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-20 text-red-500">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  {error}
                </div>
              ) : mentors.length === 0 ? (
                <div className={`flex items-center justify-center py-20 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  No mentors found
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className={`border-y ${isDarkMode ? 'border-slate-700 bg-slate-700/30' : 'border-gray-200 bg-gray-50'}`}>
                      <th className={`px-6 py-3 text-left text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                        Mentor Name
                      </th>
                      <th className={`px-6 py-3 text-left text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                        Mentor UserID
                      </th>
                      <th className={`px-6 py-3 text-left text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                        Last Login
                      </th>
                      <th className={`px-6 py-3 text-center text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                        Status
                      </th>
                      <th className={`px-6 py-3 text-center text-sm font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-gray-100'}`}>
                    {mentors.map((mentor) => (
                      <tr
                        key={mentor.id}
                        className={`${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'} transition-colors`}
                      >
                        <td className={`px-6 py-4 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {mentor.name || '—'}
                        </td>
                        <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          {mentor.email || '—'}
                        </td>
                        <td className={`px-6 py-4 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          {formatDate(mentor.created_at)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            mentor.is_active
                              ? 'bg-emerald-500 text-white'
                              : 'bg-red-500 text-white'
                          }`}>
                            {mentor.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleStatus(mentor.id)}
                            disabled={togglingId === mentor.id}
                            className={`inline-flex items-center justify-center min-w-[100px] px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                              mentor.is_active
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {togglingId === mentor.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              mentor.is_active ? 'Deactivate' : 'Activate'
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={`px-6 py-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'} flex items-center justify-between`}>
                <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} mentors
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={`p-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-slate-600 hover:bg-slate-700 text-white disabled:opacity-40'
                        : 'border-gray-300 hover:bg-gray-100 text-gray-600 disabled:opacity-40'
                    } transition-colors disabled:cursor-not-allowed`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className={`px-3 py-1 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={`p-2 rounded-lg border ${
                      isDarkMode
                        ? 'border-slate-600 hover:bg-slate-700 text-white disabled:opacity-40'
                        : 'border-gray-300 hover:bg-gray-100 text-gray-600 disabled:opacity-40'
                    } transition-colors disabled:cursor-not-allowed`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminMentors;
