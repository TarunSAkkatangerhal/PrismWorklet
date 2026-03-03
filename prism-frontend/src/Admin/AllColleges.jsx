import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AdminLeftSidebar } from './AdminSidebar';
import { ThemeContext } from '../context/ThemeContext';
import API from '../api';
import {
  Search, Home, ChevronRight, Building2, Loader2,
  Briefcase, GraduationCap, Users, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

// ─── College Card ─────────────────────────────────────────────────────
const CollegeCard = ({ college, isDarkMode, onClick }) => {
  // Generate a consistent color from the college name
  const colors = [
    { bg: 'bg-teal-500', light: 'bg-teal-50 dark:bg-teal-900/20' },
    { bg: 'bg-blue-500', light: 'bg-blue-50 dark:bg-blue-900/20' },
    { bg: 'bg-indigo-500', light: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { bg: 'bg-cyan-500', light: 'bg-cyan-50 dark:bg-cyan-900/20' },
    { bg: 'bg-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-900/20' },
  ];
  const colorIndex = (college.college_name || '').charCodeAt(0) % colors.length;
  const color = colors[colorIndex];

  const initial = (college.college_name || 'C').charAt(0).toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`rounded-xl border cursor-pointer overflow-hidden transition-all duration-200
        ${isDarkMode
          ? 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
          : 'bg-white border-slate-200 hover:border-blue-300'
        }`}
    >
      {/* Top accent bar */}
      <div className={`h-1 ${color.bg}`} />

      {/* Card body */}
      <div className="p-4">
        {/* College icon + name */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-11 h-11 rounded-full ${color.bg} flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0`}>
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={`font-semibold text-sm leading-tight truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              {college.college_name}
            </h3>
            <p className={`text-xs mt-0.5 truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {college.location || 'Location not specified'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-2">
          <StatRow
            label="Total Worklet"
            value={college.workletCount || 0}
            badgeColor="bg-teal-500"
            isDarkMode={isDarkMode}
          />
          <StatRow
            label="Professor"
            value={college.totalProfessors || 0}
            badgeColor="bg-teal-400"
            isDarkMode={isDarkMode}
          />
          <StatRow
            label="Student"
            value={college.totalStudents || 0}
            badgeColor="bg-teal-400"
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
    </motion.div>
  );
};

// ─── Stat Row inside Card ─────────────────────────────────────────────
const StatRow = ({ label, value, badgeColor, isDarkMode }) => (
  <div className="flex items-center justify-between">
    <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
      {label}
    </span>
    <span className={`inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full text-xs font-bold text-white ${badgeColor}`}>
      {value}
    </span>
  </div>
);

// ─── All Colleges Page ────────────────────────────────────────────────
const AllColleges = () => {
  useDocumentTitle('PRISM Admin - All Colleges');
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);

  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        setLoading(true);
        const res = await API.get('/colleges');
        setColleges(res.data || []);
      } catch (err) {
        console.error('Failed to fetch colleges:', err);
        setError('Failed to load colleges');
      } finally {
        setLoading(false);
      }
    };
    fetchColleges();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return colleges;
    const q = search.toLowerCase();
    return colleges.filter(c =>
      (c.college_name || '').toLowerCase().includes(q) ||
      (c.location || '').toLowerCase().includes(q)
    );
  }, [colleges, search]);

  return (
    <div className={`flex h-screen w-full overflow-hidden ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-slate-100 text-slate-800'}`}>
      <AdminLeftSidebar />

      <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
        <div className="p-4 pl-6 max-w-none mx-0">

          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            {/* Title */}
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              College<span className={`ml-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>({filtered.length})</span>
            </h1>

            {/* Right: Breadcrumb + Search */}
            <div className="flex flex-col sm:items-end gap-2">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-1.5 text-sm">
                <button onClick={() => navigate('/admin-dashboard')} className={`flex items-center gap-1 hover:underline ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
                  <Home size={14} /> Home
                </button>
                <ChevronRight size={12} className={isDarkMode ? 'text-slate-600' : 'text-slate-400'} />
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>College({colleges.length})</span>
                <ChevronRight size={12} className={isDarkMode ? 'text-slate-600' : 'text-slate-400'} />
                <span className={isDarkMode ? 'text-blue-400 font-medium' : 'text-blue-600 font-medium'}>All College</span>
              </nav>

              {/* Search */}
              <div className="relative">
                <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  placeholder="Search College"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={`pl-9 pr-4 py-2 rounded-lg border text-sm w-64 outline-none transition-all
                    ${isDarkMode
                      ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-blue-500'
                      : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-blue-500'
                    }`}
                />
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 size={32} className={`animate-spin ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
              <p className={`mt-3 text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Loading colleges...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24">
              <AlertCircle size={32} className="text-red-400" />
              <p className="mt-3 text-sm text-red-400">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Building2 size={40} className={isDarkMode ? 'text-slate-600' : 'text-slate-300'} />
              <p className={`mt-3 text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                {search.trim() ? 'No colleges match your search' : 'No colleges found'}
              </p>
            </div>
          ) : (
            /* ─── College Cards Grid ─── */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((college, idx) => (
                <CollegeCard
                  key={college.college_id}
                  college={college}
                  isDarkMode={isDarkMode}
                  onClick={() => navigate(`/academia_details?collegeId=${college.college_id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AllColleges;
