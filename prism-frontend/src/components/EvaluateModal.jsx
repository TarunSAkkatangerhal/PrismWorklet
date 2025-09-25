import React, { useState, useEffect } from 'react';
import { X, Award, Star, Trophy, Gift } from 'lucide-react';
import axios from 'axios';

function EvaluateModal({ isOpen, onClose }) {
  const [completedWorklets, setCompletedWorklets] = useState([]);
  const [selectedWorklet, setSelectedWorklet] = useState('');
  const [selectedWorkletDetails, setSelectedWorkletDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [evaluationData, setEvaluationData] = useState({
    performance_rating: '',
    completion_quality: '',
    innovation_score: '',
    teamwork_rating: '',
    perks: {
      points_awarded: 0,
      certificate_type: '',
      recommendation_letter: false,
      internship_opportunity: false,
      bonus_credits: 0,
      special_recognition: '',
      mentorship_extension: false
    },
    comments: '',
    feedback: ''
  });

  // Fetch completed worklets when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCompletedWorklets();
    }
  }, [isOpen]);

  const fetchCompletedWorklets = async () => {
    try {
      setLoading(true);
      const userEmail = localStorage.getItem("user_email");
      const token = localStorage.getItem("access_token");
      
      if (!userEmail || !token) {
        throw new Error("User information not found");
      }

      // Fetch completed worklets for the mentor
      const response = await axios.get(
        `http://localhost:8000/worklets/completed/${encodeURIComponent(userEmail)}`,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );
      
      // Filter for completed worklets (you might need to add status field to backend)
      // For now, we'll use percentage_completion >= 100 as completed
      const completed = response.data || [];
      setCompletedWorklets(completed);
    } catch (error) {
      console.error("Error fetching completed worklets:", error);
      setCompletedWorklets([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleWorkletSelect = async (workletId) => {
    setSelectedWorklet(workletId);
    if (workletId) {
      try {
        const token = localStorage.getItem("access_token");
        // Fetch students for the selected worklet
        const response = await axios.get(
          `http://localhost:8000/worklets/${workletId}/students`,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          }
        );
        
        const workletInfo = completedWorklets.find(w => w.id === parseInt(workletId));
        setSelectedWorkletDetails({
          ...workletInfo,
          students: response.data || []
        });
      } catch (error) {
        console.error("Error fetching worklet details:", error);
      }
    } else {
      setSelectedWorkletDetails(null);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.startsWith('perks.')) {
      const perkField = field.split('.')[1];
      setEvaluationData(prev => ({
        ...prev,
        perks: {
          ...prev.perks,
          [perkField]: value
        }
      }));
    } else {
      setEvaluationData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedWorklet) {
      alert("Please select a worklet to evaluate.");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      
      const evaluationPayload = {
        worklet_id: parseInt(selectedWorklet),
        ...evaluationData,
        evaluated_by: localStorage.getItem("user_email"),
        evaluation_date: new Date().toISOString()
      };

      // Submit evaluation (we'll create this endpoint)
      await axios.post(
        'http://localhost:8000/evaluations/submit',
        evaluationPayload,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      alert(`Evaluation submitted successfully for ${selectedWorkletDetails?.cert_id}!`);
      onClose();
      
      // Reset form
      setSelectedWorklet('');
      setSelectedWorkletDetails(null);
      setEvaluationData({
        performance_rating: '',
        completion_quality: '',
        innovation_score: '',
        teamwork_rating: '',
        perks: {
          points_awarded: 0,
          certificate_type: '',
          recommendation_letter: false,
          internship_opportunity: false,
          bonus_credits: 0,
          special_recognition: '',
          mentorship_extension: false
        },
        comments: '',
        feedback: ''
      });
    } catch (error) {
      console.error("Error submitting evaluation:", error);
      alert("Failed to submit evaluation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors z-10"
          aria-label="Close"
        >
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
          <Award className="text-blue-600" />
          Evaluate Completed Worklet
        </h2>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-300">Loading...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Worklet Selection */}
            <div className="mb-6">
              <label htmlFor="worklet-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Completed Worklet
              </label>
              <select
                id="worklet-select"
                value={selectedWorklet}
                onChange={(e) => handleWorkletSelect(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              >
                <option value="">Select Worklet ID</option>
                {completedWorklets.length > 0 ? (
                  completedWorklets.map(worklet => (
                    <option key={worklet.id} value={worklet.id}>
                      {worklet.cert_id} {worklet.domain ? `- ${worklet.domain}` : ''}
                    </option>
                  ))
                ) : (
                  <option disabled>No completed worklets found</option>
                )}
              </select>
            </div>

            {/* Selected Worklet Details */}
            {selectedWorkletDetails && (
              <div className="bg-blue-50 dark:bg-slate-700 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                  {selectedWorkletDetails.cert_id}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {selectedWorkletDetails.description || "No description available"}
                </p>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedWorkletDetails.domain && (<><strong>Domain:</strong> {selectedWorkletDetails.domain}<br/></>)}
                  {selectedWorkletDetails.start_date && (<><strong>Start:</strong> {selectedWorkletDetails.start_date}<br/></>)}
                  {selectedWorkletDetails.end_date && (<><strong>End:</strong> {selectedWorkletDetails.end_date}<br/></>)}
                  <strong>Students:</strong> {selectedWorkletDetails.students?.map(s => s.name).join(', ') || 'Loading...'}
                </div>
              </div>
            )}

            {/* Evaluation Form - Only show when worklet is selected */}
            {selectedWorklet && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Performance Ratings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Star className="text-yellow-500" />
                    Performance Ratings
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Overall Performance
                    </label>
                    <select
                      value={evaluationData.performance_rating}
                      onChange={(e) => handleInputChange('performance_rating', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    >
                      <option value="">Select Rating</option>
                      <option value="excellent">Excellent (90-100%)</option>
                      <option value="very_good">Very Good (80-89%)</option>
                      <option value="good">Good (70-79%)</option>
                      <option value="average">Average (60-69%)</option>
                      <option value="poor">Poor (Below 60%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Completion Quality
                    </label>
                    <select
                      value={evaluationData.completion_quality}
                      onChange={(e) => handleInputChange('completion_quality', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    >
                      <option value="">Select Quality</option>
                      <option value="outstanding">Outstanding</option>
                      <option value="high">High Quality</option>
                      <option value="standard">Standard</option>
                      <option value="needs_improvement">Needs Improvement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Innovation Score (1-10)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={evaluationData.innovation_score}
                      onChange={(e) => handleInputChange('innovation_score', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Teamwork Rating
                    </label>
                    <select
                      value={evaluationData.teamwork_rating}
                      onChange={(e) => handleInputChange('teamwork_rating', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    >
                      <option value="">Select Rating</option>
                      <option value="excellent">Excellent Collaboration</option>
                      <option value="good">Good Teamwork</option>
                      <option value="average">Average Coordination</option>
                      <option value="poor">Poor Collaboration</option>
                    </select>
                  </div>
                </div>

                {/* Perks and Rewards */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Gift className="text-green-500" />
                    Assign Perks & Rewards
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Points Awarded
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      value={evaluationData.perks.points_awarded}
                      onChange={(e) => handleInputChange('perks.points_awarded', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Certificate Type
                    </label>
                    <select
                      value={evaluationData.perks.certificate_type}
                      onChange={(e) => handleInputChange('perks.certificate_type', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    >
                      <option value="">No Certificate</option>
                      <option value="participation">Participation Certificate</option>
                      <option value="completion">Completion Certificate</option>
                      <option value="excellence">Excellence Certificate</option>
                      <option value="innovation">Innovation Award</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bonus Credits
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={evaluationData.perks.bonus_credits}
                      onChange={(e) => handleInputChange('perks.bonus_credits', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Special Recognition
                    </label>
                    <input
                      type="text"
                      value={evaluationData.perks.special_recognition}
                      onChange={(e) => handleInputChange('perks.special_recognition', e.target.value)}
                      placeholder="e.g., Best Innovation, Team Player, etc."
                      className="w-full p-2 border border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={evaluationData.perks.recommendation_letter}
                        onChange={(e) => handleInputChange('perks.recommendation_letter', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Recommendation Letter</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={evaluationData.perks.internship_opportunity}
                        onChange={(e) => handleInputChange('perks.internship_opportunity', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Internship Opportunity</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={evaluationData.perks.mentorship_extension}
                        onChange={(e) => handleInputChange('perks.mentorship_extension', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Extended Mentorship</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Comments and Feedback */}
            {selectedWorklet && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Evaluation Comments
                  </label>
                  <textarea
                    value={evaluationData.comments}
                    onChange={(e) => handleInputChange('comments', e.target.value)}
                    rows="3"
                    placeholder="Overall evaluation comments..."
                    className="w-full p-2 border border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Feedback for Students
                  </label>
                  <textarea
                    value={evaluationData.feedback}
                    onChange={(e) => handleInputChange('feedback', e.target.value)}
                    rows="3"
                    placeholder="Constructive feedback for the students..."
                    className="w-full p-2 border border-gray-300 rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-600">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-md transition-colors dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedWorklet || loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md transition-colors disabled:bg-blue-300 dark:disabled:bg-blue-800 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Trophy size={16} />
                    Submit Evaluation
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default EvaluateModal;