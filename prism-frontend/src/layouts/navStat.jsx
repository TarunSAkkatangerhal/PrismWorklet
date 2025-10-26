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
  List
} from 'lucide-react'
import LeftSidebar from '../components/Left'
import { ThemeContext } from '../context/ThemeContext'
// Animations removed to improve performance during loading

const NavStat = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isDarkMode } = useContext(ThemeContext)
  
  // Get the filter from navigation state, default to 'total'
  const initialFilter = location.state?.filter || 'total'
  const initialYear = location.state?.year || 'All'
  const targetCollege = location.state?.collegeName || ''
  const fallbackTotalCount = Number(location.state?.count) || 0
  
  const [activeFilter, setActiveFilter] = useState(initialFilter)
  const [worklets, setWorklets] = useState([])             // full dataset
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

  // Live fetch of all platform worklets; filtering done client-side
  const fetchWorklets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const base = process.env.REACT_APP_API_URL || 'http://localhost:8000'
      const token = localStorage.getItem('access_token')
      if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      const params = new URLSearchParams()
      if (yearFilter && yearFilter !== 'All') params.set('year', yearFilter)
      let data = []
      try {
        const res = await axios.get(`${base}/worklets${params.toString() ? `?${params.toString()}` : ''}`)
        data = Array.isArray(res.data) ? res.data : []
      } catch (e) {
        // Fallback to alias used by backend
        const res2 = await axios.get(`${base}/api/worklets${params.toString() ? `?${params.toString()}` : ''}`)
        data = Array.isArray(res2.data) ? res2.data : []
      }

      // Normalize minimal fields (some endpoints may not return cert_id/title consistently)
      const normalized = data.map(w => ({
        id: w.id,
        cert_id: w.cert_id || w.id,
        title: w.title || w.cert_id || `Worklet ${w.id}`,
        description: w.description || '',
        status: w.status === 'Approved' ? 'Ongoing' : w.status,
        domain: w.domain,
        worklet_progress: typeof w.worklet_progress === 'number' ? w.worklet_progress : null,
        start_date: w.start_date,
        end_date: w.end_date,
        college: w.college || null,
        student_count: typeof w.student_count === 'number' ? w.student_count : 0,
        year: w.year
      }))

      // If a target college is specified, filter dataset here (additional filtering will still apply)
      const scoped = targetCollege && targetCollege !== 'All Colleges'
        ? normalized.filter(w => (w.college || '').toLowerCase() === targetCollege.toLowerCase())
        : normalized

      setWorklets(scoped)
      setLastUpdated(new Date())

    } catch (err) {
      console.error('Error fetching worklets:', err)
      setError(err.response?.data?.detail || 'Failed to fetch worklets.')
      setWorklets([])
    } finally {
      setLoading(false)
    }
  }, [yearFilter, targetCollege])

  // Apply filter whenever full dataset or activeFilter changes
  useEffect(() => {
    let subset = worklets
    if (yearFilter && yearFilter !== 'All') {
      subset = subset.filter(w => String(w.year) === String(yearFilter))
    }
    // Optional college scoping (in case dataset source isn't already scoped)
    if (targetCollege && targetCollege !== 'All Colleges') {
      subset = subset.filter(w => (w.college || '').toLowerCase() === targetCollege.toLowerCase())
    }
    if (activeFilter === 'ongoing') subset = subset.filter(w => w.status === 'Ongoing')
    else if (activeFilter === 'completed') subset = subset.filter(w => w.status === 'Completed')
    setFiltered(subset)
  }, [worklets, activeFilter, yearFilter, targetCollege])

  // Initial fetch & refetch on filter change (filter done client-side so just reuse dataset unless first load or error)
  useEffect(() => {
    if (worklets.length === 0 || error) {
      fetchWorklets()
    }
  }, [activeFilter, yearFilter, fetchWorklets])

  // Poll every 60s
  useEffect(() => {
    const id = setInterval(() => { fetchWorklets() }, 60000)
    return () => clearInterval(id)
  }, [fetchWorklets])

  // Filter worklets based on search term
  const filteredWorklets = filtered.filter(worklet => {
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
    navigate('/Dashboard')
  }

  const getFilterStats = () => {
    let total = worklets.length
    const completed = worklets.filter(w => w.status === 'Completed').length
    const ongoing = worklets.filter(w => w.status === 'Ongoing').length
    // If no data could be loaded but a count was provided via navigation state (e.g., from dashboard), use it for total
    if (total === 0 && fallbackTotalCount > 0) {
      total = fallbackTotalCount
    }
    return { total, completed, ongoing }
  }

  const stats = getFilterStats()

  const formatTimeline = (start, end) => {
    if (!start && !end) return ''
    const fmt = (d) => {
      if (!d) return '—'
      try { return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) } catch { return '—' }
    }
    return `${fmt(start)} → ${fmt(end)}`
  }

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
            
            {/* Optimized Header Layout */}
            <div className="flex items-center justify-between">
              {/* Left Side - Back Arrow + Title */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleGoBack}
                  className={`p-2 rounded-xl transition-colors duration-200 ${
                    isDarkMode 
                      ? 'bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-500/40 hover:to-indigo-500/40 text-purple-200 hover:text-white border border-purple-500/20' 
                      : 'bg-gradient-to-r from-purple-50/80 to-indigo-50/80 hover:from-purple-100 hover:to-indigo-100 text-purple-600 hover:text-purple-700 border border-purple-200/40'
                  }`}
                >
                  <ArrowLeft size={20} />
                </button>
                
                <div>
                  <h1 className={`text-4xl font-bold font-sans ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}>
                    Worklet Details
                  </h1>
                
                </div>
              </div>

              {/* Right Side - Filter Tabs */}
              <div className="flex items-center gap-2">
                {filterOptions.map((option) => {
                  const Icon = option.icon
                  const isActive = activeFilter === option.key
                  
                  return (
                    <button
                      key={option.key}
                      onClick={() => handleFilterChange(option.key)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-200 ${
                        isActive
                          ? isDarkMode
                            ? 'bg-gradient-to-r from-purple-400 to-indigo-400 text-white shadow-lg border border-purple-300/50'
                            : 'bg-gradient-to-r from-purple-300 to-indigo-300 text-white shadow-lg border border-purple-200/50'
                          : isDarkMode
                          ? 'bg-slate-700/50 text-gray-300 border border-gray-700/30 hover:bg-gradient-to-r hover:from-gray-800/40 hover:to-gray-700/40 hover:text-white'
                          : 'bg-white/60 text-gray-700 border border-gray-300/40 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 hover:text-gray-800'
                      }`}
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
                        {option.key === 'total' && stats.total}
                        {option.key === 'ongoing' && stats.ongoing}
                        {option.key === 'completed' && stats.completed}
                      </span>
                    </button>
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
                placeholder="Search worklets by title, ID, college, or description..."
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
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-l-lg transition-colors duration-200 ${
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
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-r-lg transition-colors duration-200 ${
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
                  </button>
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
                    {filteredWorklets.map((worklet) => (
                      <div
                        key={worklet.id}
                        onClick={() => handleWorkletClick(worklet.id)}
                        className={`border cursor-pointer transition-colors duration-200 group ${
                          viewMode === 'grid' 
                            ? `p-5 rounded-xl ${
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
                            <div className="flex items-center gap-4 text-xs flex-wrap">
                              {worklet.college && (
                                <div className="flex items-center gap-1">
                                  <MapPin size={12} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{worklet.college}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Users size={12} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{worklet.student_count} student{worklet.student_count === 1 ? '' : 's'}</span>
                              </div>
                              {(worklet.start_date || worklet.end_date) && (
                                <div className="flex items-center gap-1 text-[10px]">
                                  <span className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>{formatTimeline(worklet.start_date, worklet.end_date)}</span>
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
                                  <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{worklet.title || worklet.cert_id || `Worklet ${worklet.id}`}</h3>
                                  <span className={`text-sm px-2 py-1 rounded ${isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>ID: {worklet.cert_id || worklet.id}</span>
                                  {worklet.college && (
                                    <div className="flex items-center gap-1">
                                      <MapPin size={12} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{worklet.college}</span>
                                    </div>
                                  )}
                                  {(worklet.start_date || worklet.end_date) && (
                                    <div className="flex items-center gap-1 text-[11px]">
                                      <span className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>{formatTimeline(worklet.start_date, worklet.end_date)}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <Users size={12} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{worklet.student_count} student{worklet.student_count === 1 ? '' : 's'}</span>
                                </div>
                                {worklet.description && (
                                  <p className={`text-sm line-clamp-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{worklet.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                worklet.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                : worklet.status === 'Ongoing' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                              }`}>{worklet.status || 'Unknown'}</span>
                              <ExternalLink size={16} className={`${isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-600'} transition-colors`} />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
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
