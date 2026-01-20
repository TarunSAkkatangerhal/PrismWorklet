import React, { useState, useEffect } from "react";
import axios from "axios";
import ProfessionalSelect from '../../components/ProfessionalSelect';

const Feedback = ({ onClose, workletId: propWorkletId, preSelectedWorklet }) => {
  const [workletId, setWorkletId] = useState(
    propWorkletId?.toString() || preSelectedWorklet?.id?.toString() || ""
  );
  const [stage, setStage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [progress, setProgress] = useState("");
  const [worklets, setWorklets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableStages, setAvailableStages] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [selectedMilestone, setSelectedMilestone] = useState(null);

  const autoMode = !!preSelectedWorklet;

  // Define all possible stages
  const allStages = [
    { value: "first_review", label: "First Review" },
    { value: "second_review", label: "Second Review" },
    { value: "mid_review", label: "Mid Review" },
    { value: "fourth_review", label: "Fourth Review" },
    { value: "fifth_review", label: "Fifth Review" },
    { value: "end_review", label: "End Review" },
    { value: "extended", label: "Extended" },
    { value: "ad_hoc", label: "Ad-hoc" }
  ];

  // Update workletId when props change
  useEffect(() => {
    const newWorkletId = propWorkletId?.toString() || preSelectedWorklet?.id?.toString() || "";
    if (newWorkletId && newWorkletId !== workletId) {
      setWorkletId(newWorkletId);
    }
  }, [propWorkletId, preSelectedWorklet, workletId]);

  // Fetch worklets from backend (only if not in autoMode)
  useEffect(() => {
    const fetchWorklets = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("access_token");
        
        if (!token) {
          throw new Error("User information not found");
        }

        // First get user profile to get the mentor ID
        const profileResponse = await axios.get(
          `http://localhost:8000/auth/profile`,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          }
        );

        const mentorId = profileResponse.data.id;

        // Use the new ID-based endpoint
        const response = await axios.get(
          `http://localhost:8000/api/associations/mentor/${mentorId}/worklets?status_filter=ongoing`,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          }
        );
        
        const ongoingWorklets = response.data.ongoing_worklets || [];
        
        setWorklets(ongoingWorklets);
        
        // Set first worklet as default if available
        if (ongoingWorklets.length > 0) {
          setWorkletId(ongoingWorklets[0].id.toString());
        }
      } catch (error) {
        setWorklets([]);
      } finally {
        setLoading(false);
      }
    };

    if (!autoMode) {
      fetchWorklets();
    }
  }, [autoMode]);

  // Auto-select worklet if preSelectedWorklet is provided
  useEffect(() => {
    if (!preSelectedWorklet) return;
    const identifier = preSelectedWorklet.id?.toString() || preSelectedWorklet.cert_id || '';
    if (identifier) setWorkletId(identifier);
  }, [preSelectedWorklet]);

  // Fetch milestones for the selected worklet
  useEffect(() => {
    const fetchMilestones = async () => {
      if (!workletId) {
        setAvailableStages([]);
        return;
      }

      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const response = await axios.get(
          `http://localhost:8000/milestones/worklet/${workletId}`,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          }
        );

        const fetchedMilestones = response.data || [];

        // Store full milestones data for later use
        setMilestones(fetchedMilestones);

        // Extract milestone types/stages that have been added by students
        const milestoneTitles = fetchedMilestones.map(m => (m.milestone_type || m.title || '').toLowerCase());
        
        // Map milestone titles to stage values
        const stageMapping = {
          'first review': 'first_review',
          'weekly meeting': 'first_review', // Weekly meeting can be first review
          'second review': 'second_review',
          'monthly meeting': 'second_review', // Monthly can be second
          'mid review': 'mid_review',
          'mid-review': 'mid_review',
          'fourth review': 'fourth_review',
          'fifth review': 'fifth_review',
          'end review': 'end_review',
          'extended': 'extended',
          'ad-hoc': 'ad_hoc',
          'ad hoc': 'ad_hoc',
          'others': 'ad_hoc' // Others can be ad-hoc
        };

        // Find which stages are available based on milestones
        const available = allStages.filter(stage => {
          return milestoneTitles.some(title => {
            return stageMapping[title] === stage.value || title.includes(stage.label.toLowerCase());
          });
        });

        setAvailableStages(available);
      } catch (error) {
        setAvailableStages([]);
      }
    };

    fetchMilestones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workletId]);  // allStages is static and doesn't need to be in dependencies

  // Update selected milestone when stage changes
  useEffect(() => {
    if (stage && milestones.length > 0) {
      // Find the milestone that matches the selected stage
      const stageMapping = {
        'first_review': ['first review', 'weekly meeting'],
        'second_review': ['second review', 'monthly meeting'],
        'mid_review': ['mid review', 'mid-review'],
        'fourth_review': ['fourth review'],
        'fifth_review': ['fifth review'],
        'end_review': ['end review'],
        'extended': ['extended'],
        'ad_hoc': ['ad-hoc', 'ad hoc', 'others']
      };

      const matchingTitles = stageMapping[stage] || [];
      const milestone = milestones.find(m => {
        const milestoneType = (m.milestone_type || '').toLowerCase();
        return matchingTitles.some(title => milestoneType.includes(title));
      });

      setSelectedMilestone(milestone);
    } else {
      setSelectedMilestone(null);
    }
  }, [stage, milestones]);

  const handleSubmit = async () => {
    if (!selectedMilestone) {
      alert("Please select a valid stage with a milestone");
      return;
    }

    if (!feedback.trim()) {
      alert("Please enter feedback");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      
      if (!token) {
        alert("Authentication token not found. Please log in again.");
        return;
      }

      // Get user profile to determine role
      const profileResponse = await axios.get(
        'http://localhost:8000/auth/profile',
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );

      const userRole = profileResponse.data.role?.toLowerCase() || "mentor";

      const payload = {
        milestone_id: selectedMilestone.milestone_id,
        reviewer_role: userRole, // Use actual user role from profile
        feedback_text: feedback,
        progress_completion: progress ? parseInt(progress) : null
      };

      const response = await axios.post(
        'http://localhost:8000/milestones/feedback',
        payload,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      alert("Feedback submitted successfully!");
      onClose();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message || "Failed to submit feedback. Please try again.";
      alert(`Error: ${errorMsg}`);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      {/* ++ Dark theme styles added to modal container ++ */}
      <div className="bg-white rounded-2xl shadow-lg w-[400px] p-5 relative dark:bg-slate-800">
        <button
          onClick={onClose}
          // ++ Dark theme styles added to close button ++
          className="absolute top-2 right-2 text-3xl text-purple-700 hover:text-purple-900 font-bold z-10 w-10 h-10 flex items-center justify-center rounded-full hover:bg-purple-100 transition-colors dark:text-purple-300 dark:hover:text-purple-200 dark:hover:bg-slate-700"
        >
          ×
        </button>

        {/* Title */}
        {/* ++ Dark theme styles added to title ++ */}
        <h2 className="text-lg font-semibold mb-4 text-center dark:text-white">
          Submit Feedback
        </h2>

        {/* Worklet ID */}
        {!autoMode && (
          <div className="mb-3">
            <ProfessionalSelect
              value={workletId}
              onChange={(e) => setWorkletId(e.target.value)}
              disabled={loading}
              label="Select Worklet ID"
              placeholder="-- Select --"
              options={worklets.map((worklet) => ({
                value: worklet.id,
                label: worklet.cert_id
              }))}
            />
          </div>
        )}
        {autoMode && (
          <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-slate-700/50 border border-blue-200 dark:border-slate-600">
            <div className="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1">WORKLET</div>
            <div className="text-sm font-medium text-gray-800 dark:text-white">{preSelectedWorklet?.cert_id || preSelectedWorklet?.title || workletId}</div>
          </div>
        )}

        {/* Stage */}
        <div className="mb-3">
          <ProfessionalSelect
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            disabled={!workletId || availableStages.length === 0}
            label="Select Stage"
            placeholder={
              !workletId 
                ? "Select a worklet first" 
                : availableStages.length === 0 
                  ? "No milestones available" 
                  : "Select a stage"
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
          {workletId && availableStages.length === 0 && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Student hasn't added any milestones yet
            </p>
          )}
        </div>

        {/* Feedback */}
        <div className="mb-3">
          <textarea
            placeholder="Type your Meeting Feedback here"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-slate-400 dark:focus:ring-blue-500"
          />
        </div>

        {/* Progress (Optional) */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Update Progress (Optional)
          </label>
          <input
            type="number"
            placeholder="0-100"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-slate-400 dark:focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Leave empty to keep current progress
          </p>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-700 text-white rounded-lg py-2 hover:bg-blue-800 transition dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          Send Feedback
        </button>
      </div>
    </div>
  );
};

export default Feedback;