// Dashboard page: Presents mentor snapshot including profile, stats, and ongoing worklets.
// Focus points:
// 1. Fetch mentor profile & worklets once and cache lightweight view state (layout) in localStorage
// 2. Transform backend worklet shape into a normalized card-friendly structure
// 3. Provide responsive layout (grid / horizontal scroll) with animated, accessible UI
// 4. Avoid unnecessary re-renders via localized derived data (e.g., filtered ongoing worklets)
import { getMentorOngoingWorkletsById, getMentorAllWorkletsById } from '../services/worklets' // Service helpers for API calls
import { getCurrentUser } from '../services/auth' // Secure authentication
import { sanitizeInput } from '../utils/security' // Security utilities
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import LeftSidebar from '../components/Left'   // Persistent navigation rail (left)
import RightSidebar from '../components/Right' // Ancillary widgets / future extensions (right)
import StatCard from '../components/StatCard'  // Reusable compact statistic display card

import samsungLogo from '../assets/prism_logo.png' // Brand / product logo

import {

  Calendar,
  MapPin,
  Zap,
  Rocket,
  Key,
  Crown,
  BookOpen,
  Users as UsersIcon,
  Users,
  LayoutGrid,
  Columns,
} from 'lucide-react'

// --- DUMMY DATA WITH NEW ID FORMAT AND MORE WORKLETS ---
// Retained for design / layout reference & potential offline prototyping.
// Currently NOT used in render path (live data comes from mentor endpoints).



// Level thresholds based on worklet count
const LEVEL_THRESHOLDS = [
  { name: 'SPARK', Icon: Zap, color: 'text-yellow-500', threshold: 1 },   // 1+ worklets
  { name: 'LEAD', Icon: Rocket, color: 'text-blue-500', threshold: 5 },   // 5+ worklets  
  { name: 'CORE', Icon: Key, color: 'text-green-500', threshold: 10 },    // 10+ worklets
  { name: 'MASTER', Icon: Crown, color: 'text-purple-500', threshold: 15 }, // 15+ worklets
]

// Helper function to determine current level based on worklet count
const getCurrentLevelFromWorklets = (workletCount) => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (workletCount >= LEVEL_THRESHOLDS[i].threshold) {
      return i;
    }
  }
  return -1; // Below SPARK level (0 worklets)
}

// Ordered progression ladder displayed as horizontal milestones over progress bar
const levels = [
  { name: 'SPARK', Icon: Zap, color: 'text-yellow-500' },
  { name: 'LEAD', Icon: Rocket, color: 'text-blue-500' },
  { name: 'CORE', Icon: Key, color: 'text-green-500' },
  { name: 'MASTER', Icon: Crown, color: 'text-purple-500' },
]

// Helper functions (getInitials, generateColorFromName, etc. remain the same)
// Safely derive initials from a full name for avatar fallback
const getInitials = (name) => {
  if (!name) return ''
  const nameParts = name.split(' ')
  if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase()
  return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
}

// Deterministic pastel-esque background color selection for avatar circles
const generateColorFromName = (name) => {
  const colors = ['#0077b6', '#0096c7', '#48cae4', '#90e0ef', '#ade8f4']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash % colors.length)]
}

export default function Dashboard() {
  useDocumentTitle('PRISM-home');
  
  // -------------------------- STATE --------------------------
  // User identity / profile
  const [userName, setUserName] = useState('')
  const [loadingName, setLoadingName] = useState(true)

  const navigate = useNavigate()
  // Persist layout preference (grid vs horizontal carousel) for continuity across sessions
  const [layout, setLayout] = useState(() => localStorage.getItem('worklet_layout') || 'horizontal')
  
  // State for icon rotation animations
  const [isGridIconRotating, setIsGridIconRotating] = useState(false)
  const [isColumnsIconRotating, setIsColumnsIconRotating] = useState(false)
  // Raw normalized worklet list (only ongoing subset stored)
  const [worklets, setWorklets] = useState([])
  // Separate total count (includes completed) for stats panel
  const [totalWorkletsCount, setTotalWorkletsCount] = useState(0)
  const [isLoadingWorklets, setIsLoadingWorklets] = useState(true)
  // Full mentor profile object (includes nested mentor_profile meta)
  const [userProfileData, setUserProfileData] = useState(null)

  // Engagement metrics (e.g., unique mentees) structure mirrors backend format for future expansion
  const [mentorStats, setMentorStats] = useState({ engagement_data: { 'My Students': 0 } })
  const [isLoadingMentorStats, setIsLoadingMentorStats] = useState(true)

  // Fetch current user once
  useEffect(() => {
    // Fetch authenticated mentor identity once on mount
    let cancelled = false
    const loadUser = async () => {
      setLoadingName(true)
      try {
        const me = await getCurrentUser()
        if (cancelled) return
        setUserProfileData(me)
        setUserName(sanitizeInput(me.name || me.email?.split('@')[0] || 'User', { maxLength: 50 }))
        localStorage.setItem('user_email', me.email)
        localStorage.setItem('user_name', me.name || '')
      } catch (e) {
        if (!cancelled) {
          setUserName('User')
        }
      } finally {
        if (!cancelled) setLoadingName(false)
      }
    }
    loadUser()
    return () => { cancelled = true }
  }, [])

  // Fetch real-time worklets for the logged-in mentor
  useEffect(() => {
    // After profile is available, load mentor-associated worklets & student stats
    let cancelled = false
    const fetchMentorWorklets = async () => {
      setIsLoadingWorklets(true)
      try {
        // Prefer associations endpoint (same as WorkletsPage) for canonical ongoing worklets list
        if (!userProfileData?.id) throw new Error('Mentor user id missing')
        // Fetch ongoing subset for display
        const assocData = await getMentorOngoingWorkletsById(userProfileData.id) // Ongoing subset
        // Fetch aggregate (all worklets) for totals
        const allData = await getMentorAllWorkletsById(userProfileData.id)       // Full collection (statuses)
        const list = assocData?.ongoing_worklets || []
        
        
        // Normalize each worklet and preserve student names from backend
        const normalized = list.map((worklet) => {
          const progressVal = Number(worklet.percentage_completion ?? worklet.mentor_progress ?? worklet.progress ?? 0) || 0
          // Harmonize status labels regardless of backend variant fields
          const status = worklet.completion_status ? (worklet.completion_status === 'Completed' ? 'Completed' : 'Ongoing') : (worklet.status || 'Ongoing')
          
          // Use backend performance field (from Performance column - single source of truth)
          let quality = null
          if (worklet.performance) {
            const perf = String(worklet.performance).toLowerCase().trim()
            // Map to new quality labels: Very Good, Good, Average, Poor
            if (perf.includes('very') && perf.includes('good')) quality = 'Very Good'
            else if (perf.includes('excellent') || perf.includes('excel')) quality = 'Very Good' // Map Excellence -> Very Good
            else if (perf.includes('good') && !perf.includes('very')) quality = 'Good'
            else if (perf.includes('average') || perf.includes('avg')) quality = 'Average'
            else if (perf.includes('poor') || perf.includes('need')) quality = 'Poor' // Map Needs Attention -> Poor
            else quality = worklet.performance.charAt(0).toUpperCase() + worklet.performance.slice(1)
          }
          
          // Extract student names (fallback to email if name missing)
          const studentNames = Array.isArray(worklet.students) ? worklet.students.map(s => s.name || s.email || 'Student') : []
          // Keep raw ISO dates for calculations and formatted versions for display
          const startISO = worklet.start_date || null
          const endISO = worklet.end_date || null
          const startDisplay = startISO ? new Date(startISO).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'
          const endDisplay = endISO ? new Date(endISO).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'
          
          // Extract latest suggestion data
          const latestSuggestion = worklet.latest_suggestion || null
          
          return {
            id: worklet.id,
            title: worklet.cert_id || worklet.title || 'Untitled Worklet',
            status,
            progress: progressVal,
            description: worklet.description || 'No description available',
            startDateISO: startISO,
            endDateISO: endISO,
            startDate: startDisplay,
            endDate: endDisplay,
            students: studentNames,
            notificationCount: 0,
            quality,
            college: worklet.college || 'Unknown College',
            team: worklet.team || worklet.domain || 'General',
            latestSuggestion
          }
        })
        if (!cancelled) {
          // Only show ongoing subset on dashboard
          const ongoing = normalized.filter(w => w.status === 'Ongoing')
          setWorklets(ongoing)
          // Use backend aggregate from all-worklets response; fallback to ongoing response; then fallback to local uniq calculation
          let mentees = allData?.total_mentees ?? assocData?.total_mentees // Prefer authoritative aggregate counts
          if (mentees === undefined) {
            const uniqueStudentIds = new Set()
            list.forEach(w => {
              if (Array.isArray(w.students)) {
                w.students.forEach(s => {
                  if (s && (s.id !== undefined && s.id !== null)) uniqueStudentIds.add(s.id)
                  else if (s?.email) uniqueStudentIds.add(s.email)
                })
              }
            })
            mentees = uniqueStudentIds.size
          }
          setMentorStats({ engagement_data: { 'My Students': mentees } })
          // Store total worklets (all statuses) for StatCard display by temporarily attaching to state length derivation
          // We'll override worklets.length usage by storing count separately if needed
          setTotalWorkletsCount(allData?.total_worklets ?? ongoing.length)
          setIsLoadingMentorStats(false)
        }
      } catch (e) {
        console.error('Failed to load mentor worklets', e)
        if (!cancelled) {
          setWorklets([])
          setIsLoadingMentorStats(false)
        }
      } finally {
        if (!cancelled) setIsLoadingWorklets(false)
      }
    }
    if (userProfileData) fetchMentorWorklets()
    return () => { cancelled = true }
  }, [userProfileData])

  // Filter for ongoing worklets
  // Derived view subset: actively ongoing & not fully complete (guards against stale 100% items)
  const workletsData = worklets.filter(
    (worklet) => worklet.status?.toLowerCase() === 'ongoing' && worklet.progress < 100
  )



  // Calculate progress percentage based on total worklets (15 worklets = 100%)
  const progressPercentage = Math.min((totalWorkletsCount / 15) * 100, 100)

  return (
    <div className="flex h-screen w-full bg-slate-100 text-slate-800 overflow-hidden dark:bg-slate-900 dark:text-slate-200">
      <LeftSidebar />

      <main className="flex-1 px-[2vw] py-[1.5vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-200 [&::-webkit-scrollbar-thumb]:bg-slate-400 dark:[&::-webkit-scrollbar-track]:bg-slate-800 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600">
        <header className="flex justify-between items-center mb-[3vh]">
          <div>
            <h1 className="text-[clamp(1.75rem,3.5vw,2.25rem)] font-bold text-black dark:text-white">
              {loadingName ? 'Loading...' : `Welcome , ${userName.split(' ')[0]}`}
            </h1>
            <p className="text-[clamp(0.875rem,1.2vw,1rem)] text-slate-500 dark:text-slate-400">Here's your snapshot for today.</p>
          </div>
          <div className="flex items-center gap-[1vw]">
            <img src={samsungLogo} alt="PRISM" className="h-[clamp(2.5rem,4vw,3.5rem)] opacity-90" />
          </div>
        </header>

  {/* Top summary section: Profile card (2 cols) + Stat side column */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-[1.5vw]">
          <div className="lg:col-span-2 relative overflow-visible rounded-2xl border border-white/10 bg-white/60 backdrop-blur-xl shadow-lg p-[1.5vw] dark:bg-slate-900/50 dark:border-slate-700">
            <div className="flex items-start gap-[1.2vw]">
              {userProfileData?.mentor_profile?.avatar_url ? (
                <img
                  src={userProfileData.mentor_profile.avatar_url}
                  alt="Author"
                  className="w-[clamp(4rem,6vw,5.5rem)] h-[clamp(4rem,6vw,5.5rem)] rounded-full object-cover shadow-md cursor-pointer hover:ring-4 hover:ring-blue-200 dark:hover:ring-blue-800 transition-all"
                 
                />
              ) : (
                <div
                  className="w-[clamp(4rem,6vw,5.5rem)] h-[clamp(4rem,6vw,5.5rem)] rounded-full flex items-center justify-center text-white font-bold text-[clamp(1.5rem,2.5vw,2rem)] shadow-md flex-shrink-0 cursor-pointer hover:ring-4 hover:ring-blue-200 dark:hover:ring-blue-800 transition-all"
                  style={{ backgroundColor: generateColorFromName(userProfileData?.name || 'User') }}
                  
                >
                  <span>{getInitials(userProfileData?.name || 'User')}</span>
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-[clamp(1.125rem,1.8vw,1.5rem)] font-bold text-slate-900 dark:text-white">{userProfileData?.name || userName}</h2>
                {userProfileData?.email && (
                  <p className="text-[clamp(0.75rem,0.9vw,0.875rem)] text-slate-600 dark:text-slate-300 mt-[0.2vw]">
                    {userProfileData.email}
                  </p>
                )}
                {userProfileData?.mentor_profile?.qualification && (
                  <p className="text-[clamp(0.875rem,1.1vw,1rem)] font-medium text-blue-600 dark:text-blue-400">
                    {userProfileData?.mentor_profile?.qualification}
                  </p>
                )}
                {userProfileData?.mentor_profile?.location && (
                  <p className="text-[clamp(0.75rem,0.9vw,0.875rem)] text-slate-500 dark:text-slate-400 mt-[0.5vw] flex items-center gap-[0.4vw]">
                    <MapPin className="w-[clamp(0.75rem,1vw,1rem)] h-[clamp(0.75rem,1vw,1rem)]" />
                    {userProfileData.mentor_profile.location}
                  </p>
                )}
                {/* Refined glass chips row */}
                <div className="mt-[0.8vw] flex flex-wrap gap-[0.5vw]">
                  
                  {userProfileData?.college && (
                    <span className="px-3 py-1.5 rounded-full text-[clamp(0.65rem,0.85vw,0.8rem)] bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 backdrop-blur dark:text-indigo-200">
                      {userProfileData.college}
                    </span>
                  )}
                  
                  
                </div>
              </div>
            </div>
            <div className="relative mt-[1.5vw]">
              {/* Progress bar with small milestone dots that fill when passed, no numbers */}
              <div className="relative h-[0.5vw] w-full bg-slate-200 rounded-full shadow-inner dark:bg-slate-700 mt-[1vw]">
                <div
                  className="h-[0.5vw] bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${totalWorkletsCount >= 1 ? Math.max(progressPercentage, 5) : progressPercentage}%` }}></div>
                {levels.map((level, idx) => {
                  const percent = [0, 33, 66, 100][idx];
                  const currentLevel = getCurrentLevelFromWorklets(totalWorkletsCount);
                  const levelsToGo = idx - currentLevel;
                  const nextThreshold = LEVEL_THRESHOLDS[idx]?.threshold || 15;
                  const workletsNeeded = Math.max(0, nextThreshold - totalWorkletsCount);
                  let tooltipText = '';
                  if (levelsToGo > 1) {
                    tooltipText = `${workletsNeeded} more worklet${workletsNeeded !== 1 ? 's' : ''} to reach ${level.name}`;
                  } else if (levelsToGo === 1) {
                    tooltipText = `${workletsNeeded} more worklet${workletsNeeded !== 1 ? 's' : ''} to reach ${level.name}`;
                  } else if (levelsToGo === 0) {
                    tooltipText = idx === levels.length - 1 ? 'Highest level achieved! ✨' : `You are here (${totalWorkletsCount} worklets)`;
                  } else {
                    tooltipText = `Milestone achieved ✅)`;
                  }
                  // Spark dot: filled if user has at least one worklet
                  let filled;
                  if (idx === 0) {
                    filled = totalWorkletsCount >= 1;
                  } else {
                    filled = progressPercentage >= percent;
                  }
                  // Tooltip style: Spark dot (idx 0) gets fixed left offset, others centered
                  const tooltipStyle = idx === 0
                    ? { left: '0.5rem', transform: 'none', zIndex: 9999, minWidth: '8rem' }
                    : { left: '50%', transform: 'translateX(-50%)', zIndex: 9999 };
                  return (
                    <div
                      key={level.name}
                      className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 group flex items-center justify-center`}
                      style={{ left: `calc(${percent}% - 0.75rem)` }}
                    >
                      <span
                        className={`w-3 h-3 rounded-full border-2 shadow-lg transition-all duration-500 ${filled ? level.color : 'border-gray-300 bg-gray-200'}`}
                        style={filled
                          ? { borderColor: 'currentColor', backgroundColor: 'currentColor' }
                          : { borderColor: '#d1d5db', backgroundColor: '#e5e7eb' }}
                      ></span>
                      <span className="absolute -top-7 w-max px-2 py-1 text-xs bg-slate-800 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap" style={tooltipStyle}>
                        {tooltipText}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Level names below the bar */}
              <div className="flex justify-between text-[clamp(0.75rem,0.9vw,0.875rem)] mt-[1vw] text-slate-600 font-medium dark:text-slate-400">
                {levels.map((level, idx) => (
                  <span key={level.name} className={`text-xs font-semibold ${level.color} flex items-center gap-1`}>
                    <level.Icon className={`w-4 h-4 ${level.color}`} />
                    {level.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-[1vw]">
            <div onClick={() => navigate('/worklets?tab=All')} className="cursor-pointer">
              <StatCard
                value={isLoadingWorklets ? '...' : totalWorkletsCount}
                label="Total Worklets"
                icon={<BookOpen className="w-[clamp(1.25rem,1.8vw,2rem)] h-[clamp(1.25rem,1.8vw,2rem)] text-blue-500" />}
                accent="from-blue-50 to-white hover:border-blue-300 dark:from-slate-800/50 dark:to-slate-800/20 dark:hover:border-blue-600"
              />
            </div>
            <StatCard
              value={isLoadingMentorStats ? '...' : mentorStats?.engagement_data?.['My Students']}
              label="Total students"
              icon={<UsersIcon className="w-[clamp(1.25rem,1.8vw,2rem)] h-[clamp(1.25rem,1.8vw,2rem)] text-indigo-500" />}
              accent="from-indigo-50 to-white hover:border-indigo-300 dark:from-slate-800/50 dark:to-slate-800/20 dark:hover:border-indigo-600"
            />
          </div>
        </section>

        {/* My Worklets */}
        <div className="mt-[3vh]">
          <div className="flex justify-between items-center mb-[1.5vh]">
            <h2 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-slate-900 dark:text-white">Ongoing Worklets</h2>
            <div className="flex items-center gap-[0.2vw] p-[0.3vw] bg-gray-200 rounded-lg dark:bg-slate-900">
              <button
                onClick={() => {
                  setIsGridIconRotating(true)
                  setLayout('grid')
                  localStorage.setItem('worklet_layout', 'grid')
                  setTimeout(() => setIsGridIconRotating(false), 300)
                }}
                className={`p-[0.4vw] rounded-md transition-colors ${
                  layout === 'grid' ? ' text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
                aria-label="Grid View">
                <LayoutGrid 
                  size={Math.max(16, Math.min(24, window.innerWidth * 0.015))} 
                  className={`transition-transform duration-300 ${isGridIconRotating ? 'rotate-180' : ''}`}
                />
              </button>
              <button
                onClick={() => {
                  setIsColumnsIconRotating(true)
                  setLayout('horizontal')
                  localStorage.setItem('worklet_layout', 'horizontal')
                  setTimeout(() => setIsColumnsIconRotating(false), 300)
                }}
                className={`p-[0.4vw] rounded-md transition-colors ${
                  layout === 'horizontal' ? ' text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
                aria-label="Horizontal View">
                <Columns 
                  size={Math.max(16, Math.min(24, window.innerWidth * 0.015))} 
                  className={`transition-transform duration-300 ${isColumnsIconRotating ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
          </div>

          {isLoadingWorklets ? (
            // Loading state with skeleton cards
            <div
              className={
                layout === 'grid'
                  ? 'grid grid-cols-3 gap-8'
                  : 'flex overflow-x-auto gap-8 pb-4'
              }>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-full aspect-video bg-gray-200 animate-pulse rounded-2xl dark:bg-slate-700"></div>
              ))}
            </div>
          ) : (
            <div
              className={
                layout === 'grid'
                  ? 'grid grid-cols-3 gap-[clamp(1rem,2vw,2rem)]'
                  : 'flex z-50 overflow-x-auto gap-[clamp(1rem,2vw,2rem)] pb-[1vh] overflow-y-visible [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-blue-400/50 [&::-webkit-scrollbar-thumb]:rounded-full'
              }>
              {workletsData.map((worklet) => (
                <WorkletCard key={worklet.id} worklet={worklet} layout={layout} navigate={navigate} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Right Sidebar */}
      <RightSidebar />
    </div>
  )
}

// --- UPDATED WORKLET CARD COMPONENT ---
function WorkletCard({ worklet, layout, navigate }) {
  // Helper function to format suggestion content
  const formatSuggestionContent = (content, maxWords = 15) => {
    if (!content) return null
    const words = content.split(' ')
    if (words.length <= maxWords) return content
    return words.slice(0, maxWords).join(' ') + '...'
  }

  // Helper function to calculate time ago from created_at
  const getTimeAgo = (createdAt) => {
    if (!createdAt) return 'recently'
    
    try {
      const created = new Date(createdAt)
      const now = new Date()
      const diffMs = now - created
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffHours / 24)
      
      if (diffHours < 1) return 'Just now'
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      return `${Math.floor(diffDays / 7)}w ago`
    } catch (e) {
      return 'recently'
    }
  }

  // Get latest suggestion display text
  const getLatestSuggestionDisplay = () => {
    if (!worklet.latestSuggestion) {
      return {
        text: 'No suggestions yet',
        timeAgo: null
      }
    }
    
    const content = worklet.latestSuggestion.content || worklet.latestSuggestion.title || 'Suggestion available'
    return {
      text: formatSuggestionContent(content),
      timeAgo: getTimeAgo(worklet.latestSuggestion.created_at)
    }
  }

  const suggestionDisplay = getLatestSuggestionDisplay()

  // Container width adapts when in horizontal scroller vs grid mode
  const containerClasses = layout === 'grid' ? 'w-full' : 'w-[clamp(18rem,25vw,22rem)] flex-shrink-0'

  // Professional corporate background colors based on worklet quality
  // Thematic gradient derived from qualitative status (visual semantic cue)
  const getBackgroundGradient = () => {
    const quality = worklet.quality || 'Default'
    
    switch (quality) {
      case 'Very Good':
        return `linear-gradient(135deg, 
          #1e3a8a 0%, 
          #1e40af 25%, 
          #1d4ed8 50%, 
          #2563eb 75%, 
          #3b82f6 100%)`
      case 'Good':
        return `linear-gradient(135deg, 
          #065f46 0%, 
          #047857 25%, 
          #059669 50%, 
          #10b981 75%, 
          #34d399 100%)`
      case 'Average':
        return `linear-gradient(135deg, 
          #854d0e 0%, 
          #a16207 25%, 
          #ca8a04 50%, 
          #eab308 75%, 
          #facc15 100%)`
      case 'Poor':
        return `linear-gradient(135deg, 
          #7c2d12 0%, 
          #9a3412 25%, 
          #c2410c 50%, 
          #ea580c 75%, 
          #f97316 100%)`
      default:
        return `linear-gradient(135deg, 
          #374151 0%, 
          #4b5563 25%, 
          #6b7280 50%, 
          #9ca3af 75%, 
          #d1d5db 100%)`
    }
  }

  // Calculate days left until end date; clamps past-due as 0
  const calculateRemainingDays = (endDateStr) => {
    if (!endDateStr) return { days: 0, label: 'No end date' }
    const endDate = new Date(endDateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    endDate.setHours(0, 0, 0, 0)

    const diffTime = endDate - today
    if (diffTime < 0) {
      return { days: 0, label: 'Past Due' }
    }
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return { days: diffDays, label: `${diffDays} days left` }
  }

  const remaining = calculateRemainingDays(worklet.endDateISO)

  // Badge background palette per quality band
  const qualityStyles = {
    'Very Good': 'bg-blue-600/90',
    'Good': 'bg-green-500/90',
    'Average': 'bg-yellow-500/90',
    'Poor': 'bg-red-500/90',
    'Default': 'bg-gray-500/80',
  }
  
  // Primary navigation: open worklet detail view
  const handleCardClick = () => {
    navigate(`/worklet/${worklet.id}`)
  }

  // Utility to keep badge sizes stable
  const truncateText = (text, maxLength = 40) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }
  return (
    <div
      onClick={handleCardClick}
      className={`group relative aspect-video cursor-pointer overflow-hidden rounded-2xl shadow-lg transition-all duration-500 ease-in-out hover:scale-105 ${containerClasses}`}>
      {/* Enhanced Dynamic Background */}
      <div className="h-full w-full relative overflow-hidden">
        {/* Main Animated Gradient Background */}
        <div 
          className="absolute inset-0 animate-gradient-shift transition-all duration-700 group-hover:scale-110"
          style={{
            background: getBackgroundGradient(),
            backgroundSize: '200% 200%'
          }}
        />
        
        {/* Subtle Professional Elements */}
        <div className="absolute inset-0 opacity-15">
          <div className="absolute w-16 h-16 rounded-full bg-white/8 animate-float-slow" 
               style={{ top: '15%', left: '15%', animationDelay: '0s' }} />
          <div className="absolute w-12 h-12 rounded-full bg-white/10 animate-float-medium" 
               style={{ top: '65%', right: '25%', animationDelay: '2s' }} />
          <div className="absolute w-8 h-8 rounded-full bg-white/6 animate-float-fast" 
               style={{ bottom: '20%', left: '40%', animationDelay: '4s' }} />
        </div>
        
        {/* Professional Geometric Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `
                linear-gradient(45deg, rgba(255, 255, 255, 0.05) 25%, transparent 25%),
                linear-gradient(-45deg, rgba(255, 255, 255, 0.05) 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, rgba(255, 255, 255, 0.05) 75%),
                linear-gradient(-45deg, transparent 75%, rgba(255, 255, 255, 0.05) 75%)
              `,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
            }}>
          </div>
        </div>
        
        {/* Subtle Professional Shimmer */}
        <div 
          className="absolute inset-0 opacity-8 group-hover:opacity-15 transition-opacity duration-500"
          style={{
            background: `linear-gradient(110deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)`,
            transform: 'translateX(-100%)',
            animation: 'shimmer 6s infinite linear'
          }}
        />
        
        {/* Professional Grid Lines */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }} />
        </div>
      </div>

      {/* Professional overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/20 group-hover:from-black/30 group-hover:via-black/20 group-hover:to-black/10 transition-all duration-500"></div>

     

      {/* --- STATUS AND COLLEGE BADGES AT TOP --- */}
      <div className="absolute top-0 left-0 right-0 p-[clamp(0.75rem,1.5vw,1.25rem)] text-white transition-opacity duration-300 group-hover:opacity-0 z-10">
        <div className="flex flex-wrap gap-[0.375vw] mb-[0.75vw]">
          
          <span 
            className="text-[clamp(0.65rem,0.85vw,0.8rem)] text-white bg-indigo-600/90 backdrop-blur-md px-[0.6vw] py-[0.3vw] rounded-full font-bold shadow-xl border-2 border-white/30 whitespace-nowrap"
            title={worklet.college}
          >
            {truncateText(worklet.college)}
          </span>
        </div>
        {/* PROBLEM STATEMENT with comfortable font size */}
        <h3 className="text-[clamp(0.875rem,1.2vw,1rem)] font-semibold leading-tight">{worklet.title}</h3>
      </div>

      {/* --- PROGRESS BAR AT BOTTOM --- */}
      <div className="absolute bottom-0 left-0 right-0 p-[clamp(0.75rem,1.5vw,1.25rem)] text-white transition-opacity duration-300 group-hover:opacity-0">
        <div>
          <div className="flex justify-between text-[clamp(0.6rem,0.8vw,0.75rem)] font-medium text-cyan-200">
            <span>Progress</span>
            <span>{worklet.progress}%</span>
          </div>
          <div className="mt-[0.25vw] h-[0.4vw] w-full rounded-full bg-white/20">
            <div
              className="h-[0.4vw] rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
              style={{ width: `${worklet.progress}%` }}></div>
          </div>
        </div>
      </div>

      {/* --- MODIFIED HOVER STATE CONTENT --- */}
      <div 
        className="absolute inset-0 flex text-white opacity-0 transition-opacity duration-300 delay-150 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
        onWheel={(e) => {
          e.stopPropagation();
          // Find the scrollable content area
          const scrollableElement = e.currentTarget.querySelector('.scrollable-content');
          if (scrollableElement) {
            // Always allow scrolling within the content area
            scrollableElement.scrollTop += e.deltaY;
            
            // Prevent parent scroll
            e.preventDefault();
          }
        }}
      >
        <div 
          className="scrollable-content flex-grow p-[clamp(0.75rem,1.5vw,1.25rem)] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-cyan-400/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-cyan-400/70"
        >
          {/* ID is now displayed on hover instead of title */}

          <div className="mt-[0.25vw] text-[clamp(0.6rem,0.8vw,0.75rem)] text-blue-300">{worklet.college}</div>

          {/* DESCRIPTION is now displayed on hover */}
          <p className="mt-[0.75vw] text-[clamp(0.75rem,1vw,0.875rem)] text-gray-200">{worklet.description}</p>

          <div className="mt-[0.75vw] flex items-center gap-[0.5vw] text-[clamp(0.6rem,0.8vw,0.75rem)] text-gray-300">
            <Calendar size={Math.max(12, Math.min(16, window.innerWidth * 0.012))} />
            <span>
              {worklet.startDate} - {worklet.endDate}
            </span>
          </div>

          {worklet.students.length > 0 ? (
            <div className="mt-[0.75vw]">
              <div className="flex items-center gap-[0.5vw] font-semibold text-[clamp(0.75rem,1vw,0.875rem)]">
                <Users size={Math.max(14, Math.min(18, window.innerWidth * 0.014))} />
                <h4>Assigned Students</h4>
              </div>
              <ul className="mt-[0.25vw] list-disc list-inside text-[clamp(0.6rem,0.8vw,0.75rem)] text-gray-200 space-y-[0.15vw]">
                {worklet.students.map((student, index) => (
                  <li key={`${worklet.id}-student-${index}`}>{student}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-[0.75vw]">
              <div className="flex items-center gap-[0.5vw] font-semibold text-[clamp(0.75rem,1vw,0.875rem)] text-gray-400">
                <Users size={Math.max(14, Math.min(18, window.innerWidth * 0.014))} />
                <h4>No students assigned yet</h4>
              </div>
            </div>
          )}
        </div>

        {/* Right side panel with latest update */}
        <div className="w-[clamp(6rem,8vw,7.5rem)] flex-shrink-0 bg-black/40 flex flex-col items-center text-center p-[0.4vw] transform translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-in-out overflow-hidden">
          {worklet.quality && (
            <span
              className={`px-[0.4vw] py-[0.2vw] rounded-md text-[clamp(0.5rem,0.7vw,0.65rem)] font-bold text-white ${
                qualityStyles[worklet.quality] || qualityStyles.Default
              }`}>
              {worklet.quality}
            </span>
          )}
          <div className={`${worklet.quality ? 'mt-[0.6vw]' : ''} flex-1 flex flex-col justify-center`}>
            <p className="text-[clamp(1.2rem,2.5vw,2rem)] font-bold">{remaining.days}</p>
            <p className="text-[clamp(0.5rem,0.7vw,0.65rem)] text-gray-300">{remaining.label}</p>
          </div>
          
          {/* Latest Update Section - Compact */}
          <div className="mt-[0.6vw] pt-[0.6vw] border-t border-white/20 w-full">
            <div className="flex items-center justify-center gap-[0.2vw] mb-[0.3vw]">
              <div className={`w-[0.3vw] h-[0.3vw] rounded-full ${worklet.latestSuggestion ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-[clamp(0.45rem,0.6vw,0.55rem)] text-gray-300 font-medium uppercase tracking-wide">
                Latest
              </span>
            </div>
            <div className="text-[clamp(0.5rem,0.65vw,0.6rem)] text-gray-200 leading-tight break-words">
              {suggestionDisplay.text}
            </div>
            {suggestionDisplay.timeAgo && (
              <div className="text-[clamp(0.4rem,0.55vw,0.5rem)] text-gray-400 mt-[0.2vw]">
                {suggestionDisplay.timeAgo}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}