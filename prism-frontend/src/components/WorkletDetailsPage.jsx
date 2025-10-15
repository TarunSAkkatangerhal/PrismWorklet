import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

// --- Import your actual components from their files ---
import RequestUpdate from '../layouts/Requestupdates'
import SuggestionModal from '../layouts/SuggestionModal'
import InternReferralForm from '../layouts/Intern'
import FeedBack from '../layouts/FeedBack'
import LeftSidebar from '../components/Left'

// --- Import all required icons from lucide-react ---
import {
  Calendar,
  Users,
  ArrowLeft,
  PlusCircle,
  RefreshCcw,
  Lightbulb,
  Briefcase,
  MessageSquare,
  MessageCircle,
  Bot,
  X,
  ClipboardCheck,
  ChevronRight,
  Clock,
  Target,
  BookOpen,
  Award,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  Play,
  Download,
  FileText,
  Building2,
  GraduationCap,
  MapPin,
  Mail,
  Phone,
  Globe,
  GitBranch,
  ExternalLink,
  BarChart3,
  TrendingUp,
  Settings,
  Filter,
  Home,
  Search,
  ChevronDown,
  ChevronUp,
  Zap,
  Star,
  Trophy,
  Eye,
  Edit,
  Share2,
  Upload,
  FolderOpen,
  Code,
  Database,
  Server,
  Palette,
  Monitor,
  Smartphone,
  Layout,
  Image,
  Video,
  Mic,
  Camera,
  Hash,
  Percent,
  Activity,
  Layers,
  Grid,
  Moon,
  Sun,
  Plus,
  MoreHorizontal,
  ThumbsUp
} from 'lucide-react'

// --- Enhanced Activity Button Component ---
const ActivityButton = ({ icon, label, onClick, badge, status, disabled = false }) => {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`group relative w-full flex items-center gap-3 p-4 text-left rounded-xl 
                 bg-white/70 backdrop-blur-sm border border-white/20 shadow-lg
                 text-gray-700 dark:text-gray-300
                 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl hover:bg-gradient-to-r hover:from-indigo-50/80 hover:to-purple-50/80 dark:bg-gray-800/70 dark:border-gray-600/20 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all duration-300 hover:scale-105 hover:border-indigo-200/50 dark:hover:border-indigo-700/50'}`}>
      <div className={`flex-shrink-0 text-gray-500 transition-all duration-300 ${!disabled ? 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400' : ''}`}>
        {icon}
      </div>
      <div className="flex-grow">
        <div className="text-sm font-semibold mb-1">{label}</div>
        {status && (
          <div className="text-xs text-gray-500 dark:text-gray-400">{status}</div>
        )}
      </div>
      {badge && (
        <div className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 
                        text-xs font-medium rounded-full">
          {badge}
        </div>
      )}
      <ChevronRight size={16} className={`text-gray-400 transition-all duration-300 ${!disabled ? 'group-hover:text-indigo-500 group-hover:translate-x-1' : ''}`} />
    </button>
  )
}

// --- Glassmorphism Card Component ---
const GlassCard = ({ children, className = "", hover = false, gradient = false }) => {
  return (
    <div className={`
      ${gradient ? 'bg-gradient-to-br from-white/80 via-white/70 to-white/60 dark:from-gray-800/80 dark:via-gray-800/70 dark:to-gray-800/60' 
                 : 'bg-white/70 dark:bg-gray-800/70'} 
      backdrop-blur-md border border-white/20 dark:border-gray-600/20 
      rounded-2xl shadow-lg ${hover ? 'hover:shadow-xl hover:scale-[1.02] transition-all duration-300' : ''} 
      ${className}
    `}>
      {children}
    </div>
  )
}

// --- Enhanced Progress Bar Component ---
const EnhancedProgressBar = ({ progress, size = "md", showPercentage = true, animated = true }) => {
  const getProgressColor = (progress) => {
    if (progress >= 80) return 'from-emerald-400 to-green-500'
    if (progress >= 60) return 'from-blue-400 to-indigo-500'
    if (progress >= 40) return 'from-yellow-400 to-orange-500'
    return 'from-red-400 to-pink-500'
  }

  const heights = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }

  return (
    <div className="space-y-2">
      {showPercentage && (
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Progress</span>
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {progress}%
          </span>
        </div>
      )}
      <div className={`w-full bg-gray-200/80 dark:bg-gray-700/80 rounded-full ${heights[size]} overflow-hidden backdrop-blur-sm`}>
        <div
          className={`bg-gradient-to-r ${getProgressColor(progress)} ${heights[size]} rounded-full transition-all duration-700 ease-out ${animated ? 'animate-pulse' : ''} relative overflow-hidden`}
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
        </div>
      </div>
    </div>
  )
}

// --- Collapsible Section Component ---
const CollapsibleSection = ({ title, children, isExpanded, onToggle, icon }) => {
  return (
    <div className="border border-gray-200/50 dark:border-gray-600/50 rounded-xl overflow-hidden 
                    bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between text-left 
                   hover:bg-gray-50/80 dark:hover:bg-gray-700/80 transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-indigo-600 dark:text-indigo-400">{icon}</span>}
          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            {title}
          </h3>
        </div>
        {isExpanded ? (
          <ChevronUp size={20} className="text-gray-400" />
        ) : (
          <ChevronDown size={20} className="text-gray-400" />
        )}
      </button>
      {isExpanded && (
        <div className="px-6 pb-6 text-gray-700 dark:text-gray-300 leading-relaxed text-sm border-t border-gray-200/30 dark:border-gray-600/30 pt-4">
          {children}
        </div>
      )}
    </div>
  )
}

// --- Team Member Card Component ---
const TeamMemberCard = ({ member, role = "Team Member", avatar }) => {
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-white/80 to-gray-50/80 
                    dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm border border-white/20 
                    dark:border-gray-600/20 p-4 hover:shadow-lg hover:scale-105 transition-all duration-300">
      <div className="flex items-center gap-3">
        <div className="relative">
          {avatar ? (
            <img src={avatar} alt={member} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 
                           flex items-center justify-center text-white font-bold text-sm">
              {getInitials(member)}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
        </div>
        <div className="flex-grow">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{member}</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">{role}</p>
        </div>
        <button className="opacity-0 group-hover:opacity-100 p-2 rounded-full bg-gray-100 dark:bg-gray-700 
                          hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200">
          <Eye size={14} className="text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    </div>
  )
}

export default function WorkletDetailPage() {
  // --- HOOKS ---
  const { id } = useParams()
  const navigate = useNavigate()

  // --- STATE MANAGEMENT ---
  const [worklet, setWorklet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isRequestUpdateOpen, setIsRequestUpdateOpen] = useState(false)
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false)
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [isInternModalOpen, setIsInternModalOpen] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  
  // --- NEW ENHANCED STATE ---
  const [darkMode, setDarkMode] = useState(false)
  const [searchTeam, setSearchTeam] = useState('')
  const [expandedSections, setExpandedSections] = useState({
    problemStatement: true,
    expectations: true,
    prerequisites: true
  })
  const [activityFilter, setActivityFilter] = useState('all')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  // --- BACK NAVIGATION STATE ---
  const [canGoBack, setCanGoBack] = useState(false)

  // --- CHECK IF USER CAN GO BACK ---
  useEffect(() => {
    // Check if there's history to go back to
    setCanGoBack(window.history.length > 1)
  }, [])
  
  // --- MILESTONE STATE ---
  const [milestones, setMilestones] = useState([
    {
      id: 1,
      title: 'Mid-Review Milestone',
      author: 'Tarun Akkatangerhal',
      authorInitials: 'TA',
      date: 'Oct 7, 2025, 2:59:07 PM',
      observations: 'Frontend architecture completed with Redux integration. All UI components implemented and tested successfully.',
      challenges: 'State management complexity resolved. Performance optimization completed through component refactoring.',
      likes: 1,
      status: 'current',
      color: 'from-blue-500 to-purple-600'
    },
    {
      id: 2,
      title: 'Initial Planning & Setup',
      author: 'Dr. Sarah Johnson',
      authorInitials: 'DS',
      date: 'Sep 15, 2024, 10:30:15 AM',
      observations: 'Project foundation established. Team roles defined, development environment configured successfully.',
      challenges: 'Technology stack finalization and resource allocation optimized after initial assessment.',
      likes: 3,
      status: 'completed',
      color: 'from-green-500 to-teal-600'
    }
  ])
  const [isAddMilestoneModalOpen, setIsAddMilestoneModalOpen] = useState(false)
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    observations: '',
    challenges: ''
  })

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchWorklet = async () => {
      try {
        setLoading(true)
        setError(null)
        const token = localStorage.getItem('access_token')

        if (!token) {
          throw new Error('Authentication token not found')
        }

        const response = await axios.get(`http://localhost:8000/worklets/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })

        if (response.data) {
          // Transform backend data to match expected format
          const imageUrls = [
            'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=400&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=400&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=400&auto=format&fit=crop',
          ]

          const transformedWorklet = {
            id: response.data.id,
            cert_id: response.data.cert_id,
            title: response.data.cert_id || response.data.title,
            status: response.data.status || 'Ongoing',
            progress: (typeof response.data.worklet_progress === 'number' ? response.data.worklet_progress : response.data.percentage_completion) || 0,
            description: response.data.description || 'No description available',
            imageUrl: imageUrls[Math.floor(Math.random() * imageUrls.length)], // Random image
            startDate: response.data.start_date
              ? new Date(response.data.start_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'N/A',
            endDate: response.data.end_date
              ? new Date(response.data.end_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'N/A',
            students: response.data.students || [], // Use actual students data or empty array
            professors: response.data.professors || [],
            college: response.data.college || 'Not specified',
            team: response.data.team || 'Not specified',
            problem_statement: response.data.problem_statement || 'No problem statement provided',
            expectations: response.data.expectations || 'No expectations specified',
            prerequisites: response.data.prerequisites || 'No prerequisites specified',
          }

          setWorklet(transformedWorklet)
        }
      } catch (error) {
        console.error('Error fetching worklet:', error)

        // For demo purposes, load dummy data instead of showing error
        const dummyWorklet = {
          id: id || '1',
          cert_id: 'FSWD-2024-BATCH-01',
          title: 'Full Stack Web Development Bootcamp',
          status: 'Ongoing',
          progress: 67,
          description:
            'A comprehensive full-stack web development program covering modern technologies including React, Node.js, databases, and deployment strategies. Students will build real-world projects and gain hands-on experience with industry-standard tools and practices.',
          imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop',
          startDate: 'Sep 15, 2024',
          endDate: 'Dec 20, 2024',
          students: ['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 'Emma Brown', 'Frank Miller'],
          college: 'Cambridge Institute of Technology',
          team: 'Web Development Team Alpha',
          problem_statement:
            'Develop a comprehensive learning platform that enables students to master full-stack web development through hands-on projects, mentorship, and real-world application scenarios. The platform should incorporate modern development practices, version control, testing, and deployment workflows.',
          expectations:
            'Students are expected to complete weekly coding assignments, participate in code reviews, contribute to team projects, and demonstrate proficiency in React, Node.js, Express, MongoDB, and modern development tools. By the end of the program, students should be able to build and deploy full-stack applications independently.',
          prerequisites:
            'Basic understanding of HTML, CSS, and JavaScript. Familiarity with programming concepts such as variables, functions, loops, and conditionals. Access to a computer with internet connection. Git and GitHub account setup is recommended but not required initially.',
          github_repo: 'stanford-bootcamp/fullstack-web-development',
          github_repo_url: 'https://github.com/stanford-bootcamp/fullstack-web-development',
        }

        setWorklet(dummyWorklet)

        // Uncomment below to show actual errors instead of dummy data
        // if (error.response?.status === 404) {
        //   setError("Worklet not found");
        // } else if (error.response?.status === 401) {
        //   setError("Authentication failed. Please login again.");
        // } else {
        //   setError("Failed to load worklet details. Please check your connection.");
        // }
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchWorklet()
    }
  }, [id, retryCount])

  // --- EVENT HANDLERS ---
  const handleNavigation = (path) => {
    navigate(path)
  }

  // --- BACK NAVIGATION HANDLER ---
  const handleGoBack = () => {
    if (canGoBack) {
      navigate(-1) // Go back to previous page
    } else {
      navigate('/worklets') // Fallback to worklets page
    }
  }

  // --- SKELETON LOADER COMPONENT ---
  const SkeletonLoader = () => (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-900">
      <LeftSidebar />
      <main className="flex-1 overflow-y-auto p-[2vw]">
        <div className="max-w-[clamp(48rem,80vw,64rem)] mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-[clamp(1rem,2vw,1.5rem)]">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
          </div>
          <div className="h-[clamp(12rem,20vw,16rem)] bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
          <div className="p-[clamp(1.5rem,3vw,2rem)] space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3"></div>
          </div>
        </div>
      </main>
    </div>
  )

  if (loading) {
    return <SkeletonLoader />
  }

  // --- RETRY FUNCTION ---
  const handleRetry = () => {
    setError(null)
    setLoading(true)
    setRetryCount((prev) => prev + 1)
  }

  if (error || !worklet) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg max-w-md">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">{error || 'Worklet Not Found'}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error
              ? 'Please try again or contact support if the problem persists.'
              : "The worklet you're looking for doesn't exist or has been removed."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {error && (
              <button
                onClick={handleRetry}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors flex items-center gap-2">
                <RefreshCcw size={16} />
                Try Again
              </button>
            )}
            <Link
              to="/worklets"
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 transition-colors">
              Back to Worklets
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // --- TAB CONTENT COMPONENTS ---
  const OverviewTab = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
            <Target size={20} />
            Progress Overview
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Completion</span>
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{worklet.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-blue-600 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${worklet.progress}%` }}></div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              {worklet.progress === 100 ? (
                <>
                  <CheckCircle2 size={16} className="text-green-500" /> Completed
                </>
              ) : worklet.progress > 0 ? (
                <>
                  <Play size={16} className="text-blue-500" /> In Progress
                </>
              ) : (
                <>
                  <Clock size={16} className="text-orange-500" /> Not Started
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-100 dark:border-green-800">
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-3 flex items-center gap-2">
            <Calendar size={20} />
            Timeline
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Start Date</span>
              <span className="font-medium">{worklet.startDate}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">End Date</span>
              <span className="font-medium">{worklet.endDate}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Status</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  worklet.status === 'Completed'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : worklet.status === 'Ongoing'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                }`}>
                {worklet.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
          <BookOpen size={20} />
          Description
        </h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{worklet.description}</p>
      </div>

      {/* GitHub Repository Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          Repository
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex-grow">
              <div className="flex items-center gap-3 mb-1">
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {worklet.github_repo || 'stanford-bootcamp/fullstack-web-development'}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Main development repository for the {worklet.title} project
              </p>
            </div>
            <div className="flex gap-2 ml-4">
              <a
                href={worklet.github_repo_url || 'https://github.com/stanford-bootcamp/fullstack-web-development'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-2 bg-gray-900 dark:bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-800 dark:hover:bg-gray-500 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                View Repo
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    worklet.github_repo_url || 'https://github.com/stanford-bootcamp/fullstack-web-development'
                  )
                }}
                className="inline-flex items-center gap-1 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                title="Copy repository URL">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy
              </button>
            </div>
          </div>

          {/* Repository stats removed per request */}
        </div>
      </div>
    </div>
  )

  const DetailsTab = () => (
    <div className="space-y-6">
      {worklet.college && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">College Information</h3>
          <p className="text-gray-600 dark:text-gray-400">{worklet.college}</p>
        </div>
      )}

      {worklet.problem_statement && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Problem Statement</h3>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{worklet.problem_statement}</p>
        </div>
      )}

      {worklet.expectations && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Expectations</h3>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{worklet.expectations}</p>
        </div>
      )}

      {worklet.prerequisites && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Prerequisites</h3>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{worklet.prerequisites}</p>
        </div>
      )}
    </div>
  )

  const StudentsTab = () => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <Users size={20} />
        Assigned Students ({worklet.students.length})
      </h3>
      {worklet.students.length > 0 ? (
        <div className="grid gap-3">
          {worklet.students.map((student, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                {student.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">{student}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Users size={48} className="mx-auto mb-3 opacity-30" />
          <p>No students assigned yet</p>
        </div>
      )}
    </div>
  )

  const TeamTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Users size={20} />
          Team Information
        </h3>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">Team Name</h4>
            <p className="text-blue-700 dark:text-blue-400">{worklet.team || 'Not specified'}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-medium text-green-900 dark:text-green-300 mb-2 flex items-center gap-2">
                <Award size={16} />
                Professors
              </h4>
              {worklet.professors && worklet.professors.length > 0 ? (
                <ul className="list-disc list-inside text-green-700 dark:text-green-400 text-sm space-y-1">
                  {worklet.professors.map((p,i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-green-700 dark:text-green-400">No professors assigned</p>
              )}
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-medium text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
                <Users size={16} />
                Team Size (Students)
              </h4>
              <p className="text-purple-700 dark:text-purple-400">{worklet.students.length + 1} Members</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-gray-300 mb-3">Students</h4>
            <div className="space-y-2">
              {worklet.students.map((student, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-white dark:bg-gray-600/50 rounded">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {student.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-grow">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{student}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block">Team Member</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )


  const AddMilestoneModal = () => {
    const [milestoneType, setMilestoneType] = useState('')
    const [kpisAchieved, setKpisAchieved] = useState('')
    const [nextSteps, setNextSteps] = useState('')
    const [githubAccessible, setGithubAccessible] = useState(false)
    const [fileUpdatedOnGithub, setFileUpdatedOnGithub] = useState(false)
    const [deliverableTitle, setDeliverableTitle] = useState('')
    const [deliverableDescription, setDeliverableDescription] = useState('')
    const [testResults, setTestResults] = useState('')
    const [documentationUpdated, setDocumentationUpdated] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)

    const milestoneTypes = [
      'Weekly Meeting',
      'Monthly Meeting', 
      'Mid-Review',
      'End Review',
      'Others'
    ]

    const handleSubmit = (e) => {
      e.preventDefault()
      if (!milestoneType.trim()) return

      // Create field mappings based on milestone type
      let fieldData = {}
      switch (milestoneType) {
        case 'Weekly Meeting':
          fieldData = {
            field1Label: 'Activities Completed',
            field1Value: kpisAchieved,
            field2Label: 'Next Steps',
            field2Value: nextSteps,
            toggleLabel: 'GitHub accessible to all team members',
            toggleValue: githubAccessible
          }
          break
        case 'Monthly Meeting':
          fieldData = {
            field1Label: 'KPIs Achieved',
            field1Value: kpisAchieved,
            field2Label: 'Next Steps',
            field2Value: nextSteps,
            toggleLabel: 'File updated on Github',
            toggleValue: fileUpdatedOnGithub
          }
          break
        case 'Mid-Review':
          fieldData = {
            field1Label: 'Observation and Results',
            field1Value: kpisAchieved,
            field2Label: 'Challenges',
            field2Value: nextSteps,
            toggleLabel: 'File uploaded on Github',
            toggleValue: fileUpdatedOnGithub
          }
          break
        case 'End Review':
          fieldData = {
            field1Label: 'Final Results & Observations',
            field1Value: kpisAchieved,
            field2Label: 'Challenges',
            field2Value: nextSteps
          }
          break
        case 'Others':
          fieldData = {
            field1Label: 'Details',
            field1Value: kpisAchieved,
            field2Label: 'Remarks',
            field2Value: nextSteps
          }
          break
        default:
          fieldData = {
            field1Label: 'Details',
            field1Value: kpisAchieved,
            field2Label: 'Remarks',
            field2Value: nextSteps
          }
      }

      const milestone = {
        id: milestones.length + 1,
        title: milestoneType,
        author: 'Current User', // This would come from auth context
        authorInitials: 'CU',
        date: new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }),
        // Store the dynamic field data
        ...fieldData,
        // Keep old fields for backward compatibility
        observations: fieldData.field1Value,
        challenges: fieldData.field2Value,
        deliverableTitle,
        deliverableDescription,
        testResults,
        documentationUpdated,
        githubAccessible,
        fileUpdatedOnGithub,
        attachment: selectedFile ? {
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type
        } : null,
        likes: 0,
        status: 'current',
        color: 'from-indigo-500 to-blue-600'
      }

      setMilestones(prev => [milestone, ...prev])
      resetForm()
      setIsAddMilestoneModalOpen(false)
    }

    const resetForm = () => {
      setMilestoneType('')
      setKpisAchieved('')
      setNextSteps('')
      setGithubAccessible(false)
      setFileUpdatedOnGithub(false)
      setDeliverableTitle('')
      setDeliverableDescription('')
      setTestResults('')
      setDocumentationUpdated(false)
      setSelectedFile(null)
    }

    const handleFileUpload = (event) => {
      const file = event.target.files[0]
      if (file) {
        setSelectedFile(file)
      }
    }

    const handleUploadButtonClick = () => {
      document.getElementById('milestone-file-input').click()
    }

    const handleClose = () => {
      setIsAddMilestoneModalOpen(false)
      resetForm()
    }

    // Render different form sections based on milestone type
    const renderTypeSpecificFields = () => {
      switch (milestoneType) {
        case 'Code Deliverable':
          return (
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={deliverableTitle}
                  onChange={(e) => setDeliverableTitle(e.target.value)}
                  placeholder="Deliverable Title"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded
                           placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <textarea
                  value={deliverableDescription}
                  onChange={(e) => setDeliverableDescription(e.target.value)}
                  placeholder="Code Description & Features"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded resize-none 
                           placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Code pushed to GitHub?</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={githubAccessible}
                    onChange={(e) => setGithubAccessible(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 
                               rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white 
                               after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white 
                               after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
                               after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          )
        
        case 'Testing Milestone':
          return (
            <div className="space-y-4">
              <div>
                <textarea
                  value={testResults}
                  onChange={(e) => setTestResults(e.target.value)}
                  placeholder="Test Results & Coverage"
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded resize-none 
                           placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">All tests passing?</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fileUpdatedOnGithub}
                    onChange={(e) => setFileUpdatedOnGithub(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 
                               rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white 
                               after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white 
                               after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
                               after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          )
        
        case 'Documentation Update':
          return (
            <div className="space-y-4">
              <div>
                <textarea
                  value={deliverableDescription}
                  onChange={(e) => setDeliverableDescription(e.target.value)}
                  placeholder="Documentation Changes & Updates"
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded resize-none 
                           placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Documentation updated in repository?</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={documentationUpdated}
                    onChange={(e) => setDocumentationUpdated(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 
                               rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white 
                               after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white 
                               after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
                               after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          )
        
        case 'Weekly Meeting':
          return (
            <div className="space-y-4">
              <div>
                <textarea
                  value={kpisAchieved}
                  onChange={(e) => setKpisAchieved(e.target.value)}
                  placeholder="Activities Completed"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded resize-none 
                           placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <textarea
                  value={nextSteps}
                  onChange={(e) => setNextSteps(e.target.value)}
                  placeholder="Next Steps"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded resize-none 
                           placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">GitHub accessible to all team members?</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={githubAccessible}
                    onChange={(e) => setGithubAccessible(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 
                               rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white 
                               after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white 
                               after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
                               after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          )
        
        case 'Monthly Meeting':
          return (
            <div className="space-y-4">
              <div>
                <textarea
                  value={kpisAchieved}
                  onChange={(e) => setKpisAchieved(e.target.value)}
                  placeholder="KPIs Achieved"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded resize-none 
                           placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <textarea
                  value={nextSteps}
                  onChange={(e) => setNextSteps(e.target.value)}
                  placeholder="Next Steps"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded resize-none 
                           placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">File updated on Github?</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fileUpdatedOnGithub}
                    onChange={(e) => setFileUpdatedOnGithub(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 
                               rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white 
                               after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white 
                               after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
                               after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          )
        
        case 'Mid-Review':
          return (
            <div className="space-y-4">
              <div>
                <textarea
                  value={kpisAchieved}
                  onChange={(e) => setKpisAchieved(e.target.value)}
                  placeholder="Observation and Results"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded resize-none 
                           placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <textarea
                  value={nextSteps}
                  onChange={(e) => setNextSteps(e.target.value)}
                  placeholder="Challenges"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded resize-none 
                           placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">File uploaded on Github?</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fileUpdatedOnGithub}
                    onChange={(e) => setFileUpdatedOnGithub(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 
                               rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white 
                               after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white 
                               after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 
                               after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          )
        
        case 'End Review':
          return (
            <div className="space-y-4">
              <div>
                <textarea
                  value={kpisAchieved}
                  onChange={(e) => setKpisAchieved(e.target.value)}
                  placeholder="Final Results & Observations"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded resize-none 
                           placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <textarea
                  value={nextSteps}
                  onChange={(e) => setNextSteps(e.target.value)}
                  placeholder="Challenges"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded resize-none 
                           placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )
        
        default:
          return (
            <div className="space-y-4">
              <div>
                <textarea
                  value={kpisAchieved}
                  onChange={(e) => setKpisAchieved(e.target.value)}
                  placeholder="Details"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded resize-none 
                           placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <textarea
                  value={nextSteps}
                  onChange={(e) => setNextSteps(e.target.value)}
                  placeholder="Remarks"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded resize-none 
                           placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )
      }
    }

    if (!isAddMilestoneModalOpen) return null

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">ADD MILESTONE</h2>
            <button
              onClick={handleClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Date Field */}
            <div>
              <input
                type="text"
                value={new Date().toLocaleDateString('en-GB')}
                readOnly
                className="w-full px-3 py-3 text-sm border border-gray-300 rounded-xl bg-gray-50 text-gray-600"
              />
            </div>

            {/* Milestone Type Dropdown */}
            <div>
              <select
                value={milestoneType}
                onChange={(e) => setMilestoneType(e.target.value)}
                className="w-full px-3 py-3 text-sm border border-gray-300 rounded-xl bg-white text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
              >
                <option value="">Select Type</option>
                {milestoneTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Dynamic Fields Based on Type */}
            {milestoneType && (
              <>
                {renderTypeSpecificFields()}
                
                {/* Attachment Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">Attachment</span>
                  </div>
                  <input
                    type="file"
                    id="milestone-file-input"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={handleUploadButtonClick}
                    className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl bg-gray-50 
                             text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload size={16} />
                    {selectedFile ? selectedFile.name : 'Upload Attachment'}
                  </button>
                  {selectedFile && (
                    <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                      <span>Selected: {selectedFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!milestoneType}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed 
                       text-white text-sm font-medium rounded-xl transition-all duration-200"
            >
              {milestoneType === 'End Review' ? 'Next' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const MilestoneTab = () => {
    const handleLikeMilestone = (milestoneId) => {
      setMilestones(prev => prev.map(milestone => 
        milestone.id === milestoneId 
          ? { ...milestone, likes: milestone.likes + 1 }
          : milestone
      ))
    }

    return (
      <div className="space-y-4">
        {/* Header with Add Button */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Project Milestones</h3>
          <button 
            onClick={() => setIsAddMilestoneModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium 
                     transition-all duration-200 flex items-center gap-2"
          >
            <Plus size={14} />
            Add Milestone
          </button>
        </div>

        {/* Dynamic Milestone Cards */}
        <div className="space-y-4">
          {milestones.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Target size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No milestones yet</p>
              <p className="text-sm">Click "Add Milestone" to create your first milestone</p>
            </div>
          ) : (
            milestones.map((milestone) => (
              <div key={milestone.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 bg-gradient-to-br ${milestone.color} rounded-full flex items-center justify-center text-white font-semibold text-sm`}>
                      {milestone.authorInitials}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base">{milestone.title}</h4>
                        {milestone.status === 'completed' && (
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                            Completed
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className={`${milestone.status === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'} font-medium`}>
                          {milestone.author}
                        </span>
                        <span>{milestone.date}</span>
                      </div>
                    </div>
                    <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <MoreHorizontal size={16} />
                    </button>
                  </div>

                  {(milestone.field1Value || milestone.field2Value || milestone.observations || milestone.challenges) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      {(milestone.field1Value || milestone.observations) && (
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-2">
                            {milestone.field1Label || 'Observations and Results'}
                          </h5>
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-3 text-xs text-gray-700 dark:text-gray-300">
                            {milestone.field1Value || milestone.observations}
                          </div>
                        </div>
                      )}
                      {(milestone.field2Value || milestone.challenges) && (
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-2">
                            {milestone.field2Label || 'Challenges'}
                          </h5>
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-3 text-xs text-gray-700 dark:text-gray-300">
                            {milestone.field2Value || milestone.challenges}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleLikeMilestone(milestone.id)}
                        className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 text-xs transition-colors"
                      >
                        <ThumbsUp size={12} />
                        <span>{milestone.likes} {milestone.likes === 1 ? 'Like' : 'Likes'}</span>
                      </button>
                      <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 text-xs">
                        <MessageCircle size={12} />
                        <span>Add Comment</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">GitHub Files</span>
                      <div className="w-8 h-4 bg-blue-500 rounded-full relative">
                        <div className="w-3 h-3 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', component: OverviewTab },
    { id: 'team', label: 'Team', component: TeamTab },
    { id: 'milestone', label: 'Milestone', component: MilestoneTab },
  ]

  // --- HELPER FUNCTIONS ---
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // --- PERFORMANCE CALCULATION ---
  const getWorkletPerformance = (worklet) => {
    if (!worklet) return 'Needs Attention'
    
    const progress = worklet.progress || 0
    
    // Performance logic based on progress percentage
    if (progress > 80) {
      return 'Excellence'
    } else if (progress > 70) {
      return 'Good'
    } else {
      return 'Needs Attention'
    }
  }

  const getPerformanceColor = (performance) => {
    switch (performance) {
      case 'Excellence':
        return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
      case 'Good':
        return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
      case 'Needs Attention':
        return 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white'
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
    }
  }

  const filteredTeamMembers = worklet?.students?.filter(member =>
    member.toLowerCase().includes(searchTeam.toLowerCase())
  ) || []

  // --- RENDER ---
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:bg-slate-900">
      <LeftSidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-transparent dark:bg-slate-900">
        <div className="max-w-7xl mx-auto p-6 space-y-6 min-h-full">
          
          {/* Enhanced Header with Glassmorphism */}
          <GlassCard gradient className="p-6 border-0 shadow-xl">
            {/* Breadcrumb Navigation with Back Button */}
            <nav className="flex items-center gap-2 text-sm mb-6">
              <button
                onClick={handleGoBack}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-600 hover:text-indigo-700 
                          dark:text-gray-400 dark:hover:text-indigo-400 font-medium transition-all duration-200 
                          hover:bg-white/50 dark:hover:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50"
                title="Go back to previous page"
              >
                <ArrowLeft size={16} />
              </button>
              <Link 
                to="/worklets" 
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-600 hover:text-indigo-700 
                          dark:text-gray-400 dark:hover:text-indigo-400 font-medium transition-all duration-200 
                          hover:bg-white/50 dark:hover:bg-gray-700/50"
              >
                <Home size={16} />
                <span>Worklets</span>
              </Link>
              <ChevronRight size={16} className="text-gray-400" />
              <span className="text-indigo-700 dark:text-indigo-400 font-semibold">Project Details</span>
            </nav>

            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              {/* Left: Project Info */}
              <div className="flex-1 space-y-4">
                {/* Organization Badge */}
                <div className="flex items-center gap-2">
                  <Building2 size={20} className="text-indigo-600 dark:text-indigo-400" />
                  <span className="px-3 py-1 bg-indigo-100/70 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 
                                   text-sm font-semibold rounded-full backdrop-blur-sm">
                    {worklet.college || 'Organization'}
                  </span>
                </div>
                
                {/* Project Title with Gradient */}
                <h1 className="text-3xl lg:text-4xl font-bold text-black dark:text-white leading-tight">
                  {worklet.title}
                </h1>
                
                {/* Enhanced Description */}
                <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed max-w-4xl">
                  {worklet.description}
                </p>
              </div>
              
              {/* Right: Status & Progress - Now appears above buttons on smaller screens */}
              <div className="lg:min-w-[300px] space-y-4 order-first lg:order-last">
                {/* Status Badge Enhanced */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start gap-4">
                  <div className="flex flex-col gap-3 w-full">
                    {/* Status and Performance Row */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold shadow-lg ${
                        worklet.status === 'Completed' 
                          ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white'
                          : worklet.status === 'Ongoing'
                          ? 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white' 
                          : 'bg-gradient-to-r from-orange-400 to-red-500 text-white'
                      }`}>
                        {worklet.status === 'Ongoing' && <Activity size={16} className="mr-2 animate-pulse" />}
                        {worklet.status === 'Completed' && <CheckCircle2 size={16} className="mr-2" />}
                        {worklet.status}
                      </span>
                      
                      {/* Performance Badge */}
                      <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold shadow-lg ${getPerformanceColor(getWorkletPerformance(worklet))}`}>
                        {getWorkletPerformance(worklet) === 'Excellence' && <Award size={16} className="mr-2" />}
                        {getWorkletPerformance(worklet) === 'Good' && <CheckCircle size={16} className="mr-2" />}
                        {getWorkletPerformance(worklet) === 'Needs Attention' && <AlertCircle size={16} className="mr-2" />}
                        {getWorkletPerformance(worklet)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Last Activity Card */}
                  <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-gray-600/50 p-4 w-full sm:min-w-[250px]">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 animate-pulse"></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900 dark:text-white font-medium mb-1">
                          Latest Update
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          Code review completed for authentication module
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Progress Bar */}
                <EnhancedProgressBar progress={worklet.progress} size="lg" />
              </div>
            </div>

            {/* Action Buttons - Now separate section below status and info */}
            <div className="flex flex-wrap gap-3 pt-4 lg:pt-6">
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-violet-100 
                                hover:from-purple-200 hover:to-violet-200 text-purple-700 border border-purple-300/50 
                                rounded-xl shadow-lg hover:shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105">
                <Edit size={16} />
                <span className="font-medium">Edit Project</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-violet-100 
                                hover:from-purple-200 hover:to-violet-200 text-purple-700 border border-purple-300/50 
                                rounded-xl shadow-lg hover:shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105">
                <Share2 size={16} />
                <span className="font-medium">Share</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-violet-100 
                                hover:from-purple-200 hover:to-violet-200 text-purple-700 border border-purple-300/50 
                                rounded-xl shadow-lg hover:shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105">
                <Download size={16} />
                <span className="font-medium">Export</span>
              </button>
            </div>
          </GlassCard>

          {/* Quick Project Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Team Size */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-600/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {worklet.students ? worklet.students.length : 0}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Team Members</div>
                </div>
              </div>
            </div>

            {/* Project Duration */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-600/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Calendar size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {(() => {
                      const start = new Date(worklet.startDate);
                      const end = new Date(worklet.endDate);
                      const weeks = Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 7));
                      return `${weeks}w`;
                    })()}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Duration</div>
                </div>
              </div>
            </div>

            {/* Current Phase */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-600/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Target size={20} className="text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {worklet.progress >= 80 ? 'Final' : worklet.progress >= 60 ? 'Testing' : worklet.progress >= 40 ? 'Development' : worklet.progress >= 20 ? 'Design' : 'Planning'}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Current Phase</div>
                </div>
              </div>
            </div>

            {/* Feedback Received */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-600/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <MessageCircle size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {worklet.feedback_count || 12}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Feedback Received</div>
                </div>
              </div>
            </div>

            {/* Mentor Suggestions */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 dark:border-gray-600/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                  <Lightbulb size={20} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {worklet.suggestions_count || 8}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Mentor Suggestions</div>
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Left Column - Project Details */}
            <div className="xl:col-span-2 space-y-6">

              {/* Enhanced Navigation Tabs */}
              <GlassCard className="p-2">
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: 'overview', label: 'Overview', icon: <BookOpen size={16} /> },
                    { id: 'team', label: 'Team', icon: <Users size={16} /> },
                    { id: 'milestone', label: 'Milestones', icon: <Target size={16} /> },
                    { id: 'files', label: 'Files', icon: <FolderOpen size={16} /> }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg scale-105'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:text-indigo-600 dark:hover:text-indigo-400'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </GlassCard>

              {/* Tab Content */}
              <div className="min-h-[400px]">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    
                    {/* Enhanced Project Overview */}
                    <GlassCard gradient className="p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg">
                          <FileText size={20} className="text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">PROJECT OVERVIEW</h2>
                      </div>

                      <div className="space-y-6">
                        {/* Collapsible Sections */}
                        <CollapsibleSection
                          title="PROBLEM STATEMENT"
                          icon={<AlertCircle size={18} />}
                          isExpanded={expandedSections.problemStatement}
                          onToggle={() => toggleSection('problemStatement')}
                        >
                          {worklet.problem_statement}
                        </CollapsibleSection>

                        <CollapsibleSection
                          title="EXPECTATIONS"
                          icon={<Target size={18} />}
                          isExpanded={expandedSections.expectations}
                          onToggle={() => toggleSection('expectations')}
                        >
                          {worklet.expectations}
                        </CollapsibleSection>

                        <CollapsibleSection
                          title="PREREQUISITES"
                          icon={<BookOpen size={18} />}
                          isExpanded={expandedSections.prerequisites}
                          onToggle={() => toggleSection('prerequisites')}
                        >
                          {worklet.prerequisites}
                        </CollapsibleSection>
                      </div>
                    </GlassCard>
                  </div>
                )}

                {/* Team Tab Content */}
                {activeTab === 'team' && (
                  <div className="space-y-6">
                    <GlassCard gradient className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
                            <Users size={20} className="text-white" />
                          </div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">TEAM DIRECTORY</h2>
                          <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 
                                          text-sm font-semibold rounded-full">
                            {filteredTeamMembers.length} members
                          </span>
                        </div>
                      </div>

                      {/* Search Bar */}
                      <div className="relative mb-6">
                        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search team members..."
                          value={searchTeam}
                          onChange={(e) => setSearchTeam(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white/70 dark:bg-gray-700/70 border border-gray-200/50 
                                    dark:border-gray-600/50 rounded-xl backdrop-blur-sm focus:outline-none focus:ring-2 
                                    focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>

                      {/* Team Members Grid */}
                      <div className="grid gap-4">
                        {/* Professors Section */}
                        <div className="mb-4">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Professors</h3>
                          {worklet.professors && worklet.professors.length > 0 ? (
                            <div className="grid gap-3">
                              {worklet.professors.map((prof, idx) => (
                                <TeamMemberCard key={idx} member={prof} role="Professor" />
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500 dark:text-gray-400">No professors assigned</div>
                          )}
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3">Team Members</h3>
                          <div className="grid gap-3">
                            {filteredTeamMembers.length > 0 ? (
                              filteredTeamMembers.map((member, index) => (
                                <TeamMemberCard 
                                  key={index} 
                                  member={member} 
                                  role={`Developer • Level ${index % 3 + 1}`} 
                                />
                              ))
                            ) : (
                              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                <Users size={48} className="mx-auto mb-3 opacity-30" />
                                <p>No team members found</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </GlassCard>
                  </div>
                )}

                {/* Other tabs can be added here following the same pattern */}
                {activeTab === 'milestone' && <MilestoneTab />}



                {activeTab === 'files' && (
                  <GlassCard className="p-6">
                    <div className="text-center py-12">
                      <FolderOpen size={48} className="mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">File Management</h3>
                      <p className="text-gray-600 dark:text-gray-400">Upload and manage project files</p>
                    </div>
                  </GlassCard>
                )}
              </div>

              {/* GitHub Repository Enhanced - Always Visible */}
              <GlassCard gradient className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-gray-800 to-black rounded-lg">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">REPOSITORY</h3>
                </div>

                <div className="space-y-4">
                  {/* Repository Info Card */}
                  <div className="p-4 bg-gradient-to-r from-gray-50/80 to-white/80 dark:from-gray-700/50 dark:to-gray-800/50 
                                  rounded-xl border border-gray-200/50 dark:border-gray-600/50 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-2">
                          <GitBranch size={16} className="text-gray-600 dark:text-gray-400" />
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {worklet.github_repo || 'stanford-bootcamp/fullstack-web-development'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Main development repository for {worklet.title}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <a
                          href={worklet.github_repo_url || 'https://github.com/stanford-bootcamp/fullstack-web-development'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white 
                                    text-sm rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
                        >
                          <ExternalLink size={14} />
                          View Repo
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Repository stats removed per request */}
                </div>
              </GlassCard>
            </div>

            {/* Right Sidebar - Activities & Quick Actions */}
            <div className="space-y-6">
              
              {/* Activity Center */}
              <GlassCard gradient className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                      <Zap size={20} className="text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white">QUICK ACTIONS</h3>
                  </div>
                  
                </div>

                <div className="space-y-3">
                  <ActivityButton
                    icon={<PlusCircle size={18} />}
                    label="Request Update"
                    status="Submit progress updates"
                    onClick={() => setIsRequestUpdateOpen(true)}
                    disabled={worklet.status === 'Completed' || worklet.progress === 100}
                  />
                  <ActivityButton
                    icon={<Lightbulb size={18} />}
                    label="Submit Suggestion"
                    status="Share your ideas"
                    onClick={() => setIsSuggestionModalOpen(true)}
                    disabled={worklet.status === 'Completed' || worklet.progress === 100}
                  />
                  <ActivityButton
                    icon={<MessageSquare size={18} />}
                    label="Provide Feedback"
                    status="Give project feedback"
                    onClick={() => setIsFeedbackOpen(true)}
                    // disabled={worklet.status === 'Completed' || worklet.progress === 100}
                  />
                  <ActivityButton
                    icon={<Users size={18} />}
                    label="Intern Referral"
                    status="Refer talented candidates"
                    onClick={() => setIsInternModalOpen(true)}
                    // disabled={worklet.status === 'Completed' || worklet.progress === 100}
                  />
                </div>
              </GlassCard>

              {/* Project Statistics */}
              <GlassCard gradient className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                    <BarChart3 size={20} className="text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white">PROJECT STATS</h3>
                </div>

                <div className="space-y-4">
                  {/* Days Remaining */}
                  <div className="p-4 bg-white/50 dark:bg-gray-700/50 rounded-xl backdrop-blur-sm border border-white/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Days Remaining</span>
                      <span className="text-lg font-bold text-blue-600 dark:text-purple-400">45</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-2 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full transition-all duration-1000"
                        style={{ width: `65%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Other Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-blue-50/80 dark:bg-blue-900/20 rounded-xl">
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400">15</div>
                      <div className="text-xs text-blue-700 dark:text-blue-400 font-medium">Tasks Done</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50/80 dark:bg-orange-900/20 rounded-xl">
                      <div className="text-xl font-bold text-red-600 dark:text-red-400">8</div>
                      <div className="text-xs text-red-600 dark:text-red-300 font-medium">Pending</div>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Achievement Badges */}
              <GlassCard gradient className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                    <Trophy size={20} className="text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white">ACHIEVEMENTS</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50/80 to-indigo-50/80 
                                  dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200/50">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full 
                                    flex items-center justify-center">
                      <Star size={16} className="text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">First Milestone</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Completed project setup</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50/80 to-purple-50/80 
                                  dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200/50">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full 
                                    flex items-center justify-center">
                      <Users size={16} className="text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">Team Player</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Great collaboration</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50/80 dark:bg-slate-700/50 rounded-xl 
                                  border border-slate-200/50 opacity-50">
                    <div className="w-10 h-10 bg-slate-300 dark:bg-slate-600 rounded-full flex items-center justify-center">
                      <Award size={16} className="text-slate-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-600 dark:text-slate-400 text-sm">Project Complete</div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">Finish all milestones</div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </main>

      {/* Enhanced Modals */}
      <RequestUpdate
        isOpen={isRequestUpdateOpen}
        onClose={() => setIsRequestUpdateOpen(false)}
        workletId={worklet?.id}
        preSelectedWorklet={worklet ? {
          id: worklet.id,
          title: worklet.title,
          cert_id: worklet.cert_id || worklet.title,
          status: worklet.status,
          college: worklet.college,
          team: worklet.team,
          progress: worklet.progress
        } : null}
      />
      
      <SuggestionModal
        isOpen={isSuggestionModalOpen}
        onClose={() => setIsSuggestionModalOpen(false)}
        workletId={worklet?.id}
        preSelectedWorklet={worklet ? {
          id: worklet.id,
          title: worklet.title,
          cert_id: worklet.cert_id || worklet.title,
          status: worklet.status,
          college: worklet.college,
          team: worklet.team,
          progress: worklet.progress
        } : null}
      />

      {/* Add Milestone Modal */}
      <AddMilestoneModal />
      
      {isFeedbackOpen && worklet && (
        <FeedBack
          onClose={() => setIsFeedbackOpen(false)}
          workletId={worklet.id}
          preSelectedWorklet={{
            id: worklet.id,
            title: worklet.title,
            cert_id: worklet.cert_id || worklet.title,
            status: worklet.status,
            college: worklet.college,
            team: worklet.team,
            progress: worklet.progress
          }}
        />
      )}

      {isInternModalOpen && worklet && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
          <div className="relative w-full max-w-4xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl 
                          shadow-2xl border border-white/20 dark:border-gray-600/20 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                INTERN REFERRAL FORM
              </h2>
              <button
                onClick={() => setIsInternModalOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 
                          rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-700/50 transition-all duration-200"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <InternReferralForm
                workletId={worklet.id}
                preSelectedWorklet={{
                  id: worklet.id,
                  title: worklet.title,
                  cert_id: worklet.cert_id || worklet.title,
                  status: worklet.status,
                  college: worklet.college,
                  team: worklet.team,
                  progress: worklet.progress
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
//quick Action