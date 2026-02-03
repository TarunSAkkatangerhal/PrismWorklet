import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import secureAPI from '../services/secureAPI'
import {
  Search,
  Users,
  ChevronDown,
  Download,
  Building2,
  Target,
  RefreshCw,
  X,
  ArrowLeft,
  CheckCircle,
  PauseCircle,
  XCircle,
  Clock,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import LeftSidebar from '../components/Left'
// --- Animation Styles ---
const AnimationStyles = () => (
  <style>{`
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .animate-fadeInUp { animation: fadeInUp 0.5s ease-out forwards; opacity: 0; }
  `}</style>
)

// --- Chart Modal Component ---
const ChartModal = ({ chartInfo, onClose }) => {
  if (!chartInfo) return null

  const renderChart = () => {
    const chartProps = { data: chartInfo.data, isEnlarged: true, onEnlarge: () => {} }
    switch (chartInfo.type) {
      case 'performance':
        return <WorkletPerformanceChart {...chartProps} />
      case 'workletCount':
        return <WorkletsPerCollegeChart {...chartProps} />
      case 'studentsPerWorklet':
        return <StudentsPerWorkletChart {...chartProps} />
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeInUp" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 bg-gray-100 dark:bg-slate-700 rounded-full">
          <X className="w-5 h-5" />
        </button>
        {renderChart()}
      </div>
    </div>
  )
}

// --- Searchable Dropdown Component ---
const SearchableDropdown = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const filteredOptions = useMemo(() => {
    const list = Array.isArray(options) ? options : []
    const q = typeof value === 'string' ? value.toLowerCase() : ''
    return list.filter((option) => {
      if (!option || typeof option.name !== 'string') return false
      const name = option.name.toLowerCase()
      return q === '' ? true : name.includes(q)
    })
  }, [options, value])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (optionName) => {
    if (onChange && typeof onChange === 'function') {
      onChange(optionName)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder || 'Search...'}
          value={value || ''}
          onChange={(e) => onChange && onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-9 pr-9 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange && onChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.id}
                onClick={() => handleSelect(option.name)}
                className="px-3 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer">
                {option.name}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">No colleges found</div>
          )}
        </div>
      )}
    </div>
  )
}

// --- Individual Chart Components ---
const WorkletPerformanceChart = ({ data, onEnlarge, isEnlarged = false }) => {
  const performanceData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    // Use backend-provided performance counts (veryGoodCount, goodCount, averageCount, poorCount)
    // These are calculated based on evaluation scores and progress metrics
    const totalVeryGood = data.reduce((sum, college) => sum + (college.veryGoodCount || 0), 0)
    const totalGood = data.reduce((sum, college) => sum + (college.goodCount || 0), 0)
    const totalAverage = data.reduce((sum, college) => sum + (college.averageCount || 0), 0)
    const totalPoor = data.reduce((sum, college) => sum + (college.poorCount || 0), 0)
    
    return [
      { name: 'Very Good', value: totalVeryGood },
      { name: 'Good', value: totalGood },
      { name: 'Average', value: totalAverage },
      { name: 'Poor', value: totalPoor },
    ].filter((item) => item.value > 0)
  }, [data])

  const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444']

  const handleExportPerformance = (e) => {
    e.stopPropagation()
    if (performanceData.length === 0) {
      alert('No data to export')
      return
    }
    const headers = ['Performance Category', 'Count']
    const csvContent = [
      headers.join(','),
      ...performanceData.map(row => `${row.name},${row.value}`)
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.setAttribute('href', URL.createObjectURL(blob))
    link.setAttribute('download', `Worklet_Performance_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg shadow-slate-200/60 dark:shadow-black/20 p-6 transition-all duration-300 ${
        !isEnlarged && 'cursor-pointer hover:shadow-xl hover:-translate-y-1'
      }`}
      onClick={() => !isEnlarged && onEnlarge && onEnlarge('performance', data)}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Overall Worklet Performance</h3>
        <button
          onClick={handleExportPerformance}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          title="Export to CSV"
        >
          <Download className="w-3 h-3" />
          Export
        </button>
      </div>
      <div
        className={`w-full text-xs text-gray-600 dark:text-gray-400 ${
          isEnlarged ? 'h-[450px]' : 'h-[250px]'
        } transition-all duration-300`}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={performanceData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={isEnlarged ? 150 : 80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                const r = innerRadius + (outerRadius - innerRadius) * 0.5
                const x = cx + r * Math.cos(-midAngle * (Math.PI / 180))
                const y = cy + r * Math.sin(-midAngle * (Math.PI / 180))
                return (
                  <text
                    x={x}
                    y={y}
                    fill="white"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={14}
                    fontWeight="bold">{`${(percent * 100).toFixed(0)}%`}</text>
                )
              }}>
              {performanceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(5px)',
                border: '1px solid #ddd',
                borderRadius: '0.5rem',
              }}
            />
            <Legend wrapperStyle={{ color: 'currentColor' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const WorkletsPerCollegeChart = ({ data, onEnlarge, isEnlarged = false }) => {
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = isEnlarged ? 25 : 15; // Show more items when enlarged

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return { paginatedData: [], pageCount: 0, allData: [] };

    // 1. Map and sort the data
    const sortedData = [...data]
      .map(college => ({
        name: college.college_name || college.name,
        // Ensure worklet count is always a valid number
        worklets: (() => {
          const direct = Number(college.workletCount)
          if (Number.isFinite(direct)) return direct
          if (Array.isArray(college.worklets)) return college.worklets.length
          const sumStatuses =
            (Number(college.completedCount) || 0) +
            (Number(college.ongoingCount) || 0) +
            (Number(college.onHoldCount) || 0) +
            (Number(college.terminatedCount) || 0)
          return sumStatuses
        })(),
      }))
      .sort((a, b) => {
        if (sortOrder === 'asc') return a.worklets - b.worklets;
        if (sortOrder === 'desc') return b.worklets - a.worklets;
        return a.name.localeCompare(b.name); // 'alpha'
      });

    // 2. Paginate the sorted data
    const pageCount = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return { paginatedData, pageCount, allData: sortedData };
  }, [data, sortOrder, currentPage, ITEMS_PER_PAGE]);

  const { paginatedData, pageCount, allData } = processedData;

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pageCount) {
      setCurrentPage(newPage);
    }
  };

  const handleExportWorklets = (e) => {
    e.stopPropagation()
    if (!allData || allData.length === 0) {
      alert('No data to export')
      return
    }
    const headers = ['College Name', 'Worklet Count']
    const csvContent = [
      headers.join(','),
      ...allData.map(row => `"${row.name}",${row.worklets}`)
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.setAttribute('href', URL.createObjectURL(blob))
    link.setAttribute('download', `Worklets_Per_College_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg shadow-slate-200/60 dark:shadow-black/20 p-6 flex flex-col transition-all duration-300 ${
        !isEnlarged && 'cursor-pointer hover:shadow-xl hover:-translate-y-1'
      }`}
      onClick={() => !isEnlarged && onEnlarge && onEnlarge('workletCount', data)}>
      <div
        className="flex justify-between items-center mb-4"
        // FIX: Stop click event from bubbling up to the parent container
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Worklet Count per College</h3>
        <div className="flex items-center space-x-2 text-xs">
           <button
             onClick={handleExportWorklets}
             className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
             title="Export to CSV"
           >
             <Download className="w-3 h-3" />
             Export
           </button>
           <select
             value={sortOrder}
             onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}
             className="bg-gray-100 dark:bg-slate-700 border-none rounded-md p-1 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500"
           >
             <option value="desc">Most First</option>
             <option value="asc">Fewest First</option>
             <option value="alpha">Alphabetical</option>
           </select>
        </div>
      </div>
      <div
        className={`w-full flex-grow text-xs text-gray-600 dark:text-gray-400 ${
          isEnlarged ? 'h-[450px]' : 'h-[250px]'
        } transition-all duration-300`}>
        {paginatedData.length > 0 ? (
          <ResponsiveContainer>
            <BarChart
              layout="vertical"
              data={paginatedData}
              margin={{ top: 8, right: 30, left: 24, bottom: 8 }}
              // Add spacing between horizontal lines (bars)
              barCategoryGap={isEnlarged ? '25%' : '35%'}
              barGap={6}
            >
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis type="number" tick={{ fill: 'currentColor' }} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: 'currentColor', fontSize: 10 }}
                tickMargin={6}
                width={120}
                interval={0}
                tickFormatter={(value) => (value.length > 15 ? `${value.substring(0, 13)}...` : value)}
              />
              <Tooltip
                cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(5px)',
                  border: '1px solid #ddd',
                  borderRadius: '0.5rem',
                }}
              />
              <Bar dataKey="worklets" fill="#8884d8" name="Worklets" barSize={12} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
           <div className="flex items-center justify-center h-full text-gray-500">No data to display.</div>
        )}
      </div>
       {pageCount > 1 && (
         <div
           className="flex justify-center items-center pt-4 space-x-2 text-sm"
           // FIX: Stop click event from bubbling up to the parent container
           onClick={(e) => e.stopPropagation()}
         >
           <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 bg-gray-200 dark:bg-slate-700 rounded-md disabled:opacity-50">Prev</button>
           <span className="text-gray-700 dark:text-gray-300">Page {currentPage} of {pageCount}</span>
           <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === pageCount} className="px-3 py-1 bg-gray-200 dark:bg-slate-700 rounded-md disabled:opacity-50">Next</button>
         </div>
       )}
    </div>
  );
};
const StudentsPerWorkletChart = ({ data, onEnlarge, isEnlarged = false }) => {
  const [statusFilter, setStatusFilter] = useState('Ongoing')
  const chartData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return []

    const normalizeStatus = (s) => {
      if (typeof s !== 'string') return ''
      const compact = s.toLowerCase().trim().replace(/[^a-z]/g, '') // remove spaces, dashes, etc.
      // map common synonyms/variants
      if (compact === 'inprogress' || compact === 'progress' || compact === 'ongoing') return 'ongoing'
      if (compact === 'completed' || compact === 'complete' || compact === 'done' || compact === 'finished') return 'completed'
      if (compact === 'onhold' || compact === 'hold' || compact === 'paused') return 'onhold'
      if (compact === 'terminated' || compact === 'cancelled' || compact === 'canceled' || compact === 'stopped') return 'terminated'
      return compact
    }
    const selected = normalizeStatus(statusFilter)

    const aggregate = data.flatMap((college) => {
      if (!college || !Array.isArray(college.worklets)) return []
      return college.worklets
        .filter((w) => {
          const s = normalizeStatus(w.progressStatus || w.status)
          return selected ? s === selected : true
        })
        .map((worklet) => {
          const studentList = Array.isArray(worklet.assignedStudents) ? worklet.assignedStudents : []
          const uniqueKeys = new Set(
            studentList
              .map((student) => (student?.email || student?.name || '').trim().toLowerCase())
              .filter(Boolean)
          )
          const fallbackSource = worklet.studentCount ?? worklet.student_count ?? studentList.length
          const parsedFallback = Number(fallbackSource)
          const fallbackCount = Number.isFinite(parsedFallback) ? parsedFallback : studentList.length

          // Prefer actual unique assigned students when available; otherwise fallback (including zero)
          const studentCount = uniqueKeys.size > 0 ? uniqueKeys.size : fallbackCount

          // Ensure category labels are unique to avoid overlapping bars in Recharts
          const idSuffix = worklet.id ? ` • ${String(worklet.id).slice(-4)}` : ''
          const label = data.length === 1 ? `${worklet.title}${idSuffix}` : `${worklet.title} (${college.name})`
          return {
            name: label,
            studentCount,
          }
        })
    })

    // Sort descending by student count and limit entries for readability (more when enlarged)
    const limit = isEnlarged ? aggregate.length : 12
    return aggregate
      // Keep zero-count worklets too so the user sees all filtered items
      .filter((item) => !!item.name)
      .sort((a, b) => b.studentCount - a.studentCount)
      .slice(0, limit)
  }, [data, isEnlarged, statusFilter])

  const handleExportStudents = (e) => {
    e.stopPropagation()
    if (chartData.length === 0) {
      alert('No data to export')
      return
    }
    const headers = ['Worklet Name', 'Student Count']
    const csvContent = [
      headers.join(','),
      ...chartData.map(row => `"${row.name.replace(/"/g, '""')}",${row.studentCount}`)
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.setAttribute('href', URL.createObjectURL(blob))
    link.setAttribute('download', `Students_Per_Worklet_${statusFilter}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const studentsTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null
    const { value } = payload[0]
    return (
      <div className="bg-white/90 dark:bg-slate-800/90 rounded-md shadow-md px-3 py-2 text-xs text-gray-700 dark:text-gray-200">
        <div className="font-semibold mb-1">{label}</div>
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5" />
          <span className="font-medium">{value} student{value === 1 ? '' : 's'}</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg shadow-slate-200/60 dark:shadow-black/20 p-6 transition-all duration-300 ${
        !isEnlarged && 'cursor-pointer hover:shadow-xl hover:-translate-y-1'
      }`}
      onClick={() => !isEnlarged && onEnlarge && onEnlarge('studentsPerWorklet', data)}>
      <div className="flex items-center justify-between mb-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Students per Worklet</h3>
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleExportStudents}
            className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            title="Export to CSV"
          >
            <Download className="w-3 h-3" />
            Export
          </button>
          {['Ongoing','Completed','On Hold','Terminated'].map((s) => (
            <button
              key={s}
              onClick={(e) => { e.stopPropagation(); setStatusFilter(s) }}
              className={`px-2 py-1 rounded-md border ${statusFilter===s ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 border-transparent'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div
        className={`w-full text-xs text-gray-600 dark:text-gray-400 ${
          isEnlarged ? 'h-[450px]' : 'h-[250px]'
        } transition-all duration-300`}>
        {chartData.length > 0 ? (
          <ResponsiveContainer>
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis
                type="number"
                tick={{ fill: 'currentColor' }}
                allowDecimals={false}
                domain={[0, (dataMax) => Math.max(dataMax || 0, 1)]}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={isEnlarged ? 200 : 140}
                tick={{ fill: 'currentColor', width: 110 }}
                style={{ fontSize: '10px' }}
              />
              <Tooltip cursor={{ fill: 'rgba(128, 128, 128, 0.08)' }} content={studentsTooltip} />
              <Bar dataKey="studentCount" name="Students" fill="#82ca9d" barSize={20} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-sm">
            Select a college to view student distribution across worklets.
          </div>
        )}
      </div>
    </div>
  )
}

// --- Main Graphs Component for Multi-College View ---
const DashboardGraphs = ({ data, onEnlarge }) => {
  return (
    <div className="space-y-6">
      <WorkletsPerCollegeChart data={data} onEnlarge={onEnlarge} />
      <WorkletPerformanceChart data={data} onEnlarge={onEnlarge} />
    </div>
  )
}

// --- Reusable Worklet List View ---
// eslint-disable-next-line no-unused-vars
const WorkletListView = ({ data, onBack, filterStatus, title }) => {
  const worklets = useMemo(() => {
    const allWorklets = data.flatMap((college) =>
      college.worklets.map((worklet) => ({ ...worklet, collegeName: college.name }))
    )
    if (filterStatus) {
      return allWorklets.filter((worklet) => worklet.progressStatus === filterStatus)
    }
    return allWorklets
  }, [data, filterStatus])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={onBack}
            className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-200 dark:to-slate-400">
            {title}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Displaying {worklets.length} worklet(s)
            {data.length === 1 && ` for ${data[0].name}`}
          </p>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg shadow-slate-200/60 dark:shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Worklet Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  College
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {worklets.length > 0 ? (
                worklets.map((worklet, index) => (
                  <tr
                    key={`${worklet.collegeName}-${worklet.id}`}
                    className="hover:bg-gray-50 dark:hover:bg-slate-700/50 animate-fadeInUp"
                    style={{ animationDelay: `${index * 50}ms` }}>
                    <td className="px-6 py-4 align-top">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{worklet.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span className="font-semibold text-gray-600 dark:text-gray-400">Description: </span>
                        {worklet.description}
                      </div>
                      <div className="mt-2">
                        <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                          Students Assigned:
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {worklet.assignedStudents.map((student) => (
                            <span
                              key={student.email}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-800 dark:bg-slate-900/30 dark:text-slate-300 rounded-full">
                              {student.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap align-top text-sm text-gray-500 dark:text-gray-300">
                      {worklet.collegeName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap align-top">
                      {worklet.performanceStatus ? (
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            worklet.performanceStatus === 'Excellent'
                              ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400'
                              : worklet.performanceStatus === 'Good'
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                              : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400'
                          }`}>
                          {worklet.performanceStatus}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No worklets found with this status.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// --- List View for All Students ---
// eslint-disable-next-line no-unused-vars
const AllStudentsView = ({ data, onBack }) => {
  const uniqueStudents = useMemo(() => {
    const studentMap = new Map()
    data.forEach((college) => {
      college.worklets.forEach((worklet) => {
        worklet.assignedStudents.forEach((student) => {
          const studentEntry = studentMap.get(student.email)
          if (studentEntry) {
            studentEntry.worklets.push({ title: worklet.title, collegeName: college.name })
          } else {
            studentMap.set(student.email, {
              ...student,
              worklets: [{ title: worklet.title, collegeName: college.name }],
            })
          }
        })
      })
    })
    return Array.from(studentMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [data])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={onBack}
            className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-200 dark:to-slate-400">
            Enrolled Students
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {data.length > 1
              ? `A unique list of all students enrolled in worklets.`
              : `A list of students enrolled in worklets at ${data[0]?.name || ''}.`}
          </p>
        </div>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg shadow-slate-200/60 dark:shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Assigned Worklets
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {uniqueStudents.map((student, index) => (
                <tr
                  key={student.email}
                  className="hover:bg-gray-50 dark:hover:bg-slate-700/50 animate-fadeInUp"
                  style={{ animationDelay: `${index * 50}ms` }}>
                  <td className="px-6 py-4 whitespace-nowrap align-top text-sm font-medium text-gray-900 dark:text-white">
                    {student.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap align-top text-sm text-gray-500 dark:text-gray-300">
                    {student.email}
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-col space-y-1">
                      {student.worklets.map((worklet, index) => (
                        <div key={index} className="text-xs">
                          <span className="font-medium text-gray-800 dark:text-gray-300">{worklet.title}</span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {' '}
                            ({worklet.collegeName.split(' ')[0]})
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// --- Main Colleges Component ---
const Colleges = () => {
  useDocumentTitle('College Analytics');
  const navigate = useNavigate()
  const location = useLocation()
  
  // Initialize all filters to default (no restoration from URL or navigation state)
  const [collegeSearch, setCollegeSearch] = useState('')
  const [selectedYear, setSelectedYear] = useState('All Years')
  const [selectedTeam, setSelectedTeam] = useState('Select Team')
  
  const [allCollegeData, setAllCollegeData] = useState([])
  const [allYears, setAllYears] = useState([]) // Store all available years
  const [loading, setLoading] = useState(true)
  const [enlargedChartInfo, setEnlargedChartInfo] = useState(null) // State for modal
  const [availableTeams, setAvailableTeams] = useState([]) // Available teams for filtering
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000'
  const [collegeDetailStatus, setCollegeDetailStatus] = useState({}) // tracks detailed fetch status per college
  const allCollegeDataRef = useRef(allCollegeData)
  const originalCollegeDataRef = useRef([]) // Store ORIGINAL unfiltered data, never updated after initial fetch
  // Worklet count sort for College Overview table
  const [overviewSortOrder, setOverviewSortOrder] = useState('desc') // 'desc' (Highest→Lowest) | 'asc' (Lowest→Highest)
  // Total worklets available from global worklets list (fallback for statistics)
  const [workletsTotalCount, setWorkletsTotalCount] = useState(0)
  
  // Ref for college overview section
  const collegeOverviewRef = useRef(null)

  // Function to scroll to college overview section
  const scrollToCollegeOverview = () => {
    if (collegeOverviewRef.current) {
      collegeOverviewRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      })
    }
  }
  
  // Clear URL params if coming from academia_details (fresh page)
  useEffect(() => {
    if (location.state?.fromDetails) {
      // Clear all filters
      setCollegeSearch('')
      setSelectedYear('All Years')
      setSelectedTeam('Select Team')
      // Clear URL params
      navigate({ search: '' }, { replace: true, state: null })
    }
  }, [location.state?.fromDetails, navigate])

  // Update URL params whenever filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (collegeSearch) params.set('college', collegeSearch)
    if (selectedYear && selectedYear !== 'All Years') params.set('year', selectedYear)
    if (selectedTeam && selectedTeam !== 'Select Team') params.set('team', selectedTeam)
    
    const currentSearch = window.location.search.slice(1) // Remove leading '?'
    const newSearch = params.toString()
    
    // Only update if the URL actually changed to avoid unnecessary navigation
    if (currentSearch !== newSearch) {
      navigate({ search: newSearch }, { replace: true })
    }
  }, [collegeSearch, selectedYear, selectedTeam, navigate])

  // Extract unique years and areas from backend data (after allCollegeData is declared)
  const uniqueYears = useMemo(() => {
    // Use ORIGINAL unfiltered data ref to ensure we always have complete worklets with year fields
    const sourceData = originalCollegeDataRef.current.length > 0 
      ? originalCollegeDataRef.current 
      : (allCollegeDataRef.current.length > 0 ? allCollegeDataRef.current : allCollegeData)
    
    // If a college is selected, only show years for that college's worklets
    let collegesToConsider = sourceData || []
    
    if (collegeSearch) {
      collegesToConsider = collegesToConsider.filter(
        (c) => typeof c?.name === 'string' && c.name.toLowerCase() === collegeSearch.toLowerCase()
      )
      
      // Extract years from worklets
      const allWorklets = collegesToConsider.flatMap((college) => college.worklets || [])
      const years = allWorklets
        .map((worklet) => worklet?.year)
        .filter((year) => year != null && year !== '' && !isNaN(Number(year)))
      
      const unique = Array.from(new Set(years)).sort((a, b) => Number(b) - Number(a))
      
      // If college is selected but no years found, fall back to allYears
      if (unique.length === 0 && allYears.length > 0) {
        return allYears
      }
      
      return unique
    }
    
    // If no college is selected, use the stored allYears
    if (!collegeSearch && allYears.length > 0) {
      return allYears
    }
    
    // Extract years from worklets, not college establishment
    const worklets = collegesToConsider.flatMap((college) => college.worklets || [])
    
    const years = worklets
      .map((worklet) => worklet?.year)
      .filter((year) => year != null && year !== '' && !isNaN(Number(year)))
    
    const unique = Array.from(new Set(years)).sort((a, b) => Number(b) - Number(a))
    return unique
  }, [allCollegeData, collegeSearch, allYears])

  // Helper: robust worklet count computation aligned with charts
  const getWorkletCount = useCallback((college) => {
    if (!college) return 0
    const direct = Number(college.workletCount)
    if (Number.isFinite(direct)) return direct
    if (Array.isArray(college.worklets)) return college.worklets.length
    const sumStatuses =
      (Number(college.completedCount) || 0) +
      (Number(college.ongoingCount) || 0) +
      (Number(college.onHoldCount) || 0) +
      (Number(college.terminatedCount) || 0)
    return sumStatuses
  }, [])



  // Fetch available teams based on selected college and year (nested filtering)
  // Only show teams that have at least 1 worklet matching current filters
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        // Use ORIGINAL unfiltered data ref to ensure we always have complete worklets with year fields
        const sourceData = originalCollegeDataRef.current.length > 0 
          ? originalCollegeDataRef.current 
          : (allCollegeDataRef.current.length > 0 ? allCollegeDataRef.current : allCollegeData)
        
        // If a specific college is selected, filter teams from that college's worklets
        if (collegeSearch && sourceData.length > 0) {
          const selectedCollege = sourceData.find(
            (c) => c.name.toLowerCase() === collegeSearch.toLowerCase()
          )
          
          if (selectedCollege && Array.isArray(selectedCollege.worklets)) {
            let worklets = selectedCollege.worklets
            
            // Further filter by year if selected
            if (selectedYear && selectedYear !== 'All Years') {
              const yearToMatch = String(selectedYear).trim()
              worklets = worklets.filter((w) => String(w.year || '').trim() === yearToMatch)
            }
            
            // Extract unique teams that have worklets (check all possible team field names)
            const teams = [...new Set(
              worklets
                .map((w) => w.team || w.technical_domain || w.technicalDomain)
                .filter(Boolean)
                .map(t => String(t).trim())
            )].sort()
            
            setAvailableTeams(teams.length > 0 ? teams : [])
            return
          }
        }
        
        // If no college selected, fetch teams globally filtered by year
        // Only show teams that have worklets
        if (sourceData.length > 0) {
          let allWorklets = sourceData.flatMap((college) => college.worklets || [])
          
          // Filter by year if selected
          if (selectedYear && selectedYear !== 'All Years') {
            const yearToMatch = String(selectedYear).trim()
            allWorklets = allWorklets.filter((w) => String(w.year || '').trim() === yearToMatch)
          }
          
          // Extract unique teams that have worklets
          const teams = [...new Set(
            allWorklets
              .map((w) => w.team || w.technical_domain || w.technicalDomain)
              .filter(Boolean)
              .map(t => String(t).trim())
          )].sort()
          
          setAvailableTeams(teams.length > 0 ? teams : [])
        } else {
          // Try fetching from API if local data not available
          const teamsParams = new URLSearchParams()
          if (selectedYear && selectedYear !== 'All Years') {
            teamsParams.set('year', selectedYear)
          }
          
          const teamsRes = await secureAPI.get(
            `/api/dashboard/teams${teamsParams.toString() ? `?${teamsParams.toString()}` : ''}`
          )
          const teams = teamsRes?.data?.teams || []
          setAvailableTeams(teams)
        }
      } catch (error) {
        // Fallback: extract teams from originalCollegeDataRef if available
        const sourceData = originalCollegeDataRef.current.length > 0 
          ? originalCollegeDataRef.current 
          : (allCollegeDataRef.current.length > 0 ? allCollegeDataRef.current : allCollegeData)
        if (sourceData.length > 0) {
          const allTeams = [...new Set(
            sourceData
              .flatMap((college) => college.worklets || [])
              .filter((w) => {
                if (selectedYear && selectedYear !== 'All Years') {
                  return String(w.year) === String(selectedYear)
                }
                return true
              })
              .map((w) => w.team || w.technical_domain || w.technicalDomain)
              .filter(Boolean)
          )].sort()
          setAvailableTeams(allTeams)
        } else {
          setAvailableTeams([])
        }
      }
    }
    
    fetchTeams()
  }, [selectedYear, collegeSearch, allCollegeData])

  // Extract unique college names for dropdown
  const uniqueColleges = useMemo(() => {
    if (!allCollegeData || allCollegeData.length === 0) return []
    return allCollegeData
      .filter((college) => college.name && typeof college.name === 'string')
      .map((college) => ({
        id: college.id,
        name: college.name
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [allCollegeData])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('access_token')
        const requestConfig = token ? { headers: { Authorization: `Bearer ${token}` } } : {}

        // ALWAYS fetch ALL colleges and worklets (no filters to backend)
        // We'll filter by year/team client-side in the filteredColleges useMemo for consistency
        const collegesUrl = `${apiBaseUrl}/colleges`
        const collegesResponse = await axios.get(collegesUrl, requestConfig)

        // ALWAYS fetch ALL worklets (no year filter to backend) for consistency
        // We'll filter by year client-side in the filteredColleges useMemo
        let workletsDataSafe = []
        try {
          const workletsUrl = `${apiBaseUrl}/worklets`
          const workletsResponse = await axios.get(workletsUrl, requestConfig)
          workletsDataSafe = Array.isArray(workletsResponse.data) ? workletsResponse.data : []
        } catch (we) {
          // Worklets fetch failed; proceeding with colleges only
        }

        const workletsByCollege = workletsDataSafe.reduce((acc, worklet) => {
          const collegeName = worklet.college || worklet.collegeName || 'Unassigned'
          const derivedStudentCount = typeof worklet.student_count === 'number'
            ? worklet.student_count
            : Array.isArray(worklet.assignedStudents) ? worklet.assignedStudents.length : 0
          const normalizedCollegeSlug = typeof collegeName === 'string'
            ? collegeName.toLowerCase().replace(/\s+/g, '') || 'college'
            : 'college'
          
          // Map backend performance field to performanceStatus for display
          let performanceStatus = null
          if (worklet.performance) {
            const perf = String(worklet.performance).toLowerCase().trim()
            if (perf.includes('excel')) performanceStatus = 'Excellent'
            else if (perf.includes('good')) performanceStatus = 'Good'
            else if (perf.includes('need')) performanceStatus = 'Needs Attention'
            else performanceStatus = worklet.performance.charAt(0).toUpperCase() + worklet.performance.slice(1)
          }
          
          const normalizedWorklet = {
            id: worklet.id,
            title: worklet.title,
            description: worklet.description,
            status: worklet.status || worklet.progressStatus,
            progressStatus: worklet.progressStatus || worklet.status,
            performanceStatus: performanceStatus,
            domain: worklet.domain,
            year: worklet.year,
            team: worklet.team,
            startDate: worklet.start_date,
            endDate: worklet.end_date,
            studentCount: derivedStudentCount,
            assignedStudents: Array.isArray(worklet.assignedStudents)
              ? worklet.assignedStudents
              : Array.from({ length: derivedStudentCount }, (_, index) => ({
                  name: `Student ${index + 1}`,
                  email: `student${index + 1}@${normalizedCollegeSlug}.edu`,
                })),
            collegeName: collegeName,
          }

          if (!acc[collegeName]) {
            acc[collegeName] = []
          }
          acc[collegeName].push(normalizedWorklet)
          return acc
        }, {})

  // Keep a global count for robust statistics fallback
  setWorkletsTotalCount(Array.isArray(workletsDataSafe) ? workletsDataSafe.length : 0)

        const processedData = (collegesResponse.data || []).map((college) => {
          const name = college.college_name || college.name
          const worklets = workletsByCollege[name] || []
          
          // Count total students from studentCount field (not from assignedStudents array)
          // assignedStudents might be empty or incomplete, but studentCount has the accurate count
          const derivedTotalStudents = worklets.reduce((sum, worklet) => {
            return sum + (worklet.studentCount || 0)
          }, 0)
          
          return {
            id: college.college_id ?? college.id,
            name,
            location: college.location,
            established: college.established,
            areaOfExpertise: college.area_of_expertise ?? college.areaOfExpertise,
            workletCount: college.workletCount ?? worklets.length,
            veryGoodCount: college.veryGoodCount ?? 0,
            goodCount: college.goodCount ?? 0,
            averageCount: college.averageCount ?? 0,
            poorCount: college.poorCount ?? 0,
            completedCount: college.completedCount ?? 0,
            ongoingCount: college.ongoingCount ?? 0,
            onHoldCount: college.onHoldCount ?? 0,
            terminatedCount: college.terminatedCount ?? 0,
            totalStudents: typeof college.totalStudents === 'number' ? college.totalStudents : derivedTotalStudents,
            worklets,
          }
        })

        setAllCollegeData(processedData)
        
        // Store ORIGINAL unfiltered data in a ref that's NEVER updated
        // This ensures we always have access to the complete worklets with all fields
        if (originalCollegeDataRef.current.length === 0) {
          originalCollegeDataRef.current = processedData
        }
        
        // ALWAYS store all available years from the initial fetch (needed for fallback)
        // This ensures allYears is populated even when navigating back with filters
        const allAvailableYears = processedData
          .flatMap((college) => college.worklets || [])
          .map((worklet) => worklet.year)
          .filter((year) => year && !isNaN(Number(year)))
        const uniqueAvailableYears = Array.from(new Set(allAvailableYears)).sort((a, b) => Number(b) - Number(a))
        if (uniqueAvailableYears.length > 0) {
          setAllYears(uniqueAvailableYears)
        }
      } catch (err) {
        if (err.response?.status === 401) {
          // Clear auth tokens
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('user_role')
          localStorage.removeItem('user_email')
          // Redirect to login
          window.location.href = '/'
        }
        setAllCollegeData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBaseUrl, collegeSearch ? '' : selectedYear]) // Only re-fetch on year change when no college is selected

  useEffect(() => {
    allCollegeDataRef.current = allCollegeData
  }, [allCollegeData])

  const fetchCollegeWorklets = useCallback(
    async (college) => {
      if (!college || !college.id) return
      const collegeId = college.id

      const existingStatus = collegeDetailStatus[collegeId]
      if (existingStatus === 'loading' || existingStatus === 'loaded' || existingStatus === 'error') {
        return
      }

      // Prevent duplicate fetches
      setCollegeDetailStatus((prev) => {
        const currentStatus = prev[collegeId]
        if (currentStatus === 'loading' || currentStatus === 'loaded') {
          return prev
        }
        return { ...prev, [collegeId]: 'loading' }
      })

      const token = localStorage.getItem('access_token')
      const requestConfig = token ? { headers: { Authorization: `Bearer ${token}` } } : {}

      try {
        const workletsRes = await axios.get(`${apiBaseUrl}/colleges/${collegeId}/worklets`, requestConfig)
        const workletsPayload = Array.isArray(workletsRes.data) ? workletsRes.data : []

        const detailedWorklets = workletsPayload.map((rawWorklet) => {
          const students = Array.isArray(rawWorklet.assignedStudents)
            ? rawWorklet.assignedStudents.map((student) => ({
                name: student.name,
                email: student.email,
              }))
            : []

          const studentCount = students.length
          
          // Map backend performance field to performanceStatus for display
          let performanceStatus = null
          if (rawWorklet.performance) {
            const perf = String(rawWorklet.performance).toLowerCase().trim()
            if (perf.includes('excel')) performanceStatus = 'Excellent'
            else if (perf.includes('good')) performanceStatus = 'Good'
            else if (perf.includes('need')) performanceStatus = 'Needs Attention'
            else performanceStatus = rawWorklet.performance.charAt(0).toUpperCase() + rawWorklet.performance.slice(1)
          }
          
          return {
            id: rawWorklet.id,
            title: rawWorklet.title,
            description: rawWorklet.description,
            status: rawWorklet.status || rawWorklet.progressStatus,
            progressStatus: rawWorklet.progressStatus || rawWorklet.status,
            performanceStatus: performanceStatus,
            domain: rawWorklet.domain,
            year: rawWorklet.year,
            team: rawWorklet.team, // Include team field
            startDate: rawWorklet.start_date,
            endDate: rawWorklet.end_date,
            studentCount,
            assignedStudents: students,
            collegeName: rawWorklet.collegeName || rawWorklet.college || college.name,
          }
        })

        const existingEntry = allCollegeDataRef.current.find((entry) => entry.id === collegeId)
        const fallbackWorklets = existingEntry?.worklets || []
        const fallbackById = new Map(fallbackWorklets.map((worklet) => [worklet.id, worklet]))

        const baseWorklets = detailedWorklets.length > 0 ? detailedWorklets : fallbackWorklets

        const mergedWorklets = baseWorklets
          .map((worklet) => {
            const fallback = fallbackById.get(worklet.id) || {}

            const fallbackAssigned = Array.isArray(fallback.assignedStudents) ? fallback.assignedStudents : []
            const detailedAssigned = Array.isArray(worklet.assignedStudents) ? worklet.assignedStudents : []
            const assignedStudents = detailedAssigned.length > 0 ? detailedAssigned : fallbackAssigned

            const rawDetailedCount = typeof worklet.studentCount === 'number' ? worklet.studentCount : NaN
            const detailedCount = Number.isFinite(rawDetailedCount) ? rawDetailedCount : (detailedAssigned.length || 0)

            const rawFallbackCount = typeof fallback.studentCount === 'number' ? fallback.studentCount : NaN
            const fallbackCount = Number.isFinite(rawFallbackCount) ? rawFallbackCount : (fallbackAssigned.length || 0)

            // Prefer detailed when positive; otherwise use fallback if available (>0)
            const studentCount = detailedCount > 0 ? detailedCount : (fallbackCount > 0 ? fallbackCount : 0)

            return {
              ...fallback,
              ...worklet,
              assignedStudents,
              studentCount,
            }
          })
          .filter((worklet) => worklet && worklet.title)

        const derivedTotalStudents = (() => {
          // Count total students from studentCount field (not from assignedStudents array)
          return mergedWorklets.reduce((sum, worklet) => {
            return sum + (worklet.studentCount || 0)
          }, 0)
        })()

        setAllCollegeData((prev) =>
          prev.map((entry) =>
            entry.id === collegeId
              ? {
                  ...entry,
                  worklets: mergedWorklets,
                  totalStudents:
                    typeof entry.totalStudents === 'number' && entry.totalStudents > 0
                      ? entry.totalStudents
                      : derivedTotalStudents,
                }
              : entry
          )
        )

        setCollegeDetailStatus((prev) => ({ ...prev, [collegeId]: 'loaded' }))
      } catch (detailError) {
        if (detailError.response?.status === 401) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/'
        }

        setCollegeDetailStatus((prev) => ({ ...prev, [collegeId]: 'error' }))
      }
    },
    [apiBaseUrl, collegeDetailStatus]
  )

  // removed rawMockData: now using backend data only

  // Backend fetch useEffect is defined earlier in the component; remove mock mapping

  const filteredColleges = useMemo(() => {
    if (!allCollegeData || allCollegeData.length === 0) return []

    let collegesToFilter = allCollegeData
    
    // College search filter (single college selection)
    if (collegeSearch) {
      collegesToFilter = allCollegeData.filter((c) => c && c.name && c.name.toLowerCase() === collegeSearch.toLowerCase())
      
      // When college is selected, apply nested year and team filters to worklets
      return collegesToFilter.map((college) => {
        // Apply year filter to worklets within selected college
        let filteredWorklets = Array.isArray(college.worklets) ? college.worklets : []
        
        if (selectedYear && selectedYear !== 'All Years') {
          const yearToMatch = String(selectedYear).trim()
          filteredWorklets = filteredWorklets.filter(worklet => {
            const workletYear = String(worklet.year || '').trim()
            return workletYear === yearToMatch
          })
        }
        
        // Apply team filter to worklets
        if (selectedTeam && selectedTeam !== 'Select Team') {
          const teamToMatch = String(selectedTeam).toLowerCase().trim()
          filteredWorklets = filteredWorklets.filter(worklet => {
            const workletTeam = String(worklet.team || worklet.technical_domain || worklet.technicalDomain || '').toLowerCase().trim()
            return workletTeam === teamToMatch
          })
        }
        
        // ALWAYS recalculate counts from actual worklets data for accuracy
        const completedCount = filteredWorklets.filter(w => w.status === 'Completed' || w.progressStatus === 'Completed').length
        const ongoingCount = filteredWorklets.filter(w => w.status === 'Ongoing' || w.status === 'To Start' || w.progressStatus === 'Ongoing' || w.progressStatus === 'To Start').length
        const onHoldCount = filteredWorklets.filter(w => w.status === 'On Hold' || w.progressStatus === 'On Hold').length
        const terminatedCount = filteredWorklets.filter(w => w.status === 'Terminated' || w.status === 'Dropped' || w.progressStatus === 'Terminated' || w.progressStatus === 'Dropped').length
        
        // Map performance status to match backend fields (Very Good, Good, Average, Poor)
        const veryGoodCount = filteredWorklets.filter(w => {
          const perf = String(w.performanceStatus || '').toLowerCase()
          return perf.includes('very good') || perf.includes('excellent')
        }).length
        const goodCount = filteredWorklets.filter(w => {
          const perf = String(w.performanceStatus || '').toLowerCase()
          return perf === 'good' && !perf.includes('very')
        }).length
        const averageCount = filteredWorklets.filter(w => {
          const perf = String(w.performanceStatus || '').toLowerCase()
          return perf.includes('average') || perf.includes('moderate')
        }).length
        const poorCount = filteredWorklets.filter(w => {
          const perf = String(w.performanceStatus || '').toLowerCase()
          return perf.includes('poor') || perf.includes('needs attention')
        }).length
        
        // Count total students from studentCount field (summing up, may include duplicates across worklets)
        const totalStudents = filteredWorklets.reduce((sum, w) => sum + (w.studentCount || 0), 0)
        
        return {
          ...college,
          worklets: filteredWorklets,
          workletCount: filteredWorklets.length,
          completedCount,
          ongoingCount,
          onHoldCount,
          terminatedCount,
          veryGoodCount,
          goodCount,
          averageCount,
          poorCount,
          totalStudents
        }
      }).filter(Boolean)
    }

    // No college selected - apply year and team filters to ALL colleges
    return collegesToFilter.map((college) => {
      let filteredWorklets = Array.isArray(college.worklets) ? college.worklets : []
      
      // Apply year filter if selected
      if (selectedYear && selectedYear !== 'All Years') {
        const yearToMatch = String(selectedYear).trim()
        filteredWorklets = filteredWorklets.filter(worklet => {
          const workletYear = String(worklet.year || '').trim()
          return workletYear === yearToMatch
        })
      }
      
      // Apply team filter if selected
      if (selectedTeam && selectedTeam !== 'Select Team') {
        const teamToMatch = String(selectedTeam).toLowerCase().trim()
        filteredWorklets = filteredWorklets.filter(worklet => {
          const workletTeam = String(worklet.team || worklet.technical_domain || worklet.technicalDomain || '').toLowerCase().trim()
          return workletTeam === teamToMatch
        })
      }
      
      // ALWAYS recalculate counts from actual worklets data for accuracy
      const completedCount = filteredWorklets.filter(w => w.status === 'Completed' || w.progressStatus === 'Completed').length
      const ongoingCount = filteredWorklets.filter(w => w.status === 'Ongoing' || w.status === 'To Start' || w.progressStatus === 'Ongoing' || w.progressStatus === 'To Start').length
      const onHoldCount = filteredWorklets.filter(w => w.status === 'On Hold' || w.progressStatus === 'On Hold').length
      const terminatedCount = filteredWorklets.filter(w => w.status === 'Terminated' || w.status === 'Dropped' || w.progressStatus === 'Terminated' || w.progressStatus === 'Dropped').length
      
      // Map performance status to match backend fields (Very Good, Good, Average, Poor)
      const veryGoodCount = filteredWorklets.filter(w => {
        const perf = String(w.performanceStatus || '').toLowerCase()
        return perf.includes('very good') || perf.includes('excellent')
      }).length
      const goodCount = filteredWorklets.filter(w => {
        const perf = String(w.performanceStatus || '').toLowerCase()
        return perf === 'good' && !perf.includes('very')
      }).length
      const averageCount = filteredWorklets.filter(w => {
        const perf = String(w.performanceStatus || '').toLowerCase()
        return perf.includes('average') || perf.includes('moderate')
      }).length
      const poorCount = filteredWorklets.filter(w => {
        const perf = String(w.performanceStatus || '').toLowerCase()
        return perf.includes('poor') || perf.includes('needs attention')
      }).length
      
      // Count total students from studentCount field (summing up, may include duplicates across worklets)
      const totalStudents = filteredWorklets.reduce((sum, w) => sum + (w.studentCount || 0), 0)
      
      return {
        ...college,
        worklets: filteredWorklets,
        workletCount: filteredWorklets.length,
        completedCount,
        ongoingCount,
        onHoldCount,
        terminatedCount,
        veryGoodCount,
        goodCount,
        averageCount,
        poorCount,
        totalStudents
      }
    })
  }, [allCollegeData, collegeSearch, selectedTeam, selectedYear])

  // College Overview list sorted by worklet counts (must be after filteredColleges)
  const overviewColleges = useMemo(() => {
    const list = [...filteredColleges]
    return list.sort((a, b) => {
      const ac = getWorkletCount(a)
      const bc = getWorkletCount(b)
      return overviewSortOrder === 'asc' ? ac - bc : bc - ac
    })
  }, [filteredColleges, overviewSortOrder, getWorkletCount])

  useEffect(() => {
    if (filteredColleges.length === 1) {
      fetchCollegeWorklets(filteredColleges[0])
    }
  }, [filteredColleges, fetchCollegeWorklets])

  const handleExport = () => {
    if (filteredColleges.length === 0) {
      alert('No data to export!')
      return
    }
    const headers = ['ID', 'Name', 'Location', 'Total Worklets', 'Very Good', 'Good', 'Average', 'Poor']
    const csvRows = [
      headers.join(','),
      ...filteredColleges.map((college) =>
        [
          college.id,
          `"${college.college_name || college.name}"`,
          `"${college.location}"`,
          college.workletCount,
          college.veryGoodCount || 0,
          college.goodCount || 0,
          college.averageCount || 0,
          college.poorCount || 0,
        ].join(',')
      ),
    ]
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'college_data.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleGetProfessors = () => {
    if (filteredColleges.length === 1) {
      alert(`Fetching professors for ${filteredColleges[0].name}...`)
    } else {
      alert('Please select a single college to get professors.')
    }
  }

  const handleResetFilters = () => {
    setCollegeSearch('')
    setSelectedYear('All Years')
    setSelectedTeam('Select Team')
  }

  const handleCollegeSelect = (collegeName) => {
    setCollegeSearch(collegeName)
    // Reset dependent filters when college selection changes
    setSelectedYear('All Years')
    setSelectedTeam('Select Team')
  }

  // New handler for opening the chart modal
  const handleEnlargeChart = (type, data) => {
    setEnlargedChartInfo({ type, data })
  }

  // Navigation handler to go to navColl component with filter details
  const handleNavigateToFilter = (filter, collegeName = null) => {
    const targetCollege = collegeName || (filteredColleges.length === 1 ? filteredColleges[0].name : null)

    if (targetCollege) {
      let count = 0

      if (targetCollege === 'All Colleges') {
        // Handle multi-college aggregated counts - USE FILTERED COLLEGES to respect year/team filters
        switch (filter) {
          case 'total':
            count = filteredColleges.reduce((acc, curr) => acc + getWorkletCount(curr), 0) || workletsTotalCount
            break
          case 'ongoing':
            count = filteredColleges.reduce((acc, curr) => acc + curr.ongoingCount, 0)
            break
          case 'completed':
            count = filteredColleges.reduce((acc, curr) => acc + curr.completedCount, 0)
            break
          case 'onhold':
            count = filteredColleges.reduce((acc, curr) => acc + curr.onHoldCount, 0)
            break
          case 'terminated':
            count = filteredColleges.reduce((acc, curr) => acc + curr.terminatedCount, 0)
            break
          case 'students':
            count = filteredColleges.reduce((acc, curr) => acc + curr.totalStudents, 0)
            break
          default:
            count = filteredColleges.reduce((acc, curr) => acc + curr.workletCount, 0)
        }
      } else {
        // Handle single college counts - USE FILTERED COLLEGES to respect year/team filters
  const selectedCollege = filteredColleges.find(college => (college.college_name || college.name) === targetCollege)
        if (selectedCollege) {
          switch (filter) {
            case 'total':
              count = getWorkletCount(selectedCollege)
              break
            case 'ongoing':
              count = selectedCollege.ongoingCount || 25
              break
            case 'completed':
              count = selectedCollege.completedCount || 15
              break
            case 'onhold':
              count = selectedCollege.onHoldCount || 8
              break
            case 'terminated':
              count = selectedCollege.terminatedCount || 2
              break
            case 'students':
              count = selectedCollege.studentCount || 150
              break
            default:
              count = selectedCollege.workletCount
          }
        }
      }

      // Navigate to academia_details with filter info (no return filters needed)
      navigate('/academia_details', {
        state: {
          filter,
          collegeName: targetCollege === 'All Colleges' ? '' : targetCollege,
          count,
          year: selectedYear !== 'All Years' ? selectedYear : '',
          team: selectedTeam !== 'Select Team' ? selectedTeam : ''
        },
        replace: false
      })
    } else {
      alert('Please select a college first')
    }
  }

  const renderDashboard = () => {
    // Single College View Layout
    if (filteredColleges.length === 1 && collegeSearch) {
      const college = filteredColleges[0]
      // Robust total worklets using helper (aligns with charts and overview table)
      const totalWorklets = getWorkletCount(college)
      return (
        <div className="space-y-8 transition-opacity duration-300 ease-in-out">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg shadow-slate-200/60 dark:shadow-black/20">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">College Overview</h3>
              <button
                type="button"
                onClick={() => setOverviewSortOrder(overviewSortOrder === 'desc' ? 'asc' : 'desc')}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-blue-200 dark:border-slate-600 bg-blue-50 text-blue-700 dark:bg-slate-700 dark:text-slate-200 hover:ring-2 hover:ring-blue-400/60 transition-all"
                title={overviewSortOrder === 'desc' ? 'Sort: Highest → Lowest' : 'Sort: Lowest → Highest'}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                {overviewSortOrder === 'desc' ? 'Highest → Lowest' : 'Lowest → Highest'}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      College Name
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Worklets
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Very Good
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Good
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Average
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Poor
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {overviewColleges.map((college) => {
                    const totalWorkletsRow =
                      (college.completedCount || 0) +
                      (college.ongoingCount || 0) +
                      (college.onHoldCount || 0) +
                      (college.terminatedCount || 0)
                    return (
                      <tr 
                        key={college.id} 
                        className="transition-colors duration-200"
                        style={{ 
                          animation: 'fadeIn 0.3s ease-in-out',
                          animationDelay: '50ms',
                          animationFillMode: 'both'
                        }}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg mr-3">
                              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{college.college_name || college.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{college.location}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-900 dark:text-white">
                          {totalWorkletsRow}
                        </td>
                        <td className="px-6 py-4 text-sm text-center font-medium text-blue-600 dark:text-blue-400">
                          {college.veryGoodCount || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-center font-medium text-green-600 dark:text-green-400">
                          {college.goodCount || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-center font-medium text-yellow-600 dark:text-yellow-400">
                          {college.averageCount || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-center font-medium text-red-600 dark:text-red-400">
                          {college.poorCount || 0}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <button
              onClick={() => handleNavigateToFilter('total')}
              className="group text-left bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-850 border border-gray-200/80 dark:border-slate-700/80 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Total Worklets</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{totalWorklets}</p>
                </div>
                <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-md bg-gradient-to-br from-purple-500 to-purple-600 shadow-sm group-hover:shadow-md transition-shadow">
                  <Target className="w-5 h-5 text-white" />
                </div>
              </div>
            </button>
            <button
              onClick={() => handleNavigateToFilter('ongoing')}
              className="group text-left bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-850 border border-gray-200/80 dark:border-slate-700/80 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Ongoing</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{college.ongoingCount}</p>
                </div>
                <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm group-hover:shadow-md transition-shadow">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>
            </button>
            <button
              onClick={() => handleNavigateToFilter('completed')}
              className="group text-left bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-850 border border-gray-200/80 dark:border-slate-700/80 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{college.completedCount}</p>
                </div>
                <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm group-hover:shadow-md transition-shadow">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </button>
            <button
              onClick={() => handleNavigateToFilter('onhold')}
              className="group text-left bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-850 border border-gray-200/80 dark:border-slate-700/80 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">On Hold</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{college.onHoldCount}</p>
                </div>
                <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-md bg-gradient-to-br from-amber-500 to-amber-600 shadow-sm group-hover:shadow-md transition-shadow">
                  <PauseCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </button>
            <button
              onClick={() => handleNavigateToFilter('terminated')}
              className="group text-left bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-850 border border-gray-200/80 dark:border-slate-700/80 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-rose-300 dark:hover:border-rose-700 transition-all duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Terminated</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{college.terminatedCount}</p>
                </div>
                <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-md bg-gradient-to-br from-rose-500 to-rose-600 shadow-sm group-hover:shadow-md transition-shadow">
                  <XCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </button>
            <button
              onClick={() => handleNavigateToFilter('students')}
              className="group text-left bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-850 border border-gray-200/80 dark:border-slate-700/80 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Students</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{college.totalStudents}</p>
                </div>
                <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-sm group-hover:shadow-md transition-shadow">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
            </button>
          </div>
          {/* MODIFIED: This container now only holds one chart */}
          <div className="mt-8">
            <WorkletPerformanceChart data={filteredColleges} onEnlarge={handleEnlargeChart} />
          </div>
        </div>
      )
    }

    // Default Multi-College View Layout
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={scrollToCollegeOverview}
              className="group text-left bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-850 border border-gray-200/80 dark:border-slate-700/80 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Total Colleges</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{filteredColleges.length}</p>
                </div>
                <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm group-hover:shadow-md transition-shadow">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
              </div>
            </button>
            <button
              onClick={() => handleNavigateToFilter('total', collegeSearch ? collegeSearch : 'All Colleges')}
              className="group text-left bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-850 border border-gray-200/80 dark:border-slate-700/80 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Total Worklets</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                    {(() => {
                      const sum = filteredColleges.reduce((acc, c) => acc + getWorkletCount(c), 0)
                      // Fallback to global worklets count if sum is 0 but global count > 0
                      return sum > 0 ? sum : (workletsTotalCount || 0)
                    })()}
                  </p>
                </div>
                <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-md bg-gradient-to-br from-purple-500 to-purple-600 shadow-sm group-hover:shadow-md transition-shadow">
                  <Target className="w-5 h-5 text-white" />
                </div>
              </div>
            </button>
            <button
              onClick={() => handleNavigateToFilter('students', collegeSearch ? collegeSearch : 'All Colleges')}
              className="group text-left bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-850 border border-gray-200/80 dark:border-slate-700/80 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                    {filteredColleges.reduce((acc, curr) => acc + (curr.totalStudents || 0), 0)}
                  </p>
                </div>
                <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-sm group-hover:shadow-md transition-shadow">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
            </button>
            <button
              onClick={() => handleNavigateToFilter('ongoing', collegeSearch ? collegeSearch : 'All Colleges')}
              className="group text-left bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-850 border border-gray-200/80 dark:border-slate-700/80 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Ongoing</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                    {filteredColleges.reduce((acc, curr) => acc + (curr.ongoingCount || 0), 0)}
                  </p>
                </div>
                <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-md bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm group-hover:shadow-md transition-shadow">
                  <Clock className="w-5 h-5 text-white" />
                </div>
              </div>
            </button>
            <button
              onClick={() => handleNavigateToFilter('completed', collegeSearch ? collegeSearch : 'All Colleges')}
              className="group text-left bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-850 border border-gray-200/80 dark:border-slate-700/80 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                    {filteredColleges.reduce((acc, curr) => acc + (curr.completedCount || 0), 0)}
                  </p>
                </div>
                <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm group-hover:shadow-md transition-shadow">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </button>
            <button
              onClick={() => handleNavigateToFilter('onhold', collegeSearch ? collegeSearch : 'All Colleges')}
              className="group text-left bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-850 border border-gray-200/80 dark:border-slate-700/80 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition-all duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">On Hold</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                    {filteredColleges.reduce((acc, curr) => acc + (curr.onHoldCount || 0), 0)}
                  </p>
                </div>
                <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-md bg-gradient-to-br from-amber-500 to-amber-600 shadow-sm group-hover:shadow-md transition-shadow">
                  <PauseCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </button>
            <button
              onClick={() => handleNavigateToFilter('terminated', collegeSearch ? collegeSearch : 'All Colleges')}
              className="group text-left bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-850 border border-gray-200/80 dark:border-slate-700/80 rounded-lg p-5 shadow-sm hover:shadow-md hover:border-rose-300 dark:hover:border-rose-700 transition-all duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Terminated</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                    {filteredColleges.reduce((acc, curr) => acc + (curr.terminatedCount || 0), 0)}
                  </p>
                </div>
                <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-md bg-gradient-to-br from-rose-500 to-rose-600 shadow-sm group-hover:shadow-md transition-shadow">
                  <XCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            </button>
          </div>
          <div ref={collegeOverviewRef} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg shadow-slate-200/60 dark:shadow-black/20">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">College Overview</h3>
              <button
                type="button"
                onClick={() => setOverviewSortOrder(overviewSortOrder === 'desc' ? 'asc' : 'desc')}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-blue-200 dark:border-slate-600 bg-blue-50 text-blue-700 dark:bg-slate-700 dark:text-slate-200 hover:ring-2 hover:ring-blue-400/60 transition-all"
                title={overviewSortOrder === 'desc' ? 'Sort: Highest → Lowest' : 'Sort: Lowest → Highest'}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                {overviewSortOrder === 'desc' ? 'Highest → Lowest' : 'Lowest → Highest'}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      College Name
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Worklets
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Very Good
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Good
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Average
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Poor
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        Loading...
                      </td>
                    </tr>
                  ) : (
                    overviewColleges.map((college, index) => (
                      <tr
                        key={college.id}
                        onClick={() => handleCollegeSelect(college.college_name || college.name)}
                        className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors duration-200 cursor-pointer"
                        style={{ 
                          animation: 'fadeIn 0.3s ease-in-out',
                          animationDelay: `${index * 30}ms`,
                          animationFillMode: 'both'
                        }}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg mr-3">
                              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {college.college_name || college.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{college.location}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-900 dark:text-white">
                          {getWorkletCount(college)}
                        </td>
                        <td className="px-6 py-4 text-sm text-center font-medium text-blue-600 dark:text-blue-400">
                          {college.veryGoodCount || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-center font-medium text-green-600 dark:text-green-400">
                          {college.goodCount || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-center font-medium text-yellow-600 dark:text-yellow-400">
                          {college.averageCount || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-center font-medium text-red-600 dark:text-red-400">
                          {college.poorCount || 0}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <DashboardGraphs data={filteredColleges} onEnlarge={handleEnlargeChart} />
        </div>
      </div>
    )
  }

  const renderCurrentView = () => {
    // Always show dashboard - all navigation goes to navColl
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Back button - shows only when a specific college is selected */}
            {collegeSearch && filteredColleges.length === 1 && (
              <button
                onClick={() => {
                  setCollegeSearch('')
                  handleResetFilters()
                }}
                className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all duration-200 shadow-sm hover:shadow-md"
                title="Back to All Colleges"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-[clamp(1.75rem,3.5vw,2.25rem)] font-bold text-black dark:text-white">
              College Management
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                {collegeSearch
                  ? `Displaying data for ${collegeSearch}`
                  : 'Monitor and manage college partnerships and worklet performance'}
              </p>
            </div>
          </div>
            </div>
            
            {/* Simple Filter Section */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-lg shadow-sm mb-8">
              <div className="w-full md:w-64">
                <SearchableDropdown
                  options={uniqueColleges}
                  value={collegeSearch}
                  onChange={handleCollegeSelect}
                  placeholder="Search college..."
                />
              </div>
              
              <div className="w-full md:w-48">
                <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(e.target.value)
                      setSelectedTeam('Select Team')
                    }}
                    className="w-full appearance-none bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg pl-3 pr-9 py-2 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all">
                    <option>All Years</option>
                    {uniqueYears.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              
              <div className="w-full md:w-48">
                <div className="relative">
                  <select
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    disabled={availableTeams.length === 0}
                    className="w-full appearance-none bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg pl-3 pr-9 py-2 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    <option>Select Team</option>
                    {availableTeams.map((team) => (
                      <option key={team} value={team}>{team}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              
              <div className="flex-1"></div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetFilters}
                  className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                  title="Reset Filters">
                  <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
                <button
                  onClick={handleGetProfessors}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                  <Users className="w-4 h-4" />
                  Professors
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
            {renderDashboard()}
          </div>
        )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <AnimationStyles />
      <LeftSidebar />
      
      <main className="flex-1 px-[2vw] py-[1.5vh] overflow-y-auto [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="max-w-7xl mx-auto">{renderCurrentView()}</div>
      </main>
      <ChartModal chartInfo={enlargedChartInfo} onClose={() => setEnlargedChartInfo(null)} />
    </div>
  )
}

export default Colleges
