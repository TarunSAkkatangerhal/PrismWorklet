/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import axios from 'axios';
import apiClient from '../../services/secureAPI';

// Define all possible stages outside component to avoid dependency issues
const allStages = [
  { value: 'first_review', label: 'First Review' },
  { value: 'second_review', label: 'Second Review' },
  { value: 'mid_review', label: 'Mid Review' },
  { value: 'fourth_review', label: 'Fourth Review' },
  { value: 'fifth_review', label: 'Fifth Review' },
  { value: 'end_review', label: 'End Review' },
  { value: 'extended', label: 'Extended' },
  { value: 'ad_hoc', label: 'Ad-Hoc' }
];

export default function FeedbackForm({ isOpen, onClose }) {
  const [selectedWorklet, setSelectedWorklet] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [feedbackContent, setFeedbackContent] = useState("");
  const [worklets, setWorklets] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [availableStages, setAvailableStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchWorklets();
    }
  }, [isOpen]);

  // Fetch milestones when worklet changes
  useEffect(() => {
    const fetchMilestones = async () => {
      if (!selectedWorklet) {
        setMilestones([]);
        setAvailableStages([]);
        setSelectedStage("");
        return;
      }

      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const response = await axios.get(
          `http://localhost:8000/worklets/${selectedWorklet}/milestones`,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          }
        );

        const fetchedMilestones = response.data?.milestones || [];
        setMilestones(fetchedMilestones);

        // Extract milestone types/stages that have been added by students
        const milestoneTitles = fetchedMilestones.map(m => m.title?.toLowerCase() || '');
        
        // Map milestone titles to stage values
        const stageMapping = {
          'first review': 'first_review',
          'weekly meeting': 'first_review',
          'second review': 'second_review',
          'monthly meeting': 'second_review',
          'mid review': 'mid_review',
          'mid-review': 'mid_review',
          'fourth review': 'fourth_review',
          'fifth review': 'fifth_review',
          'end review': 'end_review',
          'extended': 'extended',
          'ad-hoc': 'ad_hoc',
          'ad hoc': 'ad_hoc',
          'others': 'ad_hoc'
        };

        // Find which stages are available based on milestones
        const available = allStages.filter(stage => {
          return milestoneTitles.some(title => {
            return stageMapping[title] === stage.value || title.includes(stage.label.toLowerCase());
          });
        });

        setAvailableStages(available);
        setSelectedStage(""); // Reset selection when worklet changes
      } catch (error) {

        setMilestones([]);
        setAvailableStages([]);
      }
    };

    fetchMilestones();
  }, [selectedWorklet]);

  const fetchWorklets = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("access_token");
      if (!token) {
        setError("User information not found. Please log in again.");
        setLoading(false);
        return;
      }
      const userResp = await apiClient.get('/auth/profile');
      const userId = userResp?.data?.id;
      if (!userId) {
        setError("Unable to determine user ID. Please re-login.");
        setLoading(false);
        return;
      }
      const response = await apiClient.get(`/api/associations/mentor/${userId}/worklets?status_filter=ongoing`);
      const data = response?.data?.ongoing_worklets || [];
      setWorklets(Array.isArray(data) ? data : []);
      if ((data || []).length === 0) setError("No worklets found for this mentor");
    } catch (error) {
      setError("Failed to load worklets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedWorklet) {
      setShowWarningPopup(true);
      setTimeout(() => setShowWarningPopup(false), 2500);
      return;
    }

    if (!selectedStage || !feedbackContent.trim()) {
      setShowWarningPopup(true);
      setTimeout(() => setShowWarningPopup(false), 2500);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      const feedbackData = {
        worklet_id: parseInt(selectedWorklet, 10),
        stage: selectedStage, // Send stage instead of month
        feedback_content: feedbackContent.trim()
      };

      const response = await apiClient.post('/worklets/submit-feedback', feedbackData);

      
      
      // Reset form
      setSelectedWorklet("");
      setSelectedStage("");
      setFeedbackContent("");
      setMilestones([]);
      setAvailableStages([]);
      
      // Show success popup
      setShowSuccessPopup(true);
      setTimeout(() => {
        setShowSuccessPopup(false);
        onClose();
      }, 3000);

    } catch (error) {
      setShowErrorPopup(true);
      setTimeout(() => setShowErrorPopup(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedWorklet("");
    setSelectedStage("");
    setFeedbackContent("");
    setMilestones([]);
    setAvailableStages([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[70]">
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={handleClose}></div>
      
      <div className="bg-white rounded-2xl shadow-2xl p-[clamp(1.5rem,3vw,2rem)] mx-[clamp(0.75rem,2vw,1rem)] relative z-10 dark:bg-slate-800 max-w-[clamp(24rem,35vw,32rem)] w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-[clamp(1rem,2vh,1.5rem)]">
          <div>
            <h2 className="text-[clamp(1.25rem,2vw,1.5rem)] font-bold text-gray-900 dark:text-white">
              📝 Submit Feedback
            </h2>
            <p className="text-[clamp(0.875rem,1.2vw,1rem)] text-gray-600 dark:text-gray-300 mt-[clamp(0.25rem,0.5vh,0.5rem)]">
              Send feedback to all students in the selected worklet
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-[clamp(1.25rem,1.8vw,1.5rem)] h-[clamp(1.25rem,1.8vw,1.5rem)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading && !worklets.length ? (
          <div className="flex items-center justify-center py-[clamp(1.5rem,3vh,2rem)]">
            <div className="animate-spin rounded-full h-[clamp(1.5rem,2.5vw,2rem)] w-[clamp(1.5rem,2.5vw,2rem)] border-b-2 border-blue-600"></div>
            <span className="ml-[clamp(0.5rem,1vw,0.75rem)] text-gray-600 text-[clamp(0.875rem,1.2vw,1rem)] dark:text-gray-300">Loading worklets...</span>
          </div>
        ) : error ? (
          <div className="text-center py-[clamp(1.5rem,3vh,2rem)]">
            <div className="text-red-600 dark:text-red-400 mb-[clamp(0.75rem,1.5vh,1rem)] text-[clamp(0.875rem,1.2vw,1rem)]">⚠️ {error}</div>
            <button
              onClick={fetchWorklets}
              className="bg-blue-600 text-white px-[clamp(0.75rem,1.5vw,1rem)] py-[clamp(0.5rem,1vh,0.75rem)] rounded-lg hover:bg-blue-700 transition-colors text-[clamp(0.875rem,1.2vw,1rem)]"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-[clamp(1rem,2vh,1.5rem)]">
            {/* Worklet Selection */}
            <div>
              <label className="block text-[clamp(0.75rem,1vw,0.875rem)] font-medium text-gray-700 dark:text-gray-300 mb-[clamp(0.5rem,1vh,0.75rem)]">
                Select Worklet *
              </label>
              <select
                value={selectedWorklet}
                onChange={(e) => setSelectedWorklet(e.target.value)}
                className="w-full p-[clamp(0.5rem,1.2vw,0.75rem)] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-[clamp(0.875rem,1.2vw,1rem)] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                style={{
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                <option value="">Choose a worklet...</option>
                {worklets.map((worklet) => {
                  const displayText = `${worklet.cert_id} - ${worklet.description || worklet.title || ''}`;
                  const truncatedText = displayText.length > 60 
                    ? displayText.substring(0, 60) + '...' 
                    : displayText;
                  return (
                    <option 
                      key={worklet.id} 
                      value={worklet.id}
                      title={displayText}
                    >
                      {truncatedText}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Stage Selection */}
            <div>
              <label className="block text-[clamp(0.75rem,1vw,0.875rem)] font-medium text-gray-700 dark:text-gray-300 mb-[clamp(0.5rem,1vh,0.75rem)]">
                Feedback Stage *
              </label>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                disabled={!selectedWorklet || availableStages.length === 0}
              >
                <option value="">
                  {!selectedWorklet 
                    ? "Select a worklet first..." 
                    : availableStages.length === 0 
                      ? "No milestones available" 
                      : "Select a stage..."}
                </option>
                {allStages.map((stageOption) => {
                  const isAvailable = availableStages.some(s => s.value === stageOption.value);
                  return (
                    <option 
                      key={stageOption.value} 
                      value={stageOption.value}
                      disabled={!isAvailable}
                    >
                      {stageOption.label} {!isAvailable ? "(No milestone)" : ""}
                    </option>
                  );
                })}
              </select>
              {selectedWorklet && availableStages.length === 0 && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ Student hasn't added any milestones yet
                </p>
              )}
            </div>

            {/* Feedback Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Feedback Content *
              </label>
              <textarea
                value={feedbackContent}
                onChange={(e) => setFeedbackContent(e.target.value)}
                placeholder="Enter your detailed feedback here..."
                rows={6}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
              />
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {feedbackContent.length} characters
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={handleClose}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {loading ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Beautiful Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-[100]">
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
          <div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 relative z-10 dark:bg-slate-800 max-w-md w-full transform animate-bounce">
            {/* Success Icon */}
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center dark:bg-green-900">
                <svg 
                  className="w-8 h-8 text-green-600 dark:text-green-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              </div>
            </div>
            
            {/* Success Message */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                🎉 Feedback Sent!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Your feedback has been sent successfully!
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                All students in the worklet will receive an email notification.
              </p>
            </div>
            
            {/* Progress bar animation */}
            <div className="mt-6">
              <div className="w-full bg-gray-200 rounded-full h-1 dark:bg-gray-700">
                <div 
                  className="bg-green-600 h-1 rounded-full animate-pulse"
                  style={{
                    width: '100%',
                    animation: 'progress 3s linear forwards'
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Beautiful Warning Popup */}
      {showWarningPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-[100]">
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
          <div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 relative z-10 dark:bg-slate-800 max-w-md w-full transform animate-pulse">
            {/* Warning Icon */}
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center dark:bg-yellow-900">
                <svg 
                  className="w-8 h-8 text-yellow-600 dark:text-yellow-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                  />
                </svg>
              </div>
            </div>
            
            {/* Warning Message */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                ⚠️ Missing Information
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Please fill in all required fields.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Worklet, stage, and content are required.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Beautiful Error Popup */}
      {showErrorPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-[100]">
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
          <div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 relative z-10 dark:bg-slate-800 max-w-md w-full transform animate-pulse">
            {/* Error Icon */}
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center dark:bg-red-900">
                <svg 
                  className="w-8 h-8 text-red-600 dark:text-red-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              </div>
            </div>
            
            {/* Error Message */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                ❌ Submission Failed
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Failed to submit feedback. Please try again.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Check your connection and try again.
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}

