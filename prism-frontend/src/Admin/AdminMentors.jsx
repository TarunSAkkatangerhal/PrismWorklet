import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AdminLeftSidebar } from './AdminSidebar';
import { ThemeContext } from '../context/ThemeContext';
import API from '../api';
import {
  Download, User, Mail, Users, ChevronLeft, ChevronRight,
  Home, Loader2, AlertCircle, Plus, X, Search, CheckCircle, Award,
  UserCheck, UserX, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminMentors = () => {
  useDocumentTitle('PRISM Admin - Mentors');
  const { isDarkMode } = useContext(ThemeContext);

  // State
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [togglingId, setTogglingId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // Add Mentor form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    group_name: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });

  // Fetch mentors
  const fetchMentors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, page_size: pageSize, role: 'Mentor' };
      if (statusFilter !== 'all') params.status = statusFilter;
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
  }, [page, pageSize, search, statusFilter]);

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
        group_name: formData.group_name.trim() || null
      });
      setSubmitMessage({ type: 'success', text: 'Mentor added successfully!' });
      setFormData({ name: '', email: '', group_name: '' });
      fetchMentors();
      setTimeout(() => { setShowAddModal(false); setSubmitMessage({ type: '', text: '' }); }, 1200);
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

  const activeCount = mentors.filter(m => m.is_active).length;
  const inactiveCount = mentors.filter(m => !m.is_active).length;

  return (
    <div className={`flex h-screen w-full ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-slate-100 text-slate-800'} overflow-hidden`}>
      <AdminLeftSidebar />

      <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
        <div className="max-w-none mx-0 p-4 pl-6">

          {/* ─── Header ─────────────────────────────────────────── */}
          <div className={`${
            isDarkMode
              ? 'bg-gradient-to-r from-slate-800/80 via-slate-700/50 to-slate-800/80 backdrop-blur-sm border-slate-700/50'
              : 'bg-gradient-to-r from-white/80 via-purple-50/50 to-indigo-50/30 backdrop-blur-sm border-purple-200/30'
          } rounded-2xl shadow-lg border p-4 mb-4`}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-4xl font-bold font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Mentors
                </h1>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Manage and monitor all mentors across the platform
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'}`}>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{total}</div>
                  <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total</div>
                </div>
                <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'}`}>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{activeCount}</div>
                  <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Active</div>
                </div>
                <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'}`}>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{inactiveCount}</div>
                  <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Inactive</div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Filters bar ────────────────────────────────────── */}
          <div className={`flex items-center flex-wrap gap-3 mb-4 p-3 rounded-lg ${
            isDarkMode ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white/60 border-slate-200/50'
          } border shadow-sm`}>
              {/* Status sliding tabs */}
              <div className={`flex items-center rounded-xl p-1 ${
                isDarkMode ? 'bg-slate-700/60' : 'bg-slate-100'
              }`}>
                {[
                  { value: 'all', label: 'All' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setStatusFilter(opt.value); setPage(1); }}
                    className={`relative px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      statusFilter === opt.value
                        ? isDarkMode
                          ? 'text-white'
                          : 'text-white'
                        : isDarkMode
                          ? 'text-slate-400 hover:text-slate-200'
                          : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {statusFilter === opt.value && (
                      <motion.div
                        layoutId="mentorStatusTab"
                        className={`absolute inset-0 rounded-lg ${
                          opt.value === 'active'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                            : opt.value === 'inactive'
                              ? 'bg-gradient-to-r from-red-500 to-rose-500'
                              : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                        } shadow-md`}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      {opt.value === 'active' && <CheckCircle size={13} />}
                      {opt.value === 'inactive' && <XCircle size={13} />}
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-64">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm transition-all ${
                    isDarkMode
                      ? 'bg-slate-700/60 border-gray-600/40 text-white placeholder-gray-400/60'
                      : 'bg-white border-gray-300/60 text-slate-700 placeholder-gray-500/60'
                  }`}
                />
              </div>

              <div className="flex items-center gap-3 ml-auto">
              {/* Add Mentor */}
              <motion.button
                onClick={() => { setShowAddModal(true); setSubmitMessage({ type: '', text: '' }); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isDarkMode
                    ? 'bg-slate-700/50 text-gray-300 border border-gray-700/30 hover:text-white'
                    : 'bg-white/60 text-gray-700 border border-gray-300/40 hover:text-gray-800'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus size={15} />
                <span>Add Mentor</span>
              </motion.button>

              {/* Export */}
              <motion.button
                onClick={handleExport}
                disabled={isExporting}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isExporting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg border border-green-500/50'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg border border-green-400/50'
                }`}
                whileHover={isExporting ? {} : { scale: 1.02 }}
                whileTap={isExporting ? {} : { scale: 0.98 }}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    <span>Export</span>
                  </>
                )}
              </motion.button>
              </div>
          </div>

          {/* Showing count + Pagination */}
          {!loading && !error && mentors.length > 0 && (
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <motion.button
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    className={`p-1.5 rounded-lg border text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                      isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ChevronLeft size={16} />
                  </motion.button>
                  {(() => {
                    const pageNumbers = [];
                    const maxVisible = 5;
                    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
                    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                    if (endPage - startPage < maxVisible - 1) {
                      startPage = Math.max(1, endPage - maxVisible + 1);
                    }
                    if (startPage > 1) {
                      pageNumbers.push(
                        <motion.button key={1} onClick={() => setPage(1)} className={`min-w-[28px] h-7 px-1.5 rounded-md text-xs font-medium transition-all ${isDarkMode ? 'border border-slate-600 text-slate-300 hover:bg-slate-700' : 'border border-slate-300 text-slate-600 hover:bg-slate-100'}`} whileTap={{ scale: 0.95 }}>1</motion.button>
                      );
                      if (startPage > 2) pageNumbers.push(<span key="e1" className={`px-1 text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>...</span>);
                    }
                    for (let i = startPage; i <= endPage; i++) {
                      pageNumbers.push(
                        <motion.button key={i} onClick={() => setPage(i)} className={`min-w-[28px] h-7 px-1.5 rounded-md text-xs font-medium transition-all ${page === i ? (isDarkMode ? 'bg-purple-500 text-white border border-purple-400' : 'bg-purple-600 text-white border border-purple-500') : (isDarkMode ? 'border border-slate-600 text-slate-300 hover:bg-slate-700' : 'border border-slate-300 text-slate-600 hover:bg-slate-100')}`} whileTap={{ scale: 0.95 }}>{i}</motion.button>
                      );
                    }
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) pageNumbers.push(<span key="e2" className={`px-1 text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>...</span>);
                      pageNumbers.push(
                        <motion.button key={totalPages} onClick={() => setPage(totalPages)} className={`min-w-[28px] h-7 px-1.5 rounded-md text-xs font-medium transition-all ${isDarkMode ? 'border border-slate-600 text-slate-300 hover:bg-slate-700' : 'border border-slate-300 text-slate-600 hover:bg-slate-100'}`} whileTap={{ scale: 0.95 }}>{totalPages}</motion.button>
                      );
                    }
                    return pageNumbers;
                  })()}
                  <motion.button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className={`p-1.5 rounded-lg border text-sm transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                      isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ChevronRight size={16} />
                  </motion.button>
                </div>
              )}
            </div>
          )}

          {/* ─── Table ──────────────────────────────────────────── */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-red-500 gap-2">
              <AlertCircle className="w-8 h-8" />
              <p>{error}</p>
            </div>
          ) : mentors.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
              <Award className="w-10 h-10" />
              <p className="text-lg font-medium">No mentors found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className={`rounded-xl overflow-hidden border shadow-sm ${
              isDarkMode ? 'border-slate-700/50' : 'border-slate-200/50'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className={`text-xs font-semibold uppercase tracking-wider ${
                      isDarkMode ? 'bg-slate-800/90 text-slate-400' : 'bg-slate-50 text-slate-500'
                    }`}>
                      <th className="px-4 py-3 text-left">Mentor Name</th>
                      <th className="px-4 py-3 text-left">Mentor UserID</th>
                      <th className="px-4 py-3 text-left">Last Login</th>
                      <th className="px-4 py-3 text-center w-[100px]">Status</th>
                      <th className="px-4 py-3 text-center w-[120px]">Action</th>
                    </tr>
                  </thead>
                  <tbody className={isDarkMode ? 'bg-slate-800/40' : 'bg-white'}>
                    {mentors.map((mentor) => (
                      <tr
                        key={mentor.id}
                        className={`border-b ${isDarkMode ? 'border-slate-700/50 hover:bg-slate-700/30' : 'border-slate-100 hover:bg-slate-50'} transition-colors`}
                      >
                        <td className={`px-4 py-3 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {mentor.name || '—'}
                        </td>
                        <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          {mentor.email || '—'}
                        </td>
                        <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          {formatDate(mentor.created_at)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {mentor.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                              <CheckCircle className="w-3 h-3" /> Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                              <XCircle className="w-3 h-3" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <motion.button
                            onClick={() => toggleStatus(mentor.id)}
                            disabled={togglingId === mentor.id}
                            className={`inline-flex items-center justify-center gap-1 min-w-[110px] px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              mentor.is_active
                                ? isDarkMode
                                  ? 'bg-red-600/70 hover:bg-red-500 text-white'
                                  : 'bg-red-500 hover:bg-red-600 text-white'
                                : isDarkMode
                                  ? 'bg-green-600/70 hover:bg-green-500 text-white'
                                  : 'bg-green-500 hover:bg-green-600 text-white'
                            } disabled:opacity-50 shadow-sm`}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                          >
                            {togglingId === mentor.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : mentor.is_active ? (
                              <>
                                <UserX className="w-3 h-3" /> Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3 h-3" /> Activate
                              </>
                            )}
                          </motion.button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
      {/* Add Mentor Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) { setShowAddModal(false); setSubmitMessage({ type: '', text: '' }); } }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className={`relative w-full max-w-lg mx-4 rounded-xl shadow-2xl ${
                isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
              }`}
            >
              {/* Modal Header */}
              <div className={`flex items-center justify-between px-6 py-4 border-b ${
                isDarkMode ? 'border-slate-700' : 'border-gray-200'
              }`}>
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  Add New Mentor
                </h2>
                <button
                  onClick={() => { setShowAddModal(false); setSubmitMessage({ type: '', text: '' }); }}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  {/* Name Field */}
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Name <span className="text-red-400">*</span>
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
                        } focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm`}
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      UserID <span className="text-red-400">*</span>
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
                        } focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm`}
                      />
                    </div>
                  </div>

                  {/* Group Name Field */}
                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Group Name
                    </label>
                    <div className="relative">
                      <Users className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} />
                      <input
                        type="text"
                        name="group_name"
                        value={formData.group_name}
                        onChange={handleInputChange}
                        placeholder="Enter group name"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                          isDarkMode
                            ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        } focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm`}
                      />
                    </div>
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

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => { setShowAddModal(false); setSubmitMessage({ type: '', text: '' }); }}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isDarkMode
                        ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Mentor
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminMentors;
