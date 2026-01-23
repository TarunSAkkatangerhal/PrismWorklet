import React, { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import secureAPI from '../services/secureAPI'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import {
  Download,
  Activity,
  RotateCcw,
  Target,
  CheckCircle,
  GraduationCap,
  Users,
  Maximize,
  X,
} from 'lucide-react'
import LeftSidebar from '../components/Left'
import { motion,} from 'framer-motion'
import { ThemeContext } from '../context/ThemeContext'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  Title,
  Text,
  Metric,
} from '@tremor/react'

// Modern color palettes and chart configurations
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316']
const DARK_COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#22D3EE', '#A3E635', '#FB923C']


// Helper function to get appropriate colors based on theme
const getColors = (isDark) => (isDark ? DARK_COLORS : COLORS)

// Custom tooltip components
const CustomTooltip = ({ active, payload, label, isDark }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className={`p-4 rounded-lg shadow-lg border ${
          isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200'
        }`}>
        <p className="font-semibold mb-2">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {`${entry.name || entry.dataKey}: ${entry.value}`}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Modern animated metric card component
// The component now accepts 'subtitle' instead of 'change' and 'trend'
// The component no longer needs the 'isDark' prop for styling
const AnimatedMetricCard = ({ title, value, subtitle, icon: Icon, color, onClick, isClickable = false }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
    onClick={isClickable ? onClick : undefined}
    className={`p-4 rounded-xl shadow-lg border bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 ${
      isClickable ? 'cursor-pointer hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200' : ''
    }`}>
    <div className="flex flex-col h-full">
      {/* Icon and Title on same line */}
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-5 h-5 flex-shrink-0 ${isClickable ? 'group-hover:scale-110 transition-transform' : ''}`} style={{ color }} />
        <Text className="text-gray-600 dark:text-gray-400 text-xs font-semibold">{title}</Text>
      </div>
      {/* Count */}
      <Metric className="text-gray-900 dark:text-white text-2xl mb-1">{value}</Metric>
      {/* Description */}
      {subtitle && <Text className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</Text>}
    </div>
  </motion.div>
)
// Modern chart container component
const ChartContainer = ({ title, children, isDark, exportAction, previewAction }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    className={`p-6 rounded-xl shadow-lg border ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
    <div className="flex justify-between items-center mb-6">
      <Title className={isDark ? 'text-white' : 'text-gray-900'}>{title}</Title>
      <div className="flex gap-2">
        {previewAction && (
          <button
            onClick={previewAction}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}>
            <Maximize size={16} />
            <span className="text-sm">Preview</span>
          </button>
        )}
        {exportAction && (
          <button
            onClick={exportAction}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}>
            <Download size={16} />
            <span className="text-sm">Export</span>
          </button>
        )}
      </div>
    </div>
    {children}
  </motion.div>
)

const generatePerformanceData = () => [
  {
    subject: 'Completion Rate',
    userScore: Math.floor(Math.random() * 15) + 85, // Generates a score between 85-100
    mentorAvg: 90,
  },
  {
    subject: 'Timeliness',
    userScore: Math.floor(Math.random() * 20) + 80, // Generates a score between 80-100
    mentorAvg: 92,
  },
  {
    subject: 'Completion Quality',
    userScore: Math.floor(Math.random() * 25) + 75, // Generates a score between 75-100
    mentorAvg: 88,
  },
  {
    subject: 'Performance',
    userScore: Math.floor(Math.random() * 20) + 78, // Generates a score between 78-98
    mentorAvg: 85,
  },
]

const generateStatusData = (isDarkMode = false) => {
  const colors = getColors(isDarkMode)
  return [
    { name: 'Completed', value: 45, color: colors[1] },
    { name: 'In Progress', value: 30, color: colors[2] },
    { name: 'Pending', value: 15, color: colors[3] },
    { name: 'On Hold', value: 10, color: colors[7] },
  ]
}

// Add this new data generation function
const generatePerformanceBreakdown = () => ({
  mentor: {
    Excellent: 8,
    'Very Good': 12,
    Good: 5,
    'Needs Improvement': 1,
  },
  overall: {
    Excellent: 120,
    'Very Good': 180,
    Good: 95,
    'Needs Improvement': 40,
  },
})

// Generate performance distribution data for pie chart from real API performance data
const generatePerformanceDistribution = (totalsData, isDark) => {
  const colors = getColors(isDark)
  
  // Use actual performance_distribution from backend API
  const perfDist = totalsData?.performance_distribution || {}
  
  return [
    { name: 'Excellent', value: perfDist.excellent || 0, color: colors[1] },
    { name: 'Very Good', value: perfDist.very_good || 0, color: colors[0] },
    { name: 'Good', value: perfDist.good || 0, color: colors[5] },
    { name: 'Average', value: perfDist.average || 0, color: colors[2] },
    { name: 'Needs Improvement', value: perfDist.needs_improvement || 0, color: colors[3] },
    { name: 'Not Rated', value: perfDist.not_rated || 0, color: '#9CA3AF' },
  ]
}
// Modern Statistics Dashboard component
const ModernStatisticsDashboard = () => {
  useDocumentTitle('Performance Analytics Dashboard');
  const navigate = useNavigate()
  
  // ## KEY CHANGE ##
  // Use the ThemeContext to get the current theme state dynamically.
  // This replaces the hardcoded `const isDarkMode = true;`
  const { isDarkMode } = useContext(ThemeContext)

  // Preview modal state
  const [previewChart, setPreviewChart] = useState(null)

  // Custom scrollbar styles
  React.useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        height: 8px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: ${isDarkMode ? '#374151' : '#f1f5f9'};
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: ${isDarkMode ? '#6b7280' : '#cbd5e1'};
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: ${isDarkMode ? '#9ca3af' : '#94a3b8'};
      }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [isDarkMode])
  
  // Navigation handlers for worklet cards
  const handleTotalWorkletsClick = () => {
    navigate('/dashboard_details', { state: { filter: 'total', year: filters.year, domain: filters.domain, team: filters.team } })
  }
  
  const handleOngoingWorkletsClick = () => {
    navigate('/dashboard_details', { state: { filter: 'ongoing', year: filters.year, domain: filters.domain, team: filters.team } })
  }
  
  const handleCompletedWorkletsClick = () => {
    navigate('/dashboard_details', { state: { filter: 'completed', year: filters.year, domain: filters.domain, team: filters.team } })
  }
  
  const [statisticsData, setStatisticsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ year: 'All', domain: 'All', team: 'All' })
  const [options, setOptions] = useState({ years: [], domains: [], teams: [] })
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Load platform totals and trends from backend (driven by global year dropdown)
  useEffect(() => {
    const loadAll = async () => {
      try {
        setLoading(true)

        const params = new URLSearchParams()
        if (filters?.year && filters.year !== 'All') params.set('year', filters.year)
        if (filters?.domain && filters.domain !== 'All') params.set('domain', filters.domain)
        if (filters?.team && filters.team !== 'All') params.set('team', filters.team)

        // If "All Years" is selected, fetch data for all available years
        let monthlyData = []
        let statusMonthlyData = []
        let allYearsList = []
        
        if (filters?.year === 'All') {
          // First, get the list of available years
          const initialRes = await secureAPI.get('/api/dashboard/platform-monthly-trends')
          allYearsList = initialRes?.data?.years || []
          
          // Fetch data for each year and combine
          const yearlyPromises = allYearsList.map(year => {
            const yearParams = new URLSearchParams()
            yearParams.set('year', year)
            if (filters?.domain && filters.domain !== 'All') yearParams.set('domain', filters.domain)
            if (filters?.team && filters.team !== 'All') yearParams.set('team', filters.team)
            
            return Promise.all([
              secureAPI.get(`/api/dashboard/platform-monthly-trends?${yearParams.toString()}`),
              secureAPI.get(`/api/dashboard/platform-status-trends?${yearParams.toString()}`)
            ])
          })
          
          const yearlyResults = await Promise.all(yearlyPromises)
          
          // Aggregate data by year without inflating counts
          // Use max across months for active/ongoing type series (approximate unique concurrent counts)
          // and sum for event-like series (completed)
          const yearlyAggregated = {}
          const yearlyStatusAggregated = {}
          
          yearlyResults.forEach(([monthlyRes, statusRes], index) => {
            const year = allYearsList[index]
            const monthlyDataForYear = monthlyRes?.data?.monthly || []
            const statusDataForYear = statusRes?.data?.monthly || []
            
            // Aggregate monthly data for this year (max for concurrent counts, sum for completed)
            yearlyAggregated[year] = {
              month: String(year),
              worklets: monthlyDataForYear.reduce((mx, m) => Math.max(mx, (m.worklets || 0)), 0),
              completed: monthlyDataForYear.reduce((sum, m) => sum + (m.completed || 0), 0),
              students: monthlyDataForYear.reduce((mx, m) => Math.max(mx, (m.students || 0)), 0),
              month_key: String(year)
            }
            
            // Aggregate status data for this year (max for ongoing/on_hold, sum for completed/terminated)
            yearlyStatusAggregated[year] = {
              month: String(year),
              completed: statusDataForYear.reduce((sum, m) => sum + (m.completed || 0), 0),
              ongoing: statusDataForYear.reduce((mx, m) => Math.max(mx, (m.ongoing || 0)), 0),
              on_hold: statusDataForYear.reduce((mx, m) => Math.max(mx, (m.on_hold || 0)), 0),
              dropped: statusDataForYear.reduce((mx, m) => Math.max(mx, (m.dropped || 0)), 0),
              terminated: statusDataForYear.reduce((sum, m) => sum + (m.terminated || 0), 0),
              month_key: String(year)
            }
          })
          
          // Convert to arrays sorted by year
          monthlyData = Object.keys(yearlyAggregated).sort().map(year => yearlyAggregated[year])
          statusMonthlyData = Object.keys(yearlyStatusAggregated).sort().map(year => yearlyStatusAggregated[year])
        }
        
        const [totalsRes, monthlyRes, statusRes] = await Promise.all([
          secureAPI.get(`/api/dashboard/statistics${params.toString() ? `?${params.toString()}` : ''}`),
          filters?.year === 'All' ? Promise.resolve({ data: { monthly: monthlyData, years: allYearsList } }) : secureAPI.get(
            `/api/dashboard/platform-monthly-trends${params.toString() ? `?${params.toString()}` : ''}`
          ),
          filters?.year === 'All' ? Promise.resolve({ data: { monthly: statusMonthlyData, years: allYearsList } }) : secureAPI.get(
            `/api/dashboard/platform-status-trends${params.toString() ? `?${params.toString()}` : ''}`
          ),
        ])

      // Fetch domains based on selected year (nested filtering)
      let domains = []
      let teams = []
      try {
        const domainsParams = new URLSearchParams()
        if (filters?.year && filters.year !== 'All') domainsParams.set('year', filters.year)
        
        const domainsRes = await secureAPI.get(`/api/dashboard/domains${domainsParams.toString() ? `?${domainsParams.toString()}` : ''}`)
        domains = domainsRes?.data?.domains || []
      } catch (domainError) {
        if (process.env.NODE_ENV === 'development') console.log('Domains endpoint not available, using default domains')
        domains = ['Computer Science', 'Engineering', 'Data Science', 'AI/ML', 'Cybersecurity']
      }

      // Fetch teams based on selected year and domain (nested filtering)
      try {
        const teamsParams = new URLSearchParams()
        if (filters?.year && filters.year !== 'All') teamsParams.set('year', filters.year)
        if (filters?.domain && filters.domain !== 'All') teamsParams.set('domain', filters.domain)
        
        const teamsRes = await secureAPI.get(`/api/dashboard/teams${teamsParams.toString() ? `?${teamsParams.toString()}` : ''}`)
        teams = teamsRes?.data?.teams || []
      } catch (teamError) {
        if (process.env.NODE_ENV === 'development') console.log('Teams endpoint not available, using default teams')
        teams = ['Vision', 'Innovation', 'Research', 'Development', 'Analytics', 'Design']
      }        const totals = totalsRes?.data || {}
        const monthly = monthlyRes?.data?.monthly || []
        const statusMonthly = statusRes?.data?.monthly || []
        const yearsList = Array.from(
          new Set([...(monthlyRes?.data?.years || []), ...(statusRes?.data?.years || [])])
        ).sort()
        // Only show backend-provided years; do not add hardcoded ones
        setOptions((prev) => ({ ...prev, years: yearsList, domains: domains, teams: teams }))

        setStatisticsData((prev) => ({
          ...(prev || {}),
          totals,
          monthly_data: monthly,
          worklet_status_data: statusMonthly,
          publications: totals?.publications || { papers: 0, patents: 0 },
          performance_radar: prev?.performance_radar || generatePerformanceData(),
          status_distribution: prev?.status_distribution || generateStatusData(isDarkMode),
          performance_breakdown: prev?.performance_breakdown || generatePerformanceBreakdown(),
          performance_distribution: generatePerformanceDistribution(totals, isDarkMode),
        }))
      } catch (err) {
        console.error('Error loading dashboard data:', err)
        // Minimal safe fallback without introducing fake years
        setStatisticsData((prev) => ({
          ...(prev || {}),
          totals: prev?.totals || {
            total_mentors: 0,
            total_students: 0,
            total_worklets: 0,
            ongoing_worklets: 0,
            completed_worklets: 0,
            completion_rate: 0,
          },
          monthly_data: prev?.monthly_data || [],
          worklet_status_data: prev?.worklet_status_data || [],
          publications: prev?.publications || { papers: 0, patents: 0 },
          performance_radar: prev?.performance_radar || generatePerformanceData(),
          status_distribution: prev?.status_distribution || generateStatusData(isDarkMode),
          performance_breakdown: prev?.performance_breakdown || generatePerformanceBreakdown(),
          performance_distribution: generatePerformanceDistribution(prev?.totals || {}, isDarkMode),
        }))
      } finally {
        setLoading(false)
      }
    }

    loadAll()
    // periodic refresh
    const interval = setInterval(loadAll, 300000)
    return () => clearInterval(interval)
  }, [filters.year, filters.domain, filters.team, isDarkMode])

  // Update domains and teams list when year or domain changes (nested filtering behavior)
  useEffect(() => {
    const fetchFilteredOptions = async () => {
      // Fetch domains based on selected year
      try {
        const domainsParams = new URLSearchParams()
        if (filters?.year && filters.year !== 'All') domainsParams.set('year', filters.year)
        
        const domainsRes = await secureAPI.get(`/api/dashboard/domains${domainsParams.toString() ? `?${domainsParams.toString()}` : ''}`)
        const domains = domainsRes?.data?.domains || []
        
        setOptions((prev) => ({ ...prev, domains: domains }))
        
        // Reset domain filter to 'All' if current selection is not in the new list
        if (filters.domain !== 'All' && !domains.includes(filters.domain)) {
          setFilters((prev) => ({ ...prev, domain: 'All' }))
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') console.log('Failed to fetch domains, using default domains')
        const defaultDomains = ['Computer Science', 'Engineering', 'Data Science', 'AI/ML', 'Cybersecurity']
        setOptions((prev) => ({ ...prev, domains: defaultDomains }))
      }

      // Fetch teams based on selected year and domain
      try {
        const teamsParams = new URLSearchParams()
        if (filters?.year && filters.year !== 'All') teamsParams.set('year', filters.year)
        if (filters?.domain && filters.domain !== 'All') teamsParams.set('domain', filters.domain)
        
        const teamsRes = await secureAPI.get(`/api/dashboard/teams${teamsParams.toString() ? `?${teamsParams.toString()}` : ''}`)
        const teams = teamsRes?.data?.teams || []
        
        setOptions((prev) => ({ ...prev, teams: teams }))
        
        // Reset team filter to 'All' if current selection is not in the new list
        if (filters.team !== 'All' && !teams.includes(filters.team)) {
          setFilters((prev) => ({ ...prev, team: 'All' }))
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') console.log('Failed to fetch teams, using default teams')
        const defaultTeams = ['Vision', 'Innovation', 'Research', 'Development', 'Analytics', 'Design']
        setOptions((prev) => ({ ...prev, teams: defaultTeams }))
      }
    }

    fetchFilteredOptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.year, filters.domain])  // Removed filters.team from dependencies to prevent circular updates

  // Reset all filters to default values
  const handleResetFilters = () => {
    setFilters({ group: 'All', part: 'All', year: 'All', domain: 'All', team: 'All' })
  }

  // Manual refresh function
  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    try {
      const params = new URLSearchParams()
      if (filters?.year && filters.year !== 'All') params.set('year', filters.year)
      if (filters?.domain && filters.domain !== 'All') params.set('domain', filters.domain)
      if (filters?.team && filters.team !== 'All') params.set('team', filters.team)

      // If "All Years" is selected, fetch data for all available years
      let monthlyData = []
      let statusMonthlyData = []
      let allYearsList = []
      
      if (filters?.year === 'All') {
        // First, get the list of available years
        const initialRes = await secureAPI.get('/api/dashboard/platform-monthly-trends')
        allYearsList = initialRes?.data?.years || []
        
        // Fetch data for each year and combine
        const yearlyPromises = allYearsList.map(year => {
          const yearParams = new URLSearchParams()
          yearParams.set('year', year)
          if (filters?.domain && filters.domain !== 'All') yearParams.set('domain', filters.domain)
          if (filters?.team && filters.team !== 'All') yearParams.set('team', filters.team)
          
          return Promise.all([
            secureAPI.get(`/api/dashboard/platform-monthly-trends?${yearParams.toString()}`),
            secureAPI.get(`/api/dashboard/platform-status-trends?${yearParams.toString()}`)
          ])
        })
        
        const yearlyResults = await Promise.all(yearlyPromises)
        
  // Aggregate data by year without inflating counts
  // Use max across months for active/ongoing type series (approximate unique concurrent counts)
  // and sum for event-like series (completed)
        const yearlyAggregated = {}
        const yearlyStatusAggregated = {}
        
        yearlyResults.forEach(([monthlyRes, statusRes], index) => {
          const year = allYearsList[index]
          const monthlyDataForYear = monthlyRes?.data?.monthly || []
          const statusDataForYear = statusRes?.data?.monthly || []
          
          // Aggregate monthly data for this year (max for concurrent counts, sum for completed)
          yearlyAggregated[year] = {
            month: String(year),
            worklets: monthlyDataForYear.reduce((mx, m) => Math.max(mx, (m.worklets || 0)), 0),
            completed: monthlyDataForYear.reduce((sum, m) => sum + (m.completed || 0), 0),
            students: monthlyDataForYear.reduce((mx, m) => Math.max(mx, (m.students || 0)), 0),
            month_key: String(year)
          }
          
          // Aggregate status data for this year (max for ongoing/on_hold, sum for completed/terminated)
          yearlyStatusAggregated[year] = {
            month: String(year),
            completed: statusDataForYear.reduce((sum, m) => sum + (m.completed || 0), 0),
            ongoing: statusDataForYear.reduce((mx, m) => Math.max(mx, (m.ongoing || 0)), 0),
            on_hold: statusDataForYear.reduce((mx, m) => Math.max(mx, (m.on_hold || 0)), 0),
            dropped: statusDataForYear.reduce((mx, m) => Math.max(mx, (m.dropped || 0)), 0),
            terminated: statusDataForYear.reduce((sum, m) => sum + (m.terminated || 0), 0),
            month_key: String(year)
          }
        })
        
        // Convert to arrays sorted by year
        monthlyData = Object.keys(yearlyAggregated).sort().map(year => yearlyAggregated[year])
        statusMonthlyData = Object.keys(yearlyStatusAggregated).sort().map(year => yearlyStatusAggregated[year])
      }

      const [totalsRes, monthlyRes, statusRes] = await Promise.all([
        secureAPI.get(`/api/dashboard/statistics${params.toString() ? `?${params.toString()}` : ''}`),
        filters?.year === 'All' ? Promise.resolve({ data: { monthly: monthlyData, years: allYearsList } }) : secureAPI.get(
          `/api/dashboard/platform-monthly-trends${params.toString() ? `?${params.toString()}` : ''}`
        ),
        filters?.year === 'All' ? Promise.resolve({ data: { monthly: statusMonthlyData, years: allYearsList } }) : secureAPI.get(
          `/api/dashboard/platform-status-trends${params.toString() ? `?${params.toString()}` : ''}`
        ),
      ])

      // Try to fetch domains separately, but don't fail if endpoint doesn't exist
      let domains = []
      let teams = []
      try {
        const domainsRes = await secureAPI.get('/api/dashboard/domains')
        domains = domainsRes?.data?.domains || []
      } catch (domainError) {
        if (process.env.NODE_ENV === 'development') console.log('Domains endpoint not available, using default domains')
        domains = ['Computer Science', 'Engineering', 'Data Science', 'AI/ML', 'Cybersecurity']
      }

      // Fetch domains based on selected year (nested filtering)
      try {
        const domainsParams = new URLSearchParams()
        if (filters?.year && filters.year !== 'All') domainsParams.set('year', filters.year)
        
        const domainsRes = await secureAPI.get(`/api/dashboard/domains${domainsParams.toString() ? `?${domainsParams.toString()}` : ''}`)
        domains = domainsRes?.data?.domains || []
      } catch (domainError) {
        if (process.env.NODE_ENV === 'development') console.log('Domains endpoint not available, using default domains')
        domains = ['Computer Science', 'Engineering', 'Data Science', 'AI/ML', 'Cybersecurity']
      }

      // Fetch teams based on selected year and domain (nested filtering)
      try {
        const teamsParams = new URLSearchParams()
        if (filters?.year && filters.year !== 'All') teamsParams.set('year', filters.year)
        if (filters?.domain && filters.domain !== 'All') teamsParams.set('domain', filters.domain)
        
        const teamsRes = await secureAPI.get(`/api/dashboard/teams${teamsParams.toString() ? `?${teamsParams.toString()}` : ''}`)
        teams = teamsRes?.data?.teams || []
      } catch (teamError) {
        if (process.env.NODE_ENV === 'development') console.log('Teams endpoint not available, using default teams')
        teams = ['Vision', 'Innovation', 'Research', 'Development', 'Analytics', 'Design']
      }

      const totals = totalsRes?.data || {}
      const monthly = monthlyRes?.data?.monthly || []
      const statusMonthly = statusRes?.data?.monthly || []
      const yearsList = Array.from(
        new Set([...(monthlyRes?.data?.years || []), ...(statusRes?.data?.years || [])])
      ).sort()
      
      setOptions((prev) => ({ ...prev, years: yearsList, domains: domains, teams: teams }))

      setStatisticsData((prev) => ({
        ...(prev || {}),
        totals,
        monthly_data: monthly,
        worklet_status_data: statusMonthly,
        publications: totals?.publications || { papers: 0, patents: 0 },
        performance_radar: prev?.performance_radar || generatePerformanceData(),
        status_distribution: prev?.status_distribution || generateStatusData(isDarkMode),
        performance_breakdown: prev?.performance_breakdown || generatePerformanceBreakdown(),
        performance_distribution: generatePerformanceDistribution(totals, isDarkMode),
      }))
    } catch (err) {
      console.error('Error refreshing data:', err)
    } finally {
      // Add a small delay to show the refresh animation
      setTimeout(() => {
        setIsRefreshing(false)
      }, 1000)
    }
  }

  // Modern export function
  const exportData = (type) => {
    const data = statisticsData
    if (!data) return

    let csvContent = ''
    switch (type) {
      case 'overview':
        csvContent =
          'Metric,Value\n' +
          Object.entries(data.totals)
            .map(([k, v]) => `${k},${v}`)
            .join('\n')
        break
      case 'monthly': {
        const rows = (data.monthly_data || []).map((m) => [m.month, m.worklets, m.completed, m.students])
        csvContent = ['Month,Worklets,Completed,Students', ...rows.map((r) => r.join(','))].join('\n')
        break
      }
      case 'status_trends': {
        const rows = (data.worklet_status_data || []).map((m) => [
          m.month,
          m.ongoing,
          m.completed,
          m.on_hold,
          m.terminated,
        ])
        csvContent = ['Month,Ongoing,Completed,On Hold,Terminated', ...rows.map((r) => r.join(','))].join('\n')
        break
      }
      case 'status':
        csvContent =
          'Status,Count\n' +
          Object.entries(data.status_counts)
            .map(([k, v]) => `${k},${v}`)
            .join('\n')
        break
      case 'performance':
        csvContent = 'Category,Score\n' + data.performance_radar.map((d) => `${d.subject},${d.userScore}`).join('\n')
        break
      case 'performance_distribution':
        csvContent = 'Performance Level,Count\n' + (data.performance_distribution || []).map((d) => `${d.name},${d.value}`).join('\n')
        break
      default:
        // Handle other cases or provide a default export
        return
    }

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}_statistics.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center 'dark bg-gray-900' : 'bg-gray-50'}`}>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <Text className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>Loading modern analytics...</Text>
        </motion.div>
      </div>
    )
  }

  return (
    <div
      className={`flex h-screen w-full overflow-hidden ${
        isDarkMode ? 'dark bg-slate-900 text-slate-200' : 'bg-slate-100 text-slate-800'
      }`}>
      <LeftSidebar />

      <main className="flex-1 px-[2vw] py-[1.5vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-200 [&::-webkit-scrollbar-thumb]:bg-slate-400 dark:[&::-webkit-scrollbar-track]:bg-slate-800 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600 ">
        <header className="flex justify-between items-center mb-[3vh]">
          <div>
            <h1 className="text-[clamp(1.75rem,3.5vw,2.25rem)] font-bold text-black dark:text-white">
              Performance Analytics
            </h1>
            <p className="text-[clamp(0.875rem,1.2vw,1rem)] text-slate-500 dark:text-slate-400">
              Real-time insights with modern data visualizations
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500">
              <option value="All">All Years</option>
              {(options.years || []).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              value={filters.domain}
              onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500">
              <option value="All">All Domains</option>
              {(options.domains || []).map((domain) => (
                <option key={domain} value={domain}>
                  {domain}
                </option>
              ))}
            </select>
            <select
              value={filters.team}
              onChange={(e) => setFilters({ ...filters, team: e.target.value })}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500">
              <option value="All">All Teams</option>
              {(options.teams || []).map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
            <button
              onClick={handleResetFilters}
              className="flex items-center justify-center px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title="Reset all filters">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleManualRefresh}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Activity className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        {/* Blur overlay during refresh */}
        {isRefreshing && (
          <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 flex flex-col items-center gap-4 shadow-xl">
              <div className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin">
                <Activity className="w-full h-full" />
              </div>
              <span className="text-gray-600 dark:text-gray-300 font-medium">
                Refreshing Statistics...
              </span>
            </div>
          </div>
        )}

        <section className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
            <AnimatedMetricCard
              title="Total Worklets"
              value={statisticsData?.totals?.total_worklets || 0}
              subtitle="Tracked across all projects"
              icon={Target}
              color={getColors(isDarkMode)[0]}
              isDark={isDarkMode}
              onClick={handleTotalWorkletsClick}
              isClickable={true}
            />
            <AnimatedMetricCard
              title="Completed"
              value={statisticsData?.totals?.completed_worklets || 0}
              subtitle="Successfully delivered"
              icon={CheckCircle}
              color={getColors(isDarkMode)[1]}
              isDark={isDarkMode}
              onClick={handleCompletedWorkletsClick}
              isClickable={true}
            />
            <AnimatedMetricCard
              title="Ongoing Worklets"
              value={statisticsData?.totals?.ongoing_worklets || 0}
              subtitle="Currently in progress"
              icon={Activity}
              color={getColors(isDarkMode)[4]}
              isDark={isDarkMode}
              onClick={handleOngoingWorkletsClick}
              isClickable={true}
            />
            <AnimatedMetricCard
              title="Total Students"
              value={statisticsData?.totals?.total_students || 0}
              subtitle="Actively learning"
              icon={GraduationCap}
              color={getColors(isDarkMode)[5]}
              isDark={isDarkMode}
            />
            <AnimatedMetricCard
              title="Total Mentors"
              value={statisticsData?.totals?.total_mentors || 0}
              subtitle="Across all domains"
              icon={Users}
              color={getColors(isDarkMode)[0]}
              isDark={isDarkMode}
            />
            <AnimatedMetricCard
              title="Professor Count"
              value={statisticsData?.totals?.total_professors || 0}
              subtitle="Guiding the program"
              icon={Users}
              color={getColors(isDarkMode)[5]}
              isDark={isDarkMode}
            />
          </div>

          {/* Advanced Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Interactive Line Chart with Scroll */}
            <ChartContainer
              title="Monthly Progress Trends"
              isDark={isDarkMode}
              exportAction={() => exportData('monthly')}
              previewAction={() => setPreviewChart('monthly')}>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                 📊 {statisticsData?.monthly_data?.length || 0} {filters.year === 'All' ? 'years' : 'months'} of data {filters.year === 'All' ? '(Year-wise aggregated)' : filters.year !== 'All' ? `(${filters.year})` : ''}
              </p>
              <div className="mt-8 overflow-x-auto pb-4 custom-scrollbar -ml-8">
                <div className={filters.year === 'All' ? 'min-w-full' : 'min-w-[1200px]'}>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={statisticsData?.monthly_data || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                      <XAxis dataKey="month" stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                      <YAxis
                        stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                        domain={(() => {
                          const data = statisticsData?.monthly_data || []
                          const max = Math.max(
                            ...data.map((d) => Math.max(d.worklets || 0, d.completed || 0)),
                            0
                          )
                          if (max <= 5) return [0, 5]
                          return [0, 'auto']
                        })()}
                        allowDecimals={false}
                        tickFormatter={(v) => (Number.isInteger(v) ? v : '')}
                        ticks={(() => {
                          const data = statisticsData?.monthly_data || []
                          const max = Math.max(
                            ...data.map((d) => Math.max(d.worklets || 0, d.completed || 0)),
                            0
                          )
                          if (max <= 5) return [0, 1, 2, 3, 4, 5]
                          // For larger data, generate integer ticks up to the next multiple of 5 above max
                          const step = Math.ceil((max + 1) / 5)
                          return Array.from({ length: step * 5 + 1 }, (_, i) => i).filter((x) => x % step === 0)
                        })()}
                      />
                      <Tooltip content={<CustomTooltip isDark={isDarkMode} />} />
                      <Legend wrapperStyle={{ color: isDarkMode ? '#E5E7EB' : '#374151' }} />
                      <Line
                        type="monotone"
                        dataKey="worklets"
                        stroke={getColors(isDarkMode)[0]}
                        strokeWidth={3}
                        dot={(props) => {
                          const now = new Date()
                          const mk = props?.payload?.month_key
                          const isCurrentMonth = mk
                            ? mk ===
                              `${now.getFullYear().toString().padStart(4, '0')}-${(now.getMonth() + 1)
                                .toString()
                                .padStart(2, '0')}`
                            : false
                          const colors = getColors(isDarkMode)
                          return (
                            <circle
                              key={`worklets-dot-${props.cx}-${props.cy}-${props.payload?.month_key}`}
                              cx={props.cx}
                              cy={props.cy}
                              r={isCurrentMonth ? 8 : 6}
                              fill={colors[0]}
                              stroke={isCurrentMonth ? '#FBBF24' : colors[0]}
                              strokeWidth={isCurrentMonth ? 3 : 2}
                            />
                          )
                        }}
                        name="Total Worklets"
                      />
                      <Line
                        type="monotone"
                        dataKey="completed"
                        stroke={getColors(isDarkMode)[1]}
                        strokeWidth={3}
                        dot={(props) => {
                          const now = new Date()
                          const mk = props?.payload?.month_key
                          const isCurrentMonth = mk
                            ? mk ===
                              `${now.getFullYear().toString().padStart(4, '0')}-${(now.getMonth() + 1)
                                .toString()
                                .padStart(2, '0')}`
                            : false
                          const colors = getColors(isDarkMode)
                          return (
                            <circle
                              key={`completed-dot-${props.cx}-${props.cy}-${props.payload?.month_key}`}
                              cx={props.cx}
                              cy={props.cy}
                              r={isCurrentMonth ? 8 : 6}
                              fill={colors[1]}
                              stroke={isCurrentMonth ? '#FBBF24' : colors[1]}
                              strokeWidth={isCurrentMonth ? 3 : 2}
                            />
                          )
                        }}
                        name="Completed"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flex justify-center items-center mt-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full ring-2 ring-yellow-300"></div>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">Current Month</span>
              </div>
            </ChartContainer>

            {/* Worklet Status Bar Chart */}
            <ChartContainer
              title="Worklet Status Trends"
              isDark={isDarkMode}
              exportAction={() => exportData('status_trends')}
              previewAction={() => setPreviewChart('status')}>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                 📊 Status breakdown across time periods
              </p>
              <div className="mt-10 overflow-x-auto pb-4 custom-scrollbar -ml-8">
                {/* Dynamic width based on filter selection */}
                <div className={filters.year === 'All' ? 'min-w-full' : 'min-w-[1200px]'}>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={statisticsData?.worklet_status_data || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                      <XAxis dataKey="month" stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                      <YAxis
                        stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                        allowDecimals={false}
                        tickFormatter={(v) => (Number.isInteger(v) ? v : '')}
                        domain={(() => {
                          const data = statisticsData?.worklet_status_data || []
                          const max = Math.max(
                            ...data.map(
                              (d) => (d.completed || 0) + (d.ongoing || 0) + (d.on_hold || 0) + (d.terminated || 0)
                            ),
                            0
                          )
                          if (max <= 5) return [0, 5]
                          return [0, 'auto']
                        })()}
                        ticks={(() => {
                          const data = statisticsData?.worklet_status_data || []
                          const max = Math.max(
                            ...data.map(
                              (d) => (d.completed || 0) + (d.ongoing || 0) + (d.on_hold || 0) + (d.terminated || 0)
                            ),
                            0
                          )
                          if (max <= 5) return [0, 1, 2, 3, 4, 5]
                          const step = Math.ceil((max + 1) / 5)
                          return Array.from({ length: step * 5 + 1 }, (_, i) => i).filter((x) => x % step === 0)
                        })()}
                      />
                      <Tooltip
                        content={<CustomTooltip isDark={isDarkMode} />}
                        cursor={{ fill: isDarkMode ? '#374151' : '#f3f4f6' }}
                      />
                      <Legend 
                        wrapperStyle={{ color: isDarkMode ? '#F3F4F6' : '#1F2937' }} 
                        align="right"
                        verticalAlign="bottom"
                      />

                      <Bar
                        dataKey="completed"
                        stackId="a"
                        name="Completed"
                        fill={getColors(isDarkMode)[1]}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar dataKey="ongoing" stackId="a" name="Ongoing" fill={getColors(isDarkMode)[0]} />
                      <Bar dataKey="on_hold" stackId="a" name="On Hold" fill={getColors(isDarkMode)[2]} />
                      <Bar
                        dataKey="terminated"
                        stackId="a"
                        name="Terminated"
                        fill={getColors(isDarkMode)[3]}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </ChartContainer>

            {/* Performance Distribution Pie Chart */}
            <ChartContainer
              title="Performance Distribution"
              isDark={isDarkMode}
              exportAction={() => exportData('performance_distribution')}
              previewAction={() => setPreviewChart('performance')}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  📊 Worklet performance breakdown based on current filters
                  {filters.year !== 'All' && ` (${filters.year})`}
                  {filters.domain !== 'All' && ` - ${filters.domain}`}
                  {filters.team !== 'All' && ` - ${filters.team}`}
                </p>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Total: {(statisticsData?.performance_distribution || []).reduce((sum, item) => sum + item.value, 0)} worklets
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statisticsData?.performance_distribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={70}
                    innerRadius={35}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={800}>
                    {(statisticsData?.performance_distribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0]
                        const total = (statisticsData?.performance_distribution || []).reduce((sum, item) => sum + item.value, 0)
                        const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0
                        return (
                          <div
                            className={`p-4 rounded-lg shadow-lg border ${
                              isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200'
                            }`}>
                            <p className="font-semibold mb-2">{data.name}</p>
                            <p style={{ color: data.payload.color }} className="text-sm">
                              Count: {data.value}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Percentage: {percentage}%
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{ color: isDarkMode ? '#E5E7EB' : '#374151' }}
                    formatter={(value, entry) => (
                      <span style={{ color: isDarkMode ? '#E5E7EB' : '#374151' }}>
                        {value} ({entry.payload.value})
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </section>
      </main>

      {/* Preview Modal */}
      {previewChart && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-8"
          onClick={() => setPreviewChart(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`relative w-full max-w-7xl h-[90vh] rounded-xl shadow-2xl p-8 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}
            onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewChart(null)}
              className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}>
              <X size={24} />
            </button>

            {previewChart === 'monthly' && (
              <div className="h-full flex flex-col">
                <Title className={`mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Monthly Progress Trends - Detailed View
                </Title>
                <div className="flex-1 overflow-x-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={statisticsData?.monthly_data || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                      <XAxis dataKey="month" stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                      <YAxis
                        stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                        allowDecimals={false}
                        tickFormatter={(v) => (Number.isInteger(v) ? v : '')}
                      />
                      <Tooltip content={<CustomTooltip isDark={isDarkMode} />} />
                      <Legend wrapperStyle={{ color: isDarkMode ? '#E5E7EB' : '#374151' }} />
                      <Line
                        type="monotone"
                        dataKey="worklets"
                        stroke={getColors(isDarkMode)[0]}
                        strokeWidth={4}
                        dot={{ r: 6 }}
                        name="Total Worklets"
                      />
                      <Line
                        type="monotone"
                        dataKey="completed"
                        stroke={getColors(isDarkMode)[1]}
                        strokeWidth={4}
                        dot={{ r: 6 }}
                        name="Completed"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {previewChart === 'status' && (
              <div className="h-full flex flex-col">
                <Title className={`mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Worklet Status Trends - Detailed View
                </Title>
                <div className="flex-1 overflow-x-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statisticsData?.worklet_status_data || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                      <XAxis dataKey="month" stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                      <YAxis
                        stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                        allowDecimals={false}
                        tickFormatter={(v) => (Number.isInteger(v) ? v : '')}
                      />
                      <Tooltip
                        content={<CustomTooltip isDark={isDarkMode} />}
                        cursor={{ fill: isDarkMode ? '#374151' : '#f3f4f6' }}
                      />
                      <Legend wrapperStyle={{ color: isDarkMode ? '#F3F4F6' : '#1F2937' }} />
                      <Bar dataKey="completed" stackId="a" name="Completed" fill={getColors(isDarkMode)[1]} />
                      <Bar dataKey="ongoing" stackId="a" name="Ongoing" fill={getColors(isDarkMode)[0]} />
                      <Bar dataKey="on_hold" stackId="a" name="On Hold" fill={getColors(isDarkMode)[2]} />
                      <Bar dataKey="terminated" stackId="a" name="Terminated" fill={getColors(isDarkMode)[3]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {previewChart === 'performance' && (
              <div className="h-full flex flex-col">
                <Title className={`mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Performance Distribution - Detailed View
                </Title>
                <div className="flex-1 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statisticsData?.performance_distribution || []}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        outerRadius={200}
                        innerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={800}>
                        {(statisticsData?.performance_distribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0]
                            const total = (statisticsData?.performance_distribution || []).reduce((sum, item) => sum + item.value, 0)
                            const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0
                            return (
                              <div
                                className={`p-4 rounded-lg shadow-lg border ${
                                  isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200'
                                }`}>
                                <p className="font-semibold mb-2">{data.name}</p>
                                <p style={{ color: data.payload.color }} className="text-sm">
                                  Count: {data.value}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Percentage: {percentage}%
                                </p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        wrapperStyle={{ color: isDarkMode ? '#E5E7EB' : '#374151' }}
                        formatter={(value, entry) => (
                          <span style={{ color: isDarkMode ? '#E5E7EB' : '#374151', fontSize: '14px' }}>
                            {value} ({entry.payload.value})
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default ModernStatisticsDashboard
//test1