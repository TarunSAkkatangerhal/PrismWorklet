// Student Dashboard - Shows worklets content with student-focused UI
// Now with proper security and API integration like mentor dashboard
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import secureAPI from '../services/secureAPI';
import { getCurrentUser } from '../services/auth';
import { sanitizeInput } from '../utils/security';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { 
  Calendar, 
  Users,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  BookOpen,
  Target,
  MapPin,
  List,
  ArrowRightLeft,
} from "lucide-react";
import LeftSidebar from '../components/Left';
import RightSidebar from '../components/Right';
import StatCard from '../components/StatCard';
import samsungLogo from '../assets/prism_logo.png';

// Helper to get initials from name
const getInitials = (name) => {
  if (!name) return '';
  const nameParts = name.split(' ');
  if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
  return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
};

// Helper to generate color from name
const generateColorFromName = (name) => {
  const colors = ['#0077b6', '#0096c7', '#48cae4', '#90e0ef', '#ade8f4'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash % colors.length)];
};

export default function StudentDashboard() {
  useDocumentTitle('PRISM-home');
  const navigate = useNavigate();
  
  // Real state management
  const [workletsData, setWorkletsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // User profile state
  const [userName, setUserName] = useState('');
  const [loadingName, setLoadingName] = useState(true);
  const [userProfileData, setUserProfileData] = useState(null);
  
  // View state management
  const [layout, setLayout] = useState(() => localStorage.getItem('student_worklet_layout') || 'list');
  
  // Filter state for stat card clicks
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all', 'total', 'completed'
  
  // Icon rotation states
  const [isListIconRotating, setIsListIconRotating] = useState(false);
  const [isHorizontalIconRotating, setIsHorizontalIconRotating] = useState(false);

  // Load saved layout preference
  useEffect(() => {
    const savedLayout = localStorage.getItem('student_worklet_layout');
    if (savedLayout) {
      setLayout(savedLayout);
    }
  }, []);

  // Save layout preference when it changes
  useEffect(() => {
    localStorage.setItem('student_worklet_layout', layout);
  }, [layout]);

  // Fetch current user profile
  useEffect(() => {
    let cancelled = false;
    const loadUser = async () => {
      setLoadingName(true);
      try {
        const me = await getCurrentUser();
        if (cancelled) return;
        setUserProfileData(me);
        setUserName(sanitizeInput(me.name || me.email?.split('@')[0] || 'Student', { maxLength: 50 }));
        localStorage.setItem('user_email', me.email);
        localStorage.setItem('user_name', me.name || '');
      } catch (e) {
        console.error('Error loading user:', e);
        if (!cancelled) {
          setUserName('Student');
        }
      } finally {
        if (!cancelled) setLoadingName(false);
      }
    };
    loadUser();
    return () => { cancelled = true };
  }, []);

  // Fetch worklets function with proper security
  const fetchWorklets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use secure API with authentication
      const response = await secureAPI.get('/worklets/student/me');
      
      const payload = response.data;
      const items = Array.isArray(payload) ? payload : (Array.isArray(payload?.worklets) ? payload.worklets : []);

      if (items.length > 0) {
        const processedWorklets = items.map(worklet => ({
          ...worklet,
          id: worklet.id || worklet.worklet_id,
          created_at: worklet.created_at ? new Date(worklet.created_at) : new Date(),
          updated_at: worklet.updated_at ? new Date(worklet.updated_at) : new Date(),
          // Calculate progress if not provided
          progress: worklet.worklet_progress !== undefined ? worklet.worklet_progress : 
                   (worklet.percentage_completion !== undefined ? worklet.percentage_completion : 0),
        }));
        setWorkletsData(processedWorklets);
      } else {
        setWorkletsData([]);
      }
    } catch (error) {
      console.error("Error fetching worklets:", error);
      if (error.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
        // Redirect to login after a delay
        setTimeout(() => navigate('/'), 2000);
      } else if (error.response?.status === 403) {
        setError("You don't have permission to view worklets.");
      } else {
        setError("Failed to load worklets. Please try again.");
      }
      setWorkletsData([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Load worklets on component mount
  useEffect(() => {
    fetchWorklets();
  }, [fetchWorklets]);

  // Filter worklets based on selected filter
  const processedWorklets = React.useMemo(() => {
    if (selectedFilter === 'completed') {
      return workletsData.filter(w => w.status === 'Completed');
    }
    return workletsData; // 'all' or 'total' shows all worklets
  }, [workletsData, selectedFilter]);

  // Calculate stats
  const totalWorklets = workletsData.length;
  const completedWorklets = workletsData.filter(w => w.status === 'Completed').length;

  // Show error message if there's an error
  if (error) {
    return (
      <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
        <LeftSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              {error}
            </h2>
            <button
              onClick={fetchWorklets}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
        <RightSidebar />
      </div>
    );
  }

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
        <RightSidebar />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-100 text-slate-800 overflow-hidden dark:bg-slate-900 dark:text-slate-200">
      <LeftSidebar />

      <main className="flex-1 px-[2vw] py-[1.5vh] overflow-y-auto [&::-webkit-scrollbar]:hidden scrollbar-hide">
        <header className="flex justify-between items-center mb-[3vh]">
          <div>
            <h1 className="text-[clamp(1.75rem,3.5vw,2.25rem)] font-bold text-black dark:text-white">
              {loadingName ? 'Loading...' : `Welcome, ${userName.split(' ').slice(0, 2).join(' ')}`}
            </h1>
            <p className="text-[clamp(0.875rem,1.2vw,1rem)] text-slate-500 dark:text-slate-400">
              Track your learning journey and worklet progress
            </p>
          </div>
          <div className="flex items-center gap-[1vw]">
            <img src={samsungLogo} alt="PRISM" className="h-[clamp(2.5rem,4vw,3.5rem)] opacity-90" />
          </div>
        </header>

        {/* Profile and Stats Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-[1.5vw] mb-[3vh]">
          {/* Profile Card */}
          <div className="lg:col-span-2 relative overflow-visible rounded-2xl border border-white/10 bg-white/60 backdrop-blur-xl shadow-lg p-[1.5vw] dark:bg-slate-900/50 dark:border-slate-700">
            <div className="flex items-start gap-[1.2vw]">
              {userProfileData?.avatar_url ? (
                <img
                  src={userProfileData.avatar_url}
                  alt="Student"
                  className="w-[clamp(4rem,6vw,5.5rem)] h-[clamp(4rem,6vw,5.5rem)] rounded-full object-cover shadow-md"
                />
              ) : (
                <div
                  className="w-[clamp(4rem,6vw,5.5rem)] h-[clamp(4rem,6vw,5.5rem)] rounded-full flex items-center justify-center text-white font-bold text-[clamp(1.5rem,2.5vw,2rem)] shadow-md flex-shrink-0"
                  style={{ backgroundColor: generateColorFromName(userProfileData?.name || 'Student') }}
                >
                  <span>{getInitials(userProfileData?.name || 'Student')}</span>
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-[clamp(1.125rem,1.8vw,1.5rem)] font-bold text-slate-900 dark:text-white">
                  {userProfileData?.name || userName}
                </h2>
                {userProfileData?.email && (
                  <p className="text-[clamp(0.75rem,0.9vw,0.875rem)] text-slate-600 dark:text-slate-300 mt-[0.2vw]">
                    {userProfileData.email}
                  </p>
                )}
                {userProfileData?.college && (
                  <p className="text-[clamp(0.875rem,1.1vw,1rem)] font-medium text-blue-600 dark:text-blue-400 mt-[0.3vw]">
                    {userProfileData.college}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="space-y-[1vw]">
            <div 
              onClick={() => setSelectedFilter(selectedFilter === 'total' ? 'all' : 'total')} 
              className="cursor-pointer"
            >
              <StatCard
                value={loading ? '...' : totalWorklets}
                label="Total Worklets"
                icon={<BookOpen className="w-[clamp(1.25rem,1.8vw,2rem)] h-[clamp(1.25rem,1.8vw,2rem)] text-blue-500" />}
                accent={selectedFilter === 'total' 
                  ? "from-blue-100 to-blue-50 border-blue-400 dark:from-blue-900/50 dark:to-blue-800/30 dark:border-blue-500"
                  : "from-blue-50 to-white hover:border-blue-300 dark:from-slate-800/50 dark:to-slate-800/20 dark:hover:border-blue-600"
                }
              />
            </div>
            <div 
              onClick={() => setSelectedFilter(selectedFilter === 'completed' ? 'all' : 'completed')} 
              className="cursor-pointer"
            >
              <StatCard
                value={loading ? '...' : completedWorklets}
                label="Completed"
                icon={<CheckCircle className="w-[clamp(1.25rem,1.8vw,2rem)] h-[clamp(1.25rem,1.8vw,2rem)] text-green-500" />}
                accent={selectedFilter === 'completed'
                  ? "from-green-100 to-green-50 border-green-400 dark:from-green-900/50 dark:to-green-800/30 dark:border-green-500"
                  : "from-green-50 to-white hover:border-green-300 dark:from-slate-800/50 dark:to-slate-800/20 dark:hover:border-green-600"
                }
              />
            </div>
          </div>
        </section>

        {/* Worklets Display */}
        <section>
          {/* Section Title with Layout Toggle */}
          <div className="mb-[2vh] flex items-center justify-between">
            <h2 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-slate-900 dark:text-white">
              {selectedFilter === 'completed' ? 'Completed Worklets' : 
               selectedFilter === 'total' ? 'All Worklets' : 'My Worklets'}
            </h2>

            {/* Layout Toggle */}
            <div className="flex items-center gap-[0.5vw] p-1 bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl rounded-xl border border-white/10 dark:border-slate-700 shadow-lg">
              <button
                onClick={() => {
                  setLayout('list');
                  setIsListIconRotating(true);
                  setTimeout(() => setIsListIconRotating(false), 600);
                }}
                className={`p-2.5 rounded-lg transition-all duration-200 ${
                  layout === 'list'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
                title="List View"
              >
                <List className={`w-5 h-5 ${isListIconRotating ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => {
                  setLayout('horizontal');
                  setIsHorizontalIconRotating(true);
                  setTimeout(() => setIsHorizontalIconRotating(false), 600);
                }}
                className={`p-2.5 rounded-lg transition-all duration-200 ${
                  layout === 'horizontal'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
                title="Horizontal Scroll View"
              >
                <ArrowRightLeft className={`w-5 h-5 ${isHorizontalIconRotating ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {processedWorklets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-[8vh] bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 dark:border-slate-700 shadow-lg">
              <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                No worklets available
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-center max-w-md">
                Your worklets will appear here once assigned
              </p>
            </div>
          ) : layout === 'horizontal' ? (
            <div className="overflow-x-auto pb-4 -mx-[2vw] px-[2vw] [&::-webkit-scrollbar]:hidden scrollbar-hide">
              <div className="flex gap-[1.5vw] min-w-max">
                {processedWorklets.map((worklet) => (
                  <div
                    key={worklet.id}
                    onClick={() => navigate(`/worklet/${worklet.id}`)}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/60 backdrop-blur-xl shadow-lg p-[1.2vw] cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] dark:bg-slate-900/50 dark:border-slate-700 dark:hover:border-blue-500/50 w-[350px] flex-shrink-0"
                  >
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-[0.8vw]">
                      <span className={`px-3 py-1.5 rounded-full text-[clamp(0.65rem,0.85vw,0.8rem)] font-medium ${
                        worklet.status === 'Completed'
                          ? 'bg-green-500/10 text-green-700 border border-green-500/20 dark:text-green-300'
                          : 'bg-blue-500/10 text-blue-700 border border-blue-500/20 dark:text-blue-300'
                      }`}>
                        {worklet.status || 'Ongoing'}
                      </span>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all dark:text-slate-500 dark:group-hover:text-blue-400" />
                    </div>

                    {/* Title */}
                    <h3 className="text-[clamp(1rem,1.3vw,1.125rem)] font-bold text-slate-900 dark:text-white mb-[0.5vw] line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {worklet.title || 'Untitled Worklet'}
                    </h3>

                    {/* Description */}
                    <p className="text-[clamp(0.8rem,0.95vw,0.875rem)] text-slate-600 dark:text-slate-400 mb-[1vw] line-clamp-2">
                      {worklet.description || 'No description available'}
                    </p>

                    {/* Progress Bar (if available) */}
                    {worklet.progress !== undefined && (
                      <div className="mb-[1vw]">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[clamp(0.7rem,0.85vw,0.75rem)] text-slate-600 dark:text-slate-400 font-medium">
                            Progress
                          </span>
                          <span className="text-[clamp(0.7rem,0.85vw,0.75rem)] font-semibold text-blue-600 dark:text-blue-400">
                            {worklet.progress}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                            style={{ width: `${worklet.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-[clamp(0.7rem,0.85vw,0.75rem)] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {worklet.created_at
                            ? new Date(worklet.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'No date'}
                        </span>
                      </div>
                      {worklet.team_name && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">{worklet.team_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-[1vw]">
              {processedWorklets.map((worklet) => (
                <div
                  key={worklet.id}
                  onClick={() => navigate(`/worklet/${worklet.id}`)}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/60 backdrop-blur-xl shadow-lg p-[1.2vw] cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] dark:bg-slate-900/50 dark:border-slate-700 dark:hover:border-blue-500/50"
                >
                  <div className="flex items-center gap-[1.5vw]">
                    {/* Status Icon */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                      worklet.status === 'Completed'
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}>
                      {worklet.status === 'Completed' ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Target className="w-6 h-6" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[clamp(1rem,1.3vw,1.125rem)] font-bold text-slate-900 dark:text-white mb-1 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {worklet.title || 'Untitled Worklet'}
                          </h3>
                          <p className="text-[clamp(0.8rem,0.95vw,0.875rem)] text-slate-600 dark:text-slate-400 line-clamp-1">
                            {worklet.description || 'No description available'}
                          </p>
                        </div>
                        <span className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[clamp(0.65rem,0.85vw,0.8rem)] font-medium ${
                          worklet.status === 'Completed'
                            ? 'bg-green-500/10 text-green-700 border border-green-500/20 dark:text-green-300'
                            : 'bg-blue-500/10 text-blue-700 border border-blue-500/20 dark:text-blue-300'
                        }`}>
                          {worklet.status || 'Ongoing'}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      {worklet.progress !== undefined && (
                        <div className="mb-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[clamp(0.7rem,0.85vw,0.75rem)] text-slate-600 dark:text-slate-400 font-medium">
                              Progress
                            </span>
                            <span className="text-[clamp(0.7rem,0.85vw,0.75rem)] font-semibold text-blue-600 dark:text-blue-400">
                              {worklet.progress}%
                            </span>
                          </div>
                          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                              style={{ width: `${worklet.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-[clamp(0.7rem,0.85vw,0.75rem)] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {worklet.created_at
                              ? new Date(worklet.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'No date'}
                          </span>
                        </div>
                        {worklet.team_name && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{worklet.team_name}</span>
                          </div>
                        )}
                        {worklet.college && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{worklet.college}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="flex-shrink-0 w-6 h-6 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all dark:text-slate-500 dark:group-hover:text-blue-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      
      <RightSidebar />
    </div>
  );
}