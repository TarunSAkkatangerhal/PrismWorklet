import React, { useState, useEffect, useContext } from 'react'
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
  List
} from 'lucide-react'
import LeftSidebar from '../components/Left'
import { ThemeContext } from '../context/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'

const NavStat = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isDarkMode } = useContext(ThemeContext)
  
  // Get the filter from navigation state, default to 'total'
  const initialFilter = location.state?.filter || 'total'
  
  const [activeFilter, setActiveFilter] = useState(initialFilter)
  const [worklets, setWorklets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

  // Filter options configuration
  const filterOptions = [
    {
      key: 'total',
      label: 'Total Worklets',
      icon: Target,
      color: 'blue',
      description: 'All worklets in the system'
    },
    {
      key: 'ongoing',
      label: 'Ongoing',
      icon: Activity,
      color: 'orange',
      description: 'Currently active worklets'
    },
    {
      key: 'completed',
      label: 'Completed',
      icon: CheckCircle,
      color: 'green',
      description: 'Successfully finished worklets'
    }
  ]

  // Static worklet data for demonstration
  const staticWorklets = [
    {
      id: 1,
      title: 'Full Stack Web Development Bootcamp',
      cert_id: 'PRISM-2025-001',
      status: 'Ongoing',
      description: 'A comprehensive full-stack web development program covering modern technologies including React, Node.js, databases, and deployment strategies. Students will build real-world projects and gain hands-on experience with industry-standard tools and practices.',
      college: 'Cambridge Institute of Technology'
      
    },
    {
      id: 2,
      title: 'AI & Machine Learning Research Project',
      cert_id: 'PRISM-2025-002',
      status: 'Completed',
      description: 'Advanced machine learning research project focusing on natural language processing and computer vision applications. Includes implementation of deep learning models and research paper publication.',
      college: 'MIT Technology Institute'
    }
  ]

  // Fetch worklets based on active filter
  useEffect(() => {
    // Use static data for now
    setTimeout(() => {
      let filteredData = staticWorklets
      
      if (activeFilter === 'ongoing') {
        filteredData = staticWorklets.filter(w => w.status === 'Ongoing')
      } else if (activeFilter === 'completed') {
        filteredData = staticWorklets.filter(w => w.status === 'Completed')
      }
      
      setWorklets(filteredData)
      setLoading(false)
    }, 500) // Simulate loading delay
    
    // Uncomment below for real API call
    // fetchWorklets()
  }, [activeFilter])

  const fetchWorklets = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('access_token')
      if (!token) {
        setError('Authentication token not found')
        return
      }

      // Build API URL based on filter
      let apiUrl = 'http://localhost:8000/worklets'
      if (activeFilter !== 'total') {
        apiUrl += `?status=${activeFilter}`
      }

      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      })

      setWorklets(response.data || [])
    } catch (err) {
      console.error('Error fetching worklets:', err)
      setError('Failed to fetch worklets. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Filter worklets based on search term
  const filteredWorklets = worklets.filter(worklet => {
    const searchLower = searchTerm.toLowerCase()
    return (
      worklet.title?.toLowerCase().includes(searchLower) ||
      worklet.cert_id?.toLowerCase().includes(searchLower) ||
      worklet.description?.toLowerCase().includes(searchLower) ||
      worklet.college?.toLowerCase().includes(searchLower)
    )
  })

  const handleFilterChange = (filterKey) => {
    setActiveFilter(filterKey)
    setSearchTerm('')
  }

  const handleWorkletClick = (workletId) => {
    navigate(`/worklet/${workletId}`)
  }

  const handleGoBack = () => {
    navigate('/statistics')
  }

  const getFilterStats = () => {
    const total = worklets.length
    const completed = worklets.filter(w => w.status === 'Completed').length
    const ongoing = worklets.filter(w => w.status === 'Ongoing').length
    
    return { total, completed, ongoing }
  }

  const stats = getFilterStats()

  return (
    <div className={`flex h-screen ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-purple-900/20 to-indigo-900/20' 
        : 'bg-gradient-to-br from-purple-50 via-indigo-50/50 to-blue-100/30'
    }`}>
      <LeftSidebar />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4">
          
          {/* Compact Header Section */}
          <div className={`${
            isDarkMode 
              ? 'bg-gradient-to-r from-slate-800/80 via-purple-900/10 to-indigo-900/10 backdrop-blur-sm border-purple-800/20' 
              : 'bg-gradient-to-r from-white/80 via-purple-50/50 to-indigo-50/30 backdrop-blur-sm border-purple-200/30'
          } rounded-2xl shadow-lg border p-4 mb-4`}>
            
            {/* Optimized Header Layout */}
            <div className="flex items-center justify-between">
              {/* Left Side - Back Arrow + Title */}
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={handleGoBack}
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-purple-800/50 to-indigo-800/50 hover:from-purple-700/60 hover:to-indigo-700/60 text-purple-300 hover:text-white border border-purple-700/30' 
                      : 'bg-gradient-to-r from-purple-100/80 to-indigo-100/80 hover:from-purple-200 hover:to-indigo-200 text-purple-700 hover:text-purple-800 border border-purple-300/40'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowLeft size={20} />
                </motion.button>
                
                <div>
                  <h1 className={`text-xl font-bold ${
                    isDarkMode ? 'text-white' : 'text-slate-800'
                  }`}>
                    Worklet Details
                  </h1>
                  <p className={`text-xs ${
                    isDarkMode ? 'text-purple-300/70' : 'text-purple-600/80'
                  }`}>
                    Manage and view your project worklets
                  </p>
                </div>
              </div>

              {/* Right Side - Filter Tabs */}
              <div className="flex items-center gap-2">
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
                            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg border border-purple-500/50'
                            : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg border border-purple-400/50'
                          : isDarkMode
                          ? 'bg-slate-700/50 text-purple-300 border border-purple-800/30 hover:bg-gradient-to-r hover:from-purple-800/40 hover:to-indigo-800/40 hover:text-white'
                          : 'bg-white/60 text-purple-700 border border-purple-300/40 hover:bg-gradient-to-r hover:from-purple-100 hover:to-indigo-100 hover:text-purple-800'
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
                          ? 'bg-purple-800/30 text-purple-300'
                          : 'bg-purple-100/80 text-purple-600'
                      }`}>
                        {option.key === 'total' && stats.total}
                        {option.key === 'ongoing' && stats.ongoing}
                        {option.key === 'completed' && stats.completed}
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
                  isDarkMode ? 'text-purple-400' : 'text-purple-500'
                }`} 
              />
              <input
                type="text"
                placeholder="Search worklets by title, ID, college, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-12 pr-4 py-2.5 rounded-xl border transition-all duration-200 ${
                  isDarkMode 
                    ? 'bg-slate-800/50 border-purple-700/30 text-white placeholder-purple-400/60 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20' 
                    : 'bg-white/70 border-purple-300/40 text-slate-800 placeholder-purple-500/60 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                } backdrop-blur-sm`}
              />
            </div>
          </div>

          {/* Content Section */}
          <div className={`${
            isDarkMode 
              ? 'bg-gradient-to-br from-slate-800/80 via-purple-900/10 to-indigo-900/10 backdrop-blur-sm border-purple-800/20' 
              : 'bg-gradient-to-br from-white/80 via-purple-50/30 to-indigo-50/20 backdrop-blur-sm border-purple-200/30'
          } rounded-2xl shadow-lg border overflow-hidden`}>
            
            {/* Results Header */}
            <div className={`p-4 border-b ${
              isDarkMode 
                ? 'border-purple-700/30 bg-gradient-to-r from-slate-800/60 to-purple-900/20' 
                : 'border-purple-300/30 bg-gradient-to-r from-purple-50/60 to-indigo-50/40'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className={`text-lg font-semibold ${
                    isDarkMode ? 'text-white' : 'text-slate-800'
                  }`}>
                    {filterOptions.find(f => f.key === activeFilter)?.label} 
                    {searchTerm && ` - Search Results`}
                  </h2>
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    isDarkMode 
                      ? 'bg-purple-900/30 text-purple-300 border border-purple-700/30' 
                      : 'bg-purple-100/60 text-purple-700 border border-purple-300/40'
                  }`}>
                    {searchTerm ? `${filteredWorklets.length} of ${worklets.length}` : `${worklets.length} total`} worklets
                  </span>
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
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-purple-500 text-white shadow-md'
                        : isDarkMode
                          ? 'text-gray-400 hover:text-purple-300 hover:bg-slate-700/50'
                          : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50/50'
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
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-purple-500 text-white shadow-md'
                        : isDarkMode
                          ? 'text-gray-400 hover:text-purple-300 hover:bg-slate-700/50'
                          : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50/50'
                    }`}
                    title="List View"
                  >
                    <List size={16} />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Worklets Grid */}
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className={`animate-spin ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={32} />
                  <span className={`ml-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading worklets...</span>
                </div>
              ) : error ? (
                <div className={`text-center py-12 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                  <p className="text-lg font-medium mb-2">Error</p>
                  <p className="text-sm">{error}</p>
                  <button
                    onClick={fetchWorklets}
                    className={`mt-4 px-4 py-2 rounded-lg ${
                      isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredWorklets.length === 0 ? (
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
                    {filteredWorklets.map((worklet, index) => (
                      <motion.div
                        key={worklet.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleWorkletClick(worklet.id)}
                        className={`border cursor-pointer transition-all duration-200 group ${
                          viewMode === 'grid' 
                            ? `p-5 rounded-xl hover:scale-[1.02] ${
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
                            {/* Worklet Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className={`font-semibold text-lg mb-1 line-clamp-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {worklet.title || worklet.cert_id || `Worklet ${worklet.id}`}
                                </h3>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  ID: {worklet.cert_id || worklet.id}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  worklet.status === 'Completed' 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                    : worklet.status === 'Ongoing'
                                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                                }`}>
                                  {worklet.status || 'Unknown'}
                                </span>
                                <ExternalLink 
                                  size={16} 
                                  className={`${isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-600'} transition-colors`} 
                                />
                              </div>
                            </div>

                            {/* Description */}
                            {worklet.description && (
                              <p className={`text-sm mb-4 line-clamp-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {worklet.description}
                              </p>
                            )}

                            {/* Footer Info */}
                            <div className="flex items-center gap-4 text-xs">
                              {worklet.college && (
                                <div className="flex items-center gap-1">
                                  <MapPin size={12} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                                    {worklet.college}
                                  </span>
                                </div>
                              )}
                              
                              {worklet.students && worklet.students.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <Users size={12} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                                    {worklet.students.length} student{worklet.students.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          // List View Layout
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="mb-2">
                                <div className="flex items-center gap-3 mb-1 flex-wrap">
                                  <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {worklet.title || worklet.cert_id || `Worklet ${worklet.id}`}
                                  </h3>
                                  <span className={`text-sm px-2 py-1 rounded ${isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                    ID: {worklet.cert_id || worklet.id}
                                  </span>
                                  {worklet.college && (
                                    <div className="flex items-center gap-1">
                                      <MapPin size={12} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {worklet.college}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {worklet.students && worklet.students.length > 0 && (
                                  <div className="flex items-center gap-1 mb-2">
                                    <Users size={12} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {worklet.students.length} student{worklet.students.length !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Description in List View */}
                              {worklet.description && (
                                <p className={`text-sm line-clamp-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                  {worklet.description}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                worklet.status === 'Completed' 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                  : worklet.status === 'Ongoing'
                                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                              }`}>
                                {worklet.status || 'Unknown'}
                              </span>
                              <ExternalLink 
                                size={16} 
                                className={`${isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-600'} transition-colors`} 
                              />
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

export default NavStat
