import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ThemeContext } from '../context/ThemeContext';
import API from '../api';
import {
  ArrowLeft, User, Mail, Phone, Building2, Calendar, Clock, 
  CheckCircle, XCircle, FileText, Award, TrendingUp, MessageCircle,
  Download, Edit, BarChart3, Target, MapPin, GraduationCap,
  Loader2, AlertCircle, ExternalLink, Share2, BookOpen, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UserProfileView = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);
  
  useDocumentTitle('User Profile - PRISM Admin');

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [worklets, setWorklets] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        setError('User ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Parallel API calls
        const [userRes, workletsRes] = await Promise.all([
          API.get(`/api/admin/users/${userId}`),
          API.get(`/api/admin/users/${userId}/worklets`).catch(() => ({ data: [] }))
        ]);

        const userData = userRes.data;
        const workletsData = Array.isArray(workletsRes.data) ? workletsRes.data : workletsRes.data.worklets || [];

        setUser(userData);
        setWorklets(workletsData);

        // Calculate statistics
        const totalWorklets = workletsData.length;
        const completedWorklets = workletsData.filter(w => w.status === 'Completed').length;
        const inProgressWorklets = workletsData.filter(w => w.status === 'In Progress').length;
        const pendingWorklets = workletsData.filter(w => w.status === 'Pending' || !w.status).length;
        const avgScore = totalWorklets > 0 ? 
          (workletsData.reduce((sum, w) => sum + (w.evaluation_score || 0), 0) / totalWorklets).toFixed(1) : 
          0;

        setStats({
          total: totalWorklets,
          completed: completedWorklets,
          inProgress: inProgressWorklets,
          pending: pendingWorklets,
          avgScore: parseFloat(avgScore),
          completionRate: totalWorklets > 0 ? Math.round((completedWorklets / totalWorklets) * 100) : 0
        });

      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  // Helper functions
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? 
      (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : 
      name[0].toUpperCase();
  };

  const getAvatarColor = (userId) => {
    const colors = [
      'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-rose-500',
      'bg-amber-500', 'bg-teal-500', 'bg-indigo-500', 'bg-cyan-500',
    ];
    return colors[userId % colors.length];
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'Completed': { color: 'green', icon: CheckCircle },
      'In Progress': { color: 'blue', icon: Clock },
      'Pending': { color: 'gray', icon: AlertCircle }
    };
    
    const config = statusMap[status] || statusMap['Pending'];
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium 
        ${config.color === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
          config.color === 'blue' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
          'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'}`}>
        <Icon className="w-3 h-3" />
        {status || 'Pending'}
      </span>
    );
  };

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'worklets', label: 'Worklets', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4 mx-auto" />
          <p className={`text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'} flex items-center justify-center`}>
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4 mx-auto" />
          <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Error</h2>
          <p className={`text-lg mb-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      {/* Header */}
      <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border-b sticky top-0 z-40 backdrop-blur-sm bg-opacity-95`}>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  {user?.name || 'User Profile'}
                </h1>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Detailed profile and analytics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}>
                <Share2 className="w-5 h-5" />
              </button>
              <button className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}>
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        
        {/* User Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-2xl border p-6 mb-8 shadow-sm`}
        >
          <div className="flex items-start gap-6">
            <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-white text-2xl font-bold ${getAvatarColor(user?.id || 1)}`}>
              {getInitials(user?.name)}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{user?.name}</h2>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${isDarkMode ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                      {user?.role}
                    </span>
                    {user?.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                        <XCircle className="w-3 h-3" /> Inactive
                      </span>
                    )}
                  </div>
                  <div className={`space-y-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{user?.email}</span>
                    </div>
                    {user?.college_name && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span>{user.college_name}</span>
                      </div>
                    )}
                    {user?.created_at && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Member since {new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              {stats && (
                <div className="grid grid-cols-4 gap-4">
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-50'} text-center`}>
                    <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{stats.total}</div>
                    <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Worklets</div>
                  </div>
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-50'} text-center`}>
                    <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{stats.completed}</div>
                    <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Completed</div>
                  </div>
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-50'} text-center`}>
                    <div className={`text-2xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>{stats.completionRate}%</div>
                    <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Success Rate</div>
                  </div>
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-50'} text-center`}>
                    <div className={`text-2xl font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>{stats.avgScore}</div>
                    <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Avg Score</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className={`flex items-center gap-1 mb-6 p-1 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-white'} border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? isDarkMode ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-800'
                    : isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Personal Information */}
              <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl border p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{user?.name || '—'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Email</label>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{user?.email || '—'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Role</label>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{user?.role || '—'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Student ID</label>
                    <p className={`text-sm font-mono ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{user?.student_id || '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Institution</label>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{user?.college_name || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl border p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Account Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Profile Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user?.profile_completed 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}>
                      {user?.profile_completed ? 'Complete' : 'Incomplete'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Account Status</span>
                    {user?.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                        <XCircle className="w-3 h-3" /> Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Member Since</span>
                    <span className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      }) : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Worklets Tab */}
          {activeTab === 'worklets' && (
            <motion.div
              key="worklets"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl border p-6`}>
                <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  Worklets ({worklets.length})
                </h3>
                
                {worklets.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`} />
                    <p className={`text-lg font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>No worklets found</p>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>This user hasn't participated in any worklets yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {worklets.map((worklet, index) => (
                      <motion.div
                        key={worklet.id || index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 rounded-lg border ${isDarkMode ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-50 border-slate-200'} hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                              {worklet.title || worklet.worklet_name || 'Untitled Worklet'}
                            </h4>
                            {worklet.certificate_id && (
                              <p className={`text-xs font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                Certificate: {worklet.certificate_id}
                              </p>
                            )}
                          </div>
                          <div className="ml-4">
                            {getStatusBadge(worklet.status)}
                          </div>
                        </div>
                        
                        {worklet.description && (
                          <p className={`text-sm mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {worklet.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-4">
                            {worklet.start_date && (
                              <div className={`flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                <Calendar className="w-3 h-3" />
                                <span>Started: {new Date(worklet.start_date).toLocaleDateString('en-IN')}</span>
                              </div>
                            )}
                            {worklet.mentor_name && (
                              <div className={`flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                <User className="w-3 h-3" />
                                <span>Mentor: {worklet.mentor_name}</span>
                              </div>
                            )}
                          </div>
                          {worklet.evaluation_score > 0 && (
                            <div className={`flex items-center gap-1 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'} font-medium`}>
                              <BarChart3 className="w-3 h-3" />
                              <span>{worklet.evaluation_score}/100</span>
                            </div>
                          )}
                        </div>
                        
                        {worklet.progress && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Progress</span>
                              <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{worklet.progress}%</span>
                            </div>
                            <div className={`w-full rounded-full h-2 ${isDarkMode ? 'bg-slate-600' : 'bg-slate-200'}`}>
                              <div 
                                className="bg-indigo-500 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${Math.min(worklet.progress || 0, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Performance Metrics */}
              <div className={`${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-xl border p-6`}>
                <h3 className={`text-lg font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Performance Analytics</h3>
                
                {stats ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Worklets</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats.total}</p>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">Completed</span>
                      </div>
                      <p className="text-3xl font-bold text-green-700 dark:text-green-300">{stats.completed}</p>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Success Rate</span>
                      </div>
                      <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">{stats.completionRate}%</p>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm font-medium text-amber-600 dark:text-amber-400">Avg Score</span>
                      </div>
                      <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">{stats.avgScore}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`} />
                    <p className={`text-lg font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>No analytics available</p>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Complete some worklets to see performance data.</p>
                  </div>
                )}
              </div>
              
              {/* Additional Analytics can be added here */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UserProfileView;