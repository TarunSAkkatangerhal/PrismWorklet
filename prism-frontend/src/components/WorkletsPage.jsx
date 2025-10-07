import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { 
  Calendar, 
  Users, 
  LayoutGrid,
  List,
  Search,
  Filter,
  Clock,
  ChevronRight,
  Building2,
  User,
  AlertCircle,
  CheckCircle,
  Circle
} from "lucide-react";
import LeftSidebar from "./Left";

const STATUS_OPTIONS = ["All", "Ongoing", "Completed", "Under Review"];

export default function WorkletsPage() {
  const [workletsData, setWorkletsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Ongoing");
  const [layout, setLayout] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");

  // Sample data - replace with actual API call
  const sampleWorklets = [
    {
      id: 'AI2024B1',
      title: 'AI-Powered Predictive Analytics Engine',
      status: 'Ongoing',
      progress: 85,
      description: 'Develop a scalable engine for real-time sales forecasting using machine learning models and historical data analysis.',
      startDate: 'Sep 1, 2024',
      endDate: 'Dec 15, 2024',
      students: 4,
      college: 'VIT Vellore',
      mentor: 'Dr. Sarah Johnson',
      category: 'Artificial Intelligence'
    },
    {
      id: 'WD2024C2',
      title: 'Cross-Platform Mobile Application Framework',
      status: 'Ongoing',
      progress: 62,
      description: 'Build a comprehensive framework to streamline mobile app development across iOS and Android platforms with React Native.',
      startDate: 'Aug 15, 2024',
      endDate: 'Nov 30, 2024',
      students: 3,
      college: 'MIT Cambridge',
      mentor: 'Prof. Michael Rodriguez',
      category: 'Web Development'
    },
    {
      id: 'IOT2024D3',
      title: 'IoT Smart Home Hub Integration',
      status: 'Ongoing',
      progress: 45,
      description: 'Integrate advanced smart sensors into existing IoT home automation ecosystem with real-time monitoring capabilities.',
      startDate: 'Oct 1, 2024',
      endDate: 'Jan 20, 2025',
      students: 5,
      college: 'Stanford University',
      mentor: 'Dr. Emily Watson',
      category: 'Internet of Things'
    },
    {
      id: 'CY2024E4',
      title: 'Cloud Infrastructure Security Audit',
      status: 'Completed',
      progress: 100,
      description: 'Comprehensive security audit and penetration testing of cloud infrastructure with detailed vulnerability assessment.',
      startDate: 'Jul 10, 2024',
      endDate: 'Sep 25, 2024',
      students: 2,
      college: 'IIT Bombay',
      mentor: 'Prof. Rajesh Kumar',
      category: 'Cybersecurity'
    },
    {
      id: 'BC2024F5',
      title: 'Blockchain Supply Chain Tracker',
      status: 'Under Review',
      progress: 78,
      description: 'Develop a transparent supply chain tracking system using blockchain technology for enhanced product authenticity.',
      startDate: 'Sep 20, 2024',
      endDate: 'Dec 30, 2024',
      students: 3,
      college: 'Carnegie Mellon',
      mentor: 'Prof. Lisa Chen',
      category: 'Blockchain'
    },
    {
      id: 'ML2024G6',
      title: 'Machine Learning Image Recognition System',
      status: 'Completed',
      progress: 100,
      description: 'Advanced image recognition system for medical diagnosis using convolutional neural networks and deep learning.',
      startDate: 'Jun 1, 2024',
      endDate: 'Aug 30, 2024',
      students: 4,
      college: 'Harvard University',
      mentor: 'Dr. Alexander Kim',
      category: 'Machine Learning'
    }
  ];

  useEffect(() => {
    setWorkletsData(sampleWorklets);
    setLoading(false);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Ongoing': return <Circle className="w-4 h-4 text-blue-500 fill-current" />;
      case 'Completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Under Review': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Ongoing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'Under Review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredWorklets = workletsData.filter(worklet => {
    const matchesTab = activeTab === "All" || worklet.status === activeTab;
    const matchesSearch = worklet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         worklet.college.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         worklet.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getTabCount = (status) => {
    return status === "All" ? workletsData.length : workletsData.filter(w => w.status === status).length;
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-100 dark:bg-slate-900">
        <LeftSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading worklets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <LeftSidebar />
      
      <main className="flex-1 overflow-y-auto">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto p-6">
          
          {/* Enhanced Header */}
          <div className="mb-8 bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-black dark:text-white mb-3">
                  Worklets Overview
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Manage and track project progress across all teams
                </p>
              </div>
              <div className="hidden lg:flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{workletsData.length}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Total Projects</div>
                </div>
                <div className="w-px h-12 bg-gradient-to-b from-transparent via-slate-300 dark:via-slate-600 to-transparent"></div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{getTabCount("Ongoing")}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Active</div>
                </div>
                <div className="w-px h-12 bg-gradient-to-b from-transparent via-slate-300 dark:via-slate-600 to-transparent"></div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{getTabCount("Completed")}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Completed</div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Controls */}
          <div className="flex flex-col lg:flex-row gap-6 mb-8">
            
            {/* Enhanced Search */}
            <div className="relative flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search worklets, colleges, or categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-0 rounded-2xl shadow-lg
                           bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg
                           text-slate-900 dark:text-slate-100 placeholder-slate-500
                           focus:ring-2 focus:ring-blue-500/50 focus:shadow-xl
                           transition-all duration-300"
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-indigo-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </div>

            {/* Enhanced Layout Toggle */}
            <div className="flex bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg rounded-2xl border border-white/20 dark:border-slate-700/50 p-2 shadow-lg">
              <button
                onClick={() => setLayout("grid")}
                className={`p-3 rounded-xl transition-all duration-300 ${
                  layout === "grid" 
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setLayout("list")}
                className={`p-3 rounded-xl transition-all duration-300 ${
                  layout === "list" 
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Enhanced Status Tabs */}
          <div className="flex flex-wrap gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg rounded-2xl p-3 mb-8 border border-white/20 dark:border-slate-700/50 shadow-lg">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === status
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:shadow-md"
                }`}
              >
                <span className="text-sm font-medium">{status}</span>
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                  activeTab === status 
                    ? "bg-white/20 text-white backdrop-blur-sm"
                    : "bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 text-slate-700 dark:text-slate-300"
                }`}>
                  {getTabCount(status)}
                </span>
              </button>
            ))}
          </div>

          {/* Enhanced Worklets Grid/List */}
          {layout === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredWorklets.map((worklet, index) => (
                <Link key={worklet.id} to={`/worklet/${worklet.id}`}>
                  <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 
                                hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:border-blue-300/50 dark:hover:border-blue-600/50 
                                group cursor-pointer hover:-translate-y-2 hover:scale-[1.02] transform-gpu"
                       style={{ animationDelay: `${index * 100}ms` }}>
                    
                    {/* Gradient Accent */}
                    <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-t-2xl"></div>
                    
                    {/* Card Header */}
                    <div className="p-8 pb-6">
                      <div className="flex items-start mb-4">
                        <div className="flex items-center space-x-3">
                          <span className="px-3 py-1 text-xs font-mono font-bold bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-700 dark:text-slate-300 rounded-lg">
                            {worklet.id}
                          </span>
                        </div>
                      </div>
                      
                      <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 mb-3 line-clamp-2 
                                   group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 leading-tight">
                        {worklet.title}
                      </h3>
                      
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-6 leading-relaxed">
                        {worklet.description}
                      </p>

                      {/* Enhanced Progress Bar */}
                      <div className="mb-6">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">Progress</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">{worklet.progress}%</span>
                        </div>
                        <div className="w-full bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-full h-3 shadow-inner">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full shadow-lg transition-all duration-700 relative overflow-hidden"
                            style={{ width: `${worklet.progress}%` }}
                          >
                            <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Status Badge */}
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold shadow-lg ${getStatusColor(worklet.status)}`}>
                          {worklet.status}
                        </span>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {worklet.category}
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Card Footer */}
                    <div className="px-8 py-6 bg-gradient-to-r from-slate-50/80 to-white/80 dark:from-slate-700/30 dark:to-slate-800/50 
                                  border-t border-slate-200/50 dark:border-slate-600/50 rounded-b-2xl backdrop-blur-sm">
                      <div className="flex items-center justify-between text-sm mb-3">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                              <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="font-medium">{worklet.students}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                              <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <span className="font-medium">{worklet.endDate}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 
                                               transition-all duration-300 group-hover:translate-x-1" />
                      </div>
                      
                      <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                        <Building2 className="w-3 h-3" />
                        <span className="truncate font-medium">{worklet.college}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-slate-50 to-blue-50/30 dark:from-slate-700 dark:to-slate-600">
                    <tr>
                      <th className="px-8 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Worklet
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Team
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-8 py-4 text-left text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        College
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-slate-600/50">
                    {filteredWorklets.map((worklet, index) => (
                      <tr key={worklet.id} 
                          className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-slate-700/50 dark:hover:to-slate-600/50 transition-all duration-300 group"
                          style={{ animationDelay: `${index * 50}ms` }}>
                        <td className="px-8 py-6">
                          <Link to={`/worklet/${worklet.id}`} className="group/link">
                            <div>
                              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover/link:text-blue-600 dark:group-hover/link:text-blue-400 transition-colors duration-300 mb-1">
                                {worklet.title}
                              </div>
                              <div className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-md inline-block">
                                {worklet.id}
                              </div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`inline-flex px-4 py-2 rounded-xl text-xs font-bold shadow-md ${getStatusColor(worklet.status)}`}>
                            {worklet.status}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-20 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-500 rounded-full h-3 shadow-inner">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full shadow-lg transition-all duration-500"
                                style={{ width: `${worklet.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{worklet.progress}%</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-sm font-medium">{worklet.students}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <span className="text-sm font-medium">{worklet.endDate}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                              <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="text-sm font-medium truncate max-w-32">{worklet.college}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Enhanced Empty State */}
          {filteredWorklets.length === 0 && (
            <div className="text-center py-16">
              <div className="relative mx-auto mb-8">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 
                              rounded-3xl flex items-center justify-center shadow-2xl">
                  <Search className="w-12 h-12 text-blue-500" />
                </div>
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-xl"></div>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent mb-3">
                No worklets found
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-lg mb-6 max-w-md mx-auto">
                Try adjusting your search criteria or explore different categories to discover projects.
              </p>
              <button 
                onClick={() => {setSearchTerm(""); setActiveTab("All");}}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl 
                         hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}