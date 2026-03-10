import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AdminLeftSidebar } from './AdminSidebar';
import { ThemeContext } from '../context/ThemeContext';
import {
  Search, Users, ChevronRight, ChevronLeft, AlertCircle,
  XCircle, Loader2, Building2, Clock, Download,
  UserCheck, UserX, SkipForward
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';

const PendingUsers = () => {
  useDocumentTitle('PRISM Admin - Pending Users');
  const { isDarkMode } = useContext(ThemeContext);

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState('pending');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [actionId, setActionId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, rejected: 0, skipped: 0 });
  const [colleges, setColleges] = useState([]);
  const pageSize = 50;

  const cancelRef = useRef(null);

  /* ── Fetch stats ──────────────────────────────────────────────── */
  const fetchStats = useCallback(async () => {
    try {
      const res = await API.get('/api/admin/pending-users/stats');
      setStats(res.data);
    } catch {
      // silent — stats are supplementary
    }
  }, []);

  /* ── Fetch colleges for dropdown ──────────────────────────────── */
  const fetchColleges = useCallback(async () => {
    try {
      const res = await API.get('/api/admin/pending-users/colleges');
      setColleges(res.data);
    } catch {
      // silent
    }
  }, []);

  /* ── Fetch users (main list) ──────────────────────────────────── */
  const fetchUsers = useCallback(async () => {
    if (cancelRef.current) cancelRef.current.abort();
    const controller = new AbortController();
    cancelRef.current = controller;

    setLoading(true);
    setError('');
    try {
      const params = { status: activeTab, page, page_size: pageSize };
      if (collegeFilter) params.college_id = collegeFilter;
      if (search.trim()) params.search = search.trim();
      const res = await API.get('/api/admin/pending-users', { params, signal: controller.signal });
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch (err) {
      if (err?.code !== 'ERR_CANCELED') {
        setError('Failed to load users. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, collegeFilter, search, page]);

  /* ── Effects ──────────────────────────────────────────────────── */
  useEffect(() => {
    fetchStats();
    fetchColleges();
  }, [fetchStats, fetchColleges]);

  useEffect(() => {
    fetchUsers();
    return () => { if (cancelRef.current) cancelRef.current.abort(); };
  }, [fetchUsers]);

  // Reset to page 1 when tab or filters change
  useEffect(() => { setPage(1); }, [activeTab, collegeFilter, search]);

  const totalPages = Math.ceil(total / pageSize);
  const pagedUsers = users; // already paginated server-side

  const tabs = [
    { key: 'pending', label: 'Pending Users', count: stats.pending, icon: Clock, color: 'amber' },
    { key: 'rejected', label: 'Rejected Users', count: stats.rejected, icon: XCircle, color: 'red' },
    { key: 'skipped', label: 'Skipped Users', count: stats.skipped, icon: SkipForward, color: 'slate' },
  ];

  /* ── Export handler ───────────────────────────────────────────── */
  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const params = { status: activeTab };
      if (collegeFilter) params.college_id = collegeFilter;
      const res = await API.get('/api/admin/pending-users/export', { params, responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prism_${activeTab}_users.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  /* ── Action handler (approve / reject / skip) ─────────────────── */
  const handleAction = async (userId, action) => {
    setActionId(userId);
    try {
      await API.patch(`/api/admin/pending-users/${userId}/status`, { action });
      await Promise.all([fetchUsers(), fetchStats(), fetchColleges()]);
    } catch {
      setError(`Failed to ${action} user. Please try again.`);
    } finally {
      setActionId(null);
    }
  };

  const initials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name[0].toUpperCase();
  };

  const getAvatarColor = (userId) => {
    const colors = [
      'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-rose-500',
      'bg-amber-500', 'bg-teal-500', 'bg-indigo-500', 'bg-cyan-500',
    ];
    return colors[userId % colors.length];
  };

  return (
    <div className="flex h-screen w-full bg-slate-100 text-slate-800 overflow-hidden dark:bg-slate-900 dark:text-slate-200">
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
                  Users
                  <span className={`text-2xl ml-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    ({stats.total})
                  </span>
                </h1>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Manage pending user registrations
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'}`}>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>{stats.pending}</div>
                  <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Pending</div>
                </div>
                <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'}`}>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{stats.rejected}</div>
                  <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Rejected</div>
                </div>
                <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'}`}>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{stats.skipped}</div>
                  <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Skipped</div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Filters bar (tabs + college + search + export) ── */}
          <div className={`flex items-center flex-wrap gap-3 mb-4 p-3 rounded-lg ${
            isDarkMode ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white/60 border-slate-200/50'
          } border shadow-sm`}>
            {/* Tabs inline */}
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? isDarkMode
                        ? 'bg-gradient-to-r from-purple-400 to-indigo-400 text-white shadow-lg border border-purple-200/50'
                        : 'bg-gradient-to-r from-purple-300 to-indigo-300 text-white shadow-lg border border-purple-200/50'
                      : isDarkMode
                        ? 'text-slate-400 hover:text-white hover:bg-slate-700/60 border border-slate-600/40'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-gray-300/60'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                  <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}

            {/* College dropdown */}
            <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm max-w-[180px] ${
              isDarkMode ? 'bg-slate-700/60 border-gray-600/40' : 'bg-white border-gray-300/60'
            }`}>
              <Building2 size={14} className={`shrink-0 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
              <select
                value={collegeFilter}
                onChange={e => setCollegeFilter(e.target.value)}
                className={`bg-transparent outline-none text-sm truncate ${
                  isDarkMode ? 'text-white' : 'text-slate-700'
                }`}
              >
                <option value="">All Colleges</option>
                {colleges.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Search with Name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm transition-all ${
                  isDarkMode
                    ? 'bg-slate-700/60 border-gray-600/40 text-white placeholder-gray-400/60'
                    : 'bg-white border-gray-300/60 text-slate-700 placeholder-gray-500/60'
                }`}
              />
            </div>

            {/* Export */}
            <motion.button
              onClick={handleExport}
              disabled={isExporting}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                isExporting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-gradient-to-r from-purple-400 to-indigo-400 text-white shadow-lg border border-purple-200/50'
                    : 'bg-gradient-to-r from-purple-300 to-indigo-300 text-white shadow-lg border border-purple-200/50'
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

          {/* Showing count + Pagination */}
          {pagedUsers.length > 0 && (
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

          {/* ─── Error banner ──────────────────────────────────── */}
          {error && (
            <div className="flex items-center gap-2 mb-3 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
              <button onClick={() => setError('')} className="ml-auto font-bold">&times;</button>
            </div>
          )}

          {/* ─── Loading overlay ──────────────────────────────────── */}
          {loading && (
            <div className="flex items-center justify-center h-40 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Loading users…</span>
            </div>
          )}

          {/* ─── Table ──────────────────────────────────────────── */}
          {!loading && pagedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
              <Users className="w-10 h-10" />
              <p className="text-lg font-medium">No {activeTab} users found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : !loading && (
            <div className={`rounded-xl overflow-hidden border shadow-sm ${
              isDarkMode ? 'border-slate-700/50' : 'border-slate-200/50'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className={`text-xs font-semibold uppercase tracking-wider ${
                      isDarkMode ? 'bg-slate-800/90 text-slate-400' : 'bg-slate-50 text-slate-500'
                    }`}>
                      <th className="px-4 py-3 text-left w-[220px]">Name</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left w-[120px]">Date</th>
                      <th className="px-4 py-3 text-left w-[110px]">Role Type</th>
                      <th className="px-4 py-3 text-left w-[200px]">College</th>
                      <th className="px-4 py-3 text-center w-[220px]">Action</th>
                    </tr>
                  </thead>
                  <tbody className={isDarkMode ? 'bg-slate-800/40' : 'bg-white'}>
                    <AnimatePresence>
                      {pagedUsers.map((u, idx) => (
                        <motion.tr
                          key={u.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className={`border-t ${
                            isDarkMode ? 'border-slate-700/40 hover:bg-slate-700/30' : 'border-slate-100 hover:bg-purple-50/30'
                          } transition-colors`}
                        >
                          {/* Name + avatar */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${getAvatarColor(u.id)}`}>
                                {initials(u.name)}
                              </div>
                              <span className={`text-sm font-semibold truncate max-w-[160px] ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                {u.name}
                              </span>
                            </div>
                          </td>

                          {/* Email */}
                          <td className={`px-4 py-3 text-sm truncate max-w-[200px] ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {u.email}
                          </td>

                          {/* Date */}
                          <td className={`px-4 py-3 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {u.created_at
                              ? new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '—'}
                          </td>

                          {/* Role Type */}
                          <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {u.role}
                          </td>

                          {/* College */}
                          <td className={`px-4 py-3 text-sm truncate max-w-[180px] ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {u.college_name || '—'}
                          </td>

                          {/* Action buttons */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Approve */}
                              {(activeTab === 'pending' || activeTab === 'rejected' || activeTab === 'skipped') && (
                                <motion.button
                                  onClick={() => handleAction(u.id, 'approve')}
                                  disabled={actionId === u.id}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500 hover:bg-green-600 text-white shadow-sm disabled:opacity-50 transition-all"
                                  whileHover={{ scale: 1.04 }}
                                  whileTap={{ scale: 0.96 }}
                                >
                                  {actionId === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />}
                                  Approve
                                </motion.button>
                              )}

                              {/* Skip */}
                              {(activeTab === 'pending' || activeTab === 'rejected') && (
                                <motion.button
                                  onClick={() => handleAction(u.id, 'skip')}
                                  disabled={actionId === u.id}
                                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50 transition-all ${
                                    isDarkMode
                                      ? 'bg-slate-600 hover:bg-slate-500 text-white'
                                      : 'bg-slate-400 hover:bg-slate-500 text-white'
                                  }`}
                                  whileHover={{ scale: 1.04 }}
                                  whileTap={{ scale: 0.96 }}
                                >
                                  {actionId === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <SkipForward className="w-3 h-3" />}
                                  Skip
                                </motion.button>
                              )}

                              {/* Reject */}
                              {(activeTab === 'pending' || activeTab === 'skipped') && (
                                <motion.button
                                  onClick={() => handleAction(u.id, 'reject')}
                                  disabled={actionId === u.id}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500 hover:bg-red-600 text-white shadow-sm disabled:opacity-50 transition-all"
                                  whileHover={{ scale: 1.04 }}
                                  whileTap={{ scale: 0.96 }}
                                >
                                  {actionId === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserX className="w-3 h-3" />}
                                  Reject
                                </motion.button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default PendingUsers;
