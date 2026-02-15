import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AdminLeftSidebar } from './AdminSidebar';
import { ThemeContext } from '../context/ThemeContext';
import API from '../api';
import {
  Search, Users, GraduationCap, BookOpen, ChevronRight, ChevronLeft,
  Download, AlertCircle, UserCheck, UserX, Shield, Home,
  CheckCircle, XCircle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Role tab config ─────────────────────────────────────────── */
const roleTabs = [
  { key: 'Student',   label: 'Student',   icon: GraduationCap },
  { key: 'Professor', label: 'Professor', icon: BookOpen },
];

/* ─── Component ───────────────────────────────────────────────── */
const AdminUsers = () => {
  useDocumentTitle('PRISM Admin - Users');
  const { isDarkMode } = useContext(ThemeContext);

  /* state */
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, students: 0, professors: 0, mentors: 0 });
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeRole, setActiveRole] = useState('Student');
  const [statusFilter, setStatusFilter] = useState('all');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [togglingId, setTogglingId] = useState(null);
  const pageSize = 50;

  /* fetch stats + colleges once */
  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, collegesRes] = await Promise.all([
          API.get('/api/admin/users/stats'),
          API.get('/api/admin/colleges'),
        ]);
        setStats(statsRes.data);
        setColleges(collegesRes.data);
      } catch (e) {
        console.error('Failed to load admin meta:', e);
      }
    };
    load();
  }, []);

  /* fetch users whenever filters change */
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { role: activeRole, page, page_size: pageSize };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (collegeFilter) params.college_id = collegeFilter;
      if (search.trim()) params.search = search.trim();
      const res = await API.get('/api/admin/users', { params });
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('Failed to load users');
      /* dummy fallback so UI is visible */
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [activeRole, statusFilter, collegeFilter, search, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  /* reset page on filter change */
  useEffect(() => { setPage(1); }, [activeRole, statusFilter, collegeFilter, search]);

  /* toggle activate / deactivate */
  const handleToggleActive = async (userId) => {
    setTogglingId(userId);
    try {
      await API.patch(`/api/admin/users/${userId}/toggle-active`);
      // Refresh both list and stats
      await fetchUsers();
      const statsRes = await API.get('/api/admin/users/stats');
      setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to toggle user status:', err);
    } finally {
      setTogglingId(null);
    }
  };

  /* export to CSV */
  const handleExport = () => {
    if (!users.length) return;
    const headers = ['Name', 'College ID', 'Involved Worklets', 'Email', 'College', 'Created On', 'Status', 'UID'];
    const rows = users.map(u => [
      u.name, u.student_id || '', u.involved_worklets, u.email,
      u.college_name || '', u.created_at ? new Date(u.created_at).toLocaleDateString() : '',
      u.is_active ? 'Active' : 'Inactive', u.id,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${activeRole.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(total / pageSize);

  /* avatar initials */
  const initials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name[0].toUpperCase();
  };

  const avatarColors = [
    'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-rose-500',
    'bg-amber-500', 'bg-teal-500', 'bg-indigo-500', 'bg-cyan-500',
  ];

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
                </h1>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Manage all users across the platform
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'}`}>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{stats.total}</div>
                  <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total</div>
                </div>
                <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'}`}>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>{stats.students}</div>
                  <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Students</div>
                </div>
                <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'}`}>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{stats.professors}</div>
                  <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Professors</div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Role Tabs ──────────────────────────────────────── */}
          <div className="flex flex-wrap gap-2 mb-4">
            {roleTabs.map(tab => {
              const active = activeRole === tab.key;
              const count = tab.key === 'Student' ? stats.students : stats.professors;
              return (
                <motion.button
                  key={tab.key}
                  onClick={() => setActiveRole(tab.key)}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? isDarkMode
                        ? 'bg-gradient-to-r from-purple-400 to-indigo-400 text-white shadow-lg border border-purple-200/50'
                        : 'bg-gradient-to-r from-purple-300 to-indigo-300 text-white shadow-lg border border-purple-200/50'
                      : isDarkMode
                        ? 'bg-slate-700/50 text-gray-300 border border-gray-700/30 hover:bg-gradient-to-r hover:from-gray-800/40 hover:to-gray-700/40 hover:text-white'
                        : 'bg-white/60 text-gray-700 border border-gray-300/40 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 hover:text-gray-800'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <tab.icon size={16} />
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    active ? 'bg-white/20 text-white' : isDarkMode ? 'bg-gray-800/30 text-gray-300' : 'bg-gray-100/80 text-gray-700'
                  }`}>
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* ─── Filters bar ────────────────────────────────────── */}
          <div className={`flex items-center flex-wrap gap-3 mb-4 p-4 rounded-lg ${
            isDarkMode ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white/60 border-slate-200/50'
          } border shadow-sm`}>
            {/* Status dropdown */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                isDarkMode
                  ? 'bg-slate-700/60 border-gray-600/40 text-white'
                  : 'bg-white border-gray-300/60 text-slate-700'
              }`}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* College dropdown */}
            <select
              value={collegeFilter}
              onChange={e => setCollegeFilter(e.target.value)}
              className={`px-3 py-2 rounded-lg border text-sm transition-all max-w-[220px] ${
                isDarkMode
                  ? 'bg-slate-700/60 border-gray-600/40 text-white'
                  : 'bg-white border-gray-300/60 text-slate-700'
              }`}
            >
              <option value="">All Colleges</option>
              {colleges.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Search with name or email..."
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
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isDarkMode
                  ? 'bg-green-600/80 hover:bg-green-500 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              } shadow-sm`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Download size={15} />
              <span>Export</span>
            </motion.button>
          </div>

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
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
              <Users className="w-10 h-10" />
              <p className="text-lg font-medium">No users found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className={`rounded-xl overflow-hidden border shadow-sm ${
              isDarkMode ? 'border-slate-700/50' : 'border-slate-200/50'
            }`}>
              {/* Table head */}
              <div className={`overflow-x-auto`}>
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className={`text-xs font-semibold uppercase tracking-wider ${
                      isDarkMode ? 'bg-slate-800/90 text-slate-400' : 'bg-slate-50 text-slate-500'
                    }`}>
                      <th className="px-4 py-3 text-left w-[220px]">Name</th>
                      <th className="px-4 py-3 text-left w-[110px]">College ID</th>
                      <th className="px-4 py-3 text-center w-[100px]">Involved Worklet</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left w-[200px]">College</th>
                      <th className="px-4 py-3 text-left w-[100px]">Created On</th>
                      <th className="px-4 py-3 text-center w-[90px]">Status</th>
                      <th className="px-4 py-3 text-center w-[110px]">Action</th>
                      <th className="px-4 py-3 text-center w-[60px]">UID</th>
                    </tr>
                  </thead>
                  <tbody className={isDarkMode ? 'bg-slate-800/40' : 'bg-white'}>
                    <AnimatePresence>
                      {users.map((u, idx) => (
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
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                avatarColors[u.id % avatarColors.length]
                              }`}>
                                {initials(u.name)}
                              </div>
                              <span className={`text-sm font-medium truncate max-w-[160px] ${
                                isDarkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-700'
                              } cursor-pointer`}>
                                {u.name}
                              </span>
                            </div>
                          </td>

                          {/* College ID / Student ID */}
                          <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            {u.student_id || '—'}
                          </td>

                          {/* Involved worklets */}
                          <td className="px-4 py-3 text-center">
                            <span className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                              {u.involved_worklets}
                            </span>
                          </td>

                          {/* Email */}
                          <td className={`px-4 py-3 text-sm truncate max-w-[200px] ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {u.email}
                          </td>

                          {/* College */}
                          <td className={`px-4 py-3 text-sm truncate max-w-[180px] ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {u.college_name || '—'}
                          </td>

                          {/* Created on */}
                          <td className={`px-4 py-3 text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </td>

                          {/* Status badge */}
                          <td className="px-4 py-3 text-center">
                            {u.is_active ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                                <CheckCircle className="w-3 h-3" /> Approved
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                                <XCircle className="w-3 h-3" /> Inactive
                              </span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="px-4 py-3 text-center">
                            <motion.button
                              onClick={() => handleToggleActive(u.id)}
                              disabled={togglingId === u.id}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                u.is_active
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
                              {togglingId === u.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : u.is_active ? (
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

                          {/* UID */}
                          <td className={`px-4 py-3 text-center text-xs font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {u.id}
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={`flex items-center justify-between px-4 py-3 border-t ${
                  isDarkMode ? 'border-slate-700/40 bg-slate-800/60' : 'border-slate-100 bg-slate-50/60'
                }`}>
                  <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
                  </span>
                  <div className="flex items-center gap-2">
                    <motion.button
                      disabled={page <= 1}
                      onClick={() => setPage(p => p - 1)}
                      className={`p-1.5 rounded-lg border text-sm transition-all disabled:opacity-30 ${
                        isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ChevronLeft size={16} />
                    </motion.button>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {page} / {totalPages}
                    </span>
                    <motion.button
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => p + 1)}
                      className={`p-1.5 rounded-lg border text-sm transition-all disabled:opacity-30 ${
                        isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-600 hover:bg-slate-100'
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ChevronRight size={16} />
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminUsers;
