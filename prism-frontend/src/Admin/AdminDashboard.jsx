import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { AdminLeftSidebar } from './AdminSidebar';
import { ThemeContext } from '../context/ThemeContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Users, Briefcase, Building2, GraduationCap, Shield,
  Activity, CheckCircle, Target, Clock, TrendingUp,
  Download, Maximize, X, RotateCcw, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
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
} from 'recharts';
import { Title, Text, Metric } from '@tremor/react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Modern color palettes
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
const DARK_COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#22D3EE', '#A3E635', '#FB923C'];

const getColors = (isDark) => (isDark ? DARK_COLORS : COLORS);

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, isDark }) => {
  if (active && payload && payload.length) {
    return (
      <div className={`p-4 rounded-lg shadow-lg border ${
        isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200'
      }`}>
        <p className="font-semibold mb-2">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {`${entry.name || entry.dataKey}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Animated metric card component
const AnimatedMetricCard = ({ title, value, subtitle, icon: Icon, color, onClick, isClickable = false, hoverContent }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
    onClick={isClickable ? onClick : undefined}
    className={`relative group p-4 rounded-xl shadow-lg border bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 ${
      isClickable ? 'cursor-pointer hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200' : ''
    }`}
  >
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-5 h-5 flex-shrink-0 ${isClickable ? 'group-hover:scale-110 transition-transform' : ''}`} style={{ color }} />
        <Text className="text-gray-600 dark:text-gray-400 text-xs font-semibold">{title}</Text>
      </div>
      <Metric className="text-gray-900 dark:text-white text-2xl mb-1">{value}</Metric>
      {subtitle && <Text className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</Text>}
    </div>
    {hoverContent && (
      <div className="absolute left-0 right-0 top-full mt-1 z-30 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity duration-200">
        <div className="p-3 rounded-lg shadow-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
          {hoverContent}
        </div>
      </div>
    )}
  </motion.div>
);

// Chart container component
const ChartContainer = ({ title, children, isDark, exportAction, previewAction }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    className={`p-6 rounded-xl shadow-lg border ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}
  >
    <div className="flex justify-between items-center mb-6">
      <Title className={isDark ? 'text-white' : 'text-gray-900'}>{title}</Title>
      <div className="flex gap-2">
        {previewAction && (
          <button
            onClick={previewAction}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Maximize size={16} />
            <span className="text-sm">Preview</span>
          </button>
        )}
        {exportAction && (
          <button
            onClick={exportAction}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Download size={16} />
            <span className="text-sm">Export</span>
          </button>
        )}
      </div>
    </div>
    {children}
  </motion.div>
);

const AdminDashboard = () => {
  useDocumentTitle('PRISM Admin - Dashboard');
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);

  // State
  const [stats, setStats] = useState({ total: 0, students: 0, mentors: 0, professors: 0, admins: 0 });
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [previewChart, setPreviewChart] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({ year: new Date().getFullYear() });
  const [options, setOptions] = useState({ years: [], colleges: [] });
  
  // Chart data
  const [monthlyData, setMonthlyData] = useState([]);
  const [workletStatusData, setWorkletStatusData] = useState([]);
  const [workletStats, setWorkletStats] = useState({ total: 0, ongoing: 0, completed: 0, pending: 0 });
  const [collegeStats, setCollegeStats] = useState([]);

  // Custom scrollbar styles
  useEffect(() => {
    const style = document.createElement('style');
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
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, [isDarkMode]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const tk = localStorage.getItem('access_token');
    const h = { Authorization: `Bearer ${tk}` };
    
    try {
      // Build params for dashboard endpoints
      const params = new URLSearchParams();
      if (filters.year && filters.year !== 'All') params.set('year', filters.year);
      
      // Fetch all data in parallel
      const [statsRes, collegesRes, workletStatsRes, monthlyTrendsRes, statusTrendsRes, collegeStatsRes] = await Promise.all([
        axios.get(`${API}/api/admin/users/stats`, { headers: h }),
        axios.get(`${API}/api/admin/colleges`, { headers: h }),
        axios.get(`${API}/api/dashboard/statistics${params.toString() ? `?${params.toString()}` : ''}`, { headers: h }),
        axios.get(`${API}/api/dashboard/platform-monthly-trends${params.toString() ? `?${params.toString()}` : ''}`, { headers: h }),
        axios.get(`${API}/api/dashboard/platform-status-trends${params.toString() ? `?${params.toString()}` : ''}`, { headers: h }),
        axios.get(`${API}/api/admin/college-stats`, { headers: h }),
      ]);
      
      // Set user stats based on whether filters are applied
      const dashboardStats = workletStatsRes.data || {};
      
      // When year filter is applied, use counts from dashboard statistics (users in worklets for that year)
      // When "All" years, use counts from admin/users/stats (total registered users)
      if (filters.year && filters.year !== 'All') {
        // Use dashboard statistics which reflects users in worklets for the filtered year
        setStats({
          total: (dashboardStats.total_mentors || 0) + (dashboardStats.total_students || 0) + (dashboardStats.total_professors || 0) + (statsRes.data.admins || 0),
          students: dashboardStats.total_students || 0,
          mentors: dashboardStats.total_mentors || 0,
          professors: dashboardStats.total_professors || 0,
          admins: statsRes.data.admins || 0
        });
      } else {
        // Use admin/users/stats which shows all registered users
        setStats(statsRes.data);
      }
      
      // Set colleges and extract available years
      const collegesList = Array.isArray(collegesRes.data) ? collegesRes.data : [];
      setColleges(collegesList);
      
      // Extract years from monthly trends response
      const availableYears = monthlyTrendsRes.data?.years || [];
      const yearsToUse = availableYears.length > 0 ? availableYears : [new Date().getFullYear()];
      
      setOptions(prev => ({ 
        ...prev, 
        colleges: collegesList.map(c => c.name || c.college_name || c),
        years: yearsToUse
      }));
      
      // Set worklet statistics from dashboard API
      setWorkletStats({
        total: dashboardStats.total_worklets || 0,
        ongoing: dashboardStats.ongoing_worklets || 0,
        completed: dashboardStats.completed_worklets || 0,
        pending: 0 // Can be calculated if needed
      });
      
      // Process monthly trends data
      const monthlyData = monthlyTrendsRes.data?.monthly || [];
      // Transform backend data format to match chart format
      const transformedMonthly = monthlyData.map(item => ({
        month: item.month,
        users: item.students || 0, // Using students as new users metric
        worklets: item.worklets || 0,
        completed: item.completed || 0,
        month_key: item.month_key || item.month
      }));
      setMonthlyData(transformedMonthly);
      
      // Process status trends data
      const statusData = statusTrendsRes.data?.monthly || [];
      // Transform backend data format to match chart format
      const transformedStatus = statusData.map(item => ({
        month: item.month,
        completed: item.completed || 0,
        ongoing: item.ongoing || 0,
        on_hold: item.on_hold || 0,
        terminated: item.terminated || 0,
      }));
      setWorkletStatusData(transformedStatus);
      
      // Set college stats for institution comparison
      setCollegeStats(Array.isArray(collegeStatsRes.data) ? collegeStatsRes.data : []);
      
      // Set last updated timestamp
      setLastUpdated(new Date());
      
    } catch (e) {
      console.error('Dashboard fetch failed', e);
      // Set fallback empty data
      setWorkletStats({ total: 0, ongoing: 0, completed: 0, pending: 0 });
      setMonthlyData([]);
      setWorkletStatusData([]);
      setCollegeStats([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleResetFilters = () => {
    setFilters({ year: new Date().getFullYear() });
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const exportData = (type) => {
    let csvContent = '';
    let data = [];
    
    if (type === 'monthly') {
      data = monthlyData;
      csvContent = 'Month,Users,Worklets,Completed\n';
      data.forEach(row => {
        csvContent += `${row.month},${row.users},${row.worklets},${row.completed}\n`;
      });
    } else if (type === 'funnel') {
      csvContent = 'Stage,Count\n';
      csvContent += `Users,${stats.total || 0}\n`;
      csvContent += `Assigned,${workletStats.total || 0}\n`;
      csvContent += `Ongoing,${workletStats.ongoing || 0}\n`;
      csvContent += `Completed,${workletStats.completed || 0}\n`;
    } else if (type === 'institutions') {
      data = collegeStats;
      csvContent = 'Institution,Worklets,Users,Completed\n';
      data.forEach(row => {
        csvContent += `${row.name},${row.worklets},${row.users},${row.completed}\n`;
      });
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin_${type}_data.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportToExcel = () => {
    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();
      
      // Sheet 1: User Statistics
      const userStatsData = [
        ['User Statistics', ''],
        ['Generated On', new Date().toLocaleString()],
        ['Filter Year', filters.year === 'All' ? 'All Years' : filters.year],
        [''],
        ['Category', 'Count'],
        ['Total Users', stats.total || 0],
        ['Students', stats.students || 0],
        ['Mentors', stats.mentors || 0],
        ['Professors', stats.professors || 0],
        ['Admins', stats.admins || 0],
      ];
      const ws1 = XLSX.utils.aoa_to_sheet(userStatsData);
      XLSX.utils.book_append_sheet(wb, ws1, 'User Statistics');
      
      // Sheet 2: Worklet Statistics
      const workletStatsData = [
        ['Worklet Statistics', ''],
        ['Generated On', new Date().toLocaleString()],
        ['Filter Year', filters.year === 'All' ? 'All Years' : filters.year],
        [''],
        ['Category', 'Count'],
        ['Total Worklets', workletStats.total || 0],
        ['Ongoing', workletStats.ongoing || 0],
        ['Completed', workletStats.completed || 0],
        ['Pending', workletStats.pending || 0],
      ];
      const ws2 = XLSX.utils.aoa_to_sheet(workletStatsData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Worklet Statistics');
      
      // Sheet 3: Monthly Trends
      if (monthlyData.length > 0) {
        const monthlyHeader = [['Monthly Progress Trends'], [''], ['Month', 'New Users', 'Worklets', 'Completed']];
        const monthlyRows = monthlyData.map(row => [
          row.month,
          row.users || 0,
          row.worklets || 0,
          row.completed || 0
        ]);
        const ws3 = XLSX.utils.aoa_to_sheet([...monthlyHeader, ...monthlyRows]);
        XLSX.utils.book_append_sheet(wb, ws3, 'Monthly Trends');
      }
      
      // Sheet 4: Institution Comparison
      if (collegeStats.length > 0) {
        const instHeader = [['Institution Comparison'], [''], ['Institution', 'Worklets', 'Users', 'Completed']];
        const instRows = collegeStats.map(row => [
          row.name,
          row.worklets || 0,
          row.users || 0,
          row.completed || 0
        ]);
        const ws4 = XLSX.utils.aoa_to_sheet([...instHeader, ...instRows]);
        XLSX.utils.book_append_sheet(wb, ws4, 'Institution Comparison');
      }
      
      // Sheet 5: Colleges
      if (colleges.length > 0) {
        const collegesHeader = [['Partner Institutions'], [''], ['#', 'College Name']];
        const collegesRows = colleges.map((college, index) => [
          index + 1,
          college.name || college.college_name || college
        ]);
        const ws5 = XLSX.utils.aoa_to_sheet([...collegesHeader, ...collegesRows]);
        XLSX.utils.book_append_sheet(wb, ws5, 'Colleges');
      }
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `PRISM_Admin_Dashboard_${filters.year === 'All' ? 'All_Years' : filters.year}_${timestamp}.xlsx`;
      
      // Write and download the file
      XLSX.writeFile(wb, filename);
      
    } catch (error) {
      console.error('Failed to export Excel file:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleUsersClick = () => navigate('/admin/users');
  const handleWorkletsClick = () => navigate('/admin/worklets');
  const handleCollegesClick = () => navigate('/admin/colleges');

  if (loading) {
    return (
      <div className="flex h-screen w-full bg-slate-100 dark:bg-slate-900">
        <AdminLeftSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-purple-200 border-t-purple-500 dark:border-slate-700 dark:border-t-purple-400" />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-full overflow-hidden ${
      isDarkMode ? 'dark bg-slate-900 text-slate-200' : 'bg-slate-100 text-slate-800'
    }`}>
      <AdminLeftSidebar />

      <main className="flex-1 px-[2vw] py-[1.5vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-200 [&::-webkit-scrollbar-thumb]:bg-slate-400 dark:[&::-webkit-scrollbar-track]:bg-slate-800 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-[3vh]">
          <div>
            <h1 className="text-[clamp(1.75rem,3.5vw,2.25rem)] font-bold text-black dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-[clamp(0.875rem,1.2vw,1rem)] text-slate-500 dark:text-slate-400">
              Real-time platform analytics and insights
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value === 'All' ? e.target.value : parseInt(e.target.value) })}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Years</option>
              {(options.years || []).sort((a, b) => b - a).map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button
              onClick={handleResetFilters}
              className="flex items-center justify-center px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportToExcel}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
              title="Export dashboard data to Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          </div>
        </header>

        <section className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-[clamp(0.75rem,1.5vw,1.25rem)] mb-8">
            <AnimatedMetricCard
              title="Total Users"
              value={stats.total || 0}
              subtitle={filters.year && filters.year !== 'All' ? `Active in ${filters.year}` : "All registered users"}
              icon={Users}
              color={getColors(isDarkMode)[0]}
              onClick={handleUsersClick}
              isClickable={true}
              hoverContent={
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap size={13} className="text-green-500" />
                    <span className="text-gray-500 dark:text-gray-400">Students</span>
                    <span className="font-bold text-gray-800 dark:text-white ml-auto">{stats.students || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users size={13} className="text-purple-500" />
                    <span className="text-gray-500 dark:text-gray-400">Mentors</span>
                    <span className="font-bold text-gray-800 dark:text-white ml-auto">{stats.mentors || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users size={13} className="text-blue-500" />
                    <span className="text-gray-500 dark:text-gray-400">Professors</span>
                    <span className="font-bold text-gray-800 dark:text-white ml-auto">{stats.professors || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield size={13} className="text-orange-500" />
                    <span className="text-gray-500 dark:text-gray-400">Admins</span>
                    <span className="font-bold text-gray-800 dark:text-white ml-auto">{stats.admins || 0}</span>
                  </div>
                </div>
              }
            />
            <AnimatedMetricCard
              title="Total Worklets"
              value={workletStats.total || 0}
              subtitle={filters.year && filters.year !== 'All' ? `Started in ${filters.year}` : "All worklets"}
              icon={Target}
              color={getColors(isDarkMode)[5]}
              onClick={handleWorkletsClick}
              isClickable={true}
              hoverContent={
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Activity size={13} className="text-blue-500" />
                    <span className="text-gray-500 dark:text-gray-400">Ongoing</span>
                    <span className="font-bold text-gray-800 dark:text-white ml-auto">{workletStats.ongoing || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={13} className="text-green-500" />
                    <span className="text-gray-500 dark:text-gray-400">Completed</span>
                    <span className="font-bold text-gray-800 dark:text-white ml-auto">{workletStats.completed || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-yellow-500" />
                    <span className="text-gray-500 dark:text-gray-400">Pending</span>
                    <span className="font-bold text-gray-800 dark:text-white ml-auto">{workletStats.pending || 0}</span>
                  </div>
                </div>
              }
            />
            <AnimatedMetricCard
              title="Completion Rate"
              value={`${workletStats.total ? Math.round((workletStats.completed / workletStats.total) * 100) : 0}%`}
              subtitle={`${workletStats.completed || 0} of ${workletStats.total || 0} worklets completed`}
              icon={CheckCircle}
              color={getColors(isDarkMode)[1]}
            />
            <AnimatedMetricCard
              title="Growth Rate"
              value={`${(() => {
                if (monthlyData.length < 2) return 0;
                const current = monthlyData[monthlyData.length - 1]?.worklets || 0;
                const previous = monthlyData[monthlyData.length - 2]?.worklets || 0;
                return previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;
              })()}%`}
              subtitle="Month-over-month worklet growth"
              icon={TrendingUp}
              color={getColors(isDarkMode)[4]}
            />
            <AnimatedMetricCard
              title="Institutions"
              value={colleges.length || 0}
              subtitle="Partner colleges"
              icon={Building2}
              color={getColors(isDarkMode)[0]}
              onClick={handleCollegesClick}
              isClickable={true}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Monthly Progress Trends */}
            <ChartContainer
              title="Monthly Progress Trends"
              isDark={isDarkMode}
              exportAction={() => exportData('monthly')}
              previewAction={() => setPreviewChart('monthly')}
            >
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                📊 {monthlyData.length} months of data {filters.year !== 'All' ? `(${filters.year})` : ''}
              </p>
              {monthlyData.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center">
                  <p className="text-gray-400 dark:text-gray-500 text-sm">No data available for selected filters</p>
                </div>
              ) : (
                <div 
                  className="mt-4 overflow-x-auto pb-4 custom-scrollbar cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setPreviewChart('monthly')}
                  title="Click to view full screen"
                >
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                      <XAxis dataKey="month" stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                      <YAxis stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip isDark={isDarkMode} />} />
                      <Legend wrapperStyle={{ color: isDarkMode ? '#E5E7EB' : '#374151' }} />
                      <Line type="monotone" dataKey="users" stroke={getColors(isDarkMode)[0]} strokeWidth={3} dot={{ r: 4 }} name="New Users" />
                      <Line type="monotone" dataKey="worklets" stroke={getColors(isDarkMode)[1]} strokeWidth={3} dot={{ r: 4 }} name="Worklets" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartContainer>

            {/* Worklet Lifecycle Funnel */}
            <ChartContainer
              title="Worklet Lifecycle"
              isDark={isDarkMode}
              exportAction={() => exportData('funnel')}
              previewAction={() => setPreviewChart('funnel')}
            >
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Drop-off across the worklet pipeline
              </p>
              {stats.total === 0 && workletStats.total === 0 ? (
                <div className="h-[200px] flex items-center justify-center">
                  <p className="text-gray-400 dark:text-gray-500 text-sm">No data available</p>
                </div>
              ) : (
                <div
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setPreviewChart('funnel')}
                  title="Click to view full screen"
                >
                  {(() => {
                    const funnelData = [
                      { label: 'Users', value: stats.total || 0, color: getColors(isDarkMode)[0] },
                      { label: 'Assigned', value: workletStats.total || 0, color: getColors(isDarkMode)[4] },
                      { label: 'Ongoing', value: workletStats.ongoing || 0, color: getColors(isDarkMode)[2] },
                      { label: 'Completed', value: workletStats.completed || 0, color: getColors(isDarkMode)[1] },
                    ];
                    const maxVal = Math.max(...funnelData.map(d => d.value), 1);
                    return (
                      <div className="space-y-1.5">
                        {funnelData.map((item, i) => {
                          const widthPct = Math.max((item.value / maxVal) * 100, 12);
                          const prevVal = i > 0 ? funnelData[i - 1].value : null;
                          const dropoff = prevVal && prevVal > 0 ? Math.round(((prevVal - item.value) / prevVal) * 100) : null;
                          return (
                            <motion.div
                              key={item.label}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              className="flex items-center gap-2"
                            >
                              <span className={`text-xs w-16 text-right font-medium shrink-0 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {item.label}
                              </span>
                              <div className="flex-1 flex items-center">
                                <div
                                  className="h-8 rounded-md flex items-center justify-center transition-all duration-500 relative"
                                  style={{ width: `${widthPct}%`, backgroundColor: item.color, minWidth: '40px' }}
                                >
                                  <span className="text-white text-xs font-bold drop-shadow-sm">{item.value}</span>
                                </div>
                                {dropoff !== null && (
                                  <span className={`ml-2 text-[10px] font-medium ${dropoff > 50 ? 'text-red-400' : dropoff > 25 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    ↓{dropoff}%
                                  </span>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </ChartContainer>

            {/* 📍 Institution Comparison */}
            <ChartContainer
              title="📍 Institution Comparison"
              isDark={isDarkMode}
              exportAction={() => exportData('institutions')}
              previewAction={() => setPreviewChart('institutions')}
            >
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Worklets & users by institution
              </p>
              {collegeStats.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center">
                  <p className="text-gray-400 dark:text-gray-500 text-sm">No institution data available</p>
                </div>
              ) : (
                <div 
                  className="mt-2 overflow-x-auto pb-2 custom-scrollbar cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setPreviewChart('institutions')}
                  title="Click to view full screen"
                >
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={collegeStats} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} horizontal={false} />
                      <XAxis type="number" stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} allowDecimals={false} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} 
                        width={80} 
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => v.length > 12 ? v.slice(0, 12) + '…' : v}
                      />
                      <Tooltip content={<CustomTooltip isDark={isDarkMode} />} cursor={{ fill: isDarkMode ? '#374151' : '#f3f4f6' }} />
                      <Legend wrapperStyle={{ color: isDarkMode ? '#F3F4F6' : '#1F2937' }} />
                      <Bar dataKey="worklets" name="Worklets" fill={getColors(isDarkMode)[0]} radius={[0, 4, 4, 0]} />
                      <Bar dataKey="users" name="Users" fill={getColors(isDarkMode)[1]} radius={[0, 4, 4, 0]} />
                      <Bar dataKey="completed" name="Completed" fill={getColors(isDarkMode)[4]} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartContainer>
          </div>

          {/* Last Updated Indicator */}
          {lastUpdated && (
            <div className="flex justify-center mt-6">
              <div className={`px-4 py-2 rounded-lg text-xs ${
                isDarkMode ? 'bg-slate-800/60 text-slate-400' : 'bg-white/80 text-slate-500'
              }`}>
                Last updated: {lastUpdated.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })} on {lastUpdated.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Preview Modal */}
      {previewChart && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-8"
          onClick={() => setPreviewChart(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`relative w-full max-w-7xl h-[90vh] rounded-xl shadow-2xl p-8 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewChart(null)}
              className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <X size={24} />
            </button>

            {previewChart === 'monthly' && (
              <div className="h-full flex flex-col">
                <Title className={`mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Monthly Progress Trends - Detailed View
                </Title>
                <div className="flex-1 overflow-x-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                      <XAxis dataKey="month" stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                      <YAxis stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip isDark={isDarkMode} />} />
                      <Legend wrapperStyle={{ color: isDarkMode ? '#E5E7EB' : '#374151' }} />
                      <Line type="monotone" dataKey="users" stroke={getColors(isDarkMode)[0]} strokeWidth={4} dot={{ r: 6 }} name="New Users" />
                      <Line type="monotone" dataKey="worklets" stroke={getColors(isDarkMode)[1]} strokeWidth={4} dot={{ r: 6 }} name="Worklets" />
                      <Line type="monotone" dataKey="completed" stroke={getColors(isDarkMode)[4]} strokeWidth={4} dot={{ r: 6 }} name="Completed" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {previewChart === 'funnel' && (
              <div className="h-full flex flex-col">
                <Title className={`mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Worklet Lifecycle Funnel - Detailed View
                </Title>
                <div className="flex-1 flex items-center justify-center">
                  {(() => {
                    const funnelData = [
                      { label: 'Users', value: stats.total || 0, color: getColors(isDarkMode)[0] },
                      { label: 'Assigned', value: workletStats.total || 0, color: getColors(isDarkMode)[4] },
                      { label: 'Ongoing', value: workletStats.ongoing || 0, color: getColors(isDarkMode)[2] },
                      { label: 'Completed', value: workletStats.completed || 0, color: getColors(isDarkMode)[1] },
                    ];
                    const maxVal = Math.max(...funnelData.map(d => d.value), 1);
                    return (
                      <div className="w-full max-w-2xl space-y-3 px-8">
                        {funnelData.map((item, i) => {
                          const widthPct = Math.max((item.value / maxVal) * 100, 8);
                          const prevVal = i > 0 ? funnelData[i - 1].value : null;
                          const dropoff = prevVal && prevVal > 0 ? Math.round(((prevVal - item.value) / prevVal) * 100) : null;
                          const convRate = i > 0 && funnelData[0].value > 0 ? ((item.value / funnelData[0].value) * 100).toFixed(1) : null;
                          return (
                            <motion.div
                              key={item.label}
                              initial={{ opacity: 0, x: -30 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.15 }}
                              className="flex items-center gap-4"
                            >
                              <span className={`text-sm w-24 text-right font-semibold shrink-0 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                {item.label}
                              </span>
                              <div className="flex-1 flex items-center">
                                <div
                                  className="h-12 rounded-lg flex items-center justify-center transition-all duration-700 shadow-sm"
                                  style={{ width: `${widthPct}%`, backgroundColor: item.color, minWidth: '60px' }}
                                >
                                  <span className="text-white text-base font-bold drop-shadow-sm">{item.value}</span>
                                </div>
                                <div className="ml-3 flex flex-col">
                                  {dropoff !== null && (
                                    <span className={`text-xs font-semibold ${dropoff > 50 ? 'text-red-400' : dropoff > 25 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                      ↓ {dropoff}% drop-off
                                    </span>
                                  )}
                                  {convRate !== null && (
                                    <span className={`text-[11px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {convRate}% of total users
                                    </span>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {previewChart === 'institutions' && (
              <div className="h-full flex flex-col">
                <Title className={`mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  📍 Institution Comparison - Detailed View
                </Title>
                <div className="flex-1 overflow-x-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={collegeStats} layout="vertical" margin={{ left: 30, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} horizontal={false} />
                      <XAxis type="number" stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} allowDecimals={false} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} 
                        width={150} 
                        tick={{ fontSize: 13 }}
                      />
                      <Tooltip content={<CustomTooltip isDark={isDarkMode} />} cursor={{ fill: isDarkMode ? '#374151' : '#f3f4f6' }} />
                      <Legend wrapperStyle={{ color: isDarkMode ? '#F3F4F6' : '#1F2937' }} />
                      <Bar dataKey="worklets" name="Worklets" fill={getColors(isDarkMode)[0]} radius={[0, 4, 4, 0]} />
                      <Bar dataKey="users" name="Users" fill={getColors(isDarkMode)[1]} radius={[0, 4, 4, 0]} />
                      <Bar dataKey="completed" name="Completed" fill={getColors(isDarkMode)[4]} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
