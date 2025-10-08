import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  Filter,
  User,
  Settings,
  Video,
  Clock,
  MapPin,
  Plus,
  ChevronDown
} from 'lucide-react';
import LeftSidebar from '../components/Left';
import RightSidebar from '../components/Right';

const Meetings = () => {
  const [selectedTab, setSelectedTab] = useState('scheduled');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false); // Add Meeting modal
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  // ---------------- Add Meeting Form State ----------------
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formWorklet, setFormWorklet] = useState('');
  const [formStart, setFormStart] = useState(() => {
    // Default to current time rounded to next 30 min
    const d = new Date();
    d.setMinutes(d.getMinutes() + (30 - (d.getMinutes() % 30)) % 30, 0, 0);
    return d.toISOString().slice(0,16); // yyyy-MM-ddTHH:mm
  });
  const [formDuration, setFormDuration] = useState(30); // minutes
  const [formRepeatDays, setFormRepeatDays] = useState([]); // e.g. ['Mon','Wed']
  const [formRepeatUntil, setFormRepeatUntil] = useState('');
  const [formMeetingLink, setFormMeetingLink] = useState('');
  const [formTouched, setFormTouched] = useState(false);

  const durationOptions = [15, 30, 45, 60, 90, 120];
  const weekdayOptions = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  
  // Available worklets for meeting assignment
  const availableWorklets = [
    { id: '2STS04VIT', name: '2STS04VIT - IoT Devices Project', college: 'VIT Vellore' },
    { id: '2STS05SRM', name: '2STS05SRM - Web Development', college: 'SRM Chennai' },
    { id: 'AI2024B1', name: 'AI2024B1 - Machine Learning Workshop', college: 'SRM Chennai' },
    { id: 'DATA2024', name: 'DATA2024 - Data Science Bootcamp', college: 'VIT Vellore' },
    { id: 'MOBILE2024', name: 'MOBILE2024 - Mobile App Development', college: 'AMRITA Coimbatore' }
  ];

  const resetAddForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormWorklet('');
    const d = new Date();
    d.setMinutes(d.getMinutes() + (30 - (d.getMinutes() % 30)) % 30, 0, 0);
    setFormStart(d.toISOString().slice(0,16));
    setFormDuration(30);
    setFormRepeatDays([]);
    setFormRepeatUntil('');
    setFormMeetingLink('');
    setFormTouched(false);
  };

  // Function to open MS Teams for creating meeting links
  const openMSTeams = () => {
    try {
      // Try to open MS Teams desktop app first
      window.open('msteams://', '_blank');
      
      // Fallback to web version after a short delay if desktop app doesn't open
      setTimeout(() => {
        window.open('https://teams.microsoft.com/v2/', '_blank', 'noopener,noreferrer');
      }, 1000);
    } catch (error) {
      // If desktop app fails, open web version directly
      window.open('https://teams.microsoft.com/v2/', '_blank', 'noopener,noreferrer');
    }
  };

  // Helper function to format date into display format
  const formatDisplayDate = (startISO, durationMins) => {
    const start = new Date(startISO);
    const end = new Date(start.getTime() + durationMins * 60000);
    const day = start.getDate();
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const month = monthNames[start.getMonth()];
    const year = String(start.getFullYear()).slice(-2);
    const formatTime = (d) => {
      let h = d.getHours();
      const m = d.getMinutes().toString().padStart(2,'0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12; if (h === 0) h = 12;
      return `${h}:${m} ${ampm}`;
    };
    return `${day}-${month}-${year}, ${formatTime(start)} - ${formatTime(end)}`;
  };

  // Create initial meetings with real timestamps for proper filtering
  const nowSeed = Date.now();
  const initialMeetings = [
    // Upcoming meeting: +2 days
    (() => {
      const start = new Date(nowSeed + 2*24*60*60*1000);
      start.setHours(14, 0, 0, 0); // 2 PM
      const durationMins = 60;
      return {
        id: 1,
        title: '2STS04VIT',
        college: 'VIT Vellore',
        startISO: start.toISOString(),
        durationMins,
        date: formatDisplayDate(start.toISOString(), durationMins),
        type: 'Project Review',
        participants: 12,
        workletCode: '2STS04VIT',
        mentor: 'Dr. Sharma',
        description: 'Project review for IoT devices',
        meetingLink: ''
      };
    })(),
    // Present (ongoing) meeting: started 10 minutes ago, lasts 1 hour
    (() => {
      const start = new Date(nowSeed - 10*60*1000);
      start.setSeconds(0, 0);
      const durationMins = 60;
      return {
        id: 2,
        title: '2STS05SRM',
        college: 'VIT Vellore',
        startISO: start.toISOString(),
        durationMins,
        date: formatDisplayDate(start.toISOString(), durationMins),
        type: 'Weekly Sync',
        participants: 8,
        workletCode: '2STS05SRM',
        mentor: 'Prof. Kumar',
        description: 'Progress on IoT devices',
        meetingLink: ''
      };
    })(),
    // Completed meeting: -2 days
    (() => {
      const start = new Date(nowSeed - 2*24*60*60*1000);
      start.setHours(10, 0, 0, 0); // 10 AM
      const durationMins = 60;
      return {
        id: 3,
        title: 'AI Workshop - Batch 1',
        college: 'SRM Chennai',
        startISO: start.toISOString(),
        durationMins,
        date: formatDisplayDate(start.toISOString(), durationMins),
        type: 'Workshop',
        participants: 25,
        workletCode: 'AI2024B1',
        mentor: 'Dr. Patel',
        description: 'Introduction to Machine Learning',
        meetingLink: ''
      };
    })()
  ];

  // Meetings state (allows newly created meetings to appear instantly)
  const [meetings, setMeetings] = useState(initialMeetings);
  // Reschedule form state
  const [rescheduleDateTime, setRescheduleDateTime] = useState('');
  const [rescheduleDuration, setRescheduleDuration] = useState(60);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [rescheduleTouched, setRescheduleTouched] = useState(false);

  // Compute dynamic status based on current time vs meeting time
  const computeDynamicStatus = (meeting) => {
    if (meeting.status === 'cancelled') return 'cancelled';
    if (!meeting.startISO || !meeting.durationMins) return meeting.status || 'upcoming';
    
    const start = new Date(meeting.startISO).getTime();
    const end = start + meeting.durationMins * 60000;
    const now = Date.now();
    
    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'present';
    return 'completed';
  };

  // Filter meetings based on selected filter
  const filteredMeetings = meetings.filter(meeting => {
    if (selectedFilter === 'all') return true;
    const dynamicStatus = computeDynamicStatus(meeting);
    return dynamicStatus === selectedFilter;
  });

  // Sort meetings by status priority: present -> upcoming -> completed
  const sortedMeetings = filteredMeetings.sort((a, b) => {
    const statusA = computeDynamicStatus(a);
    const statusB = computeDynamicStatus(b);
    
    // Define priority order: present (1), upcoming (2), completed (3)
    const statusPriority = {
      'present': 1,
      'upcoming': 2,
      'completed': 3,
      'cancelled': 4
    };
    
    const priorityA = statusPriority[statusA] || 5;
    const priorityB = statusPriority[statusB] || 5;
    
    // If same priority, sort by start time (earliest first for upcoming/present, latest first for completed)
    if (priorityA === priorityB) {
      if (statusA === 'completed') {
        // For completed meetings, show most recent first
        return new Date(b.startISO || 0) - new Date(a.startISO || 0);
      } else {
        // For present/upcoming meetings, show earliest first
        return new Date(a.startISO || 0) - new Date(b.startISO || 0);
      }
    }
    
    return priorityA - priorityB;
  });



  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  // Close filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilterMenu && !event.target.closest('.filter-dropdown')) {
        setShowFilterMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterMenu]);



  const handleJoinMeeting = (meetingId) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;
    // If a meeting link exists, open it directly; otherwise show modal (legacy behaviour)
    if (meeting.meetingLink) {
      try {
        window.open(meeting.meetingLink, '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.error('Failed to open meeting link', e);
        // Fallback to modal if popup blocked
        setSelectedMeeting(meeting);
        setShowJoinModal(true);
      }
    } else {
      setSelectedMeeting(meeting);
      setShowJoinModal(true);
    }
  };

  const handleRescheduleMeeting = (meetingId) => {
    const meeting = meetings.find(m => m.id === meetingId);
    setSelectedMeeting(meeting);
    setShowRescheduleModal(true);
    if (meeting) {
      // Default new start to 24h later for convenience
      const now = new Date();
      const start = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      start.setMinutes(start.getMinutes() + (30 - (start.getMinutes() % 30)) % 30, 0, 0);
      setRescheduleDateTime(start.toISOString().slice(0,16));
      setRescheduleDuration(meeting.durationMins || 60);
      setRescheduleReason('');
      setRescheduleTouched(false);
    }
  };

  const handleCancelMeeting = (meetingId) => {
    const meeting = meetings.find(m => m.id === meetingId);
    setSelectedMeeting(meeting);
    setShowCancelModal(true);
  };

  const confirmCancelMeeting = () => {
    if (selectedMeeting) {
      // Option A: Remove meeting completely
      setMeetings(prev => prev.filter(m => m.id !== selectedMeeting.id));
      // Option B (alternative): mark as cancelled instead of removing
      // setMeetings(prev => prev.map(m => m.id === selectedMeeting.id ? { ...m, status: 'cancelled' } : m));
      console.log('Meeting cancelled:', selectedMeeting.id);
    }
    setShowCancelModal(false);
    setSelectedMeeting(null);
  };

  const confirmJoinMeeting = () => {
    console.log('Joining meeting:', selectedMeeting?.id);
    setShowJoinModal(false);
    setSelectedMeeting(null);
    // Add actual join logic here (redirect to meeting room)
  };

  const confirmRescheduleMeeting = () => {
    if (!selectedMeeting) return;
    // Reason optional now; only require a chosen datetime
    if (!rescheduleDateTime) return;

    const formatDisplayDate = (startISO, durationMins) => {
      const start = new Date(startISO);
      const end = new Date(start.getTime() + durationMins * 60000);
      const day = start.getDate();
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const month = monthNames[start.getMonth()];
      const year = String(start.getFullYear()).slice(-2);
      const formatTime = (d) => {
        let h = d.getHours();
        const m = d.getMinutes().toString().padStart(2,'0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12; if (h === 0) h = 12;
        return `${h}:${m} ${ampm}`;
      };
      return `${day}-${month}-${year}, ${formatTime(start)} - ${formatTime(end)}`;
    };

    const updatedDate = formatDisplayDate(rescheduleDateTime, rescheduleDuration);

    setMeetings(prev => prev.map(m => m.id === selectedMeeting.id ? {
      ...m,
      date: updatedDate,
      startISO: new Date(rescheduleDateTime).toISOString(),
      durationMins: rescheduleDuration,
      lastRescheduledAt: new Date().toISOString(),
      lastRescheduleReason: rescheduleReason.trim() || null
    } : m));

    console.log('Rescheduled meeting:', selectedMeeting.id, '->', updatedDate, 'Reason:', rescheduleReason.trim() || '(none)');
    setShowRescheduleModal(false);
    setSelectedMeeting(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
      case 'present': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
      case 'scheduled': return 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400';
      case 'completed': return 'bg-gray-100 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400';
      case 'cancelled': return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 line-through';
      default: return 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
    }
  };



  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 text-slate-800 overflow-hidden dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 dark:text-slate-200">
      <LeftSidebar />
      
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                My Meetings
              </h1>
              <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Manage your worklet meetings and track activities
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white dark:bg-slate-800 rounded-lg px-4 py-2 shadow-sm border border-slate-200 dark:border-slate-700">
                <span className="text-sm text-slate-600 dark:text-slate-400">Total: </span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{meetings.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Meetings Container */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Toolbar */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-b border-slate-200 dark:border-slate-600 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Scheduled Meetings
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { resetAddForm(); setShowAddModal(true); }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  Add Meeting
                </button>
                <div className="relative filter-dropdown">
                  <button
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 ${
                      showFilterMenu 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300' 
                        : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {selectedFilter === 'all' ? 'All Meetings' : selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
                  </button>
                  {showFilterMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-2 backdrop-blur-sm">
                      {[
                        { value: 'all', label: 'All Meetings', count: meetings.length },
                        { value: 'upcoming', label: 'Upcoming', count: meetings.filter(m => computeDynamicStatus(m) === 'upcoming').length },
                        { value: 'present', label: 'Present', count: meetings.filter(m => computeDynamicStatus(m) === 'present').length },
                        { value: 'completed', label: 'Completed', count: meetings.filter(m => computeDynamicStatus(m) === 'completed').length }
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSelectedFilter(option.value);
                            setShowFilterMenu(false);
                          }}
                          className={`flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${
                            selectedFilter === option.value 
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium' 
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span>{option.label}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            selectedFilter === option.value 
                              ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300' 
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                          }`}>
                            {option.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Meetings List */}
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <div className="text-slate-500 dark:text-slate-400">Loading meetings...</div>
              </div>
            ) : sortedMeetings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  No meetings found
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-center mb-6">
                  {selectedFilter === 'all' 
                    ? "You don't have any meetings scheduled yet." 
                    : `No ${selectedFilter} meetings at the moment.`}
                </p>
                {selectedFilter === 'all' && (
                  <button
                    onClick={() => { resetAddForm(); setShowAddModal(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Schedule your first meeting
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedMeetings.map((meeting) => {
                  const dynamicStatus = computeDynamicStatus(meeting);
                  return (
                    <div
                      key={meeting.id}
                      className="group bg-gradient-to-r from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-600 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                              {meeting.title}
                            </h3>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(dynamicStatus)}`}>
                              {dynamicStatus}
                            </span>
                            {dynamicStatus === 'present' && (
                              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-medium">LIVE</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <Calendar className="w-4 h-4 text-blue-500" />
                              <span>{meeting.date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <Users className="w-4 h-4 text-green-500" />
                              <span>{meeting.participants} participants</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <User className="w-4 h-4 text-purple-500" />
                              <span>{meeting.mentor}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <MapPin className="w-4 h-4 text-orange-500" />
                              <span>{meeting.college}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-3">
                            <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-xs font-medium">
                              {meeting.workletCode}
                            </div>
                            <div className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-md text-xs">
                              {meeting.type}
                            </div>
                          </div>
                          
                          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                            {meeting.description}
                          </p>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-6">
                          <button
                            onClick={() => handleJoinMeeting(meeting.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              dynamicStatus === 'present' 
                                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg' 
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                          >
                            {dynamicStatus === 'present' ? 'Join Now' : 'Join'}
                          </button>
                          <button
                            onClick={() => handleRescheduleMeeting(meeting.id)}
                            className="px-4 py-2 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm rounded-lg hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleCancelMeeting(meeting.id)}
                            className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <RightSidebar />

      {/* Cancel Meeting Modal */}
      {showCancelModal && selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-end mb-4">
              <button 
                onClick={() => setShowCancelModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Do you want to cancel meeting scheduled at {selectedMeeting.date} for worklet {selectedMeeting.workletCode}?
              </h3>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-6 py-2 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors font-semibold"
                >
                  NO
                </button>
                <button
                  onClick={confirmCancelMeeting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  YES
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Meeting Modal */}
      {showJoinModal && selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-end mb-4">
              <button 
                onClick={() => setShowJoinModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Join meeting "{selectedMeeting.title}" scheduled for {selectedMeeting.date}?
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                You will be redirected to the meeting room with {selectedMeeting.participants} participants.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="px-6 py-2 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmJoinMeeting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Join Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Meeting Modal */}
      {showRescheduleModal && selectedMeeting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl relative">
            <button
              onClick={() => setShowRescheduleModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-2xl font-bold"
              aria-label="Close reschedule modal"
            >
              ×
            </button>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 text-center">Reschedule Meeting</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 text-center">Current: {selectedMeeting.date}</p>
            <form
              onSubmit={(e) => { e.preventDefault(); confirmRescheduleMeeting(); }}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">New Start</label>
                  <input
                    type="datetime-local"
                    value={rescheduleDateTime}
                    onChange={(e) => setRescheduleDateTime(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-md px-2 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Duration (mins)</label>
                  <select
                    value={rescheduleDuration}
                    onChange={(e) => setRescheduleDuration(Number(e.target.value))}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-md px-2 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[15,30,45,60,90,120].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Reason (Optional)</label>
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="Optional: add a reason for audit trail"
                  className="w-full h-28 resize-none border rounded-md px-3 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 border-slate-300 dark:border-slate-600"
                />
              </div>
              <div className="flex justify-end gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="px-5 py-2 rounded-md bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-slate-200 hover:bg-slate-400 dark:hover:bg-slate-500 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
                  disabled={!rescheduleDateTime}
                >
                  Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Meeting Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 p-8 relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-all duration-200"
              aria-label="Close add meeting form"
            >
              ✕
            </button>
            
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Create New Meeting</h3>
              <p className="text-slate-600 dark:text-slate-400">Schedule a meeting for your worklet participants</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setFormTouched(true);
                if (!formMeetingLink.trim() || !formWorklet) return; // enforce required fields

                // Find selected worklet details
                const selectedWorklet = availableWorklets.find(w => w.id === formWorklet);

                // Derive a lightweight code from title (fallback if empty)
                const deriveCode = (t) => {
                  if (!t) return formWorklet; // Use worklet ID if no title
                  return t.replace(/[^a-zA-Z0-9]/g,'').toUpperCase().slice(0,10) || formWorklet;
                };

                const newMeeting = {
                  id: Date.now(),
                  title: formTitle || `${selectedWorklet?.name.split(' - ')[0]} Meeting`,
                  college: selectedWorklet?.college || '-',
                  startISO: new Date(formStart).toISOString(),
                  durationMins: formDuration,
                  date: formatDisplayDate(formStart, formDuration),
                  type: 'Custom',
                  participants: 0,
                  workletCode: formWorklet,
                  mentor: 'You',
                  description: formDescription || `Meeting for ${selectedWorklet?.name}`,
                  meetingLink: formMeetingLink,
                  repeat: formRepeatDays.length ? { days: formRepeatDays, until: formRepeatUntil || null } : null
                };

                setMeetings(prev => [newMeeting, ...prev]); // prepend newest
                console.log('Added meeting:', newMeeting);
                setShowAddModal(false);
              }}
              className="space-y-8"
            >
              {/* Title */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Meeting Title</label>
                <input
                  type="text"
                  placeholder="Enter meeting title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                <input
                  type="text"
                  placeholder="Brief description of the meeting"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Worklet Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Select Worklet <span className="text-red-500">*</span></label>
                <select
                  value={formWorklet}
                  onChange={(e) => setFormWorklet(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="" className="bg-white dark:bg-slate-800">Choose a worklet...</option>
                  {availableWorklets.map(worklet => (
                    <option key={worklet.id} value={worklet.id} className="bg-white dark:bg-slate-800">
                      {worklet.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date / Duration Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formStart}
                    onChange={(e) => setFormStart(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Duration</label>
                  <select
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {durationOptions.map(min => (
                      <option key={min} value={min} className="bg-white dark:bg-slate-800">
                        {min === 60 ? '1 hour' : min < 60 ? `${min} minutes` : `${min/60} hours`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Repeat Days / Repeat Until */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Select Repeat Days</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        // simple expansion through toggling a local dropdown list inline
                        const menu = e.currentTarget.nextSibling;
                        if (menu) menu.classList.toggle('hidden');
                      }}
                      className="w-full text-left border-0 border-b border-slate-200 dark:border-slate-600 bg-transparent focus:ring-0 focus:border-blue-500 py-1 text-slate-900 dark:text-white"
                    >
                      {formRepeatDays.length === 0 ? 'Select Repeat Days' : formRepeatDays.join(', ')}
                    </button>
                    <div className="hidden absolute z-10 mt-1 w-full bg-white dark:bg-slate-700 shadow-lg rounded-md border border-slate-200 dark:border-slate-600 max-h-48 overflow-auto">
                      {weekdayOptions.map(day => {
                        const active = formRepeatDays.includes(day);
                        return (
                          <div
                            key={day}
                            onClick={() => {
                              setFormRepeatDays(prev => active ? prev.filter(d => d!==day) : [...prev, day]);
                            }}
                            className={`px-3 py-2 text-sm cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-600 ${active ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}
                          >
                            {day}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col opacity-100">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Repeat Until</label>
                  <input
                    type="date"
                    disabled={formRepeatDays.length === 0}
                    value={formRepeatUntil}
                    onChange={(e) => setFormRepeatUntil(e.target.value)}
                    className={`w-full border-0 border-b bg-transparent focus:ring-0 focus:border-blue-500 text-slate-900 dark:text-white ${formRepeatDays.length===0 ? 'border-slate-300 dark:border-slate-600 text-slate-400 cursor-not-allowed' : 'border-slate-200 dark:border-slate-600'}`}
                  />
                </div>
              </div>

              {/* Meeting Link */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Meeting Link <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://teams.microsoft.com/..."
                    value={formMeetingLink}
                    onChange={(e) => setFormMeetingLink(e.target.value)}
                    onBlur={() => setFormTouched(true)}
                    className={`w-full px-4 py-3 pr-12 border rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                      !formMeetingLink && formTouched 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-transparent'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={openMSTeams}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group ${formMeetingLink.trim() ? 'opacity-0 invisible' : 'opacity-100 visible'}`}
                    title="Open Microsoft Teams to create meeting link"
                  >
                    <Video className="w-5 h-5" />
                  </button>
                </div>
                {!formMeetingLink && formTouched && (
                  <p className="text-sm text-red-600">Meeting link is required</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold rounded-xl py-4 transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg disabled:shadow-none"
                  disabled={!formMeetingLink || !formWorklet}
                >
                  {(!formMeetingLink || !formWorklet) ? 'Please fill required fields' : 'Create Meeting'}
                </button>
                {(!formMeetingLink || !formWorklet) && formTouched && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 text-center">
                    {!formWorklet ? 'Please select a worklet' : 'Meeting link is required'}
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meetings;
