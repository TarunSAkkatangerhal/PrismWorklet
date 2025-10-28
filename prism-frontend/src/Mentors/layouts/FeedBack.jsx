import React, { useState, useEffect } from "react";
import axios from "axios";

const Feedback = ({ onClose, workletId: propWorkletId, preSelectedWorklet }) => {
  const [workletId, setWorkletId] = useState(propWorkletId || "");
  const [stage, setStage] = useState("");
  const [feedback, setFeedback] = useState("");
  const [worklets, setWorklets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [milestones, setMilestones] = useState([]);
  const [availableStages, setAvailableStages] = useState([]);

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

  // Fetch worklets from backend (only if not in autoMode)
  useEffect(() => {
    const fetchWorklets = async () => {
      try {
        setLoading(true);
        const userEmail = localStorage.getItem("user_email");
        const token = localStorage.getItem("access_token");
        
        if (!userEmail || !token) {
          throw new Error("User information not found");
        }

        const response = await axios.get(
          `http://localhost:8000/worklets/mentor/${encodeURIComponent(userEmail)}/worklets`,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          }
        );
        
        const ongoingWorklets = (response.data || []).filter(worklet => 
          worklet.status === 'Ongoing'
        );
        
        setWorklets(ongoingWorklets);
        
        // Set first worklet as default if available
        if (ongoingWorklets.length > 0) {
          setWorkletId(ongoingWorklets[0].id.toString());
        }
      } catch (error) {
        console.error("Error fetching worklets:", error);
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
        setMilestones([]);
        setAvailableStages([]);
        return;
      }

      try {
        const token = localStorage.getItem("access_token");
        if (!token) return;

        const response = await axios.get(
          `http://localhost:8000/worklets/${workletId}/milestones`,
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
        console.error("Error fetching milestones:", error);
        setMilestones([]);
        setAvailableStages([]);
      }
    };

    fetchMilestones();
  }, [workletId]);

  const handleSubmit = () => {
    const data = {
      workletId,
      stage,
      feedback,
    };
    console.log("Feedback Submitted:", data);
    onClose(); // close popup after submission
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
            <label className="text-sm font-medium dark:text-slate-300">Select Worklet ID</label>
            <select
              className="w-full border rounded-lg p-2 mb-4 dark:bg-slate-700 dark:text-white dark:border-slate-600"
              value={workletId}
              onChange={(e) => setWorkletId(e.target.value)}
              disabled={loading}
            >
              <option value="">-- Select --</option>
              {worklets.map((worklet) => (
                <option key={worklet.id} value={worklet.id}>
                  {worklet.cert_id}
                </option>
              ))}
            </select>
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
          <label className="text-sm font-medium dark:text-slate-300">Select Stage</label>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:focus:ring-blue-500"
            disabled={!workletId || availableStages.length === 0}
          >
            <option value="">
              {!workletId 
                ? "Select a worklet first" 
                : availableStages.length === 0 
                  ? "No milestones available" 
                  : "Select a stage"}
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