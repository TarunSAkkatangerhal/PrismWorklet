import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { 
  Calendar, 
  Users, 
  Home,
  LayoutGrid,
  List,
  Star,
  Clock,
  TrendingUp,
  Award,
  Target
} from "lucide-react";

// --- IMPORT DATA FROM THE NEW FILE ---
import { STATUS_OPTIONS, statusIcons } from "./data";

// Enhanced professional animations with modern motion design
const animationStyles = `
  @keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  
  @keyframes float-slow {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-12px) rotate(3deg); }
  }
  
  @keyframes float-medium {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-8px) rotate(-2deg); }
  }
  
  @keyframes float-fast {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-6px) rotate(6deg); }
  }

  @keyframes fade-in-up {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
    50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.3); }
  }

  @keyframes card-hover {
    0% { transform: translateY(0) scale(1); }
    100% { transform: translateY(-8px) scale(1.02); }
  }
  
  .animate-gradient-shift { animation: gradient-shift 10s ease infinite; }
  .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
  .animate-float-medium { animation: float-medium 6s ease-in-out infinite; }
  .animate-float-fast { animation: float-fast 4s ease-in-out infinite; }
  .animate-fade-in-up { animation: fade-in-up 0.6s ease-out forwards; }
  .animate-shimmer::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    animation: shimmer 2s ease-in-out infinite;
  }
  .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
  .hover-lift:hover { animation: card-hover 0.3s ease-out forwards; }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = animationStyles;
  document.head.appendChild(styleSheet);
}

export default function WorkletsPage() {
  const location = useLocation();
  const [workletsData, setWorkletsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Ongoing");
  const [isHoverActive, setIsHoverActive] = useState(false);
  const [layout, setLayout] = useState("grid"); // 'grid' or 'list'

  // Enhanced professional gradient backgrounds with modern color science
  const generateWorkletGradient = (quality, progress) => {
    const baseGradients = {
      'Excellence': [
        `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
        `linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)`,
        `linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)`,
        `linear-gradient(135deg, #fa709a 0%, #fee140 100%)`
      ],
      'Good': [
        `linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)`,
        `linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)`,
        `linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)`,
        `linear-gradient(135deg, #96fbc4 0%, #f9f586 100%)`
      ],
      'Needs Attention': [
        `linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%)`,
        `linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)`,
        `linear-gradient(135deg, #ff512f 0%, #f09819 100%)`,
        `linear-gradient(135deg, #e65c00 0%, #f9d423 100%)`
      ],
      default: [
        `linear-gradient(135deg, #636363 0%, #a2a2a2 100%)`,
        `linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)`,
        `linear-gradient(135deg, #757f9a 0%, #d7dde8 100%)`,
        `linear-gradient(135deg, #485563 0%, #29323c 100%)`
      ]
    };
    
    const gradients = baseGradients[quality] || baseGradients.default;
    const index = Math.floor(progress / 25) % gradients.length;
    return gradients[index];
  };

  // Enhanced category abbreviations with icons
  const getCategoryData = (category) => {
    const categoryMap = {
      'Artificial Intelligence': { abbrev: 'AI', icon: '🤖', color: 'from-purple-500 to-pink-500' },
      'Web Development': { abbrev: 'WEB', icon: '💻', color: 'from-blue-500 to-cyan-500' },
      'Internet of Things': { abbrev: 'IOT', icon: '🌐', color: 'from-green-500 to-teal-500' },
      'Cybersecurity': { abbrev: 'SEC', icon: '🛡️', color: 'from-red-500 to-orange-500' },
      'Blockchain': { abbrev: 'BC', icon: '⛓️', color: 'from-yellow-500 to-orange-500' },
      'Augmented Reality': { abbrev: 'AR', icon: '🥽', color: 'from-indigo-500 to-purple-500' },
      'Machine Learning': { abbrev: 'ML', icon: '🧠', color: 'from-pink-500 to-rose-500' },
      'Robotics': { abbrev: 'ROB', icon: '🤖', color: 'from-gray-500 to-slate-500' }
    };
    return categoryMap[category] || { abbrev: 'TECH', icon: '⚡', color: 'from-gray-400 to-gray-600' };
  };

  // Static worklets data for frontend development
  useEffect(() => {
    setLoading(true);
    
    // Simulate API loading delay
    setTimeout(() => {
      const staticWorklets = [
        {
          id: 'AI2024B1',
          title: 'AI-Powered Predictive Analytics Engine',
          status: 'Ongoing',
          progress: 85,
          description: 'Develop a scalable engine for real-time sales forecasting using machine learning models and historical data analysis.',
          startDate: 'Sep 1, 2024',
          endDate: 'Dec 15, 2024',
          students: ['Alice Johnson', 'Bob Williams', 'Charlie Brown', 'Diana Miller'],
          notificationCount: 3,
          quality: 'Excellence',
          college: 'VIT Vellore',
          mentor: 'Dr. Sarah Chen',
          category: 'Artificial Intelligence',
          priority: 'High'
        },
        {
          id: 'WD2024C2',
          title: 'Cross-Platform Mobile Application Framework',
          status: 'Ongoing',
          progress: 62,
          description: 'Build a comprehensive framework to streamline mobile app development across iOS and Android platforms with React Native.',
          startDate: 'Aug 15, 2024',
          endDate: 'Nov 30, 2024',
          students: ['Eve Davis', 'Frank White', 'Grace Taylor'],
          notificationCount: 1,
          quality: 'Good',
          college: 'MIT Cambridge',
          mentor: 'Prof. Michael Rodriguez',
          category: 'Web Development',
          priority: 'Medium'
        },
        {
          id: 'IOT2024D3',
          title: 'IoT Smart Home Hub Integration',
          status: 'Ongoing',
          progress: 45,
          description: 'Integrate advanced smart sensors into existing IoT home automation ecosystem with real-time monitoring capabilities.',
          startDate: 'Oct 1, 2024',
          endDate: 'Jan 20, 2025',
          students: ['Heidi Clark', 'Ivan Rodriguez', 'Julia Martinez', 'Kevin Zhang', 'Lisa Park'],
          notificationCount: 0,
          quality: 'Needs Attention',
          college: 'Stanford University',
          mentor: 'Dr. Emily Watson',
          category: 'Internet of Things',
          priority: 'High'
        },
        {
          id: 'CY2024E4',
          title: 'Cloud Infrastructure Security Audit',
          status: 'Completed',
          progress: 100,
          description: 'Comprehensive security audit and penetration testing of cloud infrastructure with detailed vulnerability assessment.',
          startDate: 'Jul 10, 2024',
          endDate: 'Sep 25, 2024',
          students: ['Mark Thompson', 'Nina Patel'],
          notificationCount: 0,
          quality: 'Excellence',
          college: 'IIT Bombay',
          mentor: 'Prof. Rajesh Kumar',
          category: 'Cybersecurity',
          priority: 'Critical'
        },
        {
          id: 'BC2024F5',
          title: 'Blockchain Supply Chain Tracker',
          status: 'Ongoing',
          progress: 78,
          description: 'Develop a transparent supply chain tracking system using blockchain technology for enhanced product authenticity.',
          startDate: 'Sep 20, 2024',
          endDate: 'Dec 30, 2024',
          students: ['Oliver Smith', 'Priya Gupta', 'Quinn Johnson'],
          notificationCount: 2,
          quality: 'Excellence',
          college: 'Carnegie Mellon',
          mentor: 'Dr. Amanda Foster',
          category: 'Blockchain',
          priority: 'Medium'
        },
        {
          id: 'AR2024G6',
          title: 'Augmented Reality Learning Platform',
          status: 'Ongoing',
          progress: 35,
          description: 'Create an immersive AR platform for interactive learning experiences in science and engineering education.',
          startDate: 'Oct 15, 2024',
          endDate: 'Feb 28, 2025',
          students: ['Ryan Lee', 'Sophia Wilson', 'Thomas Brown', 'Uma Sharma'],
          notificationCount: 1,
          quality: 'Good',
          college: 'SRM Chennai',
          mentor: 'Prof. James Liu',
          category: 'Augmented Reality',
          priority: 'Low'
        },
        {
          id: 'ML2024H7',
          title: 'Machine Learning Healthcare Diagnostics',
          status: 'Completed',
          progress: 100,
          description: 'AI-powered diagnostic tool for early disease detection using medical imaging and machine learning algorithms.',
          startDate: 'Jun 1, 2024',
          endDate: 'Aug 30, 2024',
          students: ['Victoria Chang', 'William Davis', 'Xander Miller'],
          notificationCount: 0,
          quality: 'Excellence',
          college: 'Harvard Medical',
          mentor: 'Dr. Jennifer Adams',
          category: 'Machine Learning',
          priority: 'Critical'
        },
        {
          id: 'RB2024I8',
          title: 'Autonomous Robotics Navigation System',
          status: 'Ongoing',
          progress: 55,
          description: 'Advanced autonomous navigation system for robotics applications using computer vision and sensor fusion.',
          startDate: 'Sep 5, 2024',
          endDate: 'Jan 15, 2025',
          students: ['Yuki Tanaka', 'Zoe Anderson', 'Aaron Clark'],
          notificationCount: 4,
          quality: 'Good',
          college: 'MIT RoboLab',
          mentor: 'Prof. David Kim',
          category: 'Robotics',
          priority: 'High'
        }
      ];

      // Add enhanced visual data to each worklet
      const workletsWithVisuals = staticWorklets.map((worklet, index) => ({
        ...worklet,
        gradient: generateWorkletGradient(worklet.quality, worklet.progress),
        categoryData: getCategoryData(worklet.category),
        teamId: worklet.id.substring(0, 2), // Extract first 2 chars as team identifier
        animationDelay: index * 100 // Staggered animations
      }));
      
      setWorkletsData(workletsWithVisuals);
      setLoading(false);
    }, 800); // Simulate loading delay
  }, []);

  const filteredWorklets = workletsData.filter(
    (w) => w.status === activeTab
  );

  // Calculate counts for all statuses for tooltips
  const getStatusCount = (status) => {
    return workletsData.filter(w => w.status === status).length;
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-black text-gray-800 dark:text-gray-200">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-xl font-semibold text-gray-700 dark:text-gray-300 animate-pulse">
              Loading amazing worklets...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-black text-gray-800 dark:text-gray-200">
      {/* --- ENHANCED SIDEBAR --- */}
      <nav 
        className="w-20 transition-all duration-700 ease-in-out bg-gradient-to-b from-white/90 via-blue-50/90 to-indigo-100/90 dark:from-slate-800/90 dark:via-slate-900/90 dark:to-black/90 backdrop-blur-lg border-r border-blue-200/50 dark:border-slate-700/50 shadow-2xl flex flex-col z-20 relative overflow-hidden"
        onMouseEnter={() => setIsHoverActive(true)}
        onMouseLeave={() => setIsHoverActive(false)}
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute top-10 left-2 w-8 h-8 bg-blue-500 rounded-lg animate-float-slow"></div>
          <div className="absolute top-32 right-2 w-6 h-6 bg-purple-500 rounded-full animate-float-medium"></div>
          <div className="absolute bottom-32 left-3 w-4 h-4 bg-indigo-500 rounded animate-float-fast"></div>
        </div>

        <div className="h-20 flex items-center justify-center relative z-10">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-purple-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
                <img src="https://play-lh.googleusercontent.com/e8F34JODgtXalC7mK09QocqhT5QCqDBPRPclFZmkcWZFc_oy2FCpofb5AFdyG_1hdg=w480-h960-rw" alt="Prism" className="object-contain w-8 h-8"/>
            </div>
        </div>
        
        <div className="flex-grow flex flex-col items-center justify-center space-y-6 w-full relative z-10">
          <Link
            to="/home"
            className="relative w-full h-14 flex justify-center items-center text-slate-600 hover:text-white dark:text-slate-300 dark:hover:text-white transition-all duration-500 ease-out rounded-xl overflow-hidden group"
          >
            {/* Black Sweep Background Animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-gray-900 to-black transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out rounded-xl"></div>
            
            <Home size={24} className="relative z-10 transition-all duration-300 group-hover:scale-125 drop-shadow-lg" />
            
            {/* Enhanced Label */}
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-3 px-4 py-2 bg-black text-white text-sm font-bold rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap z-[100] pointer-events-none scale-95 group-hover:scale-100">
              Home
              {/* Arrow */}
              <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-6 border-transparent border-r-black"></div>
            </div>
          </Link>
          
          <div className="w-full space-y-3">
            {STATUS_OPTIONS.map((status, index) => (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={`relative w-full h-14 flex justify-center items-center rounded-xl transition-all duration-500 ease-out overflow-hidden group ${
                  activeTab === status
                    ? "bg-gradient-to-r from-blue-200/80 via-indigo-100/80 to-purple-100/80 dark:from-blue-800/80 dark:via-indigo-900/80 dark:to-purple-900/80 text-blue-700 dark:text-blue-300 shadow-xl border border-blue-300/50 dark:border-blue-700/50 scale-110"
                    : "text-slate-600 hover:text-white dark:text-slate-300 dark:hover:text-white"
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Black Sweep Background Animation - only for non-active buttons */}
                {activeTab !== status && (
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-gray-900 to-black transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out rounded-xl"></div>
                )}
                
                <div className="relative z-10 transition-transform duration-300 group-hover:scale-125 drop-shadow-lg">
                  {statusIcons[status]}
                </div>
                
                {/* Enhanced Status Label */}
                <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-3 px-4 py-2 bg-black text-white text-sm font-bold rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap z-[100] pointer-events-none scale-95 group-hover:scale-100">
                  <span className="flex items-center gap-2">
                    <span>{status}</span>
                    <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">
                      {getStatusCount(status)}
                    </span>
                  </span>
                  {/* Arrow */}
                  <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-6 border-transparent border-r-black"></div>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="h-20"></div>
      </nav>

      {/* --- ENHANCED MAIN CONTENT AREA --- */}
      <main className="flex-1 p-[2vw] overflow-y-auto relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none">
          <div className="absolute top-20 right-32 w-64 h-64 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full blur-3xl"></div>
          <div className="absolute bottom-32 left-20 w-48 h-48 bg-gradient-to-br from-indigo-400 to-pink-600 rounded-full blur-3xl"></div>
        </div>

        {/* Enhanced Professional Header */}
        <header className="flex justify-between items-center mb-[3vh] relative z-10">
          <div>
            <h1 className="text-[clamp(2rem,4vw,2.75rem)] font-black text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text relative">
              {activeTab} Worklets ✨
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-[clamp(1rem,1.8vw,1.125rem)] mt-2 font-medium">
              Discover and track <span className="text-blue-600 dark:text-blue-400 font-semibold">{filteredWorklets.length}</span> {activeTab.toLowerCase()} projects across teams
            </p>
          </div>
          
          {/* Enhanced Layout Toggle with Statistics */}
          <div className="flex items-center gap-4">
            {/* Quick Stats */}
            <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg rounded-xl border border-blue-200/50 dark:border-slate-700/50 shadow-lg">
              <div className="text-center">
                <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{filteredWorklets.length}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Projects</div>
              </div>
              <div className="w-px h-8 bg-slate-300 dark:bg-slate-600"></div>
              <div className="text-center">
                <div className="text-sm font-bold text-green-600 dark:text-green-400">
                  {Math.round(filteredWorklets.reduce((acc, w) => acc + w.progress, 0) / Math.max(filteredWorklets.length, 1))}%
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Avg Progress</div>
              </div>
            </div>

            {/* Layout Toggle */}
            <div className="flex items-center gap-1 p-1 bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg rounded-xl shadow-lg border border-blue-200/50 dark:border-slate-700/50">
              <button 
                onClick={() => setLayout('grid')} 
                className={`p-3 rounded-lg transition-all duration-300 ${
                  layout === 'grid' 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105' 
                    : 'text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-blue-400 hover:scale-105'
                }`} 
                aria-label="Grid View"
              >
                <LayoutGrid size={20} />
              </button>
              <button 
                onClick={() => setLayout('list')} 
                className={`p-3 rounded-lg transition-all duration-300 ${
                  layout === 'list' 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105' 
                    : 'text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-blue-400 hover:scale-105'
                }`} 
                aria-label="List View"
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </header>
        {/* Enhanced Content Grid/List */}
        <div className={layout === 'grid' 
          ? "grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-[clamp(1.5rem,2.5vw,2.5rem)] relative z-10" 
          : "flex flex-col gap-[clamp(1rem,1.5vw,1.5rem)] relative z-10"
        }>
          {filteredWorklets.length > 0 ? (
            filteredWorklets.map((worklet, index) => (
              layout === 'grid' ? (
                <div key={worklet.id}>
                  <WorkletGridItem worklet={worklet} />
                </div>
              ) : (
                <div key={worklet.id}>
                  <WorkletListItem worklet={worklet} />
                </div>
              )
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No worklets found</p>
              <p className="text-gray-500 dark:text-gray-500">No {activeTab.toLowerCase()} projects available at the moment.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// --- Enhanced Component for Grid View Item ---
const WorkletGridItem = ({ worklet }) => {
  const getQualityColor = (quality) => {
    switch (quality) {
      case 'Excellence': return 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 dark:from-emerald-900/30 dark:to-green-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700';
      case 'Good': return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700';
      case 'Needs Attention': return 'bg-gradient-to-r from-red-100 to-orange-100 text-red-800 dark:from-red-900/30 dark:to-orange-900/30 dark:text-red-300 border-red-200 dark:border-red-700';
      default: return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 dark:from-gray-900/30 dark:to-slate-900/30 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/50';
      case 'High': return 'bg-gradient-to-r from-orange-500 to-amber-600 shadow-orange-500/50';
      case 'Medium': return 'bg-gradient-to-r from-yellow-500 to-yellow-600 shadow-yellow-500/50';
      case 'Low': return 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/50';
      default: return 'bg-gradient-to-r from-gray-500 to-slate-600 shadow-gray-500/50';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'from-green-500 via-emerald-500 to-teal-500';
    if (progress >= 60) return 'from-blue-500 via-indigo-500 to-purple-500';
    if (progress >= 40) return 'from-yellow-500 via-orange-500 to-red-500';
    return 'from-red-500 via-pink-500 to-rose-500';
  };

  return (
    <Link to={`/worklet/${worklet.id}`}>
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden group h-full border border-white/50 dark:border-slate-700/50 hover:border-blue-300/50 dark:hover:border-blue-600/50 transform hover:scale-[1.03] hover-lift relative">
        {/* Enhanced Header Section with Gradient */}
        <div className="relative h-52 overflow-hidden" style={{ background: worklet.gradient }}>
          {/* Animated geometric patterns */}
          <div className="absolute inset-0 opacity-15">
            <div className="absolute top-6 left-6 w-20 h-20 border-2 border-white/30 rounded-xl rotate-12 animate-float-slow"></div>
            <div className="absolute bottom-6 right-6 w-16 h-16 border-2 border-white/20 rounded-full animate-float-medium"></div>
            <div className="absolute top-1/2 right-10 w-10 h-10 bg-white/15 rounded-lg rotate-45 animate-float-fast"></div>
            <div className="absolute bottom-10 left-10 w-12 h-12 bg-white/10 rounded-full animate-float-slow"></div>
          </div>
          
          {/* Gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10"></div>
          
          {/* Team ID and Category */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-5xl font-black mb-3 tracking-wider drop-shadow-lg">
                {worklet.teamId}
              </div>
              <div className="text-2xl mb-2 drop-shadow-md">
                {worklet.categoryData.icon}
              </div>
              <div className="text-sm font-bold tracking-[0.3em] uppercase opacity-90 bg-white/25 px-4 py-2 rounded-full backdrop-blur-sm border border-white/30">
                {worklet.categoryData.abbrev}
              </div>
            </div>
          </div>
          
          {/* Enhanced Priority Indicator */}
          <div className={`absolute top-4 left-4 w-4 h-4 ${getPriorityColor(worklet.priority)} rounded-full border-2 border-white shadow-lg animate-pulse`}></div>
          
          {/* Quality Badge */}
          <div className={`absolute top-4 right-4 px-3 py-1.5 text-xs font-bold rounded-full ${getQualityColor(worklet.quality)} border backdrop-blur-sm shadow-lg`}>
            {worklet.quality}
          </div>
          
          {/* Enhanced Notification Badge */}
          {worklet.notificationCount > 0 && (
            <div className="absolute bottom-4 right-4 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center border-2 border-white shadow-xl animate-bounce">
              {worklet.notificationCount}
            </div>
          )}
        </div>

        {/* Enhanced Content */}
        <div className="p-6">
          {/* Title and ID */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-700">
                {worklet.id}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                {worklet.category}
              </span>
            </div>
            <h3 className="font-black text-xl text-gray-900 dark:text-white leading-tight line-clamp-2 mb-1">
              {worklet.title}
            </h3>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-5 line-clamp-3 leading-relaxed">
            {worklet.description}
          </p>

          {/* Enhanced Progress Section */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-500" />
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Progress</span>
              </div>
              <span className="text-lg font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {worklet.progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden shadow-inner">
              <div 
                className={`h-3 bg-gradient-to-r ${getProgressColor(worklet.progress)} rounded-full transition-all duration-1000 ease-out shadow-lg relative overflow-hidden`}
                style={{width: `${worklet.progress}%`}}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
          </div>

          {/* Enhanced Timeline */}
          <div className="mb-5 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-slate-700/50 dark:to-slate-600/50 rounded-xl border border-gray-200 dark:border-slate-600">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-green-500"/>
                <span className="font-semibold">{worklet.startDate}</span>
              </div>
              <div className="flex-1 mx-4 border-t-2 border-dashed border-gray-300 dark:border-gray-600 relative">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{worklet.endDate}</span>
                <Calendar size={14} className="text-red-500"/>
              </div>
            </div>
          </div>

          {/* Students and College */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <Users size={16} className="text-purple-500"/>
                <span className="font-bold">{worklet.students.length} Students</span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-32 font-medium bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                {worklet.college}
              </span>
            </div>
            
            {/* Enhanced Student Avatars */}
            <div className="flex items-center gap-2">
              {worklet.students.slice(0, 4).map((student, index) => (
                <div 
                  key={student}
                  className={`w-8 h-8 bg-gradient-to-br ${worklet.categoryData.color} rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-slate-800 shadow-lg transform hover:scale-110 transition-transform duration-200`}
                  title={student}
                >
                  {student.charAt(0)}
                </div>
              ))}
              {worklet.students.length > 4 && (
                <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-slate-800 shadow-lg">
                  +{worklet.students.length - 4}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hover effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </div>
    </Link>
  );
};

// --- Enhanced Component for List View Item ---
const WorkletListItem = ({ worklet }) => {
  const getQualityColor = (quality) => {
    switch (quality) {
      case 'Excellence': return 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 dark:from-emerald-900/30 dark:to-green-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700';
      case 'Good': return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700';
      case 'Needs Attention': return 'bg-gradient-to-r from-red-100 to-orange-100 text-red-800 dark:from-red-900/30 dark:to-orange-900/30 dark:text-red-300 border-red-200 dark:border-red-700';
      default: return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 dark:from-gray-900/30 dark:to-slate-900/30 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/50';
      case 'High': return 'bg-gradient-to-r from-orange-500 to-amber-600 shadow-orange-500/50';
      case 'Medium': return 'bg-gradient-to-r from-yellow-500 to-yellow-600 shadow-yellow-500/50';
      case 'Low': return 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/50';
      default: return 'bg-gradient-to-r from-gray-500 to-slate-600 shadow-gray-500/50';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'from-green-500 via-emerald-500 to-teal-500';
    if (progress >= 60) return 'from-blue-500 via-indigo-500 to-purple-500';
    if (progress >= 40) return 'from-yellow-500 via-orange-500 to-red-500';
    return 'from-red-500 via-pink-500 to-rose-500';
  };

  return (
    <Link to={`/worklet/${worklet.id}`}>
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 flex items-center group border border-white/50 dark:border-slate-700/50 hover:border-blue-300/50 dark:hover:border-blue-600/50 transform hover:scale-[1.02] hover-lift overflow-hidden relative">
        {/* Enhanced Gradient Section */}
        <div className="relative hidden sm:block flex-shrink-0 h-36 w-48 rounded-l-2xl overflow-hidden">
          <div 
            className="absolute inset-0 animate-gradient-shift"
            style={{ 
              background: worklet.gradient,
              backgroundSize: '200% 200%'
            }}
          />
          
          {/* Enhanced Geometric Elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-3 left-3 w-10 h-10 border-2 border-white/30 rounded-lg rotate-12 animate-float-slow"></div>
            <div className="absolute bottom-3 right-3 w-8 h-8 bg-white/15 rounded-full animate-float-medium"></div>
            <div className="absolute top-1/2 right-6 w-6 h-6 bg-white/10 rounded rotate-45 animate-float-fast"></div>
          </div>
          
          {/* Enhanced Typography Design */}
          <div className="absolute inset-0 flex flex-col justify-center items-center">
            <div className="text-center text-white">
              <div className="text-3xl font-black mb-2 tracking-wider transform group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">
                {worklet.teamId}
              </div>
              <div className="text-xl mb-1 drop-shadow-md">
                {worklet.categoryData.icon}
              </div>
              <div className="text-xs font-bold tracking-[0.2em] uppercase opacity-90 bg-white/30 px-3 py-1 rounded-full backdrop-blur-sm border border-white/40">
                {worklet.categoryData.abbrev}
              </div>
            </div>
          </div>
          
          {/* Enhanced Priority Indicator */}
          <div className={`absolute top-4 left-4 w-4 h-4 ${getPriorityColor(worklet.priority)} rounded-full border-2 border-white shadow-xl animate-pulse`}></div>
          
          {/* Enhanced Notification Badge */}
          {worklet.notificationCount > 0 && (
            <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-xl animate-bounce">
              {worklet.notificationCount}
            </div>
          )}
        </div>

        {/* Enhanced Content Section */}
        <div className="flex-grow p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-grow pr-6">
              {/* ID, Category and Quality */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-700">
                  {worklet.id}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                  {worklet.category}
                </span>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${getQualityColor(worklet.quality)} border`}>
                  <Star size={12} className="inline mr-1" />
                  {worklet.quality}
                </span>
              </div>
              
              {/* Title */}
              <h3 className="font-black text-xl text-gray-900 dark:text-white line-clamp-1 mb-3">
                {worklet.title}
              </h3>
              
              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4 hidden md:block leading-relaxed">
                {worklet.description}
              </p>
            </div>

            {/* Status */}
            <span className={`text-xs font-bold px-4 py-2 rounded-full flex-shrink-0 border ${
              worklet.status === 'Ongoing' 
                ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700' 
                : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300 border-green-200 dark:border-green-700'
            }`}>
              <Clock size={12} className="inline mr-1" />
              {worklet.status}
            </span>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-blue-500" />
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Progress</span>
              </div>
              <span className="text-lg font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {worklet.progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 shadow-inner">
              <div 
                className={`h-3 bg-gradient-to-r ${getProgressColor(worklet.progress)} rounded-full transition-all duration-1000 ease-out shadow-lg relative overflow-hidden`}
                style={{width: `${worklet.progress}%`}}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
          </div>

          {/* Enhanced Bottom Info */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-400">
            {/* Left side - Students and College */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Users size={16} className="text-purple-500"/>
                <span className="font-bold">{worklet.students.length} Students</span>
              </div>
              
              <div className="hidden sm:flex items-center gap-2">
                {worklet.students.slice(0, 3).map((student, index) => (
                  <div 
                    key={student}
                    className={`w-7 h-7 bg-gradient-to-br ${worklet.categoryData.color} rounded-full flex items-center justify-center text-white text-xs font-bold border border-white dark:border-slate-800 shadow-lg transform hover:scale-110 transition-transform duration-200`}
                    title={student}
                  >
                    {student.charAt(0)}
                  </div>
                ))}
                {worklet.students.length > 3 && (
                  <div className="w-7 h-7 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold border border-white dark:border-slate-800 shadow-lg">
                    +{worklet.students.length - 3}
                  </div>
                )}
              </div>
            </div>

            {/* Right side - Timeline */}
            <div className="flex items-center gap-3 text-xs bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg">
              <Calendar size={14} className="text-green-500"/>
              <span className="font-semibold">{worklet.startDate}</span>
              <span className="text-slate-400">→</span>
              <span className="font-semibold">{worklet.endDate}</span>
              <Calendar size={14} className="text-red-500"/>
            </div>
          </div>
        </div>

        {/* Hover effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-transparent to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </div>
    </Link>
  );
};