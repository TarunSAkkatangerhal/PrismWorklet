import React, { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import axios from 'axios';

const ProvideUpdateModal = ({ isOpen, onClose, worklet, onSuccess, onError }) => {
  // Update type state
  const [updateType, setUpdateType] = useState('adhoc'); // 'adhoc' or 'meeting'
  
  // Common states
  const [ progress,setProgress] = useState(50);
  
  // Ad-hoc update states
  const [workCompleted, setWorkCompleted] = useState('');
  const [challenges, setChallenges] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [needSupport, setNeedSupport] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');
  
  // Meeting update states
  const [meetingAgenda, setMeetingAgenda] = useState('');
  const [keyDiscussions, setKeyDiscussions] = useState('');
  const [meetingNextSteps, setMeetingNextSteps] = useState('');
  const [meetingNotes, setMeetingNotes] = useState('');
  
  // Worklet selection state (for dashboard usage)
  const [availableWorklets, setAvailableWorklets] = useState([]);
  const [selectedWorklet, setSelectedWorklet] = useState(null);
  const [loadingWorklets, setLoadingWorklets] = useState(false);

  const fetchStudentWorklets = async () => {
    setLoadingWorklets(true);
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.error('No token found');
        setLoadingWorklets(false);
        return;
      }

      // Decode token to get user role
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const decoded = JSON.parse(jsonPayload);
      const userRole = decoded.role ? decoded.role.toLowerCase() : 'student';

      // Use appropriate endpoint based on role
      const endpoint = userRole === 'professor' 
        ? 'http://localhost:8000/worklets/professor/me'
        : 'http://localhost:8000/worklets/student/me';

      const response = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      // Handle both array response (new endpoints) and object with worklets property
      const workletData = Array.isArray(response.data) ? response.data : response.data.worklets;
      
      if (workletData && workletData.length > 0) {
        setAvailableWorklets(workletData);
        // Auto-select first worklet if available
        setSelectedWorklet(workletData[0]);
        // Set initial progress from worklet
        setProgress(workletData[0].worklet_progress || 50);
      }
    } catch (error) {
      console.error('Error fetching worklets:', error);
      // Do not use dummy data; show empty state instead
      setAvailableWorklets([]);
      setSelectedWorklet(null);
      setProgress(50);
    } finally {
      setLoadingWorklets(false);
    }
  };

  const handleWorkletChange = (e) => {
    const workletId = parseInt(e.target.value);
    const selected = availableWorklets.find(w => w.id === workletId);
    if (selected) {
      setSelectedWorklet(selected);
      setProgress(selected.worklet_progress || 50);
    }
  };

  // Fetch student's worklets when modal opens without a pre-selected worklet
  useEffect(() => {
    if (isOpen && !worklet) {
      fetchStudentWorklets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, worklet]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Determine which worklet to use (prop or selected)
    const targetWorklet = worklet || selectedWorklet;
    
    if (!targetWorklet) {
      if (onError) {
        onError('Please select a worklet to provide an update for.');
      } else {
        alert('Please select a worklet to provide an update for.');
      }
      return;
    }
    
    // Prepare payload based on update type
    const payload = {
      worklet_id: targetWorklet.id,
      update_type: updateType,
    };
    
    if (updateType === 'meeting') {
      payload.meeting_agenda = meetingAgenda;
      payload.key_discussions = keyDiscussions;
      payload.meeting_next_steps = meetingNextSteps;
      payload.meeting_notes = meetingNotes;
    } else {
      payload.work_completed = workCompleted;
      payload.challenges = challenges;
      payload.next_steps = nextSteps;
      payload.need_support = needSupport;
      payload.additional_notes = additionalNotes;
    }
    
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        if (onError) {
          onError('Please login to submit an update.');
        } else {
          alert('Please login to submit an update.');
        }
        return;
      }
      
      const response = await axios.post(
        'http://localhost:8000/api/updates/',
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.status === 201) {
        if (onSuccess) {
          onSuccess('Your update has been submitted successfully!');
        } else {
          alert('Update submitted successfully!');
        }
        // Reset form
        resetForm();
        onClose();
      }
    } catch (error) {
      console.error('Error submitting update:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to submit update. Please try again.';
      if (onError) {
        onError(errorMessage);
      } else {
        alert(errorMessage);
      }
    }
  };

  const resetForm = () => {
    setUpdateType('adhoc');
    setWorkCompleted('');
    setChallenges('');
    setNextSteps('');
    setNeedSupport(false);
    setAdditionalNotes('');
    setMeetingAgenda('');
    setKeyDiscussions('');
    setMeetingNextSteps('');
    setMeetingNotes('');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Updates</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Share your current worklet progress with your mentor</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 
                      rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Worklet Selection - Show when no worklet prop is provided (dashboard usage) */}
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
                ) : (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      No worklets found. Please contact your mentor or administrator.
                    </p>
                  </div>
                )}
                {selectedWorklet && (
                  <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">SELECTED WORKLET</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{selectedWorklet.cert_id}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{selectedWorklet.title}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Current Progress</div>
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {selectedWorklet.worklet_progress || 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Worklet Info Display - Only show if worklet prop exists (from worklet details page) */}
            {worklet && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">WORKLET</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{worklet.cert_id}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{worklet.title}</div>
              </div>
            )}

            {/* Update Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Update Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUpdateType('adhoc')}
                  className={`px-4 py-3 rounded-lg border-2 font-medium transition-all duration-200 ${
                    updateType === 'adhoc'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  Ad-hoc Update
                </button>
                <button
                  type="button"
                  onClick={() => setUpdateType('meeting')}
                  className={`px-4 py-3 rounded-lg border-2 font-medium transition-all duration-200 ${
                    updateType === 'meeting'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  Meeting Update
                </button>
              </div>
            </div>

            {/* Conditional Fields Based on Update Type */}
            {updateType === 'adhoc' ? (
              // Ad-hoc Update Fields
              <>
                {/* Work Completed */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Work Completed <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={workCompleted}
                    onChange={(e) => setWorkCompleted(e.target.value)}
                    rows={4}
                    required
                    placeholder="Describe what you've accomplished..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Challenges Faced */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Challenges or Blockers
                  </label>
                  <textarea
                    value={challenges}
                    onChange={(e) => setChallenges(e.target.value)}
                    rows={3}
                    placeholder="Any issues or challenges you're facing? (optional)"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Next Steps */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Planned Next Steps <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={nextSteps}
                    onChange={(e) => setNextSteps(e.target.value)}
                    rows={3}
                    required
                    placeholder="What do you plan to work on next?"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    rows={2}
                    placeholder="Any other information you'd like to share (optional)"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Mentor Support Needed */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={needSupport}
                      onChange={(e) => setNeedSupport(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded 
                                focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 
                                focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    Need mentor support or guidance
                  </label>
                </div>
              </>
            ) : (
              // Meeting Update Fields
              <>
                {/* Meeting Agenda */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Meeting Agenda/Topics <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={meetingAgenda}
                    onChange={(e) => setMeetingAgenda(e.target.value)}
                    rows={3}
                    required
                    placeholder="What topics were covered in this meeting?"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Key Discussions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Key Discussions & Decisions <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={keyDiscussions}
                    onChange={(e) => setKeyDiscussions(e.target.value)}
                    rows={4}
                    required
                    placeholder="Important points discussed and decisions made..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Planned Next Steps */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Planned Next Steps
                  </label>
                  <textarea
                    value={meetingNextSteps}
                    onChange={(e) => setMeetingNextSteps(e.target.value)}
                    rows={3}
                    placeholder="What are the next steps or action items? (optional)"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Meeting Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Additional Meeting Notes
                  </label>
                  <textarea
                    value={meetingNotes}
                    onChange={(e) => setMeetingNotes(e.target.value)}
                    rows={3}
                    placeholder="Any other meeting notes or observations (optional)"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                              focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 
                          rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                Submit Update
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProvideUpdateModal;
