import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Users, CheckCircle, Download, TrendingUp, BarChart3, Activity, Target, Award, Clock, Zap } from 'lucide-react';
import LeftSidebar from "../components/Left";
// import { ThemeContext } from '../context/ThemeContext'; // <-- Removed ThemeContext dependency
import { motion, AnimatePresence } from 'framer-motion';

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
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ComposedChart
} from 'recharts';
import {
  Card,
  Title,
  Text,
  Metric,
  DonutChart,
  ProgressBar,
  CategoryBar,
  AreaChart as TremorAreaChart,
  BarList,
  Flex,
  Badge,
  Grid
} from '@tremor/react';
// Modern color palettes and chart configurations
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];
const DARK_COLORS = ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#22D3EE', '#A3E635', '#FB923C'];

// Helper function to get appropriate colors based on theme
const getColors = (isDark) => isDark ? DARK_COLORS : COLORS;

// Custom tooltip components
const CustomTooltip = ({ active, payload, label, isDark }) => {
  if (active && payload && payload.length) {
    return (
      <div className={`p-4 rounded-lg shadow-lg border ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200'}`}>
        <p className="font-semibold">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {`${entry.dataKey}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Modern animated metric card component
const AnimatedMetricCard = ({ title, value, change, icon: Icon, color, isDark, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
    className={`p-6 rounded-xl shadow-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <Text className={isDark ? 'text-gray-400' : 'text-gray-600'}>{title}</Text>
        <Metric className={isDark ? 'text-white' : 'text-gray-900'}>{value}</Metric>
        {change && (
          <Flex className="mt-2" alignItems="center" justifyContent="start">
            <Badge color={trend === 'up' ? 'emerald' : trend === 'down' ? 'red' : 'yellow'}>
              {change}
            </Badge>
          </Flex>
        )}
      </div>
      <Icon className={`w-8 h-8`} style={{ color }} />
    </div>
  </motion.div>
);

// Modern chart container component
const ChartContainer = ({ title, children, isDark, exportAction }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    className={`p-6 rounded-xl shadow-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
  >
    <div className="flex justify-between items-center mb-6">
      <Title className={isDark ? 'text-white' : 'text-gray-900'}>{title}</Title>
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
    {children}
  </motion.div>
);

// Sample data generators for demo
const generateMonthlyData = () => {
  const currentYear = 2025;
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  return months.map((month, index) => {
    // Generate progressive data throughout the year
    const baseWorklets = 15 + Math.floor(index * 2.5); // Growing trend
    const variation = Math.floor(Math.random() * 8) - 4; // Random variation ±4
    const worklets = Math.max(baseWorklets + variation, 5); // Minimum 5 worklets
    const completionRate = 0.7 + (Math.random() * 0.25); // 70-95% completion rate
    const completed = Math.floor(worklets * completionRate);
    const studentGrowth = 40 + Math.floor(index * 3.2); // Student growth trend
    const students = studentGrowth + Math.floor(Math.random() * 10) - 5; // ±5 variation
    
    return {
      month: `${month} ${currentYear}`,
      worklets,
      completed,
      students: Math.max(students, 20) // Minimum 20 students
    };
  });
};

const generatePerformanceData = () => [
  { subject: 'Code Quality', userScore: 85, mentorAvg: 78 },
  { subject: 'Timeliness', userScore: 92, mentorAvg: 85 },
  { subject: 'Communication', userScore: 88, mentorAvg: 82 },
  { subject: 'Innovation', userScore: 76, mentorAvg: 75 },
  { subject: 'Collaboration', userScore: 90, mentorAvg: 80 },
  { subject: 'Problem Solving', userScore: 82, mentorAvg: 78 }
];

const generateStatusData = (isDarkMode = false) => {
  const colors = getColors(isDarkMode);
  return [
    { name: 'Completed', value: 45, color: colors[1] },
    { name: 'In Progress', value: 30, color: colors[2] },
    { name: 'Pending', value: 15, color: colors[3] },
    { name: 'On Hold', value: 10, color: colors[7] }
  ];
};

const generateTrendData = () => [
  { week: 'W1', performance: 75, efficiency: 68, quality: 82 },
  { week: 'W2', performance: 78, efficiency: 72, quality: 85 },
  { week: 'W3', performance: 82, efficiency: 75, quality: 88 },
  { week: 'W4', performance: 85, efficiency: 80, quality: 90 }
];

// Modern Statistics Dashboard component
const ModernStatisticsDashboard = () => {
  const isDarkMode = true; // <-- Hardcoded to dark theme
  
  // Custom scrollbar styles
  React.useEffect(() => {
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
  const [statisticsData, setStatisticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mentorInfo, setMentorInfo] = useState(null);
  const [filters, setFilters] = useState({ group: 'All', part: 'All', year: 'All' });
  const [options, setOptions] = useState({ years: [], domains: [], colleges: [] });
  const [selectedMetric, setSelectedMetric] = useState('overview');

  // Enhanced data fetching with modern sample data
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        
        // Simulate API call with modern sample data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setStatisticsData({
          totals: { 
            total_mentors: 15, 
            total_students: 180, 
            total_worklets: 45, 
            ongoing_worklets: 18, 
            completed_worklets: 22, 
            completion_rate: 64,
            performance_score: 87,
            efficiency_rating: 92
          },
          status_counts: { 
            'Completed': 22, 
            'In Progress': 18, 
            'Pending Review': 5, 
            'On Hold': 2,
            'Approved': 8
          },
          performance_counts: { 
            'Excellent': 12, 
            'Very Good': 15, 
            'Good': 8, 
            'Needs Improvement': 3 
          },
          risk_data: { 
            'Low Risk': 32, 
            'Medium Risk': 8, 
            'High Risk': 3 
          },
          monthly_data: generateMonthlyData(),
          performance_radar: generatePerformanceData(),
          status_distribution: generateStatusData(isDarkMode),
          trend_data: generateTrendData()
        });
        
        setMentorInfo({
          name: localStorage.getItem("user_name") || "Alex Thompson",
          total_worklets: 12,
          active_worklets: 8,
          rating: 4.8,
          experience: "Senior Mentor"
        });
        
        setOptions({
          years: ['2024', '2023', '2022'],
          domains: ['Full Stack', 'Data Science', 'Mobile Dev', 'DevOps'],
          colleges: ['MIT', 'Stanford', 'Berkeley', 'CMU']
        });
        
        setError(null);
      } catch (err) {
        console.error('Error fetching statistics:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
    // Refresh data every 60 seconds for real-time updates
    const interval = setInterval(fetchStatistics, 60000);

    return () => clearInterval(interval);
  }, [isDarkMode]); // Keep isDarkMode in dependency array to refetch data if needed, though it's static now

  // Load platform stats given current filters
  const loadPlatformStats = async (flt) => {
    try {
      const params = new URLSearchParams();
      if (flt?.year && flt.year !== 'All') params.set('year', flt.year);
      if (flt?.group && flt.group !== 'All') params.set('domain', flt.group);
      if (flt?.part && flt.part !== 'All') params.set('college', flt.part);
      const url = `http://localhost:8000/api/dashboard/statistics${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setStatisticsData(json);
      }
    } catch (e) {
      console.error('Failed to load platform stats', e);
    }
  };

  // Export helpers
  const exportPlatform = (section) => {
    try {
      const toCSV = (rows) => rows.map(r => r.map(v => `${String(v).replaceAll('"','""')}`).join(',')).join('\n');
      let rows = [];
      if (section === 'status') {
        rows = [['Status', 'Count'], ...Object.entries(statisticsData?.status_counts || {})];
      } else if (section === 'overview') {
        rows = [['KPI', 'Value'], ...Object.entries({
          'All Worklets': statisticsData?.totals?.total_worklets || 0,
          'All Students': statisticsData?.totals?.total_students || 0,
          'Completion Rate (%)': statisticsData?.totals?.completion_rate || 0,
          'Ongoing': statisticsData?.totals?.ongoing_worklets || 0,
          'Completed': statisticsData?.totals?.completed_worklets || 0,
          'All Mentors': statisticsData?.totals?.total_mentors || 0,
        })];
      } else if (section === 'performance') {
        rows = [['Bucket', 'Count'], ...Object.entries(statisticsData?.performance_counts || {})];
      } else if (section === 'risk') {
        rows = [['Risk', 'Count'], ...Object.entries(statisticsData?.risk_data || {})];
      }
      const csv = toCSV(rows);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${section}_stats.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
    }
  };

  // Calculate derived stats from real-time data
  let stats = {
    statusCounts: {},
    totalStudents: 0,
    totalWorklets: 0,
    performanceCounts: {}
  };
  if (statisticsData) {
    stats = {
      statusCounts: statisticsData.status_counts || {},
      totalStudents: statisticsData.engagement_data?.["My Students"] || 0,
      totalWorklets: statisticsData.engagement_data?.["My Worklets"] || 0,
      performanceCounts: statisticsData.performance_counts || {}
    };
  }

  // Platform overview KPIs
  const engagementData = {
    "All Worklets": statisticsData?.totals?.total_worklets || 0,
    "All Students": statisticsData?.totals?.total_students || 0,
    "Completion Rate": statisticsData?.totals?.completion_rate || 0,
    "Ongoing": statisticsData?.totals?.ongoing_worklets || 0,
    "Completed": statisticsData?.totals?.completed_worklets || 0,
    "All Mentors": statisticsData?.totals?.total_mentors || 0
  };

  const riskData = statisticsData?.risk_data || {
    'High Risk': 0,
    'Medium Risk': 0,
    'Low Risk': 0,
  };
  
  const totalRisk = Object.values(riskData).reduce((a, b) => a + b, 0);

  const statusColors = {
    Approved: '#7c3aed',
    Completed: '#2D3748',
    Ongoing: '#4299E1',
    'On Hold': '#ECC94B',
    Dropped: '#F6AD55',
  };
  
  const performanceColors = {
    Excellent: '#2D3748',
    'Very Good': '#4299E1',
    Good: '#A0AEC0',
    Average: '#F6AD55',
    Poor: '#E2E8F0',
  };
  
  const riskSliceColors = {
    'High Risk': '#2D3748',
    'Medium Risk': '#4299E1',
    'Low Risk': '#E2E8F0',
  };

  const maxStatusValue = Math.max(...Object.values(stats.statusCounts || {}), 1);
  const maxPerformanceValue = Math.max(...Object.values(stats.performanceCounts || {}), 1);

  // Modern export function
  const exportData = (type) => {
    const data = statisticsData;
    if (!data) return;
    
    let csvContent = '';
    switch(type) {
      case 'overview':
        csvContent = 'Metric,Value\n' + Object.entries(data.totals).map(([k,v]) => `${k},${v}`).join('\n');
        break;
      case 'status':
        csvContent = 'Status,Count\n' + Object.entries(data.status_counts).map(([k,v]) => `${k},${v}`).join('\n');
        break;
      case 'performance':
        csvContent = 'Category,Score\n' + data.performance_radar.map(d => `${d.subject},${d.userScore}`).join('\n');
        break;
      default:
        // Handle other cases or provide a default export
        return;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_statistics.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <Text className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>Loading modern analytics...</Text>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-full overflow-hidden ${isDarkMode ? 'dark bg-slate-900 text-slate-200' : 'bg-slate-100 text-slate-800'}`}>
      <LeftSidebar />

      <main className="flex-1 px-[2vw] py-[1.5vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-200 [&::-webkit-scrollbar-thumb]:bg-slate-400 dark:[&::-webkit-scrollbar-track]:bg-slate-800 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600">
        <header className="flex justify-between items-center mb-[3vh]">
          <div>
            <h1 className="text-[clamp(1.75rem,3.5vw,2.25rem)] font-bold text-slate-900 dark:text-white">
              Performance Analytics 📊
            </h1>
            <p className="text-[clamp(0.875rem,1.2vw,1rem)] text-slate-500 dark:text-slate-400">
              Real-time insights with modern data visualizations
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select 
              value={filters.year}
              onChange={(e) => setFilters({...filters, year: e.target.value})}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Years</option>
              {options.years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Activity className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </header>

        <section className="space-y-6">

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <AnimatedMetricCard
              title="Total Worklets" 
              value={statisticsData?.totals?.total_worklets || 0}
              change="+12% from last month"
              icon={Target}
              color={getColors(isDarkMode)[0]}
              isDark={isDarkMode}
              trend="up"
            />
            <AnimatedMetricCard
              title="Completed" 
              value={statisticsData?.totals?.completed_worklets || 0}
              change="+8% completion rate"
              icon={CheckCircle}
              color={getColors(isDarkMode)[1]}
              isDark={isDarkMode}
              trend="up"
            />
            <AnimatedMetricCard
              title="Performance Score" 
              value={`${statisticsData?.totals?.performance_score || 87}%`}
              change="+5% this quarter"
              icon={Award}
              color={getColors(isDarkMode)[2]}
              isDark={isDarkMode}
              trend="up"
            />
            <AnimatedMetricCard
              title="Efficiency Rating" 
              value={`${statisticsData?.totals?.efficiency_rating || 92}%`}
              change="Top 10% globally"
              icon={Zap}
              color={getColors(isDarkMode)[3]}
              isDark={isDarkMode}
              trend="up"
            />
          </div>

          {/* Advanced Visualizations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Interactive Line Chart with Scroll */}
            <ChartContainer title="Monthly Progress Trends" isDark={isDarkMode} exportAction={() => exportData('monthly')}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">📊 {statisticsData?.monthly_data?.length || 12} months of data available (Jan-Dec 2025)</p>
                  <button
                    onClick={() => {
                      const scrollContainer = document.querySelector('.custom-scrollbar');
                      scrollContainer?.scrollTo({ left: 0, behavior: 'smooth' });
                    }}
                    className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    ← Start
                  </button>
                  <button
                    onClick={() => {
                      const scrollContainer = document.querySelector('.custom-scrollbar');
                      scrollContainer?.scrollTo({ left: scrollContainer.scrollWidth, behavior: 'smooth' });
                    }}
                    className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    End →
                  </button>
                </div>
                <div className="flex space-x-2 items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Total Worklets</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full ml-4"></div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Completed</span>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full ml-4 ring-2 ring-yellow-300"></div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Current Month</span>
                </div>
              </div>
              <div className="overflow-x-auto pb-4 custom-scrollbar">
                <div className="min-w-[1200px]">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={statisticsData?.monthly_data || generateMonthlyData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                      <XAxis dataKey="month" stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                      <YAxis stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                      <Tooltip content={<CustomTooltip isDark={isDarkMode} />} />
                      <Legend wrapperStyle={{ color: isDarkMode ? '#E5E7EB' : '#374151' }} />
                      <Line 
                        type="monotone" 
                        dataKey="worklets" 
                        stroke={getColors(isDarkMode)[0]} 
                        strokeWidth={3}
                        dot={(props) => {
                          const isCurrentMonth = props.payload?.month === 'Sep 2025';
                          const colors = getColors(isDarkMode);
                          return (
                            <circle
                              cx={props.cx}
                              cy={props.cy}
                              r={isCurrentMonth ? 8 : 6}
                              fill={colors[0]}
                              stroke={isCurrentMonth ? '#FBBF24' : colors[0]}
                              strokeWidth={isCurrentMonth ? 3 : 2}
                            />
                          );
                        }}
                        name="Total Worklets"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="completed" 
                        stroke={getColors(isDarkMode)[1]} 
                        strokeWidth={3}
                        dot={(props) => {
                          const isCurrentMonth = props.payload?.month === 'Sep 2025';
                          const colors = getColors(isDarkMode);
                          return (
                            <circle
                              cx={props.cx}
                              cy={props.cy}
                              r={isCurrentMonth ? 8 : 6}
                              fill={colors[1]}
                              stroke={isCurrentMonth ? '#FBBF24' : colors[1]}
                              strokeWidth={isCurrentMonth ? 3 : 2}
                            />
                          );
                        }}
                        name="Completed"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </ChartContainer>

            {/* Modern Area Chart */}
            <ChartContainer title="Performance Trends" isDark={isDarkMode} exportAction={() => exportData('trends')}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={statisticsData?.trend_data || generateTrendData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                  <XAxis dataKey="week" stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                  <YAxis stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                  <Tooltip content={<CustomTooltip isDark={isDarkMode} />} />
                  <Legend wrapperStyle={{ color: isDarkMode ? '#F3F4F6' : '#1F2937' }} />
                  <Area 
                    type="monotone" 
                    dataKey="performance" 
                    stackId="1" 
                    stroke={getColors(isDarkMode)[0]} 
                    fill={getColors(isDarkMode)[0]}
                    fillOpacity={0.6}
                    name="Performance"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="efficiency" 
                    stackId="1" 
                    stroke={getColors(isDarkMode)[1]} 
                    fill={getColors(isDarkMode)[1]}
                    fillOpacity={0.6}
                    name="Efficiency"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* Advanced Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Status Distribution with Modern Donut Chart */}
            <ChartContainer title="Worklet Status Distribution" isDark={isDarkMode} exportAction={() => exportData('status')}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statisticsData?.status_distribution || generateStatusData(isDarkMode)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(statisticsData?.status_distribution || generateStatusData(isDarkMode)).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getColors(isDarkMode)[index % getColors(isDarkMode).length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip isDark={isDarkMode} />} />
                  <Legend wrapperStyle={{ color: isDarkMode ? '#F3F4F6' : '#1F2937' }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Performance Radar Chart */}
            <ChartContainer title="Performance Radar" isDark={isDarkMode} exportAction={() => exportData('radar')}>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={statisticsData?.performance_radar || generatePerformanceData()}>
                  <PolarGrid stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: isDarkMode ? '#9CA3AF' : '#6B7280', fontSize: 10 }} />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fill: isDarkMode ? '#9CA3AF' : '#6B7280', fontSize: 10 }}
                  />
                  <Radar
                    name="Your Score"
                    dataKey="userScore"
                    stroke={getColors(isDarkMode)[0]}
                    fill={getColors(isDarkMode)[0]}
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Mentor Average"
                    dataKey="mentorAvg"
                    stroke={getColors(isDarkMode)[1]}
                    fill={getColors(isDarkMode)[1]}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Tooltip content={<CustomTooltip isDark={isDarkMode} />} />
                  <Legend wrapperStyle={{ color: isDarkMode ? '#F3F4F6' : '#1F2937' }} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Modern Bar Chart */}
            <ChartContainer title="Comparative Analysis" isDark={isDarkMode} exportAction={() => exportData('comparison')}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={[
                  { category: 'Q1', you: 75, mentors: 68 },
                  { category: 'Q2', you: 82, mentors: 72 },
                  { category: 'Q3', you: 88, mentors: 75 },
                  { category: 'Q4', you: 92, mentors: 78 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                  <XAxis dataKey="category" stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                  <YAxis stroke={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                  <Tooltip content={<CustomTooltip isDark={isDarkMode} />} />
                  <Legend wrapperStyle={{ color: isDarkMode ? '#F3F4F6' : '#1F2937' }} />
                  <Bar dataKey="you" fill={getColors(isDarkMode)[0]} radius={[4, 4, 0, 0]} name="Your Performance" />
                  <Bar dataKey="mentors" fill={getColors(isDarkMode)[1]} radius={[4, 4, 0, 0]} name="Mentor Average" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>

          {/* Advanced Analytics Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className={`rounded-xl shadow-lg border p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          >
            <Title className={isDarkMode ? 'text-white' : 'text-gray-900'}>
              AI-Powered Insights
            </Title>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                <div className="flex items-center space-x-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <Text className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Performance Trend
                  </Text>
                </div>
                <Text className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                  Your performance has improved by 15% over the last quarter, ranking you in the top 10% of all participants.
                </Text>
              </div>
              
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
                <div className="flex items-center space-x-3 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <Text className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Peer Comparison
                  </Text>
                </div>
                <Text className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                  You consistently outperform the mentor average across all key metrics, showing exceptional dedication.
                </Text>
              </div>
              
              <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
                <div className="flex items-center space-x-3 mb-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <Text className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Recommendations
                  </Text>
                </div>
                <Text className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                  Focus on code quality and innovation metrics to reach the top 5% performer tier.
                </Text>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
};

export default ModernStatisticsDashboard;