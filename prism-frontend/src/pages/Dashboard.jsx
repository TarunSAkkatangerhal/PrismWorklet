import axios from "axios";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import samsungLogo from "../assets/prism_logo.png";
import ThemeToggleButton from '../components/ThemeToggleButton';
import Statistics from "../layouts/Statistics";

import {
  Home, BarChart, GraduationCap, MessageSquare, Bell, Calendar, Folder,
  MessageCircle, Zap, Rocket, Key, Crown, BookOpen, Users as UsersIcon,
  RefreshCcw, Lightbulb, Briefcase, PlusCircle, Bot, Users, LayoutGrid, Columns, X, ClipboardCheck, LogOut
} from "lucide-react";

import SidebarItem from "../components/SidebarItem";
import LevelBadge from "../components/LevelBadge";
import StatCard from "../components/StatCard";
import ActivityButton from "../components/ActivityButton";
import LeftSidebar from "../components/Left";
import RightSidebar from "../components/Right";

const LEVEL_COUNTS = { spark: 5, lead: 10, core: 15, master: 30 };
const STATS = { worklets: 7, mentees: 35, badges: 2 };

const levels = [
  { name: 'SPARK', Icon: Zap, color: 'text-yellow-600' },
  { name: 'LEAD', Icon: Rocket, color: 'text-blue-700' },
  { name: 'CORE', Icon: Key, color: 'text-green-700' },
  { name: 'MASTER', Icon: Crown, color: 'text-purple-700' },
];

// Helper functions for the API calls
const fetchMentorWorklets = async () => {
  try {
    const token = localStorage.getItem("access_token");
    const userEmail = localStorage.getItem("user_email");
    
    if (!token || !userEmail) {
      throw new Error("Authentication required");
    }

    // First, get the current user's ID
    const userResponse = await axios.get("http://localhost:8000/auth/profile", {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!userResponse.data?.id) {
      throw new Error("User ID not found");
    }

    const userId = userResponse.data.id;

    // Use the new association-based endpoint to get mentor's ongoing worklets
    const response = await axios.get(
      `http://localhost:8000/api/associations/mentor/${userId}/ongoing-worklets`,
      {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );
    
    return response.data?.ongoing_worklets || [];
  } catch (error) {
    console.error("Error fetching mentor worklets:", error);
    
    // Fallback to old API if new association API is not available
    try {
      const userEmail = localStorage.getItem("user_email");
      const token = localStorage.getItem("access_token");
      
      const response = await axios.get(
        `http://localhost:8000/worklets/mentor/${encodeURIComponent(userEmail)}/worklets`,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );
      
      return response.data || [];
    } catch (fallbackError) {
      console.error("Fallback API also failed:", fallbackError);
      return [];
    }
  }
};

const fetchStudentsForWorklet = async (workletId) => {
  try {
    const token = localStorage.getItem("access_token");
    
    if (!token) {
      throw new Error("Authentication token not found");
    }

    // Try using the new association-based endpoint first
    try {
      const response = await axios.get(
        `http://localhost:8000/api/associations/worklet/${workletId}`,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );
      
      // Extract students from the association response
      return response.data?.students || [];
    } catch (associationError) {
      console.log("Association API not available, using fallback");
      
      // Fallback to old students endpoint
      const response = await axios.get(
        `http://localhost:8000/worklets/${workletId}/students`,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );
      
      return response.data || [];
    }
  } catch (error) {
    console.error("Error fetching students:", error);
    return [];
  }
};

// Helper function to transform API data to match the expected format
const transformWorkletData = (apiWorklets, studentsData = {}) => {
  return apiWorklets.map((worklet, index) => {
    // Handle both old API format and new association API format
    let students = [];
    let progress = 0;
    let workletData = worklet;
    
    // Check if this is from the new association API (has mentor_progress, completion_status, etc.)
    if (worklet.id && worklet.cert_id) {
      // New association API format
      students = worklet.students || studentsData[worklet.id] || [];
      progress = worklet.percentage_completion || worklet.mentor_progress || 0;
    } else {
      // Old API format - fallback
      students = studentsData[worklet.id] || [];
      progress = worklet.percentage_completion || 0;
    }
    
    const notificationCount = 0; // Can be enhanced later with real notification system
    
    // Use actual dates from worklet or fallback to current date
    const startDate = worklet.start_date ? new Date(worklet.start_date) : new Date();
    const endDate = worklet.end_date ? new Date(worklet.end_date) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now
    
    // Determine quality based on progress and completion status
    let quality = "Good"; // default
    if (worklet.completion_status === "Completed" || progress >= 90) {
      quality = "Excellence";
    } else if (worklet.completion_status === "On Hold" || worklet.risk_status === "High Risk" || progress < 50) {
      quality = "Needs Attention";
    }
    
    // Handle status mapping from association API
    let status = "Ongoing";
    if (worklet.completion_status) {
      // New association API provides completion_status
      if (worklet.completion_status === "In Progress" || worklet.completion_status === "Not Started") {
        status = "Ongoing";
      } else {
        status = worklet.completion_status;
      }
    } else if (worklet.status) {
      // Old API format
      status = worklet.status;
    }
    
    return {
      id: worklet.id,
      title: worklet.cert_id || `Worklet ${worklet.id}`,
      status: status,
      progress: progress,
      description: worklet.description || worklet.problem_statement || "No description available",
      imageUrl: null, // Remove stock images - will handle this in the component
      startDate: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      endDate: endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      students: Array.isArray(students) ? students.map(s => typeof s === 'string' ? s : s.name) : [],
      notificationCount: notificationCount,
      quality: quality,
      college: worklet.college || "Unknown College",
      team: worklet.team || "Unknown Team",
      cert_id: worklet.cert_id,
      expectations: worklet.expectations,
      prerequisites: worklet.prerequisites,
      // Additional fields from association API
      mentor_progress: worklet.mentor_progress,
      completion_status: worklet.completion_status,
      assigned_at: worklet.assigned_at,
      notes: worklet.notes,
      student_count: worklet.student_count || (Array.isArray(students) ? students.length : 0)
    };
  });
};

// Helper functions for the initials-based avatar
const getInitials = (name) => {
  if (!name) return '';
  const nameParts = name.split(' ');
  if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
  return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
};

const generateColorFromName = (name) => {
  const colors = ['#0077b6', '#0096c7', '#48cae4', '#90e0ef', '#ade8f4'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash % colors.length)];
};

// Fetch mentor statistics
const fetchMentorStatistics = async () => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch('http://localhost:8000/api/dashboard/mentor-statistics', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch statistics: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching mentor statistics:', error);
    return null;
  }
};

// ++ 1. Dashboard component
export default function Dashboard() {
  // Get user email from localStorage
  const userEmail = localStorage.getItem("user_email") || "User";
  const [userName, setUserName] = useState(localStorage.getItem("user_name") || "");
  const [loadingName, setLoadingName] = useState(true);
  const [nameError, setNameError] = useState(false);
  // Logout handler
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };
  const navigate = useNavigate();
  const [currentUserLevel, setCurrentUserLevel] = useState(1);
  const [layout, setLayout] = useState('grid');
  const [worklets, setWorklets] = useState([]);
  const [isLoadingWorklets, setIsLoadingWorklets] = useState(true);
  const [userProfileData, setUserProfileData] = useState(null);
  
  // Mentor statistics state
  const [mentorStats, setMentorStats] = useState(null);
  const [isLoadingMentorStats, setIsLoadingMentorStats] = useState(true);

  // Consolidated user profile fetch
  useEffect(() => {
    const fetchUserProfile = async () => {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        setNameError(true);
        setLoadingName(false);
        return;
      }

      try {
        setLoadingName(true);
        setNameError(false);
        
        // Use dedicated profile endpoint
        const response = await axios.get("http://localhost:8000/auth/profile", {
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        });

        if (response.data) {
          // Set user name and profile data
          if (response.data.name) {
            setUserName(response.data.name);
            localStorage.setItem("user_name", response.data.name);
          }
          
          // Set complete profile data (includes mentor_profile if available)
          setUserProfileData(response.data);
        } else {
          console.log("No data in response:", response.data);
          setNameError(true);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error.response || error);
        setNameError(true);
      } finally {
        setLoadingName(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Fetch worklets on component mount
  useEffect(() => {
    const loadWorklets = async () => {
      setIsLoadingWorklets(true);
      try {
        const apiWorklets = await fetchMentorWorklets();
        
        if (apiWorklets.length > 0) {
          // Check if the API returned worklets with students already included (new association API)
          const hasStudentsIncluded = apiWorklets.some(w => w.students && Array.isArray(w.students));
          
          let studentsData = {};
          
          if (!hasStudentsIncluded) {
            // Old API format - need to fetch students separately for each worklet
            for (const worklet of apiWorklets) {
              const students = await fetchStudentsForWorklet(worklet.id);
              studentsData[worklet.id] = students;
            }
          }
          
          // Transform the data to match the expected format
          const transformedWorklets = transformWorkletData(apiWorklets, studentsData);
          setWorklets(transformedWorklets);
        } else {
          // No worklets found for this mentor
          console.log("No worklets found for this mentor");
          setWorklets([]);
        }
      } catch (error) {
        console.error("Error loading worklets:", error);
        // Show empty state instead of fallback data
        setWorklets([]);
      } finally {
        setIsLoadingWorklets(false);
      }
    };
    
    loadWorklets();
  }, []);

  // Fetch mentor statistics
  useEffect(() => {
    const loadMentorStats = async () => {
      setIsLoadingMentorStats(true);
      try {
        const stats = await fetchMentorStatistics();
        if (stats) {
          setMentorStats(stats);
          console.log("📊 Dashboard mentor stats loaded:", stats); // Debug log
        }
      } catch (error) {
        console.error("Error loading mentor statistics:", error);
      } finally {
        setIsLoadingMentorStats(false);
      }
    };
    
    loadMentorStats();
  }, []);

  // Filter to show only ongoing worklets in the dashboard (exclude 100% completed)
  const workletsData = worklets.filter(worklet => 
    (worklet.status === "Ongoing" || worklet.status === "ongoing") && 
    worklet.progress < 100
  );

  const LevelMilestone = ({ level, index }) => {
    const levelsToGo = index - currentUserLevel;
    let tooltipText = '';

    if (levelsToGo > 0) {
      tooltipText = `${levelsToGo} level${levelsToGo > 1 ? 's' : ''} to reach ${level.name}`;
    } else if (levelsToGo === 0) {
      tooltipText = index === levels.length - 1 ? 'Highest level achieved! ✨' : 'You are here';
    } else {
      tooltipText = 'Milestone achieved ✔️';
    }

    return (
      <div className="relative group">
        <span className="flex items-center gap-1 cursor-pointer">
          <level.Icon className={`w-4 h-4 ${level.color}`} /> {level.name}
        </span>
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 text-xs bg-slate-800 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          {tooltipText}
        </span>
      </div>
    );
  };

  const progressPercentage = (currentUserLevel / (levels.length - 1)) * 100;

  return (
    <div className={`flex h-screen w-full bg-slate-50 text-gray-800 overflow-hidden dark:bg-slate-900 dark:text-slate-200 `}>
      {/* Left Sidebar */}
      <LeftSidebar />

      {/* Main Content */}
      <main className="flex-1 px-8 py-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-4 text-blue-900 dark:text-white">
              {loadingName
                ? "Loading..."
                : userName || "User"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              PRISM / {userProfileData?.role || "Mentor"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggleButton />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
            <img src={samsungLogo} alt="PRISM" className="h-20 opacity-90" />
          </div>
        </div>

        {/* Profile box */}
        <div className="mt-4 bg-white border border-gray-200 rounded-2xl shadow-sm p-4 max-w-xl dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center gap-4">
            {/* Add a wrapping div with the 'group' class */}
            <div className="relative group">
              <Link to="/profile">
                {userProfileData?.mentor_profile?.avatar_url || userProfileData?.avatar_url ? (
                  <img
                    src={userProfileData?.mentor_profile?.avatar_url || userProfileData?.avatar_url}
                    alt="Author"
                    className="w-24 h-24 rounded-xl object-cover transition-all duration-300 shadow-md cursor-pointer hover:scale-110 hover:shadow-2xl hover:ring-4 hover:ring-blue-400 dark:bg-slate-800 dark:border-slate-700"
                    tabIndex={0}
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-xl flex items-center justify-center text-white font-bold text-4xl cursor-pointer transition-all duration-300 shadow-md hover:scale-110 hover:shadow-2xl hover:ring-4 hover:ring-blue-400"
                    style={{ backgroundColor: generateColorFromName(userProfileData?.name || "User") }}
                  >
                    <span>{getInitials(userProfileData?.name || "User")}</span>
                  </div>
                )}
              </Link>
              {/* This is the tooltip span that appears on hover */}
              <span className="absolute -top-10 left-1/2 -translate-x-1/2
                   bg-gray-700 text-gray-100 text-xs font-medium
                   rounded-md px-3 py-1.5 whitespace-nowrap
                   opacity-0 group-hover:opacity-100 transition-opacity duration-200
                   dark:bg-slate-600 dark:text-slate-50
                   border border-gray-600 dark:border-slate-500 shadow-md">
                Click to update profile
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {userProfileData?.name || userName || "User"}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400">
                    {userProfileData?.mentor_profile?.qualification || userProfileData?.role || "Mentor"}
                  </div>
                  {userProfileData?.mentor_profile?.bio && (
                    <div className="text-sm text-gray-600 dark:text-slate-300 mt-1">
                      {userProfileData.mentor_profile.bio.replace(/"/g, '')}
                    </div>
                  )}
                  {userProfileData?.mentor_profile?.location && (
                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      📍 {userProfileData.mentor_profile.location}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                <LevelBadge
                  icon={<Rocket className="w-4 h-4 " />}
                  label="Lead"
                  value={LEVEL_COUNTS.lead}
                  color="text-purple-700 bg-purple-50 dark:bg-slate-900/30"
                />
              </div>
            </div>
          </div>
        </div>


        {/* Level Progress Bar */}
        <div className="relative mt-6 w-full max-w-2xl">
          <div className="h-2 w-full bg-gray-200 rounded-full shadow-inner dark:bg-slate-700">
            <div
              className="h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[13px] mt-2 text-gray-600 font-medium dark:text-slate-400">
            {levels.map((level, index) => (
              <LevelMilestone key={level.name} level={level} index={index} />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 flex gap-4 flex-wrap">
          <div className="transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <div
              className="transform transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer"
              onClick={() => navigate('/worklets')}>
              <StatCard
                value={isLoadingWorklets ? '...' : worklets.length}
                label="My Worklets"
                icon={<BookOpen className="w-5 h-5" />}
                accent="from-blue-50 to-white hover:from-blue-100 hover:to-blue-50 dark:from-gray-800 dark:to-gray-800/50 dark:hover:from-gray-700 dark:hover:to-gray-700/50 transition-transform duration-300 hover:scale-105 hover:shadow-lg"
              />
            </div>
          </div>
          <div className="transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <StatCard
              value={isLoadingMentorStats ? '...' : (mentorStats?.engagement_data?.["My Students"] || 0)}
              label="My Mentees"
              icon={<UsersIcon className="w-5 h-5" />}
              accent="from-indigo-50 to-white hover:from-indigo-100 hover:to-indigo-50 dark:from-gray-800 dark:to-gray-800/50 dark:hover:from-gray-700 dark:hover:to-gray-700/50"
            />
          </div>
        </div>

        {/* My Worklets */}
        <div className="mt-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold bg-blue-900 animate-shimmer">Ongoing Worklets</h2>
            <div className="flex items-center gap-1 p-1 bg-gray-200 rounded-lg dark:bg-slate-900">
              <button
                onClick={() => setLayout('grid')}
                className={`p-1.5 rounded-md transition-colors ${layout === 'grid' ? ' text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                  }`}
                aria-label="Grid View">
                <LayoutGrid size={20} />
              </button>
              <button
                onClick={() => setLayout('horizontal')}
                className={`p-1.5 rounded-md transition-colors ${layout === 'horizontal' ? ' text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                  }`}
                aria-label="Horizontal View">
                <Columns size={20} />
              </button>
            </div>
          </div>

          {isLoadingWorklets ? (
            // Loading state with skeleton cards
            <div
              className={
                layout === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
                  : 'flex overflow-x-auto gap-8 pb-4'
              }>
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-full aspect-video bg-gray-200 animate-pulse rounded-2xl dark:bg-slate-700"></div>
              ))}
            </div>
          ) : (
            <div
              className={
                layout === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
                  : 'flex overflow-x-auto gap-8 pb-4 overflow-y-hidden [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-blue-400/50 [&::-webkit-scrollbar-thumb]:rounded-full'
              }>
              {workletsData.map((worklet) => (
                <WorkletCard key={worklet.id} worklet={worklet} layout={layout} navigate={navigate} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Right Sidebar */}
      <RightSidebar />
    </div>
  );
}


// --- CORRECTED WORKLET CARD COMPONENT ---
function WorkletCard({ worklet, layout, navigate }) {
  const containerClasses = layout === 'grid'
    ? 'w-full'
    : 'w-80 flex-shrink-0';

  const calculateRemainingDays = (endDateStr) => {
    const endDate = new Date(endDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const diffTime = endDate - today;
    if (diffTime < 0) {
      return { days: 0, label: "Past Due" };
    }
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { days: diffDays, label: `${diffDays} days left` };
  };

  const remaining = calculateRemainingDays(worklet.endDate);

  const qualityStyles = {
    Excellence: 'bg-green-500/80',
    Good: 'bg-blue-500/80',
    'Needs Attention': 'bg-red-500/80',
    Default: 'bg-gray-500/80',
  };

  const handleCardClick = () => {
    navigate(`/worklet/${worklet.id}`);
  };

  const handleNotificationClick = (event) => {
    event.stopPropagation();
    navigate(`/worklet/${worklet.id}/notifications`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative aspect-video cursor-pointer overflow-hidden rounded-2xl shadow-lg transition-all duration-500 ease-in-out hover:scale-105 ${containerClasses}`}>

      {/* Dynamic Background instead of stock image */}
      <div className="h-full w-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 relative">
        {/* Worklet Info Background */}
        <div className="absolute inset-0 p-4 flex flex-col justify-center items-center text-white/20">
          <div className="text-6xl font-bold mb-2">{worklet.cert_id || worklet.title}</div>
          <div className="text-sm uppercase tracking-wider">{worklet.team}</div>
          <div className="text-xs mt-1">{worklet.college}</div>
        </div>
        
        {/* Pattern overlay for visual interest */}
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full" style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 40% 40%, rgba(120, 255, 198, 0.3) 0%, transparent 50%)`
          }}></div>
        </div>
      </div>

      <div className="absolute inset-0 bg-black/50"></div>

      {worklet.notificationCount > 0 && (
        <div
          onClick={handleNotificationClick}
          className="absolute top-3 right-3 group/bell z-20"
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
          <span className="relative flex items-center justify-center h-6 w-6 rounded-full bg-red-500 text-white">
            <Bell size={14} />
          </span>
          <div className="absolute top-full right-0 mt-1 w-max px-2 py-1 text-xs bg-slate-800 text-white rounded opacity-0 group-hover/bell:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {worklet.notificationCount} new update{worklet.notificationCount > 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Normal State Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 text-white transition-opacity duration-300 group-hover:opacity-0">
        <div className="mb-2">
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{worklet.status}</span>
          <span className="text-xs bg-blue-500/60 px-2 py-1 rounded-full ml-2">{worklet.team}</span>
        </div>
        <h3 className="text-lg font-bold">{worklet.title}</h3>
        <p className="text-sm text-gray-300 line-clamp-2">{worklet.description}</p>
        <div className="mt-4">
          <div className="flex justify-between text-xs font-medium text-cyan-200">
            <span>Progress</span>
            <span>{worklet.progress}%</span>
          </div>
          <div className="mt-1 h-2 w-full rounded-full bg-white/20">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
              style={{ width: `${worklet.progress}%` }}></div>
          </div>
        </div>
      </div>

      {/* Hover State Content */}
      <div className="absolute inset-0 flex text-white opacity-0 transition-opacity duration-300 delay-150 group-hover:opacity-100 pointer-events-none">

        {/* SCROLLABLE AREA - ADDED pointer-events-auto */}
        <div className="flex-grow p-4 overflow-y-auto pointer-events-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-cyan-400/50 [&::-webkit-scrollbar-thumb]:rounded-full">
          <h3 className="text-lg font-bold">{worklet.title}</h3>
          <div className="mt-1 text-xs text-blue-300">{worklet.college}</div>
          
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-300">
            <Calendar size={14} />
            <span>{worklet.startDate} - {worklet.endDate}</span>
          </div>
          
          {worklet.expectations && (
            <div className="mt-3">
              <h4 className="text-sm font-semibold text-yellow-300">Expectations:</h4>
              <p className="text-xs text-gray-200 line-clamp-2">{worklet.expectations}</p>
            </div>
          )}
          
          {worklet.students.length > 0 ? (
            <div className="mt-3">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Users size={16} />
                <h4>Assigned Students ({worklet.students.length})</h4>
              </div>
              <ul className="mt-1 list-disc list-inside text-xs text-gray-200 space-y-1">
                {worklet.students.map((student) => (
                  <li key={student}>{student}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-3">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Users size={16} />
                <h4>Assigned Students (0)</h4>
              </div>
              <p className="mt-1 text-xs text-gray-300 italic">No students assigned to this worklet</p>
            </div>
          )}
          
          {worklet.students.length === 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-2 font-semibold text-sm text-gray-400">
                <Users size={16} />
                <h4>No students assigned yet</h4>
              </div>
            </div>
          )}
        </div>

        {/* Right side panel */}
        <div className="w-28 flex-shrink-0 bg-black/40 flex flex-col items-center justify-center text-center p-2 transform translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-in-out">
          <span className={`px-2 py-1 rounded-md text-xs font-bold text-white ${qualityStyles[worklet.quality] || qualityStyles.Default}`}>
            {worklet.quality}
          </span>
          <div className="mt-4">
            <p className="text-3xl font-bold">{remaining.days}</p>
            <p className="text-xs text-gray-300">{remaining.label}</p>
          </div>
        </div>
      </div>
    </div>
  );
}