import React, { useState, useEffect, useContext, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  ArrowLeft, 
  Target, 
  CheckCircle, 
  Users, 
  ExternalLink,
  Search,
  Loader,
  Grid3X3,
  List,
  PauseCircle,
  XCircle,
  Clock,
  Building2,
  Download
} from 'lucide-react'
import LeftSidebar from '../components/Left'
import { ThemeContext } from '../context/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'

const NavColl = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isDarkMode } = useContext(ThemeContext)
  
  const initialFilter = location.state?.filter || 'total'
  
  const initialCollegeName = location.state?.collegeName || ''
  
  // Get year and team filters from navigation state
  const yearFilter = location.state?.year || ''
  const teamFilter = location.state?.team || ''
  
  const [activeFilter, setActiveFilter] = useState(initialFilter)
  const [colleges, setColleges] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState(initialCollegeName)
  const [selectedCollege, setSelectedCollege] = useState(initialCollegeName)
  const [viewMode, setViewMode] = useState('grid')
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

  // Removed staticColleges fallback; rely solely on backend data


  const fetchColleges = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const base = process.env.REACT_APP_API_URL || 'http://localhost:8000'
      const token = localStorage.getItem('access_token')
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}

      // Fetch colleges
      const collegesResponse = await axios.get(`${base}/colleges`, { headers, timeout: 10000 })
      const collegesData = Array.isArray(collegesResponse.data) ? collegesResponse.data : []

      // Fetch all worklets (no filters - we'll filter on frontend)
      let workletsData = []
      try {
        const workletsResponse = await axios.get(`${base}/worklets`, { headers, timeout: 15000 })
        workletsData = Array.isArray(workletsResponse.data) ? workletsResponse.data : []
        console.log(`[NavColl] Fetched ${workletsData.length} total worklets from backend`)
        
        // Fetch assigned students for each worklet
        const workletStudentsPromises = workletsData.map(async (worklet) => {
          try {
            const studentsResponse = await axios.get(`${base}/worklets/${worklet.id}/students`, { headers, timeout: 10000 })
            return {
              workletId: worklet.id,
              students: Array.isArray(studentsResponse.data) ? studentsResponse.data : []
            }
          } catch (e) {
            console.warn(`Failed to fetch students for worklet ${worklet.id}:`, e)
            return { workletId: worklet.id, students: [] }
          }
        })
        
        const workletStudentsResults = await Promise.all(workletStudentsPromises)
        const studentsByWorklet = new Map()
        workletStudentsResults.forEach(result => {
          studentsByWorklet.set(result.workletId, result.students)
        })
        
        // Attach students to worklets
        workletsData = workletsData.map(worklet => ({
          ...worklet,
          assignedStudents: studentsByWorklet.get(worklet.id) || []
        }))
        
        console.log(`[NavColl] Attached students to ${workletsData.length} worklets`)
      } catch (e) {
        console.warn('Worklets fetch failed in navColl; proceeding with colleges only', e)
      }

      // Merge colleges with worklets
      const enrichedColleges = collegesData.map((college) => {
        const cid = college.college_id ?? college.id
        const cname = college.college_name ?? college.name

        const collegeWorklets = workletsData
          .filter((worklet) => {
            // Match by college_id
            if (worklet.college_id !== undefined && worklet.college_id !== null) {
              return Number(worklet.college_id) === Number(cid)
            }
            // Fallback: match by name
            if (worklet.college && cname) {
              return String(worklet.college).trim().toLowerCase() === String(cname).trim().toLowerCase()
            }
            return false
          })
          .map((worklet) => ({
            ...worklet,
            progressStatus: worklet.status,
            status: worklet.status,
            studentCount: worklet.student_count || (worklet.assignedStudents ? worklet.assignedStudents.length : 0),
            assignedStudents: worklet.assignedStudents || [],
            collegeName: worklet.college || cname,
          }))

        return {
          ...college,
          id: cid,
          name: cname,
          worklets: collegeWorklets,
        }
      })

      setColleges(enrichedColleges)

    } catch (err) {
      console.error('Failed to fetch colleges:', err)
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error'
      setError(`Failed to load colleges: ${errorMessage}`)
      setColleges([])
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  const filterColleges = useCallback(() => {
    let result = []
    if (!colleges || colleges.length === 0) return result

    if (activeFilter === 'students') {
      // Simply collect students from filtered worklets
      const studentMap = new Map()
      
      colleges.forEach((college) => {
        if (selectedCollege && (college.name || '').trim() !== selectedCollege.trim()) return
        
        // Filter worklets by year/team
        const filteredWorklets = college.worklets.filter((worklet) => {
          if (yearFilter && worklet.year && String(worklet.year) !== String(yearFilter)) return false
          if (teamFilter && worklet.team && String(worklet.team) !== String(teamFilter)) return false
          return true
        })
        
        // Collect students from filtered worklets
        filteredWorklets.forEach((worklet) => {
          (worklet.assignedStudents || []).forEach((student) => {
            const key = student.email || student.name || `student-${Math.random()}`
            if (!studentMap.has(key)) {
              studentMap.set(key, { 
                ...student, 
                id: student.user_id || student.userId || student.email || student.name || key,
                name: student.name || student.email?.split('@')[0] || 'Unknown',
                collegeName: college.name 
              })
            }
          })
        })
      })
      
      result = Array.from(studentMap.values())
      console.log(`[NavColl] Showing ${result.length} students from filtered worklets (year: ${yearFilter || 'all'}, team: ${teamFilter || 'all'})`)
      
      // Apply search filter
      if (searchTerm) {
        result = result.filter((s) =>
          (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.collegeName || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
      return result
    }

    // Worklets list based on filter
    const allowedStatuses = {
      total: ['To Start', 'Ongoing', 'Completed', 'On Hold', 'Terminated', 'Dropped'],
      ongoing: ['To Start', 'Ongoing'], // Include "To Start" as it's considered ongoing
      completed: ['Completed'],
      onhold: ['On Hold'],
      terminated: ['Terminated', 'Dropped']
    }[activeFilter] || ['To Start', 'Ongoing', 'Completed', 'On Hold', 'Terminated', 'Dropped']

    colleges.forEach((college) => {
      if (selectedCollege && (college.name || '').trim() !== selectedCollege.trim()) return
      college.worklets.forEach((worklet) => {
        // Map 'Dropped' to 'Terminated' for UI consistency
        const statusForUi = worklet.status === 'Dropped' ? 'Terminated' : (worklet.status || worklet.progressStatus)
        if (allowedStatuses.includes(worklet.status) || allowedStatuses.includes(worklet.progressStatus) || (worklet.status === 'Dropped' && allowedStatuses.includes('Terminated'))) {
          // Apply year filter ONLY if yearFilter is provided AND worklet has a year
          if (yearFilter && worklet.year) {
            if (String(worklet.year) !== String(yearFilter)) {
              return
            }
          }
          
          // Apply team filter ONLY if teamFilter is provided AND worklet has a team
          if (teamFilter && worklet.team) {
            if (String(worklet.team) !== String(teamFilter)) {
              return
            }
          }
          
          result.push({
            id: `${college.id}-${worklet.id}`,
            workletId: worklet.id, // Add the actual worklet ID for navigation
            collegeId: college.id,
            collegeName: worklet.collegeName || college.name,
            location: college.location,
            status: statusForUi,
            domain: worklet.domain || (college.areaOfExpertise && college.areaOfExpertise[0]) || 'General',
            title: worklet.title,
            description: worklet.description,
            studentCount: worklet.studentCount || (worklet.assignedStudents ? worklet.assignedStudents.length : 0),
            startDate: worklet.start_date,
            endDate: worklet.end_date,
            year: worklet.year
          })
        }
      })
    })

    // Apply search filter for worklets
    if (searchTerm) {
      result = result.filter(worklet => 
        (worklet.collegeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (worklet.domain || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (worklet.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (worklet.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return result
  }, [colleges, activeFilter, searchTerm, selectedCollege, yearFilter, teamFilter])


  useEffect(() => {
    setFiltered(filterColleges())
  }, [filterColleges])


  useEffect(() => {
    fetchColleges()
  }, [fetchColleges])

  const forceRefresh = () => {
    setError(null)
    fetchColleges()
  }

  // Keep search term in sync if navigation provides a college name
  useEffect(() => {
    if (location.state?.collegeName) {
      setSearchTerm(location.state.collegeName)
      setSelectedCollege(location.state.collegeName)
    }
  }, [location.state?.collegeName])

  const handleFilterChange = (filterKey) => {
    // No-op if same filter clicked to avoid clearing results
    if (filterKey === activeFilter) return
    setActiveFilter(filterKey)
  }

  const handleGoBack = () => {
    // Navigate back to academia with a clean state (no filters restored)
    // Clear URL and use replace to prevent back button issues
    navigate('/academia', { 
      state: { fromDetails: true }, // Flag to indicate coming from details page
      replace: true
    })
  }

  const handleExport = () => {
    // Get the data to export based on current filter
    let dataToExport = []
    
    if (activeFilter === 'students') {
      // Export students
      dataToExport = filtered.map(student => ({
        Name: student.name || 'N/A',
        Email: student.email || 'N/A',
        College: student.collegeName || 'N/A'
      }))
    } else {
      // Export worklets
      dataToExport = filtered.map(worklet => ({
        ID: worklet.workletId || worklet.id,
        Title: worklet.title || 'N/A',
        College: worklet.collegeName || 'N/A',
        Status: worklet.status || 'N/A',
        Domain: worklet.domain || 'N/A',
        'Student Count': worklet.studentCount || 0
      }))
    }

    if (dataToExport.length === 0) {
      alert('No data to export')
      return
    }

    // Convert to CSV
    const headers = Object.keys(dataToExport[0])
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(row => 
        headers.map(header => {
          const value = String(row[header] || '')
          // Escape values that contain commas or quotes
          return value.includes(',') || value.includes('"') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value
        }).join(',')
      )
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    const filterName = activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)
    link.setAttribute('download', `College_${filterName}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getFilterStats = () => {
    // Calculate stats from FILTERED data to respect year/team filters
    let total = 0, ongoing = 0, completed = 0, onhold = 0, terminated = 0
    
    console.log(`[getFilterStats] Starting with ${colleges.length} colleges, yearFilter=${yearFilter}, teamFilter=${teamFilter}`)
    
    colleges.forEach((college) => {
      if (selectedCollege && (college.name || '').trim() !== selectedCollege.trim()) return
      
      const worklets = college.worklets || []
      console.log(`[getFilterStats] ${college.name}: ${worklets.length} total worklets`)
      
      // Apply year/team filters to worklets before counting
      const filteredWorklets = worklets.filter((worklet) => {
        if (yearFilter && worklet.year && String(worklet.year) !== String(yearFilter)) return false
        if (teamFilter && worklet.team && String(worklet.team) !== String(teamFilter)) return false
        return true
      })
      
      console.log(`[getFilterStats] ${college.name}: ${filteredWorklets.length} worklets after filters`)
      
      // Count worklets by status from filtered worklets
      total += filteredWorklets.length
      ongoing += filteredWorklets.filter(w => (w.status === 'Ongoing' || w.status === 'To Start' || w.progressStatus === 'Ongoing')).length
      completed += filteredWorklets.filter(w => (w.status === 'Completed' || w.progressStatus === 'Completed')).length
      onhold += filteredWorklets.filter(w => (w.status === 'On Hold' || w.progressStatus === 'On Hold')).length
      terminated += filteredWorklets.filter(w => (w.status === 'Terminated' || w.status === 'Dropped' || w.progressStatus === 'Terminated')).length
      
      console.log(`[getFilterStats] ${college.name}: processed ${filteredWorklets.length} worklets`)
    })
    
    // Use totalStudents from backend (already calculated as unique students by college_id)
    // This avoids counting the same student multiple times across worklets
    let students = 0
    colleges.forEach((college) => {
      if (selectedCollege && (college.name || '').trim() !== selectedCollege.trim()) return
      // Add the college's totalStudents (from backend, not recalculated)
      students += college.totalStudents || 0
    })
    
    console.log(`[getFilterStats] FINAL - Total: ${total}, Ongoing: ${ongoing}, Completed: ${completed}, OnHold: ${onhold}, Terminated: ${terminated}, Students: ${students}`)
    return { total, ongoing, completed, onhold, terminated, students }
  }

  const stats = getFilterStats()

  const getStatusColor = (status) => {
    const colors = {
      'Ongoing': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'Completed': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'On Hold': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      'Terminated': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      'Dropped': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
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
                
                {/* Export and View Toggle Buttons */}
                <div className="flex items-center gap-2">
                  {/* Export Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleExport}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                      isDarkMode
                        ? 'bg-gradient-to-r from-purple-400 to-indigo-400 text-white shadow-lg border border-purple-200/50'
                        : 'bg-gradient-to-r from-purple-300 to-indigo-300 text-white shadow-lg border border-purple-200/50'
                    }`}
                    title="Export to CSV"
                  >
                    <Download size={16} />
                    <span>Export</span>
                  </motion.button>

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
            </div>

            {/* Content Grid */}
            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeFilter}-${viewMode}-${searchTerm}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className={`animate-spin ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={32} />
                  <span className={`ml-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading college worklets...</span>
                </div>
              ) : error ? (
                <div className={`text-center py-12 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                  <p className="text-lg font-medium mb-2">Error</p>
                  <p className="text-sm">{error}</p>
                  <div className="flex gap-2 justify-center mt-4">
                    <button
                      onClick={fetchColleges}
                      className={`px-4 py-2 rounded-lg ${
                        isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                      }`}
                    >
                      Try Again
                    </button>
                    <button
                      onClick={forceRefresh}
                      className={`px-4 py-2 rounded-lg ${
                        isDarkMode ? 'bg-blue-700 hover:bg-blue-600 text-blue-300' : 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                      }`}
                    >
                      Force Refresh
                    </button>
                  </div>
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
                        layout
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => {
                          // Navigate to worklet details only for worklet items (not students)
                          if (activeFilter !== 'students' && item.workletId) {
                            navigate(`/worklet/${item.workletId}`);
                          }
                        }}
                        className={`border transition-all duration-200 group ${
                          activeFilter === 'students' ? 'cursor-default' : 'cursor-pointer'
                        } ${
                          viewMode === 'grid' 
                            ? `p-5 rounded-xl h-full flex flex-col ${
                                activeFilter !== 'students' ? 'hover:scale-[1.02]' : ''
                              } ${
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
                                  {item.title ? item.title : item.name}
                                </h3>
                                <p className={`text-sm line-clamp-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {item.title ? item.description : item.email}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {item.status && (
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                    {item.status}
                                  </span>
                                )}
                                {activeFilter !== 'students' ? (
                                  <ExternalLink 
                                    size={16} 
                                    className={`${isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-600'} transition-colors`} 
                                    title="View worklet details"
                                  />
                                ) : (
                                  <ExternalLink 
                                    size={16} 
                                    className={`${isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-600'} transition-colors`} 
                                  />
                                )}
                              </div>
                            </div>

                            {/* College/Student Info */}
                            <div className="flex items-center gap-4 text-xs flex-wrap mb-4">
                              <div className="flex items-center gap-1">
                                <Building2 size={12} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{item.collegeName}</span>
                              </div>
                              {item.studentCount !== undefined && (
                                <div className="flex items-center gap-1">
                                  <Users size={12} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{item.studentCount} student{item.studentCount === 1 ? '' : 's'}</span>
                                </div>
                              )}
                            </div>

                            {/* Bottom section with domain and year */}
                            {item.domain && (
                              <div className="flex items-center justify-between mt-auto pt-3">
                                <div>
                                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full">
                                    {item.domain}
                                  </span>
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
                            {item.worklets && Array.isArray(item.worklets) && (
                              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Assigned Worklets:</p>
                                  {item.worklets.slice(0, 2).map((worklet) => (
                                    <div key={worklet.id || worklet.workletId || worklet.cert_id || worklet.title} className="text-xs text-gray-600 dark:text-gray-400">
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
                              {activeFilter !== 'students' ? (
                                <ExternalLink 
                                  size={16} 
                                  className={`${isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-600'} transition-colors`}
                                  title="View worklet details"
                                />
                              ) : (
                                <ExternalLink 
                                  size={16} 
                                  className={`${isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-600'} transition-colors`} 
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default NavColl;