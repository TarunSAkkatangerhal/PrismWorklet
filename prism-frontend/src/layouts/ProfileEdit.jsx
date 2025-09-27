import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserProfile.css';
import { Edit, Briefcase, MapPin, Cake, Link as LinkIcon, X, ImageOff, ArrowLeft, Save, ChevronLeft, ChevronRight, Calendar, Settings, LogOut, Moon, Sun, Info } from 'lucide-react';
import axios from 'axios';

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200&auto=format&fit=crop',
];

const getInitials = (name) => {
  if (!name) return '';
  const nameParts = name.split(' ');
  if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
  return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
};

const generateColorFromName = (name) => {
  if (!name) return '#cccccc';
  const colors = ['#0077b6', '#0096c7', '#48cae4', '#90e0ef', '#ade8f4'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash % colors.length)];
};

const DatePicker = ({ value, onChange, placeholder = "Select date", disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    onChange(date.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const formatDisplayDate = (date) => {
    if (!date) return placeholder;
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-left flex items-center justify-between ${disabled ? 'bg-gray-50 dark:bg-slate-600 cursor-not-allowed opacity-60' : ''}`}
      >
        <span className={selectedDate ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}>
          {formatDisplayDate(selectedDate)}
        </span>
        <Calendar className="w-5 h-5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
          <div className="p-4">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={prevMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-2">
                {/* Month Selector */}
                <select
                  value={currentMonth.getMonth()}
                  onChange={(e) => setCurrentMonth(new Date(currentMonth.getFullYear(), parseInt(e.target.value), 1))}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white bg-white"
                >
                  {months.map((month, index) => (
                    <option key={index} value={index}>{month}</option>
                  ))}
                </select>
                
                {/* Year Selector */}
                <select
                  value={currentMonth.getFullYear()}
                  onChange={(e) => setCurrentMonth(new Date(parseInt(e.target.value), currentMonth.getMonth(), 1))}
                  className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white bg-white"
                >
                  {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              <button
                type="button"
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {daysOfWeek.map(day => (
                <div key={day} className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => day && handleDateClick(day)}
                  disabled={!day}
                  className={`
                    h-10 text-sm rounded-lg transition-colors
                    ${!day ? 'invisible' : ''}
                    ${day && selectedDate && day.toDateString() === selectedDate.toDateString()
                      ? 'bg-blue-500 text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700'
                    }
                    ${day && day.toDateString() === new Date().toDateString()
                      ? 'ring-1 ring-blue-500'
                      : ''
                    }
                  `}
                >
                  {day?.getDate()}
                </button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
              <button
                type="button"
                onClick={() => {
                  setSelectedDate(null);
                  onChange('');
                  setIsOpen(false);
                }}
                className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  setSelectedDate(today);
                  onChange(today.toISOString().split('T')[0]);
                  setIsOpen(false);
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                Today
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SettingsMenu = ({ isEditing, onToggleEdit, onSave, isLoading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const navigate = useNavigate();

  // Lock/unlock body scroll when sidebar opens/closes
  useEffect(() => {
    if (isOpen) {
      // Lock scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Unlock scroll
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    navigate('/');
  };

  const handleAboutUs = () => {
    // You can navigate to an about us page or show a modal
    alert('About Us: PRISM - Professional Resource and Internship Support Management\n\nA platform connecting mentors and students for professional growth and development.');
  };

  return (
    <>
      {/* Settings Toggle Button - Left Side */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed left-6 z-50 p-4 rounded-full transition-all duration-300 ${
          isOpen 
            ? 'bg-blue-600 text-white shadow-lg top-4' 
            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-600 top-6'
        }`}
        title="Settings"
      >
        <Settings className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dashboard-Style Settings Sidebar */}
      <div 
        className={`fixed left-0 top-0 h-full w-72 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-40 overflow-hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onWheel={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          {/* <div className="flex items-center justify-between"> */}
            {/* <h2 className="text-xl font-bold text-slate-800 dark:text-white">Settings</h2> */}
            {/* <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button> */}
          {/* </div> */}
        </div>

        {/* Dashboard-Style Menu Items */}
        <div 
          className="p-4 space-y-3 overflow-y-auto h-[calc(100%-80px)] scrollbar-hide" 
          style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}
          onWheel={(e) => e.stopPropagation()}
        >
          
          {/* Profile Actions Section */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Profile Actions
            </h3>
            
            {/* Edit Profile Card - Only show Save when editing, Edit when not editing */}
            {isEditing ? (
              <button
                onClick={() => {
                  onSave();
                  setIsOpen(false);
                }}
                disabled={isLoading}
                className="w-full flex flex-col items-center p-4 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mb-2">
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="w-4 h-4 text-white" />
                  )}
                </div>
                <span className="font-medium text-sm text-green-700 dark:text-green-300">
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onToggleEdit();
                  setIsOpen(false);
                }}
                className="w-full flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                  <Edit className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-sm text-blue-700 dark:text-blue-300">Edit Profile</span>
              </button>
            )}
          </div>

          {/* Preferences Section */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Preferences
            </h3>
            
            <button
              onClick={toggleTheme}
              className="w-full flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mb-2">
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-white" />
                ) : (
                  <Moon className="w-4 h-4 text-white" />
                )}
              </div>
              <span className="font-medium text-sm text-purple-700 dark:text-purple-300">
                {isDarkMode ? 'Light Mode' : 'Dark Mode'}
              </span>
            </button>
          </div>

          {/* Information Section */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Information
            </h3>
            
            <button
              onClick={handleAboutUs}
              className="w-full flex flex-col items-center p-4 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center mb-2">
                <Info className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-sm text-amber-700 dark:text-amber-300">About PRISM</span>
            </button>
          </div>

          {/* Account Section */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Account
            </h3>
            
            <button
              onClick={handleLogout}
              className="w-full flex flex-col items-center p-4 bg-gradient-to-br from-red-50 to-rose-100 dark:from-red-900/20 dark:to-rose-900/20 rounded-lg border border-red-200 dark:border-red-800 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mb-2">
                <LogOut className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-sm text-red-700 dark:text-red-300">Sign Out</span>
            </button>
          </div>

        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

const ProfileEdit = ({ userData, onProfileUpdate }) => {
  const [editedData, setEditedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [realUserData, setRealUserData] = useState(userData);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  // Fetch real user profile data on component mount and set as editable data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("access_token");
        
        if (!token) return;

        const response = await axios.get(
          `http://localhost:8000/auth/me`,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          }
        );
        
        if (response.data) {
          // Transform backend data to match frontend format
          const profileData = {
            name: response.data.name,
            avatarUrl: null, // Users table doesn't have avatar_url yet
            bio: `${response.data.role} at ${response.data.college || 'PRISM'}`,
            qualification: response.data.team || response.data.role,
            location: response.data.college || 'Samsung PRISM',
            dob: userData.dob, // Keep default for now since not in users table
            website: userData.website, // Keep default for now since not in users table
            handle: `@${response.data.name.replace(/\s+/g, '').toLowerCase()}`,
            team: response.data.team,
            college: response.data.college,
            role: response.data.role,
          };
          setRealUserData(profileData);
          setEditedData(profileData); // Set as editable data
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        // Use default userData if API fails
        setEditedData(userData);
      }
    };

    fetchUserProfile();
  }, [userData]);

  // Updates the temporary state
  const handleInputChange = (e) => {
    setEditedData(prevData => ({ ...prevData, [e.target.name]: e.target.value }));
  };

  // Updates the temporary avatar URL
  const handleAvatarSelect = (url) => {
    setEditedData(prevData => ({ ...prevData, avatarUrl: url }));
  };

  // Save profile changes
  const handleSave = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      
      if (!token) {
        throw new Error("User information not found");
      }

      // Prepare data for API (only send fields that can be updated in users table)
      const updateData = {
        name: editedData.name,
        team: editedData.qualification, // Map qualification to team field
        college: editedData.location, // Map location to college field
      };

      const response = await axios.put(
        `http://localhost:8000/auth/me/profile`,
        updateData,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        // Update local state with saved data
        const updatedData = {
          ...editedData,
          name: response.data.user.name,
          qualification: response.data.user.team || response.data.user.role,
          location: response.data.user.college || 'Samsung PRISM',
          bio: `${response.data.user.role} at ${response.data.user.college || 'PRISM'}`,
        };
        setRealUserData(updatedData);
        // Also update parent component
        if (onProfileUpdate) onProfileUpdate(updatedData);
        alert('Profile updated successfully!');
        navigate('/home');
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      // Cancel editing - reset to original data
      setEditedData(realUserData);
      setIsEditing(false);
    } else {
      // Start editing
      setEditedData(realUserData);
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setEditedData(realUserData);
    navigate('/home');
  };

  if (!editedData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-x-hidden scrollbar-hide">
      
      {/* Settings Sidebar */}
      <SettingsMenu 
        isEditing={isEditing}
        onToggleEdit={handleToggleEdit}
        onSave={handleSave}
        isLoading={isLoading}
      />
      
      <div className="container mx-auto px-[2vw] py-[2vh] scrollbar-hide">
        {/* Header */}
        <div className="flex items-center justify-between mb-[3vh] ml-[5vw]">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-[0.5vw] text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-[clamp(1rem,1.5vw,1.25rem)] h-[clamp(1rem,1.5vw,1.25rem)]" />
            <span className="text-[clamp(0.875rem,1.1vw,1rem)]">Back to Dashboard</span>
          </button>
          
          <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-slate-800 dark:text-white">
            {isEditing ? 'Edit Profile' : 'My Profile'}
          </h1>
          
          <div className="w-32">
            {/* Empty space for balance */}
          </div>
        </div>

        {/* Edit Form */}
        <div className="max-w-[clamp(32rem,60vw,40rem)] mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-[clamp(1.5rem,3vw,2rem)]">
            
            {/* Avatar Section */}
            <div className="text-center mb-[3vh]">
              <div className="relative inline-block">
                {editedData.avatarUrl ? (
                  <img
                    src={editedData.avatarUrl}
                    alt="Profile"
                    className="w-[clamp(6rem,10vw,8rem)] h-[clamp(6rem,10vw,8rem)] rounded-full object-cover border-4 border-blue-200 dark:border-blue-800 shadow-lg mx-auto"
                  />
                ) : (
                  <div
                    className="w-[clamp(6rem,10vw,8rem)] h-[clamp(6rem,10vw,8rem)] rounded-full border-4 border-blue-200 dark:border-blue-800 shadow-lg flex items-center justify-center text-white font-bold text-[clamp(2rem,4vw,3rem)] mx-auto"
                    style={{ backgroundColor: generateColorFromName(editedData.name) }}
                  >
                    {getInitials(editedData.name)}
                  </div>
                )}
              </div>
              
              {isEditing && (
                <>
                  <p className="text-[clamp(0.75rem,1vw,0.875rem)] text-slate-500 dark:text-slate-400 mt-[1vh] mb-[1vh]">Choose an avatar:</p>
                  
                  <div className="flex flex-wrap justify-center gap-[0.75vw]">
                    {AVATAR_OPTIONS.map((url, index) => (
                      <button
                        key={index}
                        onClick={() => handleAvatarSelect(url)}
                        className={`w-[clamp(2.5rem,4vw,3rem)] h-[clamp(2.5rem,4vw,3rem)] rounded-full border-2 overflow-hidden transition-all ${
                          editedData.avatarUrl === url
                            ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                            : 'border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        <img src={url} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                    <button
                      onClick={() => handleAvatarSelect(null)}
                      className={`w-[clamp(2.5rem,4vw,3rem)] h-[clamp(2.5rem,4vw,3rem)] rounded-full border-2 flex items-center justify-center transition-all ${
                        !editedData.avatarUrl
                          ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800 bg-blue-50 dark:bg-blue-900'
                          : 'border-gray-300 hover:border-blue-400 bg-gray-50 dark:bg-gray-700'
                      }`}
                    >
                      <ImageOff className="w-[clamp(1rem,1.5vw,1.25rem)] h-[clamp(1rem,1.5vw,1.25rem)] text-gray-500" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-[1.5vh]">
              <div>
                <label className="block text-[clamp(0.75rem,1vw,0.875rem)] font-medium text-slate-700 dark:text-slate-300 mb-[0.5vh]">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={editedData.name || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-[1vw] py-[0.75vh] border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white text-[clamp(0.875rem,1.1vw,1rem)] ${!isEditing ? 'bg-gray-50 dark:bg-slate-600 cursor-not-allowed' : ''}`}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-[clamp(0.75rem,1vw,0.875rem)] font-medium text-slate-700 dark:text-slate-300 mb-[0.5vh]">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={editedData.bio || ''}
                  onChange={handleInputChange}
                  rows={3}
                  disabled={!isEditing}
                  className={`w-full px-[1vw] py-[0.75vh] border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white scrollbar-hide text-[clamp(0.875rem,1.1vw,1rem)] ${!isEditing ? 'bg-gray-50 dark:bg-slate-600 cursor-not-allowed' : ''}`}
                  placeholder="Tell us about yourself"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.5vw]">
                <div>
                  <label className="block text-[clamp(0.75rem,1vw,0.875rem)] font-medium text-slate-700 dark:text-slate-300 mb-[0.5vh]">
                    Qualification/Position
                  </label>
                  <input
                    type="text"
                    name="qualification"
                    value={editedData.qualification || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${!isEditing ? 'bg-gray-50 dark:bg-slate-600 cursor-not-allowed' : ''}`}
                    placeholder="Your position or qualification"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={editedData.location || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${!isEditing ? 'bg-gray-50 dark:bg-slate-600 cursor-not-allowed' : ''}`}
                    placeholder="Your location"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Date of Birth
                  </label>
                  <DatePicker
                    value={editedData.dob}
                    onChange={(date) => handleInputChange({ target: { name: 'dob', value: date } })}
                    placeholder="Select your birth date"
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={editedData.website || ''}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${!isEditing ? 'bg-gray-50 dark:bg-slate-600 cursor-not-allowed' : ''}`}
                    placeholder="https://your-website.com"
                  />
                </div>
              </div>

              {/* Mentor-Specific Information Section */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-6 mt-6">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                  Mentor Information
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Areas of Expertise
                    </label>
                    <textarea
                      name="expertise"
                      value={editedData.expertise || ''}
                      onChange={handleInputChange}
                      rows={3}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white scrollbar-hide ${!isEditing ? 'bg-gray-50 dark:bg-slate-600 cursor-not-allowed' : ''}`}
                      placeholder="e.g., React, Node.js, Machine Learning, Data Science, Project Management..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        name="experience"
                        value={editedData.experience || ''}
                        onChange={handleInputChange}
                        min="0"
                        max="50"
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${!isEditing ? 'bg-gray-50 dark:bg-slate-600 cursor-not-allowed' : ''}`}
                        placeholder="Years of experience"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Mentoring Style
                      </label>
                      <select
                        name="mentoringStyle"
                        value={editedData.mentoringStyle || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${!isEditing ? 'bg-gray-50 dark:bg-slate-600 cursor-not-allowed' : ''}`}
                      >
                        <option value="">Select mentoring style</option>
                        <option value="hands-on">Hands-on</option>
                        <option value="guidance">Guidance & Advice</option>
                        <option value="collaborative">Collaborative</option>
                        <option value="structured">Structured Learning</option>
                        <option value="flexible">Flexible Approach</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Availability
                    </label>
                    <textarea
                      name="availability"
                      value={editedData.availability || ''}
                      onChange={handleInputChange}
                      rows={2}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white scrollbar-hide ${!isEditing ? 'bg-gray-50 dark:bg-slate-600 cursor-not-allowed' : ''}`}
                      placeholder="e.g., Weekdays 6-9 PM, Weekends flexible, Available for urgent questions..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        LinkedIn Profile
                      </label>
                      <input
                        type="url"
                        name="linkedin"
                        value={editedData.linkedin || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${!isEditing ? 'bg-gray-50 dark:bg-slate-600 cursor-not-allowed' : ''}`}
                        placeholder="https://linkedin.com/in/yourprofile"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        GitHub Profile
                      </label>
                      <input
                        type="url"
                        name="github"
                        value={editedData.github || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${!isEditing ? 'bg-gray-50 dark:bg-slate-600 cursor-not-allowed' : ''}`}
                        placeholder="https://github.com/yourusername"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={editedData.phone || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${!isEditing ? 'bg-gray-50 dark:bg-slate-600 cursor-not-allowed' : ''}`}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Preferred Communication
                      </label>
                      <select
                        name="communicationPreference"
                        value={editedData.communicationPreference || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${!isEditing ? 'bg-gray-50 dark:bg-slate-600 cursor-not-allowed' : ''}`}
                      >
                        <option value="">Select preference</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="video-call">Video Call</option>
                        <option value="chat">Chat/Messaging</option>
                        <option value="in-person">In-person</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Mentoring Goals & Approach
                    </label>
                    <textarea
                      name="mentoringGoals"
                      value={editedData.mentoringGoals || ''}
                      onChange={handleInputChange}
                      rows={4}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white scrollbar-hide ${!isEditing ? 'bg-gray-50 dark:bg-slate-600 cursor-not-allowed' : ''}`}
                      placeholder="Describe your mentoring philosophy, what you hope to achieve with mentees, and your approach to helping others grow..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Industry Focus
                      </label>
                      <input
                        type="text"
                        name="industry"
                        value={editedData.industry || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${!isEditing ? 'bg-gray-50 dark:bg-slate-600 cursor-not-allowed' : ''}`}
                        placeholder="e.g., Technology, Healthcare, Finance, Education..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Company/Organization
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={editedData.company || ''}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${!isEditing ? 'bg-gray-50 dark:bg-slate-600 cursor-not-allowed' : ''}`}
                        placeholder="Current company or organization"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;