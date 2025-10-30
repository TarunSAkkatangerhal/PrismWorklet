import React, { useState, useEffect, useCallback, useContext, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { 
  Calendar, 
  Users, 
  List,
  Search,
  ChevronRight,
  Building2,
  Target,
  Activity,
  CheckCircle,
  Grid3X3,
  X
} from "lucide-react";
import LeftSidebar from "../../components/Left";
import { ThemeContext } from "../../context/ThemeContext";
import { motion} from "framer-motion";

// Filter options configuration similar to dashboard_details
const filterOptions = [
  {
    key: 'all',
    label: 'All Worklets',
    icon: Target,
    color: 'blue',
    description: 'All worklets in the system'
  },
  {
    key: 'ongoing',
    label: 'Ongoing',
    icon: Activity,
    color: 'yellow',
    description: 'Currently active worklets'
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: CheckCircle,
    color: 'green',
    description: 'Successfully finished worklets'
  },
  {
    key: 'onhold',
    label: 'On Hold',
    icon: Users,
    color: 'orange',
    description: 'Temporarily paused worklets'
  },
  {
    key: 'dropped',
    label: 'Dropped',
    icon: X,
    color: 'red',
    description: 'Discontinued worklets'
  }
];

// Status options for tabs (UI remains unchanged; no 'To Start' tab)


// localStorage utility functions
const STORAGE_KEY = 'worklets_view_state';

const saveViewState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save view state to localStorage:', error);
  }
};

const loadViewState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn('Failed to load view state from localStorage:', error);
    return null;
  }
};
export default function WorkletsPage() {
  useDocumentTitle('MyWorklets');
  const { isDarkMode } = useContext(ThemeContext);
  const [workletsData, setWorkletsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Initialize state with persisted values or defaults
  const savedState = loadViewState();
  const location = useLocation();
  const navigate = useNavigate();
  // Prefer URL query param 'tab' if present (enables cross-page linking without localStorage)
  const urlParams = new URLSearchParams(location.search);
  const initialTabFromUrl = urlParams.get('tab');
  // Do NOT initialize activeTab from savedState to avoid persisting tab selection in localStorage
  const [activeFilter, setActiveFilter] = useState(initialTabFromUrl?.toLowerCase() || "all");
  const [viewMode, setViewMode] = useState(savedState?.layout || "grid");
  const [searchTerm, setSearchTerm] = useState(savedState?.searchTerm || "");

  // If a URL param 'tab' was used to initialize activeTab, remove it from the address bar
  // to keep the URL clean while preserving other query params. Use replace so history isn't polluted.
  useEffect(() => {
    if (!initialTabFromUrl) return;
    try {
      const params = new URLSearchParams(location.search);
      params.delete('tab');
      const newSearch = params.toString();
      const newPath = location.pathname + (newSearch ? `?${newSearch}` : '');
      navigate(newPath, { replace: true });
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Use raw status as provided by backend/UI conventions
  const toDisplayStatus = (raw) => raw || 'Ongoing';

  const computeProgress = (w) => {
    if (typeof w.worklet_progress === 'number') return w.worklet_progress;
    if (typeof w.percentage_completion === 'number') return w.percentage_completion;
    // Derive from dates if available
    if (w.start_date && w.end_date) {
      try {
        const start = new Date(w.start_date);
        const end = new Date(w.end_date);
        const now = new Date();
        const total = (end - start) || 1;
        const elapsed = Math.min(Math.max(0, now - start), total);
        return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
      } catch (_) { /* ignore */ }
    }
    return w.status === 'Completed' ? 100 : 0;
  };

  const fmtDate = (d) => {
    if (!d) return 'N/A';
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return 'N/A'; }
  };

  const fetchWorklets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const base = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');
      if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Always get authoritative user profile
      let profile = null;
      try {
        const meRes = await axios.get(`${base}/auth/me`);
        profile = meRes.data;
      } catch (e) {
        console.warn('Failed to fetch /auth/me, falling back to localStorage role/email');
      }

      const role = (profile?.role || localStorage.getItem('user_role') || '').toLowerCase();
      const email = profile?.email || localStorage.getItem('user_email');

      let data = [];
      if (role === 'mentor') {
        if (!email) {
          throw new Error('Mentor email not available to query worklets');
        }
        // Strict: only mentor-specific endpoint; if fails, surface a helpful error
        try {
          const res = await axios.get(`${base}/worklets/mentor/${encodeURIComponent(email)}/worklets`);
          data = res.data?.worklets || [];
        } catch (e) {
          // Fallback to all worklets (read-only) to avoid a blank page
          try {
            const alt = await axios.get(`${base}/worklets`);
            data = alt.data || [];
          } catch (e2) {
            throw e; // preserve original mentor-specific error
          }
        }
      } else {
        // Non-mentor users see global; try /worklets first, then /api/worklets alias as fallback
        try {
          const res = await axios.get(`${base}/worklets`);
          data = res.data || [];
        } catch (e) {
          try {
            const res2 = await axios.get(`${base}/api/worklets`);
            data = res2.data || [];
          } catch (e2) {
            throw e; // bubble original error
          }
        }
      }

      const normalized = data.map(w => {
        const status = toDisplayStatus(w.status);
        const progress = computeProgress(w);
        const studentsCount = Array.isArray(w.students) ? w.students.length : (w.student_count || w.students || 0);
        return {
          id: w.cert_id || w.id, // display id (prefer cert_id)
          linkId: w.id,          // numeric id for detail linking if needed
          title: w.title || w.cert_id || 'Untitled Worklet',
          status,
          progress,
          description: w.description || 'No description provided',
          startDate: fmtDate(w.start_date || w.startDate),
            endDate: fmtDate(w.end_date || w.endDate),
          students: studentsCount,
          college: w.college || '—',
          mentor: w.mentor || '',
          category: w.domain || w.category || 'General'
        };
      });
      setWorkletsData(normalized);
    } catch (e) {
      console.error('Failed to fetch worklets', e);
      setError(e.response?.data?.detail || e.message || 'Failed to load worklets');
      setWorkletsData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWorklets(); }, [fetchWorklets]);

  // Poll every 60s for fresher data (only if no error and not currently loading)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !error) {
        fetchWorklets();
      }
    }, 60000); // 60 seconds
    return () => clearInterval(interval);
  }, [fetchWorklets, loading, error]);

  // Persist view state changes to localStorage (do not persist activeTab)
  useEffect(() => {
    const viewState = {
      layout: viewMode,
      searchTerm
    };
    saveViewState(viewState);
  }, [viewMode, searchTerm]);

  // If a URL param 'tab' is present it was already read during initialization and used for activeTab.

  const getStatusColor = (status) => {
    switch (status) {
      case 'Ongoing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredWorklets = useMemo(() => {
    let filtered = [...workletsData];
    
    // Apply search filter first
    if (searchTerm.trim()) {
      const needle = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(worklet => 
        worklet.title.toLowerCase().includes(needle) || 
        (worklet.college || '').toLowerCase().includes(needle) || 
        (worklet.category || '').toLowerCase().includes(needle) ||
        String(worklet.id).toLowerCase().includes(needle)
      );
    }

    // Apply status filter
    if (activeFilter !== 'all') {
      const statusMap = {
        'ongoing': 'Ongoing',
        'completed': 'Completed', 
        'onhold': 'On Hold',
        'dropped': 'Dropped'
      };
      filtered = filtered.filter(w => w.status === statusMap[activeFilter]);
    }

    return filtered;
  }, [workletsData, activeFilter, searchTerm]);



  // Filter handling function
  const handleFilterChange = (filterKey) => {
    setActiveFilter(filterKey);
  };

  // Get filtered count for each filter
  const getFilteredCount = (filterKey) => {
    if (filterKey === 'all') return workletsData.length;
    const statusMap = {
      'ongoing': 'Ongoing',
      'completed': 'Completed',
      'onhold': 'On Hold',
      'dropped': 'Dropped'
    };
    return workletsData.filter(w => w.status === statusMap[filterKey]).length;
  };



  if (loading) {
    return (
      <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
        <LeftSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading worklets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen font-sans ${
      isDarkMode 
        ? 'bg-slate-900' 
        : 'bg-slate-50'
    }`}>
      <LeftSidebar />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-none mx-0 p-4 pl-6">
          
          {/* Compact Header Section */}
          <div className={`${
            isDarkMode 
              ? 'bg-gradient-to-r from-slate-800/80 via-slate-700/50 to-slate-800/80 backdrop-blur-sm border-slate-700/50' 
              : 'bg-gradient-to-r from-white/80 via-purple-50/50 to-indigo-50/30 backdrop-blur-sm border-purple-200/30'
          } rounded-2xl shadow-lg border p-4 mb-4`}>
            
            {/* Optimized Header Layout */}
            <div className="flex items-center justify-between">
              {/* Left Side - Title */}
              <div className="flex items-center gap-3">
                <div>
                  <h1 className={`text-4xl font-bold font-sans ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>
                    My Worklets
                  </h1>
                  <p className={`text-sm mt-1 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Manage and track your project progress
                </p>
                </div>
              </div>

              {/* Right Side - Worklet Counts */}
              <div className="flex items-center gap-4">
                <div className={`text-center p-3 rounded-lg ${
                  isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'
                }`}>
                  <div className={`text-2xl font-bold ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    {workletsData.length}
                  </div>
                  <div className={`text-xs font-medium ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Total
                  </div>
                </div>
                
                <div className={`text-center p-3 rounded-lg ${
                  isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'
                }`}>
                  <div className={`text-2xl font-bold ${
                    isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                  }`}>
                    {workletsData.filter(w => w.status === 'Ongoing').length}
                  </div>
                  <div className={`text-xs font-medium ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Active
                  </div>
                </div>
                
                <div className={`text-center p-3 rounded-lg ${
                  isDarkMode ? 'bg-slate-700/50' : 'bg-white/60'
                }`}>
                  <div className={`text-2xl font-bold ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`}>
                    {workletsData.filter(w => w.status === 'Completed').length}
                  </div>
                  <div className={`text-xs font-medium ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    Completed
                  </div>
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

          {/* Search and View Controls */}
          <div className={`flex items-center justify-between mb-6 p-4 rounded-lg ${
            isDarkMode 
              ? 'bg-slate-800/80 border-slate-700/50' 
              : 'bg-white/60 border-slate-200/50'
          } border shadow-sm`}>
            
            {/* Search */}
            <div className="relative flex-1">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="Search worklets by title, college, domain, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-2.5 rounded-xl border transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-slate-800/50 border-gray-700/30 text-white placeholder-gray-400/60 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20' 
                    : 'bg-white/70 border-gray-300/40 text-slate-800 placeholder-gray-500/60 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20'
                } backdrop-blur-sm`}
              />
            </div>

            {/* View Toggle */}
            <div className={`flex rounded-lg overflow-hidden border ${
              isDarkMode ? 'border-slate-600/50' : 'border-slate-300/50'
            }`}>
              <motion.button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === "grid"
                    ? isDarkMode
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-500 text-white'
                    : isDarkMode
                      ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                      : 'bg-white/80 text-slate-600 hover:bg-slate-50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Grid3X3 size={16} />
              </motion.button>
              <motion.button
                onClick={() => setViewMode("list")}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === "list"
                    ? isDarkMode
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-500 text-white'
                    : isDarkMode
                      ? 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                      : 'bg-white/80 text-slate-600 hover:bg-slate-50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <List size={16} />
              </motion.button>
            </div>
          </div>

          {/* Filter Options */}
          <div className="flex flex-wrap gap-2 mb-6">
            {filterOptions.map((option) => {
              const isActive = activeFilter === option.key;
              const count = getFilteredCount(option.key);
              
              return (
                <motion.button
                  key={option.key}
                  onClick={() => handleFilterChange(option.key)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
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
                  <option.icon size={16} />
                  <span>{option.label}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : isDarkMode
                        ? 'bg-gray-800/30 text-gray-300'
                        : 'bg-gray-100/80 text-gray-700'
                  }`}>
                    {count}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Worklets Display */}
          <div className={`${
            isDarkMode 
              ? 'bg-gradient-to-br from-slate-800/80 via-slate-700/50 to-slate-800/80 backdrop-blur-sm border-slate-700/50' 
              : 'bg-gradient-to-br from-white/80 via-purple-50/30 to-indigo-50/20 backdrop-blur-sm border-purple-200/30'
          } rounded-2xl shadow-lg border overflow-hidden p-6`}>
            
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredWorklets.map((worklet, index) => (
                  <Link key={worklet.id + ':' + index} to={`/worklet/${worklet.linkId || worklet.id}`}>
                    <div className="h-[320px] flex flex-col bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-xl border border-white/20 dark:border-slate-700/50 
                                  cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 hover:border-purple-300/50 dark:hover:border-purple-600/50 
                                  group hover:-translate-y-1 transform-gpu"
                         style={{ animationDelay: `${index * 100}ms` }}>
                    
                    {/* Gradient Accent */}
                    <div className="h-1 bg-gradient-to-r from-purple-500 via-purple-500 to-indigo-500 rounded-t-2xl flex-shrink-0"></div>
                    
                    {/* Card Header */}
                    <div className="flex-1 p-4 pb-3 flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="px-2 py-1 text-xs font-mono font-bold bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-300 rounded-md">
                            {worklet.id}
                          </span>
                        </div>
                        {/* Status Badge at top right */}
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold shadow-md ${getStatusColor(worklet.status)}`}>
                          {worklet.status}
                        </span>
                      </div>
                      
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mb-2 line-clamp-2 leading-tight">
                        {worklet.title}
                      </h3>
                      
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-4 mb-3 leading-relaxed flex-1">
                        {worklet.description}
                      </p>

                      {/* Enhanced Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">Progress</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">{worklet.progress}%</span>
                        </div>
                        <div className="w-full bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-full h-2 shadow-inner">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full shadow-lg transition-all duration-700 relative overflow-hidden"
                            style={{ width: `${worklet.progress}%` }}
                          >
                            <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Card Footer */}
                    <div className="flex-shrink-0 px-4 py-3 bg-gradient-to-r from-slate-50/80 to-white/80 dark:from-slate-700/30 dark:to-slate-800/50 
                                  border-t border-slate-200/50 dark:border-slate-600/50 rounded-b-2xl backdrop-blur-sm">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-400">
                            <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                              <Users className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="font-medium text-xs">{worklet.students}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-400">
                            <div className="p-1 bg-indigo-100 dark:bg-indigo-900/30 rounded-md">
                              <Calendar className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <span className="font-medium text-xs">{worklet.endDate}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                      
                      <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-400">
                        <Building2 className="w-3 h-3" />
                        <span className="truncate font-medium text-xs">{worklet.college}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
          //list view with enhancements
          : (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-8 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Worklet
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Team
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        College
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-600/50">
                    {filteredWorklets.map((worklet, index) => (
                      <tr key={worklet.id + ':' + index} 
                          className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-slate-700/50 dark:hover:to-slate-600/50 transition-all duration-300 group"
                          style={{ animationDelay: `${index * 50}ms` }}>
                        <td className="px-8 py-6">
                          <Link to={`/worklet/${worklet.linkId || worklet.id}`} className="group/link">
                            <div>
                              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400 transition-colors duration-300 mb-1">
                                {worklet.title}
                              </div>
                              <div className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-md inline-block">
                                {worklet.id}
                              </div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`inline-flex px-4 py-2 rounded-xl text-xs font-bold shadow-md ${getStatusColor(worklet.status)}`}>
                            {worklet.status}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-20 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded-full h-3 shadow-inner">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full shadow-lg transition-all duration-500"
                                style={{ width: `${worklet.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{worklet.progress}%</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-sm font-medium">{worklet.students}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <span className="text-sm font-medium">{worklet.endDate}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                              <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="text-sm font-medium truncate max-w-32">{worklet.college}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Enhanced Empty State */}
          {filteredWorklets.length === 0 && (
            <div className="text-center py-16">
              <div className="relative mx-auto mb-8">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 
                              rounded-3xl flex items-center justify-center shadow-2xl">
                  <Search className="w-12 h-12 text-blue-500" />
                </div>
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-xl"></div>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent mb-3">
                No worklets found
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-lg mb-6 max-w-md mx-auto">
                Try adjusting your search criteria or explore different categories to discover projects.
              </p>
              <button 
                onClick={() => {
                  setSearchTerm(""); 
                  setActiveFilter("all");
                }}
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
}