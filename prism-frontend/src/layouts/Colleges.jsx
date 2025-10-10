import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Users,
  TrendingUp,
  ChevronDown,
  Download,
  Plus,
  Building2,
  BookOpen,
  Target,
  RefreshCw,
  X,
  ArrowLeft,
  ClipboardList,
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
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate-fadeInUp {
      animation: fadeInUp 0.5s ease-out forwards;
      opacity: 0;
    }
  `}</style>
)

// --- Chart Modal Component for Enlarged View ---
const ChartModal = ({ chartInfo, onClose }) => {
  if (!chartInfo) return null

  const renderChart = () => {
    // Pass isEnlarged prop to modify chart height and disable further clicks
    const chartProps = { data: chartInfo.data, isEnlarged: true }
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
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeInUp"
      style={{ animationDuration: '0.3s' }}
      onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl p-6 relative"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 bg-gray-100 dark:bg-slate-700 rounded-full transition-colors">
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

  const filteredOptions = useMemo(
    () => options.filter((option) => option.name.toLowerCase().includes(value ? value.toLowerCase() : '')),
    [options, value]
  )

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
    onChange(optionName)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-10 py-2 bg-blue-50 dark:bg-slate-700 border border-blue-200 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
        />
        {value ? (
          <button
            onClick={() => onChange('')}
            className="absolute right-9 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-800">
            <X className="w-4 h-4" />
          </button>
        ) : null}
        <button onClick={() => setIsOpen(!isOpen)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1">
          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div
          className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-fadeInUp"
          style={{ animationDuration: '0.3s' }}>
          <ul>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <li
                  key={option.id}
                  onClick={() => handleSelect(option.name)}
                  className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer animate-fadeInUp"
                  style={{ animationDelay: `${index * 20}ms` }}>
                  {option.name}
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-sm text-gray-500">No colleges found.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

// --- Individual Chart Components ---
const WorkletPerformanceChart = ({ data, onEnlarge, isEnlarged = false }) => {
  const performanceData = useMemo(() => {
    if (!data || data.length === 0) return []
    const totalExcellent = data.reduce((sum, college) => sum + college.excellentCount, 0)
    const totalGood = data.reduce((sum, college) => sum + college.goodCount, 0)
    const totalNeedsAttention = data.reduce((sum, college) => sum + college.needsAttentionCount, 0)
    return [
      { name: 'Excellent', value: totalExcellent },
      { name: 'Good', value: totalGood },
      { name: 'Needs Attention', value: totalNeedsAttention },
    ].filter((item) => item.value > 0)
  }, [data])

  const PIE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b']

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg shadow-slate-200/60 dark:shadow-black/20 p-6 transition-all duration-300 ${
        !isEnlarged && 'cursor-pointer hover:shadow-xl hover:-translate-y-1'
      }`}
      onClick={() => !isEnlarged && onEnlarge && onEnlarge('performance', data)}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Overall Worklet Performance</h3>
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
    if (!data || data.length === 0) return { paginatedData: [], pageCount: 0 };

    // 1. Map and sort the data
    const sortedData = [...data]
      .map(college => ({
        name: college.name,
        worklets: college.workletCount,
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

    return { paginatedData, pageCount };
  }, [data, sortOrder, currentPage, ITEMS_PER_PAGE]);

  const { paginatedData, pageCount } = processedData;

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pageCount) {
      setCurrentPage(newPage);
    }
  };

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
            <BarChart layout="vertical" data={paginatedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis type="number" tick={{ fill: 'currentColor' }} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: 'currentColor', fontSize: 10 }}
                width={110}
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
              <Bar dataKey="worklets" fill="#8884d8" name="Worklets" barSize={15} radius={[0, 4, 4, 0]} />
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
  const chartData = useMemo(() => {
    if (!data || data.length !== 1) return []
    return data[0].worklets.map((worklet) => ({
      name: worklet.title,
      studentCount: worklet.assignedStudents.length,
    }))
  }, [data])

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg shadow-slate-200/60 dark:shadow-black/20 p-6 transition-all duration-300 ${
        !isEnlarged && 'cursor-pointer hover:shadow-xl hover:-translate-y-1'
      }`}
      onClick={() => !isEnlarged && onEnlarge && onEnlarge('studentsPerWorklet', data)}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Students per Worklet</h3>
      <div
        className={`w-full text-xs text-gray-600 dark:text-gray-400 ${
          isEnlarged ? 'h-[450px]' : 'h-[250px]'
        } transition-all duration-300`}>
        <ResponsiveContainer>
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis type="number" tick={{ fill: 'currentColor' }} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fill: 'currentColor', width: 110 }}
              style={{ fontSize: '10px' }}
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
            <Bar dataKey="studentCount" name="Students" fill="#82ca9d" barSize={20} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
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
  const navigate = useNavigate()
  const [collegeSearch, setCollegeSearch] = useState('')
  const [selectedYear, setSelectedYear] = useState('All Years')
  const [selectedArea, setSelectedArea] = useState('Select Area')
  const [allCollegeData, setAllCollegeData] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState('dashboard')
  const [enlargedChartInfo, setEnlargedChartInfo] = useState(null) // State for modal

  const rawMockData = [
    {
      id: 1,
      name: 'VIT Vellore',
      infrastructure: 'GPDS',
      areaOfExpertise: ['IoT', 'GenAI'],
      location: 'Vellore, Tamil Nadu',
      established: 1984,
      worklets: [
        {
          id: 101,
          title: 'AI-Powered Chatbot',
          description: 'Develop a customer service chatbot using modern NLP techniques.',
          assignedStudents: [
            { name: 'Anika Sharma', email: 'anika.s@example.com' },
            { name: 'Rohan Gupta', email: 'rohan.g@example.com' },
          ],
          performanceStatus: 'Excellent',
          progressStatus: 'Completed',
        },
        {
          id: 102,
          title: 'Smart Home Automation',
          description: 'Control home appliances remotely via an IoT-enabled mobile app.',
          assignedStudents: [
            { name: 'Siddharth Jain', email: 'sid.j@example.com' },
            { name: 'Meera Reddy', email: 'meera.r@example.com' },
          ],
          performanceStatus: 'Excellent',
          progressStatus: 'Completed',
        },
        {
          id: 103,
          title: 'Sentiment Analysis Model',
          description: 'Build and train a model to analyze product review sentiments.',
          assignedStudents: [
            { name: 'Priya Singh', email: 'priya.s@example.com' },
            { name: 'Arjun Verma', email: 'arjun.v@example.com' },
          ],
          performanceStatus: 'Good',
          progressStatus: 'Ongoing',
        },
        {
          id: 104,
          title: 'E-commerce Recommendation',
          description: 'Design a collaborative filtering engine for product recommendations.',
          assignedStudents: [
            { name: 'Anika Sharma', email: 'anika.s@example.com' },
            { name: 'Vikram Kumar', email: 'vikram.k@example.com' },
          ],
          performanceStatus: 'Good',
          progressStatus: 'On Hold',
        },
        {
          id: 105,
          title: 'IoT Weather Station',
          description: 'Assemble a device to collect and display real-time local weather data.',
          assignedStudents: [
            { name: 'Meera Reddy', email: 'meera.r@example.com' },
            { name: 'Rohan Gupta', email: 'rohan.g@example.com' },
          ],
          performanceStatus: 'Needs Attention',
          progressStatus: 'Ongoing',
        },
      ],
    },
    {
      id: 2,
      name: 'MIT Cambridge',
      infrastructure: 'Premium',
      areaOfExpertise: ['AI & Machine Learning', 'Robotics'],
      location: 'Cambridge, MA',
      established: 1861,
      worklets: [
        {
          id: 201,
          title: 'Robotic Arm Control System',
          description: 'Develop a high-precision inverse kinematics control algorithm.',
          assignedStudents: [
            { name: 'John Doe', email: 'john.d@example.com' },
            { name: 'Jane Smith', email: 'jane.s@example.com' },
          ],
          performanceStatus: 'Excellent',
          progressStatus: 'Completed',
        },
        {
          id: 202,
          title: 'Predictive Analytics Model',
          description: 'Build a time-series model to predict stock market trends.',
          assignedStudents: [
            { name: 'Emily White', email: 'emily.w@example.com' },
            { name: 'Chris Green', email: 'chris.g@example.com' },
          ],
          performanceStatus: 'Excellent',
          progressStatus: 'Completed',
        },
        {
          id: 203,
          title: 'Autonomous Drone Navigation',
          description: 'Implement a SLAM-based system for autonomous drone pathfinding.',
          assignedStudents: [
            { name: 'Peter Jones', email: 'peter.j@example.com' },
            { name: 'John Doe', email: 'john.d@example.com' },
          ],
          performanceStatus: 'Excellent',
          progressStatus: 'Ongoing',
        },
        {
          id: 204,
          title: 'Computer Vision for QC',
          description: 'Use a CNN for automated quality control on a manufacturing line.',
          assignedStudents: [
            { name: 'Jane Smith', email: 'jane.s@example.com' },
            { name: 'Laura Brown', email: 'laura.b@example.com' },
          ],
          performanceStatus: 'Good',
          progressStatus: 'Terminated',
        },
      ],
    },
    {
      id: 3,
      name: 'Stanford University',
      infrastructure: 'Premium',
      areaOfExpertise: ['Cybersecurity', 'Biotech'],
      location: 'Stanford, CA',
      established: 1885,
      worklets: [
        {
          id: 301,
          title: 'Network Intrusion Detection',
          description: 'Implement an ML-based system to detect and flag network anomalies.',
          assignedStudents: [
            { name: 'Michael Chen', email: 'michael.c@example.com' },
            { name: 'Sarah Lee', email: 'sarah.l@example.com' },
          ],
          performanceStatus: 'Excellent',
          progressStatus: 'Completed',
        },
        {
          id: 302,
          title: 'Gene Sequencing Algorithm',
          description: 'Optimize a parallel processing algorithm for faster DNA analysis.',
          assignedStudents: [
            { name: 'David Kim', email: 'david.k@example.com' },
            { name: 'Laura Ortiz', email: 'laura.o@example.com' },
          ],
          performanceStatus: 'Excellent',
          progressStatus: 'On Hold',
        },
        {
          id: 303,
          title: 'Blockchain for Secure Voting',
          description: 'Develop a proof-of-concept decentralized voting application.',
          assignedStudents: [
            { name: 'Ben Carter', email: 'ben.c@example.com' },
            { name: 'Michael Chen', email: 'michael.c@example.com' },
          ],
          performanceStatus: 'Good',
          progressStatus: 'Ongoing',
        },
      ],
    },
  ]

  useEffect(() => {
    setLoading(true)
    const processedData = rawMockData.map((college) => {
      const worklets = college.worklets || []
      const studentMap = new Map()
      worklets.forEach((worklet) => {
        worklet.assignedStudents.forEach((student) => {
          if (!studentMap.has(student.email)) {
            studentMap.set(student.email, student)
          }
        })
      })
      return {
        ...college,
        workletCount: worklets.length,
        excellentCount: worklets.filter((w) => w.performanceStatus === 'Excellent').length,
        goodCount: worklets.filter((w) => w.performanceStatus === 'Good').length,
        needsAttentionCount: worklets.filter((w) => w.performanceStatus === 'Needs Attention').length,
        completedCount: worklets.filter((w) => w.progressStatus === 'Completed').length,
        ongoingCount: worklets.filter((w) => w.progressStatus === 'Ongoing').length,
        onHoldCount: worklets.filter((w) => w.progressStatus === 'On Hold').length,
        terminatedCount: worklets.filter((w) => w.progressStatus === 'Terminated').length,
        totalStudents: studentMap.size,
      }
    })
    setAllCollegeData(processedData)
    setLoading(false)
  }, [])

  const filteredColleges = useMemo(() => {
    if (!allCollegeData) return []

    let collegesToFilter = allCollegeData
    if (collegeSearch) {
      collegesToFilter = allCollegeData.filter((c) => c.name.toLowerCase() === collegeSearch.toLowerCase())
    }

    return collegesToFilter.filter((college) => {
      const yearMatch = selectedYear === 'All Years' || college.established.toString() === selectedYear
      const areaMatch = selectedArea === 'Select Area' || college.areaOfExpertise.includes(selectedArea)
      return yearMatch && areaMatch
    })
  }, [allCollegeData, collegeSearch, selectedYear, selectedArea])

  const handleExport = () => {
    if (filteredColleges.length === 0) {
      alert('No data to export!')
      return
    }
    const headers = ['ID', 'Name', 'Location', 'Total Worklets', 'Excellent', 'Good', 'Needs Attention']
    const csvRows = [
      headers.join(','),
      ...filteredColleges.map((college) =>
        [
          college.id,
          `"${college.name}"`,
          `"${college.location}"`,
          college.workletCount,
          college.excellentCount,
          college.goodCount,
          college.needsAttentionCount,
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

  const handleNewWorklet = () => alert('Opening form to create a new worklet...')

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
    setSelectedArea('Select Area')
  }

  const handleCollegeSelect = (collegeName) => {
    setCollegeSearch(collegeName)
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
        // Handle multi-college aggregated counts
        switch (filter) {
          case 'total':
            count = allCollegeData.reduce((acc, curr) => acc + curr.workletCount, 0)
            break
          case 'ongoing':
            count = allCollegeData.reduce((acc, curr) => acc + curr.ongoingCount, 0)
            break
          case 'completed':
            count = allCollegeData.reduce((acc, curr) => acc + curr.completedCount, 0)
            break
          case 'onhold':
            count = allCollegeData.reduce((acc, curr) => acc + curr.onHoldCount, 0)
            break
          case 'terminated':
            count = allCollegeData.reduce((acc, curr) => acc + curr.terminatedCount, 0)
            break
          case 'students':
            count = allCollegeData.reduce((acc, curr) => acc + curr.totalStudents, 0)
            break
          default:
            count = allCollegeData.reduce((acc, curr) => acc + curr.workletCount, 0)
        }
      } else {
        // Handle single college counts
        const selectedCollege = allCollegeData.find(college => college.name === targetCollege)
        if (selectedCollege) {
          switch (filter) {
            case 'total':
              count = selectedCollege.workletCount
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
      
      navigate('/navColl', {
        state: {
          filter,
          collegeName: targetCollege,
          count,
          year: selectedYear,
          area: selectedArea
        }
      })
    } else {
      alert('Please select a college first')
    }
  }

  const renderDashboard = () => {
    // Single College View Layout
    if (filteredColleges.length === 1 && collegeSearch) {
      const college = filteredColleges[0]
      // Calculate total worklets as the sum of all status counts
      const totalWorklets =
        (college.completedCount || 0) +
        (college.ongoingCount || 0) +
        (college.onHoldCount || 0) +
        (college.terminatedCount || 0)
      return (
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg shadow-slate-200/60 dark:shadow-black/20">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">College Overview</h3>
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
                      Excellent
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Good
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Needs Attention
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {filteredColleges.map((college) => {
                    const totalWorkletsRow =
                      (college.completedCount || 0) +
                      (college.ongoingCount || 0) +
                      (college.onHoldCount || 0) +
                      (college.terminatedCount || 0)
                    return (
                      <tr key={college.id} className="animate-fadeInUp" style={{ animationDelay: '100ms' }}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg mr-3">
                              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{college.name}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{college.location}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-900 dark:text-white">
                          {totalWorkletsRow}
                        </td>
                        <td className="px-6 py-4 text-sm text-center font-medium text-blue-600 dark:text-blue-400">
                          {college.excellentCount}
                        </td>
                        <td className="px-6 py-4 text-sm text-center font-medium text-green-600 dark:text-green-400">
                          {college.goodCount}
                        </td>
                        <td className="px-6 py-4 text-sm text-center font-medium text-yellow-600 dark:text-yellow-400">
                          {college.needsAttentionCount}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
            <button
              onClick={() => handleNavigateToFilter('total')}
              className="text-left bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg shadow-slate-200/60 dark:shadow-black/20 hover:ring-2 hover:ring-purple-500 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalWorklets}</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </button>
            <button
              onClick={() => handleNavigateToFilter('ongoing')}
              className="text-left bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg shadow-slate-200/60 dark:shadow-black/20 hover:ring-2 hover:ring-blue-500 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ongoing</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{college.ongoingCount}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </button>
            <button
              onClick={() => handleNavigateToFilter('completed')}
              className="text-left bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg shadow-slate-200/60 dark:shadow-black/20 hover:ring-2 hover:ring-green-500 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{college.completedCount}</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </button>
            <button
              onClick={() => handleNavigateToFilter('onhold')}
              className="text-left bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg shadow-slate-200/60 dark:shadow-black/20 hover:ring-2 hover:ring-yellow-500 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">On Hold</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{college.onHoldCount}</p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <PauseCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </button>
            <button
              onClick={() => handleNavigateToFilter('terminated')}
              className="text-left bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg shadow-slate-200/60 dark:shadow-black/20 hover:ring-2 hover:ring-red-500 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Terminated</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{college.terminatedCount}</p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </button>
            <button
              onClick={() => handleNavigateToFilter('students')}
              className="text-left bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg shadow-slate-200/60 dark:shadow-black/20 hover:ring-2 hover:ring-indigo-500 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Students</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{college.totalStudents}</p>
                </div>
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                  <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <WorkletPerformanceChart data={filteredColleges} onEnlarge={handleEnlargeChart} />
            <StudentsPerWorkletChart data={filteredColleges} onEnlarge={handleEnlargeChart} />
          </div>
        </div>
      )
    }

    // Default Multi-College View Layout
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {filteredColleges.length > 1 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg shadow-slate-200/60 dark:shadow-black/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Colleges</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredColleges.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={() => handleNavigateToFilter('total', 'All Colleges')}
              className="text-left bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg shadow-slate-200/60 dark:shadow-black/20 hover:ring-2 hover:ring-purple-500 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Worklets</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {allCollegeData.reduce(
                      (acc, curr) =>
                        acc +
                        (curr.completedCount || 0) +
                        (curr.ongoingCount || 0) +
                        (curr.onHoldCount || 0) +
                        (curr.terminatedCount || 0),
                      0
                    )}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </button>
            <button
              onClick={() => handleNavigateToFilter('students', 'All Colleges')}
              className="text-left bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg shadow-slate-200/60 dark:shadow-black/20 hover:ring-2 hover:ring-indigo-500 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {allCollegeData.reduce((acc, curr) => acc + curr.totalStudents, 0)}
                  </p>
                </div>
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                  <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
            </button>
            <button
              onClick={() => handleNavigateToFilter('ongoing', 'All Colleges')}
              className="text-left bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg shadow-slate-200/60 dark:shadow-black/20 hover:ring-2 hover:ring-blue-500 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ongoing</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {allCollegeData.reduce((acc, curr) => acc + curr.ongoingCount, 0)}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </button>
            <button
              onClick={() => handleNavigateToFilter('completed', 'All Colleges')}
              className="text-left bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg shadow-slate-200/60 dark:shadow-black/20 hover:ring-2 hover:ring-green-500 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {allCollegeData.reduce((acc, curr) => acc + curr.completedCount, 0)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </button>
            <button
              onClick={() => handleNavigateToFilter('onhold', 'All Colleges')}
              className="text-left bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg shadow-slate-200/60 dark:shadow-black/20 hover:ring-2 hover:ring-yellow-500 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">On Hold</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {allCollegeData.reduce((acc, curr) => acc + curr.onHoldCount, 0)}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <PauseCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </button>
            <button
              onClick={() => handleNavigateToFilter('terminated', 'All Colleges')}
              className="text-left bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg shadow-slate-200/60 dark:shadow-black/20 hover:ring-2 hover:ring-red-500 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Terminated</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {allCollegeData.reduce((acc, curr) => acc + curr.terminatedCount, 0)}
                  </p>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </button>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg shadow-slate-200/60 dark:shadow-black/20">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">College Overview</h3>
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
                      Excellent
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Good
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Needs Attention
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        Loading...
                      </td>
                    </tr>
                  ) : (
                    filteredColleges.map((college, index) => (
                      <tr
                        key={college.id}
                        onClick={() => handleCollegeSelect(college.name)}
                        className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer animate-fadeInUp"
                        style={{ animationDelay: `${index * 50}ms` }}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg mr-3">
                              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {college.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{college.location}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-gray-900 dark:text-white">
                          {college.workletCount}
                        </td>
                        <td className="px-6 py-4 text-sm text-center font-medium text-blue-600 dark:text-blue-400">
                          {college.excellentCount}
                        </td>
                        <td className="px-6 py-4 text-sm text-center font-medium text-green-600 dark:text-green-400">
                          {college.goodCount}
                        </td>
                        <td className="px-6 py-4 text-sm text-center font-medium text-yellow-600 dark:text-yellow-400">
                          {college.needsAttentionCount}
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
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-200 dark:to-slate-400">
              College Management
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {collegeSearch
                ? `Displaying data for ${collegeSearch}`
                : 'Monitor and manage college partnerships and worklet performance'}
            </p>
          </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleNewWorklet}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-95">
                  <Plus className="w-4 h-4 mr-2" />
                  New Worklet
                </button>
              </div>
            </div>
            <div className="flex flex-col md:flex-row flex-wrap items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-md shadow-slate-200/50 dark:shadow-black/20 mb-8">
              <div className="w-full md:w-64">
                <SearchableDropdown
                  options={rawMockData}
                  value={collegeSearch}
                  onChange={handleCollegeSelect}
                  placeholder="Search or select college..."
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Year:</label>
                <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="appearance-none bg-green-50 dark:bg-slate-700 border border-green-200 dark:border-slate-600 rounded-lg px-4 py-2 pr-8 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200">
                    <option>All Years</option>
                    <option>2025</option>
                    <option>2024</option>
                    <option>2023</option>
                    <option>1984</option>
                    <option>1958</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Area:</label>
                <div className="relative">
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="appearance-none bg-purple-50 dark:bg-slate-700 border border-purple-200 dark:border-slate-600 rounded-lg px-4 py-2 pr-8 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200">
                    <option>Select Area</option>
                    <option>AI & Machine Learning</option>
                    <option>IoT</option>
                    <option>GenAI</option>
                    <option>Web Development</option>
                    <option>Data Science</option>
                    <option>Cybersecurity</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
              <div className="flex-1"></div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleResetFilters}
                  className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-transform hover:scale-105 active:scale-95"
                  title="Reset Filters">
                  <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
                <button
                  onClick={handleGetProfessors}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-transform hover:scale-105 active:scale-95">
                  <Users className="w-4 h-4 mr-2" />
                  Get Professors
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-transform hover:scale-105 active:scale-95">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
              </div>
            </div>
            {renderDashboard()}
          </div>
        )
    }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <AnimationStyles />
      <LeftSidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-200 [&::-webkit-scrollbar-thumb]:bg-slate-400 dark:[&::-webkit-scrollbar-track]:bg-slate-800 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600">
        <div className="max-w-7xl mx-auto">{renderCurrentView()}</div>
      </main>
      <ChartModal chartInfo={enlargedChartInfo} onClose={() => setEnlargedChartInfo(null)} />
    </div>
  )
}

export default Colleges