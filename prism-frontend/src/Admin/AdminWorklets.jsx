import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AdminLeftSidebar, AdminRightSidebar } from './AdminSidebar';
import { ThemeContext } from '../context/ThemeContext';
import API from '../api';
import {
  Search, ChevronRight, Target, Activity, CheckCircle, X, Clock,
  Users, Grid3X3, List, Building2, Briefcase, AlertCircle,
  TrendingUp, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const statusFilters = [
  { key: 'all',       label: 'All Worklets', icon: Target,      color: 'blue'   },
  { key: 'ongoing',   label: 'Ongoing',      icon: Activity,    color: 'yellow' },
  { key: 'completed', label: 'Completed',    icon: CheckCircle, color: 'green'  },
  { key: 'on hold',   label: 'On Hold',      icon: Clock,       color: 'orange' },
  { key: 'dropped',   label: 'Dropped',      icon: X,           color: 'red'    },
];

const statusColor = (s) => {
  const map = {
    blue:   { bg: 'bg-blue-100 dark:bg-blue-900/30',    text: 'text-blue-800 dark:text-blue-300',   border: 'border-blue-200'   },
    yellow: { bg: 'bg-blue-100 dark:bg-blue-900/30',     text: 'text-blue-800 dark:text-blue-300',   border: 'border-blue-200'   },
    green:  { bg: 'bg-green-100 dark:bg-green-900/30',   text: 'text-green-800 dark:text-green-300', border: 'border-green-200'  },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300', border: 'border-orange-200' },
    red:    { bg: 'bg-red-100 dark:bg-red-900/30',       text: 'text-red-800 dark:text-red-300',     border: 'border-red-200'    },
  };
  if (!s) return map.blue;
  const l = s.toLowerCase();
  if (l.includes('ongoing'))   return map.yellow;
  if (l.includes('completed')) return map.green;
  if (l.includes('hold'))      return map.orange;
  if (l.includes('dropped'))   return map.red;
  if (l.includes('start'))     return map.blue;
  return map.blue;
};

const riskColor = (r) => {
  if (!r) return 'text-slate-400';
  const l = r.toLowerCase();
  if (l === 'safe' || l === 'green')   return 'text-green-500';
  if (l === 'medium' || l === 'amber') return 'text-yellow-500';
  if (l === 'high' || l === 'red')     return 'text-red-500';
  return 'text-slate-400';
};

const AdminWorklets = () => {
  useDocumentTitle('PRISM Admin - Worklets');
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);

  const [worklets, setWorklets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    const fetchWorklets = async () => {
      try {
        setLoading(true);
        const res = await API.get('/api/worklets/');
        setWorklets(res.data);
      } catch (err) {
        console.error('Failed to fetch worklets:', err);
        setError('Failed to load worklets');
      } finally {
        setLoading(false);
      }
    };
    fetchWorklets();
  }, []);

  const filtered = useMemo(() => {
    let list = worklets;
    if (activeFilter !== 'all') {
      list = list.filter(w => {
        const s = (w.status || '').toLowerCase();
        return s.includes(activeFilter);
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(w =>
        (w.title || '').toLowerCase().includes(q) ||
        (w.cert_id || '').toLowerCase().includes(q) ||
        (w.college || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [worklets, activeFilter, search]);

  const counts = useMemo(() => {
    const c = { all: worklets.length, ongoing: 0, completed: 0, 'on hold': 0, dropped: 0 };
    worklets.forEach(w => {
      const s = (w.status || '').toLowerCase();
      if (s.includes('ongoing'))   c.ongoing++;
      else if (s.includes('completed')) c.completed++;
      else if (s.includes('hold'))      c['on hold']++;
      else if (s.includes('dropped'))   c.dropped++;
    });
    return c;
  }, [worklets]);

  return (
    <div className="flex h-screen w-full bg-slate-100 text-slate-800 overflow-hidden dark:bg-slate-900 dark:text-slate-200">
      <AdminLeftSidebar />

      <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
        <div className="max-w-none mx-0 p-4 pl-6">

        {/* Header */}
        <div className={`${
          isDarkMode
            ? 'bg-gradient-to-r from-slate-800/80 via-slate-700/50 to-slate-800/80 backdrop-blur-sm border-slate-700/50'
            : 'bg-gradient-to-r from-white/80 via-purple-50/50 to-indigo-50/30 backdrop-blur-sm border-purple-200/30'
        } rounded-2xl shadow-lg border p-4 mb-4`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-4xl font-bold font-sans ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Worklet Management
              </h1>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                View and manage all worklets across the platform
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'}`}>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{counts.all}</div>
                <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Total</div>
              </div>
              <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'}`}>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>{counts.ongoing}</div>
                <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Active</div>
              </div>
              <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'}`}>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{counts.completed}</div>
                <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Completed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search + View toggle */}
        <div className={`flex items-center justify-between mb-6 p-4 rounded-lg ${
          isDarkMode
            ? 'bg-slate-800/80 border-slate-700/50'
            : 'bg-white/60 border-slate-200/50'
        } border shadow-sm`}>
          <div className="relative flex-1">
            <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="Search worklets by title, college, domain, or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`w-full pl-12 pr-4 py-2.5 rounded-xl border transition-all duration-200 ${
                isDarkMode
                  ? 'bg-slate-800/50 border-gray-700/30 text-white placeholder-gray-400/60 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20'
                  : 'bg-white/70 border-gray-300/40 text-slate-800 placeholder-gray-500/60 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20'
              } backdrop-blur-sm`}
            />
          </div>
          <div className={`flex rounded-lg overflow-hidden border ml-4 ${isDarkMode ? 'border-slate-600/50' : 'border-slate-300/50'}`}>
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

        {/* Status filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {statusFilters.map(f => {
            const active = activeFilter === f.key;
            return (
              <motion.button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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
                <f.icon size={16} />
                <span>{f.label}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  active
                    ? 'bg-white/20 text-white'
                    : isDarkMode
                      ? 'bg-gray-800/30 text-gray-300'
                      : 'bg-gray-100/80 text-gray-700'
                }`}>
                  {counts[f.key] ?? 0}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-red-500 gap-2">
            <AlertCircle className="w-8 h-8" />
            <p>{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
            <Briefcase className="w-10 h-10" />
            <p className="text-lg font-medium">No worklets found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : viewMode === 'grid' ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-[clamp(0.75rem,1.5vw,1.25rem)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {filtered.map(w => {
              const sc = statusColor(w.status);
              return (
                <motion.div
                  key={w.id}
                  onClick={() => navigate(`/admin-worklet/${w.id}`)}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl shadow-md p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.01] group"
                  whileHover={{ y: -2 }}
                >
                  {/* Status badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>
                      {w.status || 'To Start'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{w.cert_id || `#${w.id}`}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {w.title}
                  </h3>

                  {/* Meta info */}
                  <div className="space-y-1.5 mb-3">
                    {w.college && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Building2 className="w-3.5 h-3.5" /> {w.college}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Users className="w-3.5 h-3.5" /> {w.student_count ?? 0} Students
                    </div>
                    {w.team && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Target className="w-3.5 h-3.5" /> {w.team}
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-auto">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500 dark:text-slate-400">Progress</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{w.worklet_progress ?? 0}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                        style={{ width: `${Math.min(w.worklet_progress ?? 0, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-hover:text-purple-500 transition-colors" />
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          /* List view */
          <div className="space-y-2">
            {/* List header */}
            <div className="grid grid-cols-12 gap-3 px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <div className="col-span-1">ID</div>
              <div className="col-span-3">Title</div>
              <div className="col-span-2">College</div>
              <div className="col-span-1">Students</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Performance</div>
              <div className="col-span-1">Risk</div>
              <div className="col-span-2">Progress</div>
            </div>
            {filtered.map(w => {
              const sc = statusColor(w.status);
              return (
                <motion.div
                  key={w.id}
                  onClick={() => navigate(`/admin-worklet/${w.id}`)}
                  className="grid grid-cols-12 gap-3 items-center px-4 py-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-md hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 group"
                  whileHover={{ x: 3 }}
                >
                  <div className="col-span-1 text-xs font-mono text-slate-400">{w.cert_id || `#${w.id}`}</div>
                  <div className="col-span-3 text-sm font-semibold text-slate-800 dark:text-white truncate group-hover:text-purple-600 transition-colors">{w.title}</div>
                  <div className="col-span-2 text-xs text-slate-500 dark:text-slate-400 truncate">{w.college || '—'}</div>
                  <div className="col-span-1 text-xs text-slate-600 dark:text-slate-300 text-center">{w.student_count ?? 0}</div>
                  <div className="col-span-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>{w.status || 'To Start'}</span>
                  </div>
                  <div className="col-span-1 text-xs font-medium text-slate-600 dark:text-slate-300 capitalize">{w.performance || '—'}</div>
                  <div className={`col-span-1 text-xs font-bold capitalize ${riskColor(w.riskStatus)}`}>{w.riskStatus || '—'}</div>
                  <div className="col-span-2 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500" style={{ width: `${Math.min(w.worklet_progress ?? 0, 100)}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 w-8 text-right">{w.worklet_progress ?? 0}%</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
        </div>
      </main>

      <AdminRightSidebar />
    </div>
  );
};

export default AdminWorklets;
