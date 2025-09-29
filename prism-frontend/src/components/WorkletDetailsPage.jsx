import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

// --- Import your actual components from their files ---
import RequestUpdate from '../layouts/Requestupdates'
import SuggestionModal from '../layouts/SuggestionModal'
import InternReferralForm from '../layouts/Intern'
import FeedBack from '../layouts/FeedBack'
import RightSidebar from '../components/Right'
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
  Bot,
  X,
  ClipboardCheck,
  ChevronRight,
  Clock,
  Target,
  BookOpen,
  Award,
  AlertCircle,
  CheckCircle2,
  Play,
  Download,
  FileText,
} from 'lucide-react'

// --- Enhanced Activity Button Component ---
const ActivityButton = ({ icon, label, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 text-left rounded-lg text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all duration-200 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-700 group">
      <div className="flex-shrink-0 text-gray-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {icon}
      </div>
      <div className="flex-grow text-sm font-medium">{label}</div>
      <ChevronRight size={14} className="text-gray-400 group-hover:text-indigo-500 transition-colors" />
    </button>
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
            title: response.data.cert_id,
            status: response.data.status || 'Ongoing',
            progress: response.data.percentage_completion || 0,
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
          title: 'Full Stack Web Development Bootcamp',
          status: 'Ongoing',
          progress: 67,
          description:
            'A comprehensive full-stack web development program covering modern technologies including React, Node.js, databases, and deployment strategies. Students will build real-world projects and gain hands-on experience with industry-standard tools and practices.',
          imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop',
          startDate: 'Sep 15, 2024',
          endDate: 'Dec 20, 2024',
          students: ['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson', 'Emma Brown', 'Frank Miller'],
          college: 'Stanford University - Computer Science Department',
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
      <RightSidebar />
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

          {/* Repository Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-lg font-bold">47</span>
              </div>
              <span className="text-xs text-green-700 dark:text-green-400">Commits</span>
            </div>

            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                <span className="text-lg font-bold">3</span>
              </div>
              <span className="text-xs text-blue-700 dark:text-blue-400">Branches</span>
            </div>

            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-center gap-1 text-purple-600 dark:text-purple-400 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-lg font-bold">12</span>
              </div>
              <span className="text-xs text-purple-700 dark:text-purple-400">Issues</span>
            </div>
          </div>
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
                Team Lead
              </h4>
              <p className="text-green-700 dark:text-green-400">John Doe</p>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-medium text-purple-900 dark:text-purple-300 mb-2 flex items-center gap-2">
                <Users size={16} />
                Team Size
              </h4>
              <p className="text-purple-700 dark:text-purple-400">{worklet.students.length + 1} Members</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-gray-300 mb-3">Team Members</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 bg-white dark:bg-gray-600/50 rounded">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  JD
                </div>
                <div className="flex-grow">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">John Doe</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 block">Team Lead</span>
                </div>
              </div>
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

  const MilestoneTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Target size={20} />
          Project Milestones
        </h3>

        <div className="space-y-4">
          {/* Milestone Timeline */}
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-600"></div>

            {/* Milestone 1 */}
            <div className="relative flex items-start gap-4 pb-8">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center relative z-10">
                <CheckCircle2 size={16} className="text-white" />
              </div>
              <div className="flex-grow">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-900 dark:text-green-300 mb-1">Project Setup & Planning</h4>
                  <p className="text-sm text-green-700 dark:text-green-400 mb-3">
                    Initial project setup, requirements gathering, and team formation
                  </p>
                  <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-500 mb-3">
                    <Calendar size={12} />
                    <span>Completed - Sep 20, 2024</span>
                  </div>

                  {/* Documents & Deliverables */}
                  <div className="mt-3 p-3 bg-white dark:bg-green-950/30 rounded-lg border border-green-300 dark:border-green-700">
                    <h5 className="text-xs font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center gap-1">
                      <FileText size={12} />
                      Documents & Deliverables (4 files)
                    </h5>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-green-100 dark:bg-green-900/40 rounded border border-green-200 dark:border-green-700">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                          </svg>
                          <span className="text-xs font-medium text-green-800 dark:text-green-300">
                            Project Requirements.pdf
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-green-600 dark:text-green-400">1.2 MB</span>
                          <button className="text-green-700 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200">
                            <Download size={12} />
                          </button>
                        </div>
                        </div>
                        
                      <div className="flex items-center justify-between p-2 bg-green-100 dark:bg-green-900/40 rounded border border-green-200 dark:border-green-700">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,17H7V15H14M17,13H7V11H17M17,9H7V7H17M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z" />
                          </svg>
                          <span className="text-xs font-medium text-green-800 dark:text-green-300">
                            Team Charter.docx
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-green-600 dark:text-green-400">850 KB</span>
                          <button className="text-green-700 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200">
                            <Download size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-green-100 dark:bg-green-900/40 rounded border border-green-200 dark:border-green-700">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,17H7V15H14M17,13H7V11H17M17,9H7V7H17M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z" />
                          </svg>
                          <span className="text-xs font-medium text-green-800 dark:text-green-300">
                            Project Timeline.xlsx
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-green-600 dark:text-green-400">45 KB</span>
                          <button className="text-green-700 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200">
                            <Download size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-green-100 dark:bg-green-900/40 rounded border border-green-200 dark:border-green-700">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M5,3H7V5H21V7H7V13A3,3 0 0,0 10,16H14A3,3 0 0,0 17,13V8H19V13A5,5 0 0,1 14,18H10A5,5 0 0,1 5,13V3Z" />
                          </svg>
                          <span className="text-xs font-medium text-green-800 dark:text-green-300">
                            System Architecture.png
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-green-600 dark:text-green-400">2.1 MB</span>
                          <button className="text-green-700 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200">
                            <Download size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Milestone 2 */}
            <div className="relative flex items-start gap-4 pb-8">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center relative z-10">
                <Play size={16} className="text-white" />
              </div>
              <div className="flex-grow">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">Frontend Development</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
                    React components, UI/UX design implementation, and responsive design
                  </p>
                  <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-500 mb-2">
                    <Calendar size={12} />
                    <span>In Progress - Due Oct 15, 2024</span>
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mb-3">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: '75%' }}></div>
                  </div>

                  {/* Documents & Deliverables */}
                  <div className="mt-3 p-3 bg-white dark:bg-blue-950/30 rounded-lg border border-blue-300 dark:border-blue-700">
                    <h5 className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-1">
                      <FileText size={12} />
                      Documents & Deliverables (3 files)
                    </h5>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-blue-100 dark:bg-blue-900/40 rounded border border-blue-200 dark:border-blue-700">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                          </svg>
                          <span className="text-xs font-medium text-blue-800 dark:text-blue-300">
                            UI Wireframes.fig
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-blue-600 dark:text-blue-400">3.4 MB</span>
                          <button className="text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200">
                            <Download size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-blue-100 dark:bg-blue-900/40 rounded border border-blue-200 dark:border-blue-700">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                          </svg>
                          <span className="text-xs font-medium text-blue-800 dark:text-blue-300">
                            Component Library.zip
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-blue-600 dark:text-blue-400">5.7 MB</span>
                          <button className="text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200">
                            <Download size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-blue-100 dark:bg-blue-900/40 rounded border border-blue-200 dark:border-blue-700 opacity-60">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,17H7V15H14M17,13H7V11H17M17,9H7V7H17M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3Z" />
                          </svg>
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                            Testing Report.pdf
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-blue-500 dark:text-blue-500">Pending</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Milestone 3 */}
            <div className="relative flex items-start gap-4 pb-8">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center relative z-10">
                <Clock size={16} className="text-white" />
              </div>
              <div className="flex-grow">
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                  <h4 className="font-semibold text-orange-900 dark:text-orange-300 mb-1">Backend Development</h4>
                  <p className="text-sm text-orange-700 dark:text-orange-400 mb-3">
                    API development, database design, authentication, and server setup
                  </p>
                  <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-500 mb-3">
                    <Calendar size={12} />
                    <span>Upcoming - Nov 1, 2024</span>
                  </div>

                  {/* Planned Documents */}
                  <div className="mt-3 p-3 bg-white dark:bg-orange-950/30 rounded-lg border border-orange-300 dark:border-orange-700">
                    <h5 className="text-xs font-semibold text-orange-800 dark:text-orange-300 mb-2 flex items-center gap-1">
                      <FileText size={12} />
                      Planned Deliverables (5 files)
                    </h5>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-orange-100 dark:bg-orange-900/40 rounded border border-orange-200 dark:border-orange-700 opacity-70">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                          </svg>
                          <span className="text-xs font-medium text-orange-700 dark:text-orange-400">
                            API Documentation.pdf
                          </span>
                        </div>
                        <span className="text-xs text-orange-500 dark:text-orange-500">Planned</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-orange-100 dark:bg-orange-900/40 rounded border border-orange-200 dark:border-orange-700 opacity-70">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                          </svg>
                          <span className="text-xs font-medium text-orange-700 dark:text-orange-400">
                            Database Schema.sql
                          </span>
                        </div>
                        <span className="text-xs text-orange-500 dark:text-orange-500">Planned</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Milestone 4 */}
            <div className="relative flex items-start gap-4">
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center relative z-10">
                <Award size={16} className="text-white" />
              </div>
              <div className="flex-grow">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-300 mb-1">Testing & Deployment</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-400 mb-3">
                    Quality assurance, testing, bug fixes, and final deployment
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-500 mb-3">
                    <Calendar size={12} />
                    <span>Planned - Dec 10, 2024</span>
                  </div>

                  {/* Future Documents */}
                  <div className="mt-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-300 dark:border-gray-600">
                    <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-400 mb-2 flex items-center gap-1">
                      <FileText size={12} />
                      Expected Deliverables (3 files)
                    </h5>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600 opacity-60">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                          </svg>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Final Report.pdf</span>
                        </div>
                        <span className="text-xs text-gray-500">Future</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600 opacity-60">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                          </svg>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Deployment Guide.md
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">Future</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const MeetingTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <MessageSquare size={20} />
          Meetings & Communication
        </h3>

        <div className="space-y-4">
          {/* Next Meeting */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-blue-900 dark:text-blue-300">Next Meeting</h4>
              <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">Upcoming</span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">Weekly Progress Review</p>
            <div className="flex items-center gap-4 text-xs text-blue-600 dark:text-blue-500">
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                <span>Oct 2, 2024</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>2:00 PM - 3:00 PM</span>
              </div>
            </div>
          </div>

          {/* Meeting History */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-300 mb-3">Recent Meetings</h4>
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Project Kickoff Meeting</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Sep 25, 2024</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Initial project discussion and role assignments
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-2 py-1 rounded">
                    Completed
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Duration: 1h 30m</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Requirements Analysis</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Sep 22, 2024</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Detailed requirements gathering and technical specifications
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-2 py-1 rounded">
                    Completed
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Duration: 2h</span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Weekly Standup #3</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Sep 18, 2024</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  Progress updates and blocker discussions
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-2 py-1 rounded">
                    Completed
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Duration: 45m</span>
                </div>
              </div>
            </div>
          </div>

          {/* Communication Channels */}
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-3">Communication Channels</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                <MessageSquare size={14} />
                <span>Slack: #fullstack-bootcamp</span>
              </div>
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                <Calendar size={14} />
                <span>Weekly meetings: Wednesdays 2:00 PM</span>
              </div>
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                <Users size={14} />
                <span>Daily standups: 9:00 AM (Mon-Fri)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const TodoTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <ClipboardCheck size={20} />
          Tasks & To-Do Items
        </h3>

        <div className="space-y-6">
          {/* High Priority Tasks */}
          <div>
            <h4 className="font-medium text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
              <AlertCircle size={16} />
              High Priority
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <input type="checkbox" className="w-4 h-4 text-red-600 rounded" />
                <span className="flex-grow text-sm text-red-800 dark:text-red-300">
                  Fix authentication bug in login component
                </span>
                <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 px-2 py-1 rounded">
                  Due: Oct 1
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <input type="checkbox" className="w-4 h-4 text-red-600 rounded" />
                <span className="flex-grow text-sm text-red-800 dark:text-red-300">Complete API documentation</span>
                <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 px-2 py-1 rounded">
                  Due: Sep 30
                </span>
              </div>
            </div>
          </div>

          {/* Medium Priority Tasks */}
          <div>
            <h4 className="font-medium text-orange-600 dark:text-orange-400 mb-3 flex items-center gap-2">
              <Clock size={16} />
              Medium Priority
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-orange-600 rounded" />
                <span className="flex-grow text-sm text-orange-800 dark:text-orange-300 line-through">
                  Implement user dashboard layout
                </span>
                <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 px-2 py-1 rounded">
                  Completed
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <input type="checkbox" className="w-4 h-4 text-orange-600 rounded" />
                <span className="flex-grow text-sm text-orange-800 dark:text-orange-300">
                  Add form validation to all inputs
                </span>
                <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 px-2 py-1 rounded">
                  Due: Oct 5
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <input type="checkbox" className="w-4 h-4 text-orange-600 rounded" />
                <span className="flex-grow text-sm text-orange-800 dark:text-orange-300">Setup CI/CD pipeline</span>
                <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 px-2 py-1 rounded">
                  Due: Oct 8
                </span>
              </div>
            </div>
          </div>

          {/* Low Priority Tasks */}
          <div>
            <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
              <CheckCircle2 size={16} />
              Low Priority
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                <span className="flex-grow text-sm text-blue-800 dark:text-blue-300">
                  Write unit tests for utility functions
                </span>
                <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-1 rounded">
                  Due: Oct 15
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                <span className="flex-grow text-sm text-blue-800 dark:text-blue-300 line-through">
                  Update project README
                </span>
                <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 px-2 py-1 rounded">
                  Completed
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                <span className="flex-grow text-sm text-blue-800 dark:text-blue-300">Optimize images and assets</span>
                <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-1 rounded">
                  Due: Oct 20
                </span>
              </div>
            </div>
          </div>

          {/* Progress Summary */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-gray-300 mb-3">Task Summary</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">8</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Tasks</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">3</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">5</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Remaining</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const tabs = [
    { id: 'overview', label: 'Overview', component: OverviewTab },
    { id: 'team', label: 'Team', component: TeamTab },
    { id: 'milestone', label: 'Milestone', component: MilestoneTab },
    { id: 'meeting', label: 'Meeting', component: MeetingTab },
    { id: 'todo', label: 'To-Do', component: TodoTab },
  ]

  // --- RENDER ---
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-900">
      <LeftSidebar />
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-[2vw]">
        <div className="max-w-[clamp(48rem,85vw,72rem)] mx-auto">
          {/* Header Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-6">
            {/* Back Button */}
            <div className="p-6">
              <Link
                to="/worklets"
                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold text-sm transition-colors">
                <ArrowLeft size={16} />
                Back to All Worklets
              </Link>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <img src={worklet.imageUrl} alt={worklet.title} className="w-full h-48 md:h-64 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute bottom-4 left-6 text-white">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 ${
                    worklet.status === 'Completed'
                      ? 'bg-green-500'
                      : worklet.status === 'Ongoing'
                      ? 'bg-blue-500'
                      : 'bg-orange-500'
                  }`}>
                  {worklet.status}
                </span>
                <h1 className="text-3xl md:text-4xl font-bold">{worklet.title}</h1>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Tab Navigation */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}>
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="p-6">{tabs.find((tab) => tab.id === activeTab)?.component()}</div>
              </div>
            </div>

            {/* Activity Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <ActivityButton
                    icon={<RefreshCcw size={18} />}
                    label="Request Update"
                    onClick={() => {
                      console.log(`Opening Request Update for worklet ID: ${worklet.id}`)
                      setIsRequestUpdateOpen(true)
                    }}
                  />
                  <ActivityButton
                    icon={<Lightbulb size={18} />}
                    label="Share Suggestion"
                    onClick={() => {
                      console.log(`Opening Suggestion Modal for worklet ID: ${worklet.id}`)
                      setIsSuggestionModalOpen(true)
                    }}
                  />
                  <ActivityButton
                    icon={<MessageSquare size={18} />}
                    label="Give Feedback"
                    onClick={() => {
                      console.log(`Opening Feedback for worklet ID: ${worklet.id}`)
                      setIsFeedbackOpen(true)
                    }}
                  />
                  <ActivityButton
                    icon={<Briefcase size={18} />}
                    label="Internship Referral"
                    onClick={() => {
                      console.log(`Opening Internship Referral for worklet ID: ${worklet.id}`)
                      setIsInternModalOpen(true)
                    }}
                  />
                  <ActivityButton
                    icon={<ClipboardCheck size={18} />}
                    label="Evaluate Progress"
                    onClick={() => {
                      console.log(`Navigating to evaluate for worklet ID: ${worklet.id}`)
                      navigate(`/evaluate?workletId=${worklet.id}`)
                    }}
                  />
                </div>

                {/* Worklet Info Card */}
                <div className="mt-6 p-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                  <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">Current Worklet</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">ID: {worklet.id}</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate" title={worklet.title}>
                    {worklet.title}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        worklet.status === 'Completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : worklet.status === 'Ongoing'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                      }`}>
                      {worklet.status}
                    </span>
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                      {worklet.progress}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* --- Modals --- */}
      <RequestUpdate
        isOpen={isRequestUpdateOpen}
        onClose={() => setIsRequestUpdateOpen(false)}
        workletId={worklet.id}
        preSelectedWorklet={{
          id: worklet.id,
          title: worklet.title,
          cert_id: worklet.title,
        }}
      />
      <SuggestionModal
        isOpen={isSuggestionModalOpen}
        onClose={() => setIsSuggestionModalOpen(false)}
        workletId={worklet.id}
        preSelectedWorklet={{
          id: worklet.id,
          title: worklet.title,
          cert_id: worklet.title,
        }}
      />
      {isFeedbackOpen && (
        <FeedBack
          onClose={() => setIsFeedbackOpen(false)}
          workletId={worklet.id}
          preSelectedWorklet={{
            id: worklet.id,
            title: worklet.title,
            cert_id: worklet.title,
          }}
        />
      )}

      {isInternModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 dark:bg-opacity-80 z-50 p-4">
          <div className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-end p-2 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <button
                onClick={() => setIsInternModalOpen(false)}
                className="text-gray-500 hover:text-purple-700 dark:text-gray-400 dark:hover:text-white font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors">
                &times;
              </button>
            </div>
            <div className="p-6 pt-0 overflow-y-auto">
              <InternReferralForm
                workletId={worklet.id}
                preSelectedWorklet={{
                  id: worklet.id,
                  title: worklet.title,
                  cert_id: worklet.title,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}