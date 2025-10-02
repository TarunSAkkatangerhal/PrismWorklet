import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  Search,
  Filter,
  User,
  Settings
} from 'lucide-react';
import LeftSidebar from '../components/Left';
import RightSidebar from '../components/Right';

const Meetings = () => {
  const [selectedTab, setSelectedTab] = useState('scheduled');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  // Mock data for scheduled meetings
  const scheduledMeetings = [
    {
      id: 1,
      title: '2STS04VIT',
      college: 'VIT Vellore',
      date: '12-May-25, 3-4 PM',
      type: 'Project Review',
      status: 'upcoming',
      participants: 12,
      workletCode: '2STS04VIT',
      mentor: 'Dr. Sharma',
      description: 'Project review for IoT devices'
    },
    {
      id: 2,
      title: '2STS05SRM',
      college: 'VIT Vellore', 
      date: '15-May-25, 1-2 PM',
      type: 'Weekly Sync',
      status: 'upcoming',
      participants: 8,
      workletCode: '2STS05SRM',
      mentor: 'Prof. Kumar',
      description: 'Progress on IoT devices'
    },
    {
      id: 3,
      title: 'AI Workshop - Batch 1',
      college: 'SRM Chennai',
      date: '18-May-25, 10-11 AM',
      type: 'Workshop',
      status: 'scheduled',
      participants: 25,
      workletCode: 'AI2024B1',
      mentor: 'Dr. Patel',
      description: 'Introduction to Machine Learning'
    }
  ];



  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);



  const handleJoinMeeting = (meetingId) => {
    const meeting = scheduledMeetings.find(m => m.id === meetingId);
    setSelectedMeeting(meeting);
    setShowJoinModal(true);
  };

  const handleRescheduleMeeting = (meetingId) => {
    const meeting = scheduledMeetings.find(m => m.id === meetingId);
    setSelectedMeeting(meeting);
    setShowRescheduleModal(true);
  };

  const handleCancelMeeting = (meetingId) => {
    const meeting = scheduledMeetings.find(m => m.id === meetingId);
    setSelectedMeeting(meeting);
    setShowCancelModal(true);
  };

  const confirmCancelMeeting = () => {
    console.log('Meeting cancelled:', selectedMeeting?.id);
    setShowCancelModal(false);
    setSelectedMeeting(null);
    // Add actual cancel logic here
  };

  const confirmJoinMeeting = () => {
    console.log('Joining meeting:', selectedMeeting?.id);
    setShowJoinModal(false);
    setSelectedMeeting(null);
    // Add actual join logic here (redirect to meeting room)
  };

  const confirmRescheduleMeeting = () => {
    console.log('Rescheduling meeting:', selectedMeeting?.id);
    setShowRescheduleModal(false);
    setSelectedMeeting(null);
    // Add actual reschedule logic here
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
      case 'scheduled': return 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400';
      case 'completed': return 'bg-gray-100 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400';
      default: return 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
    }
  };



  return (
    <div className="flex h-screen w-full bg-slate-100 text-slate-800 overflow-hidden dark:bg-slate-900 dark:text-slate-200">
      <LeftSidebar />
      
      <main className="flex-1 p-[clamp(1rem,2vw,2rem)] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-slate-200 [&::-webkit-scrollbar-thumb]:bg-slate-400 dark:[&::-webkit-scrollbar-track]:bg-slate-800 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600">
        {/* Header Section */}
        <div className="mb-[2vh]">
          <h1 className="text-[clamp(1.5rem,3vw,2.5rem)] font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-[0.5vh]">
            My Meetings
          </h1>
          <p className="text-[clamp(0.875rem,1.2vw,1rem)] text-slate-600 dark:text-slate-400">
            Manage your worklet meetings and track activities
          </p>
        </div>

        {/* Scheduled Meetings */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-[clamp(1rem,1.5vw,1.5rem)]">
          <div className="flex items-center justify-between mb-[1.5vh]">
            <h2 className="text-[clamp(1.125rem,1.5vw,1.25rem)] font-semibold text-slate-900 dark:text-white">Scheduled Meetings</h2>
            <div className="flex items-center space-x-[0.5vw]">
              <button className="p-[0.5vw] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <Search className="w-[clamp(1rem,1.2vw,1.125rem)] h-[clamp(1rem,1.2vw,1.125rem)]" />
              </button>
              <button className="p-[0.5vw] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <Filter className="w-[clamp(1rem,1.2vw,1.125rem)] h-[clamp(1rem,1.2vw,1.125rem)]" />
              </button>
            </div>
          </div>

          {/* Meetings List */}
          <div className="space-y-[1vh]">
            {loading ? (
              <div className="flex items-center justify-center py-[2vh]">
                <div className="text-slate-500 dark:text-slate-400">Loading meetings...</div>
              </div>
            ) : (
              scheduledMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-[clamp(0.75rem,1.2vw,1rem)] border border-slate-200 dark:border-slate-600 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-[0.75vw] mb-[0.5vh]">
                        <h3 className="font-semibold text-[clamp(0.875rem,1.1vw,1rem)] text-slate-900 dark:text-white">
                          {meeting.title}
                        </h3>
                        <span className={`px-[0.5vw] py-[0.25vh] text-[clamp(0.75rem,0.9vw,0.875rem)] font-semibold rounded-full ${getStatusColor(meeting.status)}`}>
                          {meeting.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-[1vw] text-[clamp(0.75rem,0.9vw,0.875rem)] text-slate-600 dark:text-slate-400">
                        <div className="flex items-center space-x-[0.5vw]">
                          <Calendar className="w-[clamp(0.875rem,1vw,1rem)] h-[clamp(0.875rem,1vw,1rem)]" />
                          <span>{meeting.date}</span>
                        </div>
                        <div className="flex items-center space-x-[0.5vw]">
                          <Users className="w-[clamp(0.875rem,1vw,1rem)] h-[clamp(0.875rem,1vw,1rem)]" />
                          <span>{meeting.participants} participants</span>
                        </div>
                        <div className="flex items-center space-x-[0.5vw]">
                          <User className="w-[clamp(0.875rem,1vw,1rem)] h-[clamp(0.875rem,1vw,1rem)]" />
                          <span>{meeting.mentor}</span>
                        </div>
                        <div className="flex items-center space-x-[0.5vw]">
                          <Settings className="w-[clamp(0.875rem,1vw,1rem)] h-[clamp(0.875rem,1vw,1rem)]" />
                          <span>{meeting.type}</span>
                        </div>
                      </div>
                      
                      <p className="text-[clamp(0.75rem,0.9vw,0.875rem)] text-slate-500 dark:text-slate-400 mt-[0.5vh]">
                        {meeting.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-[0.5vw] ml-[1vw]">
                      <button
                        onClick={() => handleJoinMeeting(meeting.id)}
                        className="px-[0.75vw] py-[0.25vh] bg-blue-500 text-white text-[clamp(0.75rem,0.9vw,0.875rem)] rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        Join
                      </button>
                      <button
                        onClick={() => handleRescheduleMeeting(meeting.id)}
                        className="px-[0.75vw] py-[0.25vh] bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 text-[clamp(0.75rem,0.9vw,0.875rem)] rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => handleCancelMeeting(meeting.id)}
                        className="px-[0.75vw] py-[0.25vh] bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[clamp(0.75rem,0.9vw,0.875rem)] rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-end mb-4">
              <button 
                onClick={() => setShowRescheduleModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Reschedule meeting "{selectedMeeting.title}"
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Current schedule: {selectedMeeting.date}
              </p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Select new date and time:
                </label>
                <input
                  type="datetime-local"
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowRescheduleModal(false)}
                  className="px-6 py-2 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-400 dark:hover:bg-slate-500 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRescheduleMeeting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Reschedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meetings;
