import React, { useState, useEffect, useContext, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  ArrowLeft, 
  Target, 
  Activity, 
  CheckCircle, 
  Users, 
  MapPin, 
  ExternalLink,
  Search,
  Filter,
  Download,
  Loader,
  Grid3X3,
  List,
  PauseCircle,
  XCircle,
  Clock,
  Building2
} from 'lucide-react'
import LeftSidebar from '../components/Left'
import { ThemeContext } from '../context/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'

const NavColl = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isDarkMode } = useContext(ThemeContext)
  
  // Get the filter from navigation state, default to 'total'
  const initialFilter = location.state?.filter || 'total'
  const initialYear = location.state?.year || 'All'
  
  const [activeFilter, setActiveFilter] = useState(initialFilter)
  const [colleges, setColleges] = useState([])             // full dataset
  const [filtered, setFiltered] = useState([])             // filtered by activeFilter
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [yearFilter, setYearFilter] = useState(initialYear)
  // Internal tracking for data freshness (not displayed per user request)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Filter options configuration
  const filterOptions = [
    {
      key: 'total',
      label: 'Total Worklets',
      icon: Target,
      color: 'purple',
      description: 'All worklets across colleges'
    },
    {
      key: 'ongoing',
      label: 'Ongoing',
      icon: Clock,
      color: 'blue',
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
      icon: PauseCircle,
      color: 'yellow',
      description: 'Paused worklets'
    },
    {
      key: 'terminated',
      label: 'Terminated',
      icon: XCircle,
      color: 'red',
      description: 'Terminated worklets'
    }
  ]

  // Dummy college data with worklets (similar to navStat structure)
  const staticColleges = [
    {
      id: 1,
      name: 'Indian Institute of Technology, Bombay',
      location: 'Mumbai, Maharashtra',
      totalWorklets: 45,
      ongoingWorklets: 28,
      completedWorklets: 15,
      onHoldWorklets: 2,
      terminatedWorklets: 0,
      totalStudents: 180,
      domains: ['AI/ML', 'Web Development', 'Blockchain', 'IoT'],
      establishedYear: 1958,
      type: 'Government'
    },
    {
      id: 2,
      name: 'Delhi Technological University',
      location: 'Delhi, Delhi',
      totalWorklets: 38,
      ongoingWorklets: 22,
      completedWorklets: 12,
      onHoldWorklets: 3,
      terminatedWorklets: 1,
      totalStudents: 152,
      domains: ['Software Engineering', 'Data Science', 'Cybersecurity'],
      establishedYear: 1941,
      type: 'Government'
    },
    {
      id: 3,
      name: 'Manipal Institute of Technology',
      location: 'Manipal, Karnataka',
      totalWorklets: 32,
      ongoingWorklets: 19,
      completedWorklets: 10,
      onHoldWorklets: 2,
      terminatedWorklets: 1,
      totalStudents: 128,
      domains: ['Mobile Development', 'Cloud Computing', 'Game Development'],
      establishedYear: 1957,
      type: 'Private'
    },
    {
      id: 4,
      name: 'Vellore Institute of Technology',
      location: 'Vellore, Tamil Nadu',
      totalWorklets: 41,
      ongoingWorklets: 25,
      completedWorklets: 14,
      onHoldWorklets: 1,
      terminatedWorklets: 1,
      totalStudents: 164,
      domains: ['Robotics', 'AI/ML', 'Full Stack Development'],
      establishedYear: 1984,
      type: 'Private'
    },
    {
      id: 5,
      name: 'National Institute of Technology, Trichy',
      location: 'Tiruchirappalli, Tamil Nadu',
      totalWorklets: 29,
      ongoingWorklets: 17,
      completedWorklets: 9,
      onHoldWorklets: 2,
      terminatedWorklets: 1,
      totalStudents: 116,
      domains: ['Data Analytics', 'Machine Learning', 'Web Technologies'],
      establishedYear: 1964,
      type: 'Government'
    }
  ]

  // Live fetch of all college data; filtering done client-side
  const fetchColleges = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // For now, use static data. In production, this would be an API call
      // const base = process.env.REACT_APP_API_URL || 'http://localhost:8000'
      // const token = localStorage.getItem('access_token')
      // if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      // const res = await axios.get(`${base}/colleges`)
      // const data = Array.isArray(res.data) ? res.data : []

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const data = staticColleges

      setColleges(data)
      setLastUpdated(new Date())

    } catch (err) {
      console.error('Failed to fetch colleges:', err)
      setError('Failed to load colleges. Please try again.')
      setColleges([])
    } finally {
      setLoading(false)
    }
  }, [yearFilter])

  // Filter colleges based on active filter
  const filterColleges = useCallback(() => {
    let result = []
    
    colleges.forEach(college => {
      // Create individual worklet entries based on college's worklet counts
      const workletEntries = []
      
      // Add worklets based on status counts
      for (let i = 0; i < college.ongoingWorklets; i++) {
        workletEntries.push({
          id: `${college.id}-ongoing-${i}`,
          collegeId: college.id,
          collegeName: college.name,
          location: college.location,
          status: 'Ongoing',
          domain: college.domains[i % college.domains.length],
          title: `Worklet ${i + 1}`,
          description: `${college.domains[i % college.domains.length]} project at ${college.name}`,
          year: new Date().getFullYear(),
          studentCount: Math.floor(Math.random() * 8) + 3 // 3-10 students
        })
      }
      
      for (let i = 0; i < college.completedWorklets; i++) {
        workletEntries.push({
          id: `${college.id}-completed-${i}`,
          collegeId: college.id,
          collegeName: college.name,
          location: college.location,
          status: 'Completed',
          domain: college.domains[i % college.domains.length],
          title: `Worklet ${college.ongoingWorklets + i + 1}`,
          description: `${college.domains[i % college.domains.length]} project at ${college.name}`,
          year: new Date().getFullYear(),
          studentCount: Math.floor(Math.random() * 8) + 3
        })
      }
      
      for (let i = 0; i < college.onHoldWorklets; i++) {
        workletEntries.push({
          id: `${college.id}-onhold-${i}`,
          collegeId: college.id,
          collegeName: college.name,
          location: college.location,
          status: 'On Hold',
          domain: college.domains[i % college.domains.length],
          title: `Worklet ${college.ongoingWorklets + college.completedWorklets + i + 1}`,
          description: `${college.domains[i % college.domains.length]} project at ${college.name}`,
          year: new Date().getFullYear(),
          studentCount: Math.floor(Math.random() * 8) + 3
        })
      }
      
      for (let i = 0; i < college.terminatedWorklets; i++) {
        workletEntries.push({
          id: `${college.id}-terminated-${i}`,
          collegeId: college.id,
          collegeName: college.name,
          location: college.location,
          status: 'Terminated',
          domain: college.domains[i % college.domains.length],
          title: `Worklet ${college.ongoingWorklets + college.completedWorklets + college.onHoldWorklets + i + 1}`,
          description: `${college.domains[i % college.domains.length]} project at ${college.name}`,
          year: new Date().getFullYear(),
          studentCount: Math.floor(Math.random() * 8) + 3
        })
      }
      
      result = result.concat(workletEntries)
    })

    // Apply status filter
    if (activeFilter !== 'total') {
      const statusMap = {
        'ongoing': 'Ongoing',
        'completed': 'Completed',
        'onhold': 'On Hold',
        'terminated': 'Terminated'
      }
      result = result.filter(worklet => worklet.status === statusMap[activeFilter])
    }

    // Apply search filter
    if (searchTerm) {
      result = result.filter(worklet => 
        worklet.collegeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worklet.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worklet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worklet.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return result
  }, [colleges, activeFilter, searchTerm])

  // Update filtered data when dependencies change
  useEffect(() => {
    setFiltered(filterColleges())
  }, [filterColleges])

  // Fetch colleges on component mount
  useEffect(() => {
    fetchColleges()
  }, [fetchColleges])

  const handleFilterChange = (filterKey) => {
    setActiveFilter(filterKey)
  }

  const handleGoBack = () => {
    navigate('/colleges')
  }

  const getFilterStats = () => {
    const allWorklets = filterColleges() // Get all worklets without status filter
    const total = colleges.reduce((acc, college) => acc + college.totalWorklets, 0)
    const ongoing = colleges.reduce((acc, college) => acc + college.ongoingWorklets, 0)
    const completed = colleges.reduce((acc, college) => acc + college.completedWorklets, 0)
    const onhold = colleges.reduce((acc, college) => acc + college.onHoldWorklets, 0)
    const terminated = colleges.reduce((acc, college) => acc + college.terminatedWorklets, 0)
    
    return { total, ongoing, completed, onhold, terminated }
  }

  const stats = getFilterStats()

  const formatTimeline = (start, end) => {
    if (!start && !end) return ''
    const fmt = (d) => {
      if (!d) return '—'
      try { return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) } catch { return '—' }
    }
    return `${fmt(start)} - ${fmt(end)}`
  }

  const getStatusColor = (status) => {
    const colors = {
      'Ongoing': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'Completed': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'On Hold': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'Terminated': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  }

  const currentFilter = filterOptions.find(f => f.key === activeFilter)

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900 font-sans">
      <LeftSidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleGoBack}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Back to Colleges</span>
              </button>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  College Worklets - {currentFilter?.label}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 font-sans">
                  {currentFilter?.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <Grid3X3 size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3">
            {filterOptions.map((option) => {
              const Icon = option.icon
              const isActive = activeFilter === option.key
              const count = stats[option.key] || 0
              
              return (
                <button
                  key={option.key}
                  onClick={() => handleFilterChange(option.key)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 font-sans ${
                    isActive
                      ? `border-${option.color}-500 bg-${option.color}-50 text-${option.color}-700 dark:bg-${option.color}-900/20 dark:border-${option.color}-400 dark:text-${option.color}-300`
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-medium">{option.label}</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    isActive 
                      ? `bg-${option.color}-200 text-${option.color}-800 dark:bg-${option.color}-800 dark:text-${option.color}-200`
                      : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search worklets, colleges, domains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-sans"
            />
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600 dark:text-gray-400 font-sans">Loading college worklets...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 dark:text-red-400 mb-4 font-sans">{error}</div>
              <button
                onClick={fetchColleges}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-sans"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-gray-600 dark:text-gray-400 font-sans">
                  {filtered.length} worklet{filtered.length !== 1 ? 's' : ''} found
                </p>
              </div>

              {/* Grid/List View */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {filtered.map((worklet) => (
                      <motion.div
                        key={worklet.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 font-sans">
                              {worklet.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-sans">
                              {worklet.description}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(worklet.status)}`}>
                            {worklet.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Building2 size={16} />
                            <span className="font-sans">{worklet.collegeName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <MapPin size={16} />
                            <span className="font-sans">{worklet.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Users size={16} />
                            <span className="font-sans">{worklet.studentCount} students</span>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full">
                              {worklet.domain}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-sans">
                              {worklet.year}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-slate-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-sans">
                            Worklet
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-sans">
                            College
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-sans">
                            Domain
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-sans">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-sans">
                            Students
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        <AnimatePresence>
                          {filtered.map((worklet) => (
                            <motion.tr
                              key={worklet.id}
                              layout
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white font-sans">
                                    {worklet.title}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 font-sans">
                                    {worklet.description}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white font-sans">
                                    {worklet.collegeName}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 font-sans">
                                    {worklet.location}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full">
                                  {worklet.domain}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(worklet.status)}`}>
                                  {worklet.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-sans">
                                {worklet.studentCount}
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {filtered.length === 0 && !loading && (
                <div className="text-center py-12">
                  <div className="text-gray-500 dark:text-gray-400 mb-2 font-sans">
                    No worklets found matching your criteria
                  </div>
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setActiveFilter('total')
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-sans"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default NavColl
