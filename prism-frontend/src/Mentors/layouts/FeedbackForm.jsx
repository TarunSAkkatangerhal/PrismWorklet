/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import axios from 'axios';
import apiClient from '../../services/secureAPI';
import { RefreshCcw } from 'lucide-react';
import ProfessionalSelect from '../../components/ProfessionalSelect';

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

/**
 * Unified Feedback Form Component
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {function} props.onClose - Callback when modal closes
 * @param {string|number} [props.workletId] - Pre-selected worklet ID (optional)
 * @param {Object} [props.preSelectedWorklet] - Pre-selected worklet object (optional)
 * 
 * Usage:
 * 1. Standalone mode (from Dashboard):
 *    <FeedbackForm isOpen={isOpen} onClose={onClose} />
 * 
 * 2. Pre-selected mode (from Worklet Details):
 *    <FeedbackForm isOpen={isOpen} onClose={onClose} workletId={123} />
 *    OR
 *    <FeedbackForm isOpen={isOpen} onClose={onClose} preSelectedWorklet={workletObj} />
 */
export default function FeedbackForm({ 
  isOpen, 
  onClose, 
  workletId: propWorkletId, 
  preSelectedWorklet,
  onSuccess,
  onError
}) {
  // Determine if we're in pre-selection mode
  const hasPreSelection = !!(propWorkletId || preSelectedWorklet);
  const preSelectedId = propWorkletId?.toString() || preSelectedWorklet?.id?.toString() || "";

  const [selectedWorklet, setSelectedWorklet] = useState(preSelectedId);
  const [selectedStage, setSelectedStage] = useState("");
  const [performanceIndicator, setPerformanceIndicator] = useState("");
  const [feedbackContent, setFeedbackContent] = useState("");
  const [progressCompletion, setProgressCompletion] = useState("");
  const [worklets, setWorklets] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [availableStages, setAvailableStages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [refreshingProgress, setRefreshingProgress] = useState(false);

  // Update selectedWorklet when props change
  useEffect(() => {
    if (propWorkletId) {
      setSelectedWorklet(propWorkletId.toString());
    } else if (preSelectedWorklet?.id) {
      setSelectedWorklet(preSelectedWorklet.id.toString());
    }
  }, [propWorkletId, preSelectedWorklet]);

  // Fetch worklets when modal opens (only if not pre-selected)
  useEffect(() => {
    if (isOpen && !hasPreSelection) {
      fetchWorklets();
    } else if (isOpen && hasPreSelection) {
      // If pre-selected, we still need to populate worklets array for display
      if (preSelectedWorklet) {
        setWorklets([preSelectedWorklet]);
      }
    }
  }, [isOpen, hasPreSelection, preSelectedWorklet]);

  // Fetch milestones when worklet changes
  useEffect(() => {
    const fetchMilestones = async () => {
      if (!selectedWorklet) {
        setMilestones([]);
        setAvailableStages([]);
        setSelectedStage("");
        setProgressCompletion("");
        return;
      }

      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        // Fetch worklet data to get current progress
        const workletResponse = await axios.get(
          `http://localhost:8000/api/associations/worklet/${selectedWorklet}`,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          }
        );

        // Set current progress as default
        if (workletResponse.data) {
          const currentProgress = workletResponse.data.worklet_progress || workletResponse.data.percentage_completion || 0;
          setProgressCompletion(currentProgress.toString());
        }

        const response = await axios.get(
          `http://localhost:8000/milestones/worklet/${selectedWorklet}`,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          }
        );

        const fetchedMilestones = response.data || [];
        setMilestones(fetchedMilestones);

        // Extract milestone types/stages that have been added by students
        const milestoneTitles = fetchedMilestones.map(m => (m.milestone_type || m.title || '').toLowerCase());
        
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorklet]);  // allStages is static and doesn't need to be in dependencies

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
      const userRole = userResp?.data?.role;
      if (!userId) {
        setError("Unable to determine user ID. Please re-login.");
        setLoading(false);
        return;
      }
      
      // Fetch worklets based on user role
      let response;
      let data = [];
      
      if (userRole && userRole.toLowerCase() === 'student') {
        // For students, use the student worklets endpoint
        response = await apiClient.get('/worklets/student/me');
        data = Array.isArray(response?.data) ? response.data : [];
      } else if (userRole && userRole.toLowerCase() === 'professor') {
        // For professors, use the professor worklets endpoint
        response = await apiClient.get('/worklets/professor/me');
        data = Array.isArray(response?.data) ? response.data : [];
      } else {
        // For mentors, use the mentor worklets endpoint
        response = await apiClient.get(`/api/associations/mentor/${userId}/worklets?status_filter=ongoing`);
        data = response?.data?.ongoing_worklets || [];
      }
      
      setWorklets(Array.isArray(data) ? data : []);
      if ((data || []).length === 0) {
        const roleText = userRole ? userRole.toLowerCase() : 'user';
        setError(`No worklets found for this ${roleText}`);
      }
    } catch (error) {
      setError("Failed to load worklets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Refresh current worklet progress
  const refreshCurrentProgress = async () => {
    if (!selectedWorklet) return;
    
    try {
      setRefreshingProgress(true);
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const workletResponse = await axios.get(
        `http://localhost:8000/api/associations/worklet/${selectedWorklet}`,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );

      if (workletResponse.data) {
        const currentProgress = workletResponse.data.worklet_progress || workletResponse.data.percentage_completion || 0;
        setProgressCompletion(currentProgress.toString());
      }
    } catch (error) {
      console.error('Error refreshing progress:', error);
    } finally {
      setRefreshingProgress(false);
    }
  };

  // Calculate allowed progress range based on milestone stage
  const getProgressRange = (stage) => {
    const reviewStages = ['first_review', 'second_review', 'mid_review', 'fourth_review', 'fifth_review', 'end_review'];
    const stageIndex = reviewStages.indexOf(stage);
    
    if (stageIndex === -1) {
      // For extended or ad_hoc, allow any progress
      return { min: 0, max: 100 };
    }
    
    // Each review stage represents roughly 17% of progress (100/6 ≈ 16.67)
    const segmentSize = 100 / 6;
    const max = Math.round((stageIndex + 1) * segmentSize);
    
    // Always start from 0, only restrict the maximum
    return { min: 0, max };
  };

  // Check if progress is valid
  const isProgressValid = () => {
    if (!progressCompletion || progressCompletion.trim() === "" || !selectedStage) {
      return true; // Valid if empty (optional field)
    }
    
    const progress = parseInt(progressCompletion, 10);
    if (isNaN(progress)) return false;
    
    const { max } = getProgressRange(selectedStage);
    return progress >= 0 && progress <= max;
  };

  const handleSubmit = async () => {
    if (!selectedWorklet) {
      setShowWarningPopup(true);
      setTimeout(() => setShowWarningPopup(false), 2500);
      return;
    }

    if (!selectedStage || !performanceIndicator || !feedbackContent.trim()) {
      setShowWarningPopup(true);
      setTimeout(() => setShowWarningPopup(false), 2500);
      return;
    }

    // Validate progress range based on selected stage (only if progress is provided)
    let progress = null;
    if (progressCompletion && progressCompletion.trim() !== "") {
      progress = parseInt(progressCompletion, 10);
      
      if (!isProgressValid()) {
        // Don't close modal, just show warning and focus will be on the red-bordered field
        setShowWarningPopup(true);
        setTimeout(() => setShowWarningPopup(false), 2500);
        return;
      }
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      const feedbackData = {
        worklet_id: parseInt(selectedWorklet, 10),
        stage: selectedStage,
        performance_indicator: performanceIndicator,
        feedback_content: feedbackContent.trim()
      };

      // Only add progress if it was provided
      if (progress !== null) {
        feedbackData.progress_completion = progress;
      }

      const response = await apiClient.post('/worklets/submit-feedback', feedbackData);

      
      // Reset form
      if (!hasPreSelection) {
        setSelectedWorklet("");
      }
      setSelectedStage("");
      setPerformanceIndicator("");
      setFeedbackContent("");
      setProgressCompletion("");
      setMilestones([]);
      setAvailableStages([]);
      
      // Close modal and show success message on parent page
      onClose();
      if (onSuccess) {
        onSuccess("Feedback submitted successfully! Students have been notified.");
      }

    } catch (error) {
      // Close modal and show error message on parent page
      onClose();
      if (onError) {
        onError("Failed to submit feedback. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!hasPreSelection) {
      setSelectedWorklet("");
    }
    setSelectedStage("");
    setPerformanceIndicator("");
    setFeedbackContent("");
    setProgressCompletion("");
    setMilestones([]);
    setAvailableStages([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  // Get selected worklet details for display
  const selectedWorkletDetails = worklets.find(
    w => w.id?.toString() === selectedWorklet
  ) || preSelectedWorklet;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[70]">
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={handleClose}></div>
      
      <div className="bg-white rounded-2xl shadow-2xl p-[clamp(1.5rem,3vw,2rem)] mx-[clamp(0.75rem,2vw,1rem)] relative z-10 dark:bg-slate-800 max-w-[clamp(24rem,35vw,32rem)] w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-[clamp(1rem,2vh,1.5rem)]">
          <div>
            <h2 className="text-[clamp(1.25rem,2vw,1.5rem)] font-bold text-gray-900 dark:text-white">
              📝 {hasPreSelection ? 'Provide Feedback' : 'Submit Feedback'}
            </h2>
            <p className="text-[clamp(0.875rem,1.2vw,1rem)] text-gray-600 dark:text-gray-300 mt-[clamp(0.25rem,0.5vh,0.5rem)]">
              {hasPreSelection 
                ? 'Provide feedback for this worklet' 
                : 'Send feedback to all students in the selected worklet'}
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
              
              {hasPreSelection ? (
                // Display pre-selected worklet (read-only)
                <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg px-4 py-3">
                  <p className="text-gray-800 dark:text-gray-200 font-medium">
                    {selectedWorkletDetails?.cert_id || selectedWorkletDetails?.id || 'N/A'} - {selectedWorkletDetails?.description || selectedWorkletDetails?.title || 'No title'}
                  </p>
                </div>
              ) : (
                // Dropdown for worklet selection
                <ProfessionalSelect
                  value={selectedWorklet}
                  onChange={(e) => setSelectedWorklet(e.target.value)}
                  placeholder="Choose a worklet..."
                  options={worklets.map((worklet) => {
                    const displayText = `${worklet.cert_id} - ${worklet.description || worklet.title || ''}`;
                    const truncatedText = displayText.length > 60 
                      ? displayText.substring(0, 60) + '...' 
                      : displayText;
                    return {
                      value: worklet.id,
                      label: truncatedText
                    };
                  })}
                />
              )}
            </div>

            {/* Stage Selection */}
            <div>
              <ProfessionalSelect
                label="Feedback Stage"
                required
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                disabled={!selectedWorklet || availableStages.length === 0}
                placeholder={
                  !selectedWorklet 
                    ? "Select a worklet first..." 
                    : availableStages.length === 0 
                      ? "No milestones available" 
                      : "Select a stage..."
                }
                options={allStages.map((stageOption) => {
                  const isAvailable = availableStages.some(s => s.value === stageOption.value);
                  return {
                    value: stageOption.value,
                    label: `${stageOption.label}${!isAvailable ? " (No milestone)" : ""}`,
                    disabled: !isAvailable
                  };
                })}
              />
              {selectedWorklet && availableStages.length === 0 && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ Student hasn't added any milestones yet
                </p>
              )}
            </div>

            {/* Performance Indicator */}
            <div>
              <ProfessionalSelect
                label="Performance Indicator"
                required
                value={performanceIndicator}
                onChange={(e) => setPerformanceIndicator(e.target.value)}
                disabled={loading}
                placeholder="Select performance level..."
                options={[
                  { value: "Very Good", label: "Very Good" },
                  { value: "Good", label: "Good" },
                  { value: "Average", label: "Average" },
                  { value: "Poor", label: "Poor" }
                ]}
              />
            </div>

            {/* Progress Completion */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Progress Completion
                  </label>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {progressCompletion || 0}%
                  </span>
                </div>
                <button
                  type="button"
                  onClick={refreshCurrentProgress}
                  disabled={!selectedWorklet || refreshingProgress}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh current worklet progress"
                >
                  <RefreshCcw 
                    size={14} 
                    className={refreshingProgress ? 'animate-spin' : ''}
                  />
                  Refresh
                </button>
              </div>

              {/* Range Slider */}
              <div className="mb-3">
                <input
                  type="range"
                  value={progressCompletion || 0}
                  onChange={(e) => setProgressCompletion(e.target.value)}
                  min="0"
                  max="100"
                  step="1"
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                    !isProgressValid() && progressCompletion && progressCompletion.trim() !== ""
                      ? 'accent-red-500'
                      : 'accent-blue-600'
                  }`}
                  disabled={loading || !selectedStage}
                  style={{
                    background: selectedStage ? `linear-gradient(to right, ${
                      !isProgressValid() && progressCompletion && progressCompletion.trim() !== "" 
                        ? '#ef4444' 
                        : '#3b82f6'
                    } 0%, ${
                      !isProgressValid() && progressCompletion && progressCompletion.trim() !== "" 
                        ? '#ef4444' 
                        : '#3b82f6'
                    } ${progressCompletion || 0}%, #e5e7eb ${progressCompletion || 0}%, #e5e7eb 100%)` : ''
                  }}
                />
              </div>

              {/* Helper Text */}
              {selectedStage && (() => {
                const { max } = getProgressRange(selectedStage);
                const isInvalid = !isProgressValid() && progressCompletion && progressCompletion.trim() !== "";
                return (
                  <p className={`mt-2 text-xs ${isInvalid ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                    {isInvalid 
                      ? `⚠️ Progress must be between 0% and ${max}% for ${selectedStage.replace(/_/g, ' ')}`
                      : `Allowed range for ${selectedStage.replace(/_/g, ' ')}: 0% - ${max}%`
                    }
                  </p>
                );
              })()}
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
                rows={4}
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
                Worklet, stage, performance indicator, and content are required.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

