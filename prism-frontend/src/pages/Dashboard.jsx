// Dashboard page: Presents mentor snapshot including profile, stats, and ongoing worklets.
// Focus points:
// 1. Fetch mentor profile & worklets once and cache lightweight view state (layout) in localStorage
// 2. Transform backend worklet shape into a normalized card-friendly structure
// 3. Provide responsive layout (grid / horizontal scroll) with animated, accessible UI
// 4. Avoid unnecessary re-renders via localized derived data (e.g., filtered ongoing worklets)
// NOTE: axios imported historically (may be unused now) – kept if future calls needed
import axios from 'axios'
import { getMentorWorklets, getMentorOngoingWorkletsById, getMentorAllWorkletsById } from '../services/worklets' // Service helpers for API calls
import { getCurrentUser } from '../services/auth' // Retrieves authenticated mentor details
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LeftSidebar from '../components/Left'   // Persistent navigation rail (left)
import RightSidebar from '../components/Right' // Ancillary widgets / future extensions (right)
import StatCard from '../components/StatCard'  // Reusable compact statistic display card

import samsungLogo from '../assets/prism_logo.png' // Brand / product logo

import {
  Bell,
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

// Mapping of progression tiers to milestone thresholds (could drive dynamic level computation later)
const LEVEL_COUNTS = { spark: 5, lead: 10, core: 15, master: 30 }

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
  // -------------------------- STATE --------------------------
  // User identity / profile
  const [userName, setUserName] = useState('')
  const [loadingName, setLoadingName] = useState(true)
  const [nameError, setNameError] = useState(false)

  const navigate = useNavigate()
  // Level gamification placeholder (currently static; could be derived from KPI metrics in future)
  const [currentUserLevel, setCurrentUserLevel] = useState(1)
  // Persist layout preference (grid vs horizontal carousel) for continuity across sessions
  const [layout, setLayout] = useState(() => localStorage.getItem('worklet_layout') || 'horizontal')
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
        setUserName(me.name || me.email?.split('@')[0] || 'User')
        localStorage.setItem('user_email', me.email)
        localStorage.setItem('user_name', me.name || '')
      } catch (e) {
        if (!cancelled) {
          setNameError(true)
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
        const normalized = list.map((worklet, index) => {
          const progressVal = (typeof worklet.worklet_progress === 'number' ? worklet.worklet_progress : worklet.percentage_completion) || worklet.mentor_progress || worklet.progress || 0
          // Derive status to match WorkletsPage logic
          // Harmonize status labels regardless of backend variant fields
          const status = worklet.completion_status ? (worklet.completion_status === 'Completed' ? 'Completed' : 'Ongoing') : (worklet.status || 'Ongoing')
          // Derive quality (stable quick heuristic)
          const qualityChoices = ['Excellence','Good','Needs Attention']
          const quality = qualityChoices[index % qualityChoices.length] // Simple cyclic surrogate until backend rating metric available
          // Extract student names (fallback to email if name missing)
          const studentNames = Array.isArray(worklet.students) ? worklet.students.map(s => s.name || s.email || 'Student') : [] // Defensive extraction
          return {
            id: worklet.id,
            title: worklet.cert_id || worklet.title || 'Untitled Worklet',
            status,
            progress: progressVal,
            description: worklet.description || 'No description available',
            startDate: worklet.start_date ? new Date(worklet.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
            endDate: worklet.end_date ? new Date(worklet.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
            students: studentNames,
            notificationCount: 0,
            quality,
            college: worklet.college || 'Unknown College',
            team: worklet.team || worklet.domain || 'General'
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

  // Inline component: displays single milestone with hover tooltip describing progression context
  const LevelMilestone = ({ level, index }) => {
    const levelsToGo = index - currentUserLevel
    let tooltipText = ''
    if (levelsToGo > 0) tooltipText = `${levelsToGo} level${levelsToGo > 1 ? 's' : ''} to reach ${level.name}`
    else if (levelsToGo === 0) tooltipText = index === levels.length - 1 ? 'Highest level achieved! ✨' : 'You are here'
    else tooltipText = 'Milestone achieved ✔️'
    return (
      <div className="relative group">
        <span className="flex items-center gap-1.5 cursor-pointer">
          <level.Icon className={`w-4 h-4 ${level.color}`} /> {level.name}
        </span>
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 text-xs bg-slate-800 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          {tooltipText}
        </span>
      </div>
    )
  }

  // Translate currentUserLevel index into width percentage for progress track
  const progressPercentage = (currentUserLevel / (levels.length - 1)) * 100

  return (
    <div className="flex h-screen w-full bg-slate-100 text-slate-800 overflow-hidden dark:bg-slate-900 dark:text-slate-200">
      <LeftSidebar />

      <main className="flex-1 px-[2vw] py-[1.5vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-200 [&::-webkit-scrollbar-thumb]:bg-slate-400 dark:[&::-webkit-scrollbar-track]:bg-slate-800 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600">
        <header className="flex justify-between items-center mb-[3vh]">
          <div>
            <h1 className="text-[clamp(1.75rem,3.5vw,2.25rem)] font-bold text-black dark:text-white">
              {loadingName ? 'Loading...' : `Welcome back, ${userName.split(' ')[0]}!`}
            </h1>
            <p className="text-[clamp(0.875rem,1.2vw,1rem)] text-slate-500 dark:text-slate-400">Here's your snapshot for today.</p>
          </div>
          <div className="flex items-center gap-[1vw]">
            <img src={samsungLogo} alt="PRISM" className="h-[clamp(2.5rem,4vw,3.5rem)] opacity-90" />
          </div>
        </header>

  {/* Top summary section: Profile card (2 cols) + Stat side column */}
  <section className="grid grid-cols-1 lg:grid-cols-3 gap-[1.5vw]">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm p-[1.5vw] dark:bg-slate-800 dark:border-slate-700">
            <div className="flex items-start gap-[1.2vw]">
              {userProfileData?.mentor_profile?.avatar_url ? (
                <img
                  src={userProfileData.mentor_profile.avatar_url}
                  alt="Author"
                  className="w-[clamp(4rem,6vw,5.5rem)] h-[clamp(4rem,6vw,5.5rem)] rounded-full object-cover shadow-md cursor-pointer hover:ring-4 hover:ring-blue-200 dark:hover:ring-blue-800 transition-all"
                  onClick={() => navigate('/profile/view')}
                />
              ) : (
                <div
                  className="w-[clamp(4rem,6vw,5.5rem)] h-[clamp(4rem,6vw,5.5rem)] rounded-full flex items-center justify-center text-white font-bold text-[clamp(1.5rem,2.5vw,2rem)] shadow-md flex-shrink-0 cursor-pointer hover:ring-4 hover:ring-blue-200 dark:hover:ring-blue-800 transition-all"
                  style={{ backgroundColor: generateColorFromName(userProfileData?.name || 'User') }}
                  onClick={() => navigate('/profile/view')}
                >
                  <span>{getInitials(userProfileData?.name || 'User')}</span>
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-[clamp(1.125rem,1.8vw,1.5rem)] font-bold text-slate-900 dark:text-white">{userProfileData?.name || userName}</h2>
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
              </div>
            </div>
            <div className="relative mt-[1.5vw]">
              <div className="h-[0.5vw] w-full bg-slate-200 rounded-full shadow-inner dark:bg-slate-700">
                <div
                  className="h-[0.5vw] bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}></div>
              </div>
              <div className="flex justify-between text-[clamp(0.75rem,0.9vw,0.875rem)] mt-[0.5vw] text-slate-600 font-medium dark:text-slate-400">
                {levels.map((level, index) => (
                  <LevelMilestone key={level.name} level={level} index={index} />
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-[1vw]">
            <div onClick={() => navigate('/worklets')} className="cursor-pointer">
              <StatCard
                value={isLoadingWorklets ? '...' : totalWorkletsCount}
                label="Total Worklets"
                icon={<BookOpen className="w-[clamp(1.25rem,1.8vw,2rem)] h-[clamp(1.25rem,1.8vw,2rem)] text-blue-500" />}
                accent="from-blue-50 to-white hover:border-blue-300 dark:from-slate-800/50 dark:to-slate-800/20 dark:hover:border-blue-600"
              />
            </div>
            <StatCard
              value={isLoadingMentorStats ? '...' : mentorStats?.engagement_data?.['My Students']}
              label="Active Mentees"
              icon={<UsersIcon className="w-[clamp(1.25rem,1.8vw,2rem)] h-[clamp(1.25rem,1.8vw,2rem)] text-indigo-500" />}
              accent="from-indigo-50 to-white hover:border-indigo-300 dark:from-slate-800/50 dark:to-slate-800/20 dark:hover:border-indigo-600"
            />
          </div>
        </section>

        {/* My Worklets */}
        <div className="mt-[3vh]">
          <div className="flex justify-between items-center mb-[1.5vh]">
            <h2 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold bg-blue-900 animate-shimmer">Ongoing Worklets</h2>
            <div className="flex items-center gap-[0.2vw] p-[0.3vw] bg-gray-200 rounded-lg dark:bg-slate-900">
              <button
                onClick={() => {
                  setLayout('grid')
                  localStorage.setItem('worklet_layout', 'grid')
                }}
                className={`p-[0.4vw] rounded-md transition-colors ${
                  layout === 'grid' ? ' text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
                aria-label="Grid View">
                <LayoutGrid size={Math.max(16, Math.min(24, window.innerWidth * 0.015))} />
              </button>
              <button
                onClick={() => {
                  setLayout('horizontal')
                  localStorage.setItem('worklet_layout', 'horizontal')
                }}
                className={`p-[0.4vw] rounded-md transition-colors ${
                  layout === 'horizontal' ? ' text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
                aria-label="Horizontal View">
                <Columns size={Math.max(16, Math.min(24, window.innerWidth * 0.015))} />
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
                  : 'flex overflow-x-auto gap-[clamp(1rem,2vw,2rem)] pb-[1vh] overflow-y-hidden [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-blue-400/50 [&::-webkit-scrollbar-thumb]:rounded-full'
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
  // Container width adapts when in horizontal scroller vs grid mode
  const containerClasses = layout === 'grid' ? 'w-full' : 'w-[clamp(18rem,25vw,22rem)] flex-shrink-0'

  // Professional corporate background colors based on worklet quality
  // Thematic gradient derived from qualitative status (visual semantic cue)
  const getBackgroundGradient = () => {
    const progress = worklet.progress || 0
    const quality = worklet.quality || 'Default'
    
    switch (quality) {
      case 'Excellence':
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
      case 'Needs Attention':
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

  const remaining = calculateRemainingDays(worklet.endDate)

  // Badge background palette per quality band
  const qualityStyles = {
    Excellence: 'bg-green-500/80',
    Good: 'bg-blue-500/80',
    'Needs Attention': 'bg-red-500/80',
    Default: 'bg-gray-500/80',
  }

  // Primary navigation: open worklet detail view
  const handleCardClick = () => {
    navigate(`/worklet/${worklet.id}`)
  }

  // Utility to keep badge sizes stable
  const truncateText = (text, maxLength = 25) => {
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
          <span className="text-[clamp(0.65rem,0.85vw,0.8rem)] text-white bg-slate-900/80 backdrop-blur-md px-[0.6vw] py-[0.3vw] rounded-full font-bold shadow-xl border-2 border-white/30 whitespace-nowrap">{worklet.status}</span>
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
      <div className="absolute inset-0 flex text-white opacity-0 transition-opacity duration-300 delay-150 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
        <div 
          className="flex-grow p-[clamp(0.75rem,1.5vw,1.25rem)] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-cyan-400/50 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-cyan-400/70"
          onWheel={(e) => {
            e.stopPropagation();
            // Allow scrolling within this container only
            const element = e.currentTarget;
            const { scrollTop, scrollHeight, clientHeight } = element;
            
            // Prevent parent scroll only if we're not at boundaries
            if ((e.deltaY > 0 && scrollTop + clientHeight < scrollHeight) || 
                (e.deltaY < 0 && scrollTop > 0)) {
              e.preventDefault();
            }
          }}
        >
          {/* ID is now displayed on hover instead of title */}
          <h3 className="text-[clamp(1rem,1.8vw,1.5rem)] font-mono font-bold text-cyan-300">{worklet.id}</h3>
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
                {worklet.students.map((student) => (
                  <li key={student}>{student}</li>
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

        {/* Right side panel remains the same */}
        <div className="w-[clamp(6rem,8vw,7.5rem)] flex-shrink-0 bg-black/40 flex flex-col items-center justify-center text-center p-[0.5vw] transform translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-in-out">
          <span
            className={`px-[0.5vw] py-[0.25vw] rounded-md text-[clamp(0.6rem,0.8vw,0.75rem)] font-bold text-white ${
              qualityStyles[worklet.quality] || qualityStyles.Default
            }`}>
            {worklet.quality}
          </span>
          <div className="mt-[1vw]">
            <p className="text-[clamp(1.5rem,3vw,2.5rem)] font-bold">{remaining.days}</p>
            <p className="text-[clamp(0.6rem,0.8vw,0.75rem)] text-gray-300">{remaining.label}</p>
          </div>
        </div>
      </div>
    </div>
  )
}