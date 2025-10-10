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
  const expectedCountFromState = location.state?.count || 50 // Default to 50 if no count provided
  
  const [activeFilter, setActiveFilter] = useState(initialFilter)
  const [colleges, setColleges] = useState([])             // full dataset
  const [filtered, setFiltered] = useState([])             // filtered by activeFilter
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [yearFilter, setYearFilter] = useState(initialYear)
  const [expectedCount, setExpectedCount] = useState(expectedCountFromState)
  const [originalCount] = useState(expectedCountFromState) // Store the original count from navigation
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
    },
    {
      key: 'students',
      label: 'Students',
      icon: Users,
      color: 'indigo',
      description: 'All students across colleges'
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

      // Using static data - no artificial delay needed for better UX
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
  const filterColleges = useCallback((customExpectedCount = null) => {
    let result = []
    
    // Safety check: return empty array if colleges data is not loaded yet
    if (!colleges || colleges.length === 0) {
      return result
    }
    
    const countToUse = customExpectedCount !== null ? customExpectedCount : expectedCount
    
    // Special handling for students filter
    if (activeFilter === 'students') {
      // Generate the exact number of students based on expected count
      const studentNames = [
        'Anika Sharma', 'Rohan Gupta', 'Siddharth Jain', 'Meera Reddy',
        'Priya Singh', 'Arjun Verma', 'Vikram Kumar', 'Neha Patel',
        'Rajesh Kumar', 'Kavya Iyer', 'Rahul Mehta', 'Sneha Joshi',
        'Amit Sharma', 'Divya Rao', 'Karan Singh', 'Pooja Gupta',
        'Suresh Kumar', 'Anita Desai', 'Ravi Krishnan', 'Deepika Nair'
      ]
      
      // Create exactly the expected number of students
      for (let i = 0; i < countToUse; i++) {
        const studentIndex = i % studentNames.length
        const collegIndex = i % colleges.length
        const college = colleges[collegIndex]
        
        // Safety check for college properties
        if (!college || !college.domains || !college.name || !Array.isArray(college.domains) || college.domains.length === 0) {
          continue
        }
        
        const studentName = studentNames[studentIndex]
        const studentEmail = `${studentName.toLowerCase().replace(/\s+/g, '.')}${i > studentNames.length ? i : ''}@${college.name.toLowerCase().replace(/\s+/g, '').replace(/,.*/, '')}.edu`
        
        // Assign 1-3 worklets per student
        const workletCount = Math.floor(Math.random() * 3) + 1
        const worklets = []
        for (let w = 0; w < workletCount; w++) {
          const domainIndex = (i + w) % college.domains.length
          worklets.push({
            title: `${college.domains[domainIndex]} Project ${w + 1}`,
            collegeName: college.name
          })
        }
        
        result.push({
          id: `student-${i}`,
          name: studentName,
          email: studentEmail,
          collegeName: college.name,
          location: college.location || 'Unknown Location',
          type: 'student',
          worklets: worklets
        })
      }
      
      // Apply search filter for students
      if (searchTerm) {
        result = result.filter(student => 
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.collegeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.worklets.some(w => w.title.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      }
      
      return result
    }
    
    // For worklets, generate exactly the expected number
    const statusMap = {
      'total': ['Ongoing', 'Completed', 'On Hold', 'Terminated'],
      'ongoing': ['Ongoing'],
      'completed': ['Completed'],
      'onhold': ['On Hold'],
      'terminated': ['Terminated']
    }
    
    const allowedStatuses = statusMap[activeFilter] || statusMap['total']
    
    // Varied worklet titles and problem statements
    const workletTitles = [
      'AI-Powered Healthcare System', 'Smart City Infrastructure', 'Blockchain Voting Platform',
      'IoT Environmental Monitor', 'Machine Learning Analytics', 'Web3 Social Platform',
      'Autonomous Vehicle Control', 'Cybersecurity Framework', 'Digital Twin Simulation',
      'Quantum Computing Research', 'AR/VR Educational Tool', 'Sustainable Energy System',
      'Fintech Payment Solution', 'Biotech Data Analysis', 'Space Technology Project',
      'Robotics Automation', 'Neural Network Optimization', 'Cloud Migration Strategy',
      'Mobile Health App', 'Smart Agriculture System'
    ]
    
    const problemStatements = [
      'Develop an innovative solution to address modern healthcare challenges',
      'Create intelligent infrastructure for sustainable urban development',
      'Build secure and transparent digital voting mechanisms',
      'Design comprehensive environmental monitoring systems',
      'Implement advanced analytics for predictive insights',
      'Develop decentralized social networking platforms',
      'Create autonomous navigation and control systems',
      'Build robust security frameworks for digital assets',
      'Develop virtual representations of physical systems',
      'Research quantum algorithms for practical applications',
      'Create immersive educational experiences using AR/VR',
      'Design renewable energy management systems',
      'Build secure and efficient payment processing solutions',
      'Analyze complex biological datasets for insights',
      'Develop innovative space exploration technologies',
      'Create intelligent automation for industrial processes',
      'Optimize neural networks for better performance',
      'Plan seamless cloud infrastructure transitions',
      'Develop mobile applications for health monitoring',
      'Create smart systems for agricultural optimization'
    ]
    
    // Create exactly the expected number of worklets
    for (let i = 0; i < countToUse; i++) {
      const collegeIndex = i % colleges.length
      const college = colleges[collegeIndex]
      
      // Safety check for college properties
      if (!college || !college.domains || !college.name || !Array.isArray(college.domains) || college.domains.length === 0) {
        continue
      }
      
      const statusIndex = i % allowedStatuses.length
      const status = allowedStatuses[statusIndex]
      const titleIndex = i % workletTitles.length
      const domainIndex = i % college.domains.length
      
      // Generate random start and end dates within the last 6 months
      const now = new Date()
      const startOffset = Math.floor(Math.random() * 150) // up to 150 days ago
      const endOffset = startOffset + Math.floor(Math.random() * 30) + 10 // 10-40 days after start
      const startDate = new Date(now.getTime() - startOffset * 24 * 60 * 60 * 1000)
      const endDate = new Date(now.getTime() - endOffset * 24 * 60 * 60 * 1000)
      result.push({
        id: `worklet-${i}`,
        collegeId: college.id || `college-${i}`,
        collegeName: college.name,
        location: college.location || 'Unknown Location',
        status: status,
        domain: college.domains[domainIndex],
        title: workletTitles[titleIndex],
        description: problemStatements[titleIndex],
        startDate,
        endDate,
        studentCount: Math.floor(Math.random() * 8) + 3 // 3-10 students
      })
    }

    // Apply search filter
    if (searchTerm) {
      result = result.filter(worklet => 
        worklet.collegeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worklet.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worklet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worklet.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return result
  }, [colleges, activeFilter, searchTerm, expectedCount])

  // Update filtered data when dependencies change
  useEffect(() => {
    setFiltered(filterColleges())
  }, [filterColleges])

  // Fetch colleges on component mount
  useEffect(() => {
    fetchColleges()
  }, [fetchColleges])

  const handleFilterChange = (filterKey) => {
    setActiveFilter(filterKey);
    const stats = getFilterStats();
    const newExpectedCount = stats[filterKey] || 0;
    setExpectedCount(newExpectedCount);
    // Pass the new expected count directly to the filtering function
    setFiltered(filterColleges(newExpectedCount));
  };

  useEffect(() => {
    const stats = getFilterStats();
    setExpectedCount(stats[activeFilter] || 0);
  }, [activeFilter, colleges]);

  const handleGoBack = () => {
    navigate('/colleges')
  }

  const getFilterStats = () => {
    // Always use the original count from navigation as the base
    const baseCount = originalCount
    
    // For demonstration purposes, create proportional stats based on the original passed count
    // In a real app, these would come from the API
    const baseStats = {
      total: baseCount,
      ongoing: Math.floor(baseCount * 0.6), // 60% ongoing
      completed: Math.floor(baseCount * 0.25), // 25% completed  
      onhold: Math.floor(baseCount * 0.1), // 10% on hold
      terminated: Math.floor(baseCount * 0.05), // 5% terminated
      students: baseCount // Same as total for students
    }
    
    // Ensure the active filter shows the appropriate count
    // If we're on the initially navigated filter, show the exact original count
    if (activeFilter === initialFilter) {
      baseStats[activeFilter] = baseCount
    }
    
    return baseStats
    
    return stats
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
    <div className={`flex h-screen font-sans ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-purple-50 via-indigo-50/50 to-blue-100/30'
    }`}>
      <LeftSidebar />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4">
          
          {/* Compact Header Section */}
          <div className={`${
            isDarkMode 
              ? 'bg-gradient-to-r from-slate-800/80 via-slate-700/50 to-slate-800/80 backdrop-blur-sm border-slate-700/50' 
              : 'bg-gradient-to-r from-white/80 via-purple-50/50 to-indigo-50/30 backdrop-blur-sm border-purple-200/30'
          } rounded-2xl shadow-lg border p-4 mb-4`}>
            
            {/* Header Layout */}
            <div className="space-y-4">
              {/* Title Row - Back Arrow + Title */}
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={handleGoBack}
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-500/40 hover:to-indigo-500/40 text-purple-200 hover:text-white border border-purple-500/20' 
                      : 'bg-gradient-to-r from-purple-50/80 to-indigo-50/80 hover:from-purple-100 hover:to-indigo-100 text-purple-600 hover:text-purple-700 border border-purple-200/40'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft size={20} />
                </motion.button>
                
                <div>
                  <h1 className={`text-4xl font-bold font-sans ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>
                    College Worklets
                  </h1>
                </div>
              </div>

              {/* Filter Buttons Row */}
              <div className="flex items-center gap-2 flex-wrap ml-14">
                {filterOptions.map((option) => {
                  const Icon = option.icon
                  const isActive = activeFilter === option.key
                  
                  return (
                    <motion.button
                      key={option.key}
                      onClick={() => handleFilterChange(option.key)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                        isActive
                          ? isDarkMode
                            ? 'bg-gradient-to-r from-purple-400 to-indigo-400 text-white shadow-lg border border-purple-300/50'
                            : 'bg-gradient-to-r from-purple-300 to-indigo-300 text-white shadow-lg border border-purple-200/50'
                          : isDarkMode
                          ? 'bg-slate-700/50 text-gray-300 border border-gray-700/30 hover:bg-gradient-to-r hover:from-gray-800/40 hover:to-gray-700/40 hover:text-white'
                          : 'bg-white/60 text-gray-700 border border-gray-300/40 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 hover:text-gray-800'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon size={16} />
                      <span>{option.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : isDarkMode
                          ? 'bg-gray-800/30 text-gray-300'
                          : 'bg-gray-100/80 text-gray-700'
                      }`}>
                        {stats[option.key] || 0}
                      </span>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            
            {/* Search Bar */}
            <div className="relative mt-4">
              <Search 
                size={18} 
                className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} 
              />
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
          </div>

          {/* Content Section */}
          <div className={`${
            isDarkMode 
              ? 'bg-gradient-to-br from-slate-800/80 via-slate-700/50 to-slate-800/80 backdrop-blur-sm border-slate-700/50' 
              : 'bg-gradient-to-br from-white/80 via-purple-50/30 to-indigo-50/20 backdrop-blur-sm border-purple-200/30'
          } rounded-2xl shadow-lg border overflow-hidden`}>
            
            {/* Results Header */}
            <div className={`p-4 border-b ${
              isDarkMode 
                ? 'border-slate-700/50 bg-gradient-to-r from-slate-800/60 to-slate-700/40' 
                : 'border-purple-300/30 bg-gradient-to-r from-purple-50/60 to-indigo-50/40'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className={`text-xl font-semibold font-sans ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>
                    {filterOptions.find(f => f.key === activeFilter)?.label} 
                    {searchTerm && ` - Search Results`}
                  </h2>
                </div>
                
                {/* View Toggle Buttons */}
                <div className={`flex items-center rounded-lg border ${
                  isDarkMode 
                    ? 'border-purple-700/30 bg-slate-800/40' 
                    : 'border-purple-300/40 bg-white/60'
                }`}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-l-lg transition-all duration-200 ${
                      viewMode === 'grid'
                        ? isDarkMode
                          ? 'bg-purple-400 text-white shadow-md'
                          : 'bg-purple-300 text-white shadow-md'
                        : isDarkMode
                          ? 'text-gray-400 hover:text-purple-200 hover:bg-slate-700/50'
                          : 'text-gray-500 hover:text-purple-500 hover:bg-purple-50/50'
                    }`}
                    title="Grid View"
                  >
                    <Grid3X3 size={16} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-r-lg transition-all duration-200 ${
                      viewMode === 'list'
                        ? isDarkMode
                          ? 'bg-purple-400 text-white shadow-md'
                          : 'bg-purple-300 text-white shadow-md'
                        : isDarkMode
                          ? 'text-gray-400 hover:text-purple-200 hover:bg-slate-700/50'
                          : 'text-gray-500 hover:text-purple-500 hover:bg-purple-50/50'
                    }`}
                    title="List View"
                  >
                    <List size={16} />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className={`animate-spin ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={32} />
                  <span className={`ml-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading college worklets...</span>
                </div>
              ) : error ? (
                <div className={`text-center py-12 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                  <p className="text-lg font-medium mb-2">Error</p>
                  <p className="text-sm">{error}</p>
                  <button
                    onClick={fetchColleges}
                    className={`mt-4 px-4 py-2 rounded-lg ${
                      isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    Try Again
                  </button>
                </div>
              ) : filtered.length === 0 ? (
                <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Target size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No worklets found</p>
                  <p className="text-sm">
                    {searchTerm 
                      ? `No worklets match your search "${searchTerm}"`
                      : `No ${activeFilter} worklets available at the moment`
                    }
                  </p>
                </div>
              ) : (
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" 
                  : "space-y-4"
                }>
                  <AnimatePresence>
                    {filtered.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                        className={`border cursor-pointer transition-all duration-200 group ${
                          viewMode === 'grid' 
                            ? `p-5 rounded-xl hover:scale-[1.02] h-full flex flex-col ${
                                isDarkMode 
                                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500 hover:shadow-xl' 
                                  : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-xl'
                              }`
                            : `p-4 rounded-lg ${
                                isDarkMode 
                                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500 hover:shadow-lg' 
                                  : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-lg'
                              }`
                        }`}
                      >
                        {viewMode === 'grid' ? (
                          // Grid View Layout
                          <>
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className={`font-semibold text-lg mb-1 line-clamp-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {activeFilter === 'students' ? item.name : item.title}
                                </h3>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {activeFilter === 'students' ? item.email : item.description}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {activeFilter !== 'students' && (
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                    {item.status}
                                  </span>
                                )}
                                <ExternalLink 
                                  size={16} 
                                  className={`${isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-600'} transition-colors`} 
                                />
                              </div>
                            </div>

                            {/* College/Student Info */}
                            <div className="flex items-center gap-4 text-xs flex-wrap mb-4">
                              <div className="flex items-center gap-1">
                                <Building2 size={12} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{item.collegeName}</span>
                              </div>
                              {activeFilter !== 'students' && (
                                <div className="flex items-center gap-1">
                                  <Users size={12} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{item.studentCount} student{item.studentCount === 1 ? '' : 's'}</span>
                                </div>
                              )}
                            </div>

                            {/* Bottom section with domain and year */}
                            {activeFilter !== 'students' && (
                              <div className="flex items-center justify-between mt-auto pt-3">
                                <div>
                                  {item.domain && (
                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full">
                                      {item.domain}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  {item.year && (
                                    <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {item.year}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Additional Info for Students */}
                            {activeFilter === 'students' && item.worklets && (
                              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Assigned Worklets:</p>
                                  {item.worklets.slice(0, 2).map((worklet, idx) => (
                                    <div key={idx} className="text-xs text-gray-600 dark:text-gray-400">
                                      {worklet.title}
                                    </div>
                                  ))}
                                  {item.worklets.length > 2 && (
                                    <div className="text-xs text-gray-500 dark:text-gray-500">
                                      +{item.worklets.length - 2} more
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          // List View Layout
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="mb-2">
                                <div className="flex items-center gap-3 mb-1 flex-wrap">
                                  <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {activeFilter === 'students' ? item.name : item.title}
                                  </h3>
                                  <div className="flex items-center gap-1">
                                    <Building2 size={12} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.collegeName}</span>
                                  </div>
                                  {activeFilter !== 'students' && (
                                    <div className="flex items-center gap-1">
                                      <Users size={12} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.studentCount} student{item.studentCount === 1 ? '' : 's'}</span>
                                    </div>
                                  )}
                                </div>
                                <p className={`text-sm line-clamp-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                  {activeFilter === 'students' ? item.email : item.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              {activeFilter !== 'students' && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                  {item.status}
                                </span>
                              )}
                              <ExternalLink size={16} className={`${isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-600'} transition-colors`} />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default NavColl;
