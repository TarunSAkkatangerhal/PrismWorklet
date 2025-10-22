import React, { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import axios from 'axios';

const MeetingUpdatesModal = ({ isOpen, onClose, worklet }) => {
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDateTime, setMeetingDateTime] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  
  // Worklet selection state
  const [availableWorklets, setAvailableWorklets] = useState([]);
  const [selectedWorklet, setSelectedWorklet] = useState(null);
  const [loadingWorklets, setLoadingWorklets] = useState(false);

  // Fetch student's worklets when modal opens without a pre-selected worklet
  useEffect(() => {
    if (isOpen && !worklet) {
      fetchStudentWorklets();
    }
  }, [isOpen, worklet]);

  const fetchStudentWorklets = async () => {
    setLoadingWorklets(true);
    try {
      const token = localStorage.getItem('access_token');
      const userEmail = localStorage.getItem('user_email');
      
      if (!token || !userEmail) {
        console.error('No token or email found');
        setLoadingWorklets(false);
        return;
      }

      const response = await axios.get(
        `http://localhost:8000/worklets/student/${encodeURIComponent(userEmail)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      if (response.data && response.data.worklets) {
        setAvailableWorklets(response.data.worklets);
        if (response.data.worklets.length > 0) {
          setSelectedWorklet(response.data.worklets[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching worklets:', error);
      // Do not use dummy data; show empty state instead
      setAvailableWorklets([]);
      setSelectedWorklet(null);
    } finally {
      setLoadingWorklets(false);
    }
  };

  const handleWorkletChange = (e) => {
    const workletId = parseInt(e.target.value);
    const selected = availableWorklets.find(w => w.id === workletId);
    if (selected) {
      setSelectedWorklet(selected);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const targetWorklet = worklet || selectedWorklet;
    
    if (!targetWorklet) {
      alert('Please select a worklet for this meeting update.');
      return;
    }
    
    // TODO: Add API call to submit meeting update
    console.log('Submit Meeting Update:', {
      worklet_id: targetWorklet.id,
      worklet_cert_id: targetWorklet.cert_id,
      meetingTitle,
      meetingDateTime,
      meetingNotes
    });
    // Reset form
    setMeetingTitle('');
    setMeetingDateTime('');
    setMeetingNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Meeting Updates</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 
                      rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Worklet Selection - Show when no worklet prop is provided */}
            {!worklet && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Worklet <span className="text-red-500">*</span>
                </label>
                {loadingWorklets ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading worklets...</span>
                  </div>
                ) : availableWorklets.length > 0 ? (
                  <>
                    <div className="relative">
                      <select
                        value={selectedWorklet?.id || ''}
                        onChange={handleWorkletChange}
                        required
                        className="w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg 
                                  bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                  appearance-none cursor-pointer"
                      >
                        {availableWorklets.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.cert_id} - {w.title}
                          </option>
                        ))}
                      </select>
                      <ChevronDown 
                        size={20} 
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                      />
                    </div>
                    {selectedWorklet && (
                      <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">SELECTED WORKLET</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{selectedWorklet.cert_id}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{selectedWorklet.title}</div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      No worklets found. Please contact your mentor or administrator.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Show worklet info if passed as prop */}
            {worklet && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">WORKLET</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{worklet.cert_id}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{worklet.title}</div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meeting Title
              </label>
              <input
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="e.g., Weekly Progress Review"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meeting Date & Time
              </label>
              <input
                type="datetime-local"
                value={meetingDateTime}
                onChange={(e) => setMeetingDateTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Meeting Notes
              </label>
              <textarea
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                rows={6}
                placeholder="Describe what was discussed, decisions made, and action items..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 
                          rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Save Meeting
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MeetingUpdatesModal;
