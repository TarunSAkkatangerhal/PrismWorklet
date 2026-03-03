import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AdminLeftSidebar } from './AdminSidebar';
import { ThemeContext } from '../context/ThemeContext';
import API from '../api';
import {
  Search, Building2, Loader2, Grid3X3, List, Plus, FileCheck,
  Briefcase, GraduationCap, Users, AlertCircle, ChevronRight, MapPin
} from 'lucide-react';
import { motion } from 'framer-motion';

// ─── Filter options ───────────────────────────────────────────────────
const filterOptions = [
  { key: 'all', label: 'All Colleges', icon: Building2, color: 'blue' },
];

// ─── Accent colors for cards ──────────────────────────────────────────
const accentColors = [
  { bg: 'bg-teal-500', gradient: 'from-teal-500 to-emerald-500' },
  { bg: 'bg-blue-500', gradient: 'from-blue-500 to-indigo-500' },
  { bg: 'bg-indigo-500', gradient: 'from-indigo-500 to-purple-500' },
  { bg: 'bg-cyan-500', gradient: 'from-cyan-500 to-blue-500' },
  { bg: 'bg-emerald-500', gradient: 'from-emerald-500 to-teal-500' },
];
const getAccent = (name) => accentColors[(name || '').charCodeAt(0) % accentColors.length];

// ─── College Card (Grid View) ─────────────────────────────────────────
const CollegeCard = ({ college, isDarkMode, onClick, index }) => {
  const accent = getAccent(college.college_name);
  const initial = (college.college_name || 'C').charAt(0).toUpperCase();

  return (
    <div
      onClick={onClick}
      className="h-[240px] flex flex-col bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-xl border border-white/20 dark:border-slate-700/50 
                cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 hover:border-purple-300/50 dark:hover:border-purple-600/50 
                group hover:-translate-y-1 transform-gpu"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Gradient Accent */}
      <div className={`h-1 bg-gradient-to-r ${accent.gradient} rounded-t-xl flex-shrink-0`} />

      {/* Card Body */}
      <div className="flex-1 p-4 flex flex-col">
        {/* College icon + name */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-11 h-11 rounded-full ${accent.bg} flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0`}>
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight truncate">
              {college.college_name}
            </h3>
            <p className="text-xs mt-0.5 text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
              <MapPin size={10} />
              {college.location || 'Location not specified'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-md"><Briefcase className="w-3 h-3 text-blue-600 dark:text-blue-400" /></div>
              Worklets
            </span>
            <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full text-xs font-bold text-white bg-teal-500">
              {college.workletCount || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded-md"><GraduationCap className="w-3 h-3 text-purple-600 dark:text-purple-400" /></div>
              Professors
            </span>
            <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full text-xs font-bold text-white bg-purple-500">
              {college.totalProfessors || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <div className="p-1 bg-indigo-100 dark:bg-indigo-900/30 rounded-md"><Users className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /></div>
              Students
            </span>
            <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full text-xs font-bold text-white bg-indigo-500">
              {college.totalStudents || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="flex-shrink-0 px-4 py-2.5 bg-gradient-to-r from-slate-50/80 to-white/80 dark:from-slate-700/30 dark:to-slate-800/50 
                    border-t border-slate-200/50 dark:border-slate-600/50 rounded-b-xl backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">View Details</span>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
        </div>
      </div>
    </div>
  );
};

// ─── All Colleges Page ────────────────────────────────────────────────
const AllColleges = () => {
  useDocumentTitle('PRISM Admin - All Colleges');
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);

  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [activeFilter, setActiveFilter] = useState('all');

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
    let result = [...colleges];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        (c.college_name || '').toLowerCase().includes(q) ||
        (c.location || '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [colleges, search, activeFilter]);

  const getFilteredCount = (key) => {
    if (key === 'all') return colleges.length;
    return 0;
  };

  const totalWorklets = colleges.reduce((sum, c) => sum + (c.workletCount || 0), 0);
  const totalStudents = colleges.reduce((sum, c) => sum + (c.totalStudents || 0), 0);

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
        <AdminLeftSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 size={32} className="animate-spin mx-auto mb-4 text-slate-500" />
            <p className="text-slate-600 dark:text-slate-400">Loading colleges...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen font-sans ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <AdminLeftSidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-none mx-0 p-4 pl-6">

          {/* Header Section */}
          <div className={`${
            isDarkMode
              ? 'bg-gradient-to-r from-slate-800/80 via-slate-700/50 to-slate-800/80 backdrop-blur-sm border-slate-700/50'
              : 'bg-gradient-to-r from-white/80 via-purple-50/50 to-indigo-50/30 backdrop-blur-sm border-purple-200/30'
          } rounded-2xl shadow-lg border p-4 mb-4`}>

            <div className="flex items-center justify-between">
              {/* Left Side - Title */}
              <div>
                <h1 className={`text-4xl font-bold font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  All Colleges
                </h1>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Manage and monitor college partnerships
                </p>
              </div>

              {/* Right Side - Stats */}
              <div className="flex items-center gap-4">
                <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'}`}>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {colleges.length}
                  </div>
                  <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total</div>
                </div>
                <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'}`}>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    {totalWorklets}
                  </div>
                  <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Worklets</div>
                </div>
                <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'}`}>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                    {totalStudents}
                  </div>
                  <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Students</div>
                </div>
              </div>
            </div>

            {error && (
              <div className={`mt-4 p-3 rounded-lg border ${
                isDarkMode
                  ? 'bg-red-900/20 border-red-700/50 text-red-300'
                  : 'bg-red-50 border-red-200 text-red-600'
              }`}>
                {error}
              </div>
            )}
          </div>

          {/* Search, Actions and View Controls */}
          <div className={`flex items-center gap-3 mb-6 p-4 rounded-lg ${
            isDarkMode
              ? 'bg-slate-800/80 border-slate-700/50'
              : 'bg-white/60 border-slate-200/50'
          } border shadow-sm`}>

            {/* Search */}
            <div className="relative flex-1">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Search colleges by name, location..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className={`w-full pl-12 pr-4 py-2.5 rounded-xl border transition-all duration-200 ${
                  isDarkMode
                    ? 'bg-slate-800/50 border-gray-700/30 text-white placeholder-gray-400/60 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20'
                    : 'bg-white/70 border-gray-300/40 text-slate-800 placeholder-gray-500/60 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20'
                } backdrop-blur-sm`}
              />
            </div>

            {/* Action Buttons */}
            <motion.button
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isDarkMode
                  ? 'bg-gradient-to-r from-purple-400 to-indigo-400 text-white shadow-lg border border-purple-200/50'
                  : 'bg-gradient-to-r from-purple-300 to-indigo-300 text-white shadow-lg border border-purple-200/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Building2 size={16} />
              <span className="whitespace-nowrap">All Colleges</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-white/20 text-white">
                {colleges.length}
              </span>
            </motion.button>
            <motion.button
              onClick={() => navigate('/admin-add-college')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isDarkMode
                  ? 'bg-slate-700/50 text-gray-300 border border-gray-700/30 hover:text-white'
                  : 'bg-white/60 text-gray-700 border border-gray-300/40 hover:text-gray-800'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus size={16} />
              <span className="whitespace-nowrap">Add College</span>
            </motion.button>
            <motion.button
              onClick={() => navigate('/admin-mou-details')}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isDarkMode
                  ? 'bg-slate-700/50 text-gray-300 border border-gray-700/30 hover:text-white'
                  : 'bg-white/60 text-gray-700 border border-gray-300/40 hover:text-gray-800'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FileCheck size={16} />
              <span className="whitespace-nowrap">MOU Details</span>
            </motion.button>

            {/* View Toggle */}
            <div className={`flex rounded-lg overflow-hidden border ${isDarkMode ? 'border-slate-600/50' : 'border-slate-300/50'}`}>
              <motion.button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? isDarkMode ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                    : isDarkMode ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50' : 'bg-white/80 text-slate-600 hover:bg-slate-50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Grid3X3 size={16} />
              </motion.button>
              <motion.button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? isDarkMode ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                    : isDarkMode ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50' : 'bg-white/80 text-slate-600 hover:bg-slate-50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <List size={16} />
              </motion.button>
            </div>
          </div>

          {/* Colleges Display */}
          <div className={`${
            isDarkMode
              ? 'bg-gradient-to-br from-slate-800/80 via-slate-700/50 to-slate-800/80 backdrop-blur-sm border-slate-700/50'
              : 'bg-gradient-to-br from-white/80 via-purple-50/30 to-indigo-50/20 backdrop-blur-sm border-purple-200/30'
          } rounded-2xl shadow-lg border overflow-hidden p-6`}>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtered.map((college, idx) => (
                  <CollegeCard
                    key={college.college_id}
                    college={college}
                    isDarkMode={isDarkMode}
                    index={idx}
                    onClick={() => navigate(`/academia_details?collegeId=${college.college_id}`)}
                  />
                ))}
              </div>
            ) : (
              /* ─── List / Table View ─── */
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-700">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">College</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Worklets</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Professors</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Students</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-slate-600/50">
                      {filtered.map((college, idx) => {
                        const accent = getAccent(college.college_name);
                        const initial = (college.college_name || 'C').charAt(0).toUpperCase();

                        return (
                          <tr
                            key={college.college_id}
                            onClick={() => navigate(`/academia_details?collegeId=${college.college_id}`)}
                            className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-slate-700/50 dark:hover:to-slate-600/50 transition-all duration-300 cursor-pointer group"
                            style={{ animationDelay: `${idx * 50}ms` }}
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-full ${accent.bg} flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0`}>
                                  {initial}
                                </div>
                                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                  {college.college_name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="text-sm truncate max-w-40">{college.location || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                  <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-sm font-medium">{college.workletCount || 0}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                  <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <span className="text-sm font-medium">{college.totalProfessors || 0}</span>
                              </div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                  <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <span className="text-sm font-medium">{college.totalStudents || 0}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty State */}
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <div className="relative mx-auto mb-8">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 
                                rounded-3xl flex items-center justify-center shadow-2xl">
                    <Building2 className="w-12 h-12 text-blue-500" />
                  </div>
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-xl"></div>
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent mb-3">
                  No colleges found
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg mb-6 max-w-md mx-auto">
                  {search.trim() ? 'Try adjusting your search criteria.' : 'No colleges have been added yet.'}
                </p>
                <button
                  onClick={() => { setSearch(''); setActiveFilter('all'); }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl 
                           hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
};

export default AllColleges;
