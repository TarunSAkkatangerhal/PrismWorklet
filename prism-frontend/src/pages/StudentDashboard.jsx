// Student Dashboard - Shows worklets content with student sidebars
import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from 'axios';
import { 
  Calendar, 
  Users, 
  LayoutGrid,
  List,
  Search,
  Filter,
  Clock,
  ChevronRight,
  Building2,
  User,
  AlertCircle,
  CheckCircle,
  Circle
} from "lucide-react";
import LeftSidebar from '../components/Left';
import RightSidebar from '../components/Right';

// Status options and utility functions (copied from WorkletsPage)
const STATUS_OPTIONS = ["All", "Ongoing", "Completed", "Under Review", "On Hold", "Dropped"]; 

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

export default function StudentDashboard() {
  const [workletsData, setWorkletsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  
  // View state management
  const [viewType, setViewType] = useState('grid');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const location = useLocation();

  // Load saved view state
  useEffect(() => {
    const savedState = loadViewState();
    if (savedState) {
      setViewType(savedState.viewType || 'grid');
      setSelectedStatus(savedState.selectedStatus || 'All');
      setSearchTerm(savedState.searchTerm || '');
      setSortBy(savedState.sortBy || 'newest');
    }
  }, []);

  // Save view state when it changes
  useEffect(() => {
    saveViewState({ viewType, selectedStatus, searchTerm, sortBy });
  }, [viewType, selectedStatus, searchTerm, sortBy]);

  // Fetch worklets function
  const fetchWorklets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        setError("Authentication required. Please log in.");
        return;
      }

      // Prefer student-specific endpoint to fetch only the student's worklets
      const url = "http://localhost:8000/api/worklets/student/me";
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const payload = response.data;
      const items = Array.isArray(payload) ? payload : (Array.isArray(payload?.worklets) ? payload.worklets : []);

      if (items.length > 0) {
        const processedWorklets = items.map(worklet => ({
          ...worklet,
          id: worklet.worklet_id || worklet.id,
          created_at: worklet.created_at ? new Date(worklet.created_at) : new Date(),
          updated_at: worklet.updated_at ? new Date(worklet.updated_at) : new Date(),
        }));
        setWorkletsData(processedWorklets);
        setLastFetched(new Date());
      } else {
        setWorkletsData([]);
      }
    } catch (error) {
      console.error("Error fetching worklets:", error);
      if (error.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (error.response?.status === 403) {
        setError("You don't have permission to view worklets.");
      } else {
        setError("Failed to load worklets. Please try again.");
      }
      setWorkletsData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load worklets on component mount and location change
  useEffect(() => {
    fetchWorklets();
  }, [fetchWorklets, location.pathname]);

  // Status icon helper
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Ongoing': return <Circle className="w-4 h-4 text-blue-500 fill-current" />;
      case 'Completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Under Review': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  // Filter and sort worklets
  const processedWorklets = workletsData
    .filter(worklet => {
      const matchesStatus = selectedStatus === 'All' || worklet.status === selectedStatus;
      const matchesSearch = searchTerm === '' || 
        worklet.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worklet.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest': return new Date(a.created_at) - new Date(b.created_at);
        case 'name': return (a.title || '').localeCompare(b.title || '');
        default: return 0;
      }
    });

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
        <LeftSidebar />
        <div className="flex-1 flex items-center justify-center lg:ml-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading worklets...</p>
          </div>
        </div>
        <RightSidebar />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <LeftSidebar />
      
      <main className="flex-1 overflow-y-auto lg:ml-64 lg:mr-64">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto p-6">
          {/* Enhanced Header */}
          <div className="mb-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-black dark:text-white mb-3 flex items-center gap-4">
                  Student Worklets
                  {lastFetched && (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-md">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" /> live
                    </span>
                  )}
                  <button
                    onClick={fetchWorklets}
                    disabled={loading}
                    className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow hover:shadow-lg transition disabled:opacity-40 disabled:cursor-not-allowed">
                    Refresh
                  </button>
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Browse and explore available worklets
                </p>
                {error && (
                  <div className="mt-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-4 py-2 rounded-lg">
                    {error}
                  </div>
                )}
              </div>
              
              {/* Stats Badge */}
              <div className="text-right">
                <div className="text-3xl font-bold text-black dark:text-white">
                  {processedWorklets.length}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Available Worklets
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mb-6 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20 dark:border-slate-700/50">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search worklets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/60 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="pl-10 pr-8 py-2.5 bg-white/60 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white appearance-none cursor-pointer">
                  {STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 bg-white/60 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white cursor-pointer">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A-Z</option>
              </select>

              {/* View Toggle */}
              <div className="flex bg-white/60 dark:bg-slate-700/60 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
                <button
                  onClick={() => setViewType('grid')}
                  className={`p-2.5 transition ${viewType === 'grid' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600'}`}>
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewType('list')}
                  className={`p-2.5 transition ${viewType === 'list' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600'}`}>
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Worklets Display */}
          {processedWorklets.length === 0 ? (
            <div className="text-center py-12 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-slate-700/50">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                {searchTerm || selectedStatus !== 'All' ? 'No matching worklets' : 'No worklets available'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {searchTerm || selectedStatus !== 'All' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Check back later for new worklets'}
              </p>
            </div>
          ) : viewType === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processedWorklets.map((worklet) => (
                <Link
                  key={worklet.id}
                  to={`/worklet/${worklet.id}`}
                  className="group bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 dark:border-slate-700/50 hover:border-blue-300 dark:hover:border-blue-600 transform hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(worklet.status)}
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {worklet.status || 'Pending'}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {worklet.title || 'Untitled Worklet'}
                  </h3>
                  
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-3">
                    {worklet.description || 'No description available'}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {worklet.created_at instanceof Date 
                        ? worklet.created_at.toLocaleDateString()
                        : 'Unknown date'}
                    </div>
                    {worklet.college && (
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {worklet.college}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50 overflow-hidden">
              {processedWorklets.map((worklet, index) => (
                <Link
                  key={worklet.id}
                  to={`/worklet/${worklet.id}`}
                  className={`flex items-center p-6 hover:bg-white/40 dark:hover:bg-slate-700/40 transition-colors group ${
                    index !== processedWorklets.length - 1 ? 'border-b border-slate-200 dark:border-slate-700' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(worklet.status)}
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {worklet.title || 'Untitled Worklet'}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {worklet.description || 'No description available'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700">
                      {worklet.status || 'Pending'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {worklet.created_at instanceof Date 
                        ? worklet.created_at.toLocaleDateString()
                        : 'Unknown'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <RightSidebar />
    </div>
  );
}