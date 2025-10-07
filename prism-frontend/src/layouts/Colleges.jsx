import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Users, 
  Award, 
  TrendingUp, 
  Calendar,
  MapPin,
  ChevronDown,
  BarChart3,
  PieChart,
  Download,
  Plus,
  Building2,
  GraduationCap,
  BookOpen,
  Target
} from 'lucide-react';
import LeftSidebar from '../components/Left';

const Colleges = () => {
  const [selectedCollege, setSelectedCollege] = useState('All Colleges');
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [selectedArea, setSelectedArea] = useState('Select Area');
  const [collegeData, setCollegeData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock college data - replace with API call
  const mockCollegeData = [
    {
      id: 1,
      name: 'VIT Vellore',
      infrastructure: 'GPDS',
      areaOfExpertise: 'IoT, GenAI',
      workletCount: 20,
      excellentCount: 9,
      location: 'Vellore, Tamil Nadu',
      established: '1984',
      rating: 4.5,
      students: 45000,
      faculty: 2500
    },
    {
      id: 2,
      name: 'MIT Cambridge',
      infrastructure: 'GPDS',
      areaOfExpertise: 'AI, ML, Robotics',
      workletCount: 35,
      excellentCount: 28,
      location: 'Cambridge, MA',
      established: '1861',
      rating: 4.9,
      students: 11500,
      faculty: 3000
    },
    {
      id: 3,
      name: 'Stanford University',
      infrastructure: 'Premium',
      areaOfExpertise: 'CS, AI, Biotech',
      workletCount: 42,
      excellentCount: 35,
      location: 'Stanford, CA',
      established: '1885',
      rating: 4.8,
      students: 17000,
      faculty: 2200
    },
    {
      id: 4,
      name: 'IIT Bombay',
      infrastructure: 'GPDS',
      areaOfExpertise: 'Engineering, Tech',
      workletCount: 28,
      excellentCount: 22,
      location: 'Mumbai, Maharashtra',
      established: '1958',
      rating: 4.7,
      students: 12000,
      faculty: 850
    }
  ];

  const chartData = [
    { college: 'VIT', vit: 15, srm: 0, amity: 0 },
    { college: 'SRM', vit: 0, srm: 12, amity: 0 },
    { college: 'Amity', vit: 0, srm: 0, amity: 8 },
  ];

  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setCollegeData(mockCollegeData);
      setLoading(false);
    }, 1000);
  }, []);

  const handleExport = () => {
    console.log('Exporting data...');
    // Add export functionality
  };

  const handleNewWorklet = () => {
    console.log('Creating new worklet...');
    // Add new worklet functionality
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <LeftSidebar />
      
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-200 [&::-webkit-scrollbar-thumb]:bg-slate-400 dark:[&::-webkit-scrollbar-track]:bg-slate-800 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-black dark:text-white">
                  College Management
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Monitor and manage college partnerships and worklet performance
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleNewWorklet}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Worklet
                </button>
                <button className="p-2 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                  <Filter className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
              {/* College Selector */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">College:</label>
                <div className="relative">
                  <select
                    value={selectedCollege}
                    onChange={(e) => setSelectedCollege(e.target.value)}
                    className="appearance-none bg-blue-50 dark:bg-slate-700 border border-blue-200 dark:border-slate-600 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option>All Colleges</option>
                    <option>VIT Vellore</option>
                    <option>MIT Cambridge</option>
                    <option>Stanford University</option>
                    <option>IIT Bombay</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                </div>
              </div>

              {/* Year Selector */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Year:</label>
                <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="appearance-none bg-green-50 dark:bg-slate-700 border border-green-200 dark:border-slate-600 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option>All Years</option>
                    <option>2024</option>
                    <option>2023</option>
                    <option>2022</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                </div>
              </div>

              {/* Area Selector */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Area:</label>
                <div className="relative">
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="appearance-none bg-purple-50 dark:bg-slate-700 border border-purple-200 dark:border-slate-600 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option>Select Area</option>
                    <option>AI & Machine Learning</option>
                    <option>IoT & Hardware</option>
                    <option>Web Development</option>
                    <option>Data Science</option>
                    <option>Cybersecurity</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                </div>
              </div>

              <div className="flex-1"></div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  <Users className="w-4 h-4 mr-2" />
                  Get Professors
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Section - Statistics Cards and College Table */}
            <div className="lg:col-span-2 space-y-6">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Colleges</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Worklets</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">125</p>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Students</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">1,240</p>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* College Overview Table - Below Statistics */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">College Overview</h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">College Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Infrastructure Available</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Area of Expertise/AoE</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Worklets in AoE</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Excellent AoE Worklets</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                      {loading ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                            Loading colleges...
                          </td>
                        </tr>
                      ) : (
                        collegeData.map((college) => (
                          <tr key={college.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                            <td className="px-6 py-4">
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
                            <td className="px-6 py-4">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">
                                {college.infrastructure}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{college.areaOfExpertise}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{college.workletCount}</td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{college.excellentCount}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Section - Charts */}
            <div className="space-y-6">
              {/* Worklet Distribution Chart */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Worklet Distribution by AoE and College</h3>
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <BarChart3 className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Simple Bar Chart Representation */}
                <div className="space-y-4">
                  {chartData.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{item.college}</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {item.vit + item.srm + item.amity}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{width: `${((item.vit + item.srm + item.amity) / 15) * 100}%`}}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Chart */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Worklet Performance by AoE and College</h3>
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <TrendingUp className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Performance Metrics */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Excellent</span>
                    </div>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">65%</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Good</span>
                    </div>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">25%</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Needs Attention</span>
                    </div>
                    <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">10%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Colleges;