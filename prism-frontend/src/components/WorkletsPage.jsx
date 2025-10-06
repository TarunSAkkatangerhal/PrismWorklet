import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { 
  Calendar, 
  Users, 
  Home,
  LayoutGrid, // Icon for Grid View
  List        // Icon for List View
} from "lucide-react";

// --- IMPORT DATA FROM THE NEW FILE ---
import { STATUS_OPTIONS, statusIcons } from "./data";

// Add professional animations inline
const animationStyles = `
  @keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  
  @keyframes float-slow {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-10px) rotate(5deg); }
  }
  
  @keyframes float-medium {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-8px) rotate(-3deg); }
  }
  
  @keyframes float-fast {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-6px) rotate(8deg); }
  }
  
  .animate-gradient-shift { animation: gradient-shift 8s ease infinite; }
  .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
  .animate-float-medium { animation: float-medium 4s ease-in-out infinite; }
  .animate-float-fast { animation: float-fast 3s ease-in-out infinite; }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = animationStyles;
  document.head.appendChild(styleSheet);
}

// Pure utility helpers moved outside component for stable references
const generateWorkletGradient = (quality) => {
  switch (quality) {
    case 'Excellence':
      return `linear-gradient(135deg, 
        #1e3a8a 0%, 
        #1e40af 25%, 
        #1d4ed8 50%, 
        #2563eb 75%, 
        #3b82f6 100%)`;
    case 'Good':
      return `linear-gradient(135deg, 
        #065f46 0%, 
        #047857 25%, 
        #059669 50%, 
        #10b981 75%, 
        #34d399 100%)`;
    case 'Needs Attention':
      return `linear-gradient(135deg, 
        #7c2d12 0%, 
        #9a3412 25%, 
        #c2410c 50%, 
        #ea580c 75%, 
        #f97316 100%)`;
    default:
      return `linear-gradient(135deg, 
        #374151 0%, 
        #4b5563 25%, 
        #6b7280 50%, 
        #9ca3af 75%, 
        #d1d5db 100%)`;
  }
};

const getCategoryAbbrev = (category) => {
  const abbreviations = {
    'Artificial Intelligence': 'AI',
    'Web Development': 'WEB',
    'Internet of Things': 'IOT',
    'Cybersecurity': 'SEC',
    'Blockchain': 'BC',
    'Augmented Reality': 'AR',
    'Machine Learning': 'ML',
    'Robotics': 'ROB'
  };
  return abbreviations[category] || 'TECH';
};

// Extract numeric percentage from various backend formats (e.g. 72, '72', '72%', '0.72')
const parsePercent = (val) => {
  if (val === undefined || val === null) return null;
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (typeof val === 'string') {
    const match = val.match(/\d+(?:\.\d+)?/);
    if (match) return parseFloat(match[0]);
  }
  return null;
};

const clamp01to100 = (num) => {
  if (num === null || isNaN(num)) return 0;
  // If backend sent fractional (<=1) treat as 0-1 scale
  if (num <= 1) num = num * 100;
  return Math.min(100, Math.max(0, num));
};

export default function WorkletsPage() {
  const [workletsData, setWorkletsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('Ongoing')
  const [isHoverActive, setIsHoverActive] = useState(false)
  const [layout, setLayout] = useState('grid') // 'grid' or 'list'
  const [lastUpdated, setLastUpdated] = useState(null)

  const API_BASE = (process.env.REACT_APP_API_URL || 'http://localhost:8000') + '/api'

  const getToken = useCallback(() => localStorage.getItem('access_token'), [])

  const authHeaders = useCallback(() => {
    const t = getToken()
    return t ? { headers: { Authorization: `Bearer ${t}` } } : { headers: {} }
  }, [getToken])

  const decodeJwt = useCallback((token) => {
    try {
      const [, payload] = token.split('.')
      return JSON.parse(atob(payload))
    } catch {
      return null
    }
  }, [])

  const resolveMentorId = useCallback(async () => {
    const token = getToken()
    if (token) {
      const decoded = decodeJwt(token)
      if (decoded?.user_id) return decoded.user_id
    }
    try {
      const cached = localStorage.getItem('user')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed?.id) return parsed.id
      }
    } catch (_) {}
    try {
      const res = await axios.get(`${API_BASE}/auth/me`, authHeaders())
      if (res.data?.id) return res.data.id
    } catch (e) {
      console.warn('Failed to resolve mentor via /auth/me', e)
    }
    return null
  }, [API_BASE, authHeaders, decodeJwt, getToken])

  const transformWorklets = useCallback((items = []) =>
    items
      .map((w) => {
        const id = w.id || w.worklet_id || w.cert_id || w.worklet_cert_id
        if (!id) return null
        const statusRaw = w.status || w.worklet_status || w.current_status || 'Ongoing'
        const status = statusRaw === 'Approved' ? 'Completed' : statusRaw
        // Pick the first available raw completion-like field
        const completionSource = w.percentage_completion ?? w.progress ?? w.completion
        const parsed = parsePercent(completionSource)
        let progress
        if (status.toLowerCase() === 'completed') {
          // Only force 100 if backend didn't provide a usable percentage
            progress = parsed === null ? 100 : clamp01to100(parsed)
        } else {
          progress = clamp01to100(parsed)
        }
        let students = Array.isArray(w.students) ? w.students : []
        students = students.map((s) => (typeof s === 'string' ? s : (s?.name || s?.full_name || s?.username || 'Student')))
        // Derive quality strictly from progress to enforce consistency (ignore backend quality field)
        // Thresholds: 80+ Excellence, 50-79 Good, else Needs Attention
        const quality = progress >= 80 ? 'Excellence' : (progress >= 50 ? 'Good' : 'Needs Attention')
        const category = w.domain || w.category || 'Technology'
        const start = w.start_date || w.startDate || w.assigned_at || null
        const end = w.end_date || w.endDate || w.deadline || null
        return {
          id,
          title: w.title || w.worklet_title || w.cert_id || 'Untitled Worklet',
          status,
          progress,
          description: w.description || w.summary || 'No description provided.',
          startDate: start ? new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
          endDate: end ? new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
          students,
          notificationCount: w.notifications || 0,
          quality,
          college: w.college || w.institution || w.college_name || w.organization || 'Unknown College',
          mentor: w.mentor || w.mentor_name || w.supervisor || 'Mentor',
          category,
          priority: w.priority || 'Medium',
        }
      })
      .filter(Boolean)
      .map((w) => ({
        ...w,
        gradient: generateWorkletGradient(w.quality),
        categoryAbbrev: getCategoryAbbrev(w.category),
        teamId: String(w.id).substring(0, 2).toUpperCase(),
      })), [] )

  const fetchWorklets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const mentorId = await resolveMentorId()
  if (!mentorId) throw new Error('Unable to resolve authenticated mentor id. Ensure you are logged in and a valid access token is present.')
      let res
      try {
        res = await axios.get(`${API_BASE}/associations/mentor/${mentorId}/all-worklets`, authHeaders())
      } catch (e) {
        // Fallback to ongoing endpoint
        res = await axios.get(`${API_BASE}/associations/mentor/${mentorId}/ongoing-worklets`, authHeaders())
      }
      const payload = res.data
      const raw = Array.isArray(payload)
        ? payload
        : payload.all_worklets || payload.ongoing_worklets || payload.worklets || []
      const transformed = transformWorklets(raw)
      setWorkletsData(transformed)
      setLastUpdated(new Date())
    } catch (e) {
      console.error('Worklets fetch failed:', e)
      // Provide clearer guidance for token / auth issues
      const message = /401|403/.test(String(e)) ? 'Authorization failed. Please re-login.' : (e.message || 'Failed to load worklets')
      setError(message)
      setWorkletsData([])
    } finally {
      setLoading(false)
    }
  }, [API_BASE, authHeaders, resolveMentorId, transformWorklets])

  useEffect(() => {
    fetchWorklets()
  }, [fetchWorklets])

  const filteredWorklets = workletsData.filter(
    (w) => w.status && w.status.toLowerCase() === activeTab.toLowerCase()
  )

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading your worklets...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen bg-slate-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow border border-gray-200 dark:border-slate-700 text-center">
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Failed to load worklets</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button
              onClick={fetchWorklets}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* --- SIDEBAR --- */}
      <nav 
        className="w-20 bg-gradient-to-t from-purple-300 via-indigo-50 to-blue-100 dark:from-slate-800 dark:via-slate-900 dark:to-black border-r border-purple-200/50 dark:border-slate-700/50 shadow-xl flex flex-col z-20"
        onMouseEnter={() => setIsHoverActive(true)}
        onMouseLeave={() => setIsHoverActive(false)}
      >
        <div className="h-20 flex items-center justify-center">
            <div className="w-12 h-12 flex items-center justify-center rounded-lg">
                <img src="https://play-lh.googleusercontent.com/e8F34JODgtXalC7mK09QocqhT5QCqDBPRPclFZmkcWZFc_oy2FCpofb5AFdyG_1hdg=w480-h960-rw" alt="Prism" className="object-contain"/>
            </div>
        </div>
        <div className="flex-grow flex flex-col items-center justify-center space-y-4 w-full">
          <Link
            to="/home"
            className="relative w-full h-12 flex justify-center items-center text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-all duration-200 rounded-lg hover:bg-black/10 dark:hover:bg-white/10"
          >
            <Home size={27} />
            {isHoverActive && (
              <div className="absolute left-full top-0 h-full flex items-center pl-4 pr-8 bg-gradient-to-r from-white/95 via-indigo-50/90 to-transparent dark:from-slate-800/95 dark:via-slate-900/90 dark:to-transparent rounded-r-lg shadow-lg animate-fade-in-right pointer-events-none backdrop-blur-sm">
                <span className="text-slate-800 dark:text-slate-200 font-medium whitespace-nowrap">Home</span>
              </div>
            )}
          </Link>
          <div className="w-full space-y-2">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={`relative w-full h-12 flex justify-center items-center rounded-lg transition-all duration-200 ${
                  activeTab === status
                    ? "bg-white/20 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 shadow-lg"
                    : "text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 hover:bg-black/10 dark:hover:bg-white/10"
                }`}
              >
                {statusIcons[status]}
                {isHoverActive && (
                  <div className="absolute left-full top-0 h-full flex items-center pl-4 pr-8 bg-gradient-to-r from-white/95 via-indigo-50/90 to-transparent dark:from-slate-800/95 dark:via-slate-900/90 dark:to-transparent rounded-r-lg shadow-lg animate-fade-in-right pointer-events-none backdrop-blur-sm">
                    <span className="text-slate-800 dark:text-slate-200 font-medium whitespace-nowrap">{status}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="h-20"></div>
      </nav>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 p-[2vw] overflow-y-auto">
        {/* Professional Header matching Dashboard */}
        <header className="flex justify-between items-center mb-[3vh]">
          <div>
            <h1 className="text-[clamp(1.75rem,3.5vw,2.25rem)] font-bold text-slate-900 dark:text-white">
              {activeTab} Worklets 🚀
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-[clamp(0.875rem,1.5vw,1rem)] mt-1">
              Managing and tracking {activeTab.toLowerCase()} project worklets across teams
              {lastUpdated && (
                <span className="block text-xs mt-1 text-gray-500 dark:text-gray-500">Updated {lastUpdated.toLocaleTimeString()}</span>
              )}
            </p>
          </div>
          
          {/* Enhanced Layout Toggle matching Dashboard */}
          <div className="flex items-center gap-3">
            <button
              onClick={fetchWorklets}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
            >Refresh</button>
            <div className="flex items-center gap-1 p-1 bg-white/50 dark:bg-slate-800/50 rounded-xl shadow-lg backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50">
              <button 
                onClick={() => setLayout('grid')} 
                className={`p-3 rounded-lg transition-all duration-200 ${
                  layout === 'grid' 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-blue-400'
                }`} 
                aria-label="Grid View"
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setLayout('list')} 
                className={`p-3 rounded-lg transition-all duration-200 ${
                  layout === 'list' 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-blue-400'
                }`} 
                aria-label="List View"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </header>
        
        <div className={layout === 'grid' 
          ? "grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-[clamp(1rem,2vw,2rem)]" 
          : "flex flex-col gap-[1vh]"
        }>
          {filteredWorklets.length > 0 ? (
            filteredWorklets.map((worklet) => (
              layout === 'grid' ? (
                <WorkletGridItem key={worklet.id} worklet={worklet} />
              ) : (
                <WorkletListItem key={worklet.id} worklet={worklet} />
              )
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No worklets found for "{activeTab}".</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// --- Enhanced Component for Grid View Item ---
const WorkletGridItem = ({ worklet }) => {
  const getQualityColor = (quality) => {
    switch (quality) {
      case 'Excellence': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Good': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Needs Attention': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Link to={`/worklet/${worklet.id}`}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group h-full border border-gray-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 transform hover:scale-[1.02]">
        {/* Header Section with Gradient */}
        <div className="relative h-48" style={{ background: worklet.gradient }}>
          {/* Clean Geometric Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 w-16 h-16 border border-white/20 rounded-lg rotate-12"></div>
            <div className="absolute bottom-4 right-4 w-12 h-12 border border-white/15 rounded-full"></div>
            <div className="absolute top-1/2 right-8 w-8 h-8 bg-white/10 rounded rotate-45"></div>
          </div>
          
          {/* Team ID and Category */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-4xl font-black mb-2 tracking-wider">
                {worklet.teamId}
              </div>
              <div className="text-sm font-medium tracking-[0.2em] uppercase opacity-80 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                {worklet.categoryAbbrev}
              </div>
            </div>
          </div>
          
          {/* Priority Indicator */}
          <div className={`absolute top-3 left-3 w-3 h-3 ${getPriorityColor(worklet.priority)} rounded-full border-2 border-white shadow-lg`}></div>
          
          {/* Quality Badge */}
          <div className={`absolute top-3 right-3 px-2 py-1 text-xs font-semibold rounded-full ${getQualityColor(worklet.quality)} border border-white/20 backdrop-blur-sm`}>
            {worklet.quality}
          </div>
          
          {/* Notification Badge */}
          {worklet.notificationCount > 0 && (
            <div className="absolute bottom-3 right-3 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-lg">
              {worklet.notificationCount}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Title and ID */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                {worklet.id}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {worklet.category}
              </span>
            </div>
            <h3 className="font-bold text-lg text-gray-900 dark:text-white leading-tight line-clamp-2">
              {worklet.title}
            </h3>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 leading-relaxed">
            {worklet.description}
          </p>

          {/* Progress Section */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{worklet.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div 
                className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out shadow-sm"
                style={{width: `${worklet.progress}%`}}
              ></div>
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar size={12}/>
                <span>{worklet.startDate}</span>
              </div>
              <div className="flex-1 mx-2 border-t border-dashed border-gray-300 dark:border-gray-600"></div>
              <div className="flex items-center gap-1">
                <span>{worklet.endDate}</span>
                <Calendar size={12}/>
              </div>
            </div>
          </div>

          {/* Students and College */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <Users size={14}/>
                <span className="font-medium">{worklet.students.length} Students</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-24">
                {worklet.college}
              </span>
            </div>
            
            {/* Student Avatars */}
            <div className="flex items-center gap-1">
              {worklet.students.slice(0, 4).map((student, index) => (
                <div 
                  key={student}
                  className="w-7 h-7 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold border-2 border-white dark:border-slate-800 shadow-sm"
                  title={student}
                >
                  {student.charAt(0)}
                </div>
              ))}
              {worklet.students.length > 4 && (
                <div className="w-7 h-7 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 text-xs font-semibold border-2 border-white dark:border-slate-800">
                  +{worklet.students.length - 4}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

// --- Enhanced Component for List View Item ---
const WorkletListItem = ({ worklet }) => {
  const getQualityColor = (quality) => {
    switch (quality) {
      case 'Excellence': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Good': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Needs Attention': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-red-500';
      case 'High': return 'bg-orange-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Link to={`/worklet/${worklet.id}`}>
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 flex items-center group border border-gray-200/50 dark:border-slate-700/50 hover:border-blue-300 dark:hover:border-blue-600 transform hover:scale-[1.02] hover:bg-white dark:hover:bg-slate-800">
        {/* Enhanced Gradient Section */}
        <div className="relative hidden sm:block flex-shrink-0 h-32 w-40 rounded-l-xl overflow-hidden">
          <div 
            className="absolute inset-0 animate-gradient-shift"
            style={{ 
              background: worklet.gradient,
              backgroundSize: '200% 200%'
            }}
          />
          
          {/* Minimal Geometric Elements */}
          <div className="absolute inset-0 opacity-15">
            <div className="absolute top-2 left-2 w-8 h-8 border border-white/20 rounded rotate-12"></div>
            <div className="absolute bottom-2 right-2 w-6 h-6 bg-white/10 rounded-full"></div>
          </div>
          
          {/* Clean Typography Design */}
          <div className="absolute inset-0 flex flex-col justify-center items-center">
            <div className="text-center text-white">
              <div className="text-2xl font-black mb-1 tracking-wider transform group-hover:scale-110 transition-transform duration-300">
                {worklet.teamId}
              </div>
              <div className="text-xs font-medium tracking-[0.15em] uppercase opacity-80 bg-white/25 px-2 py-0.5 rounded-full backdrop-blur-sm">
                {worklet.category.split(' ')[0]}
              </div>
            </div>
          </div>
          
          {/* Priority Indicator */}
          <div className={`absolute top-3 left-3 w-3 h-3 ${getPriorityColor(worklet.priority)} rounded-full border-2 border-white shadow-xl animate-pulse`}></div>
          
          {/* Notification Badge */}
          {worklet.notificationCount > 0 && (
            <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border border-white shadow-lg">
              {worklet.notificationCount}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-grow p-5">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-grow pr-4">
              {/* ID and Category */}
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                  {worklet.id}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {worklet.category}
                </span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getQualityColor(worklet.quality)}`}>
                  {worklet.quality}
                </span>
              </div>
              
              {/* Title */}
              <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1 mb-2">
                {worklet.title}
              </h3>
              
              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 hidden md:block">
                {worklet.description}
              </p>
            </div>

            {/* Status */}
            <span className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${
              worklet.status === 'Ongoing' 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' 
                : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            }`}>
              {worklet.status}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{worklet.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
              <div 
                className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out"
                style={{width: `${worklet.progress}%`}}
              ></div>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-400">
            {/* Left side - Students and College */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users size={14}/>
                <span>{worklet.students.length} Students</span>
              </div>
              
              <div className="hidden sm:flex items-center gap-1">
                {worklet.students.slice(0, 3).map((student, index) => (
                  <div 
                    key={student}
                    className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold border border-white dark:border-slate-800"
                    title={student}
                  >
                    {student.charAt(0)}
                  </div>
                ))}
                {worklet.students.length > 3 && (
                  <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 text-xs font-semibold border border-white dark:border-slate-800">
                    +{worklet.students.length - 3}
                  </div>
                )}
              </div>
            </div>

            {/* Right side - Timeline */}
            <div className="flex items-center gap-2 text-xs">
              <Calendar size={12}/>
              <span>{worklet.startDate} - {worklet.endDate}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};