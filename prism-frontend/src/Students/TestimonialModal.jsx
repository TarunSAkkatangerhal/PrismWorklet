import React, { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import axios from 'axios';

const TestimonialModal = ({ isOpen, onClose, worklet }) => {
  const [feedbackScore, setFeedbackScore] = useState(null);
  const [feedbackCategory, setFeedbackCategory] = useState('');
  const [feedbackMentorSupport, setFeedbackMentorSupport] = useState(0);
  const [feedbackLearningValue, setFeedbackLearningValue] = useState(0);
  const [feedbackTeamCollaboration, setFeedbackTeamCollaboration] = useState(0);
  const [feedbackProjectRelevance, setFeedbackProjectRelevance] = useState(0);
  const [feedbackOverallSatisfaction, setFeedbackOverallSatisfaction] = useState(0);
  const [feedbackWouldRecommend, setFeedbackWouldRecommend] = useState(null);
  const [feedbackTestimonial, setFeedbackTestimonial] = useState('');
  const [feedbackRecommendation, setFeedbackRecommendation] = useState('');
  const [feedbackBestFeature, setFeedbackBestFeature] = useState('');
  const [feedbackImprovements, setFeedbackImprovements] = useState('');
  const [feedbackSkillsGained, setFeedbackSkillsGained] = useState([]);
  
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const targetWorklet = worklet || selectedWorklet;
    
    if (!targetWorklet) {
      alert('Please select a worklet for your testimonial.');
      return;
    }
    
    // TODO: Add API call to submit feedback
    console.log('Submit Feedback:', {
      worklet_id: targetWorklet.id,
      worklet_cert_id: targetWorklet.cert_id,
      feedbackScore,
      feedbackCategory,
      feedbackMentorSupport,
      feedbackLearningValue,
      feedbackTeamCollaboration,
      feedbackProjectRelevance,
      feedbackOverallSatisfaction,
      feedbackWouldRecommend,
      feedbackTestimonial,
      feedbackRecommendation,
      feedbackBestFeature,
      feedbackImprovements,
      feedbackSkillsGained
    });
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFeedbackScore(null);
    setFeedbackCategory('');
    setFeedbackMentorSupport(0);
    setFeedbackLearningValue(0);
    setFeedbackTeamCollaboration(0);
    setFeedbackProjectRelevance(0);
    setFeedbackOverallSatisfaction(0);
    setFeedbackTestimonial('');
    setFeedbackRecommendation('');
    setFeedbackImprovements('');
    setFeedbackBestFeature('');
    setFeedbackSkillsGained([]);
    setFeedbackWouldRecommend(null);
  };

  if (!isOpen) return null;

  const StarRating = ({ value, onChange, label }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`text-2xl transition-all duration-200 ${
              star <= value
                ? 'text-yellow-400 scale-110'
                : 'text-gray-300 dark:text-gray-600 hover:text-yellow-200'
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
      <div className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Share Your Feedback</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Help us improve by sharing your experience</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 
                      rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
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
            
            {/* Recommendation Score (0-10) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                On a scale of 0-10, how likely are you to recommend this worklet program to others?
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="grid grid-cols-11 gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => {
                      setFeedbackScore(score);
                      // Auto-categorize
                      if (score >= 9) setFeedbackCategory('Promoter');
                      else if (score >= 7) setFeedbackCategory('Passive');
                      else setFeedbackCategory('Detractor');
                    }}
                    className={`h-12 rounded-lg font-bold text-sm transition-all duration-200 ${
                      feedbackScore === score
                        ? score >= 9
                          ? 'bg-green-500 text-white shadow-lg scale-110'
                          : score >= 7
                          ? 'bg-yellow-500 text-white shadow-lg scale-110'
                          : 'bg-red-500 text-white shadow-lg scale-110'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span>Not at all likely</span>
                <span>Extremely likely</span>
              </div>
              {feedbackScore !== null && (
                <div className={`mt-3 p-3 rounded-lg ${
                  feedbackCategory === 'Promoter' 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : feedbackCategory === 'Passive'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                  <p className={`text-sm font-medium ${
                    feedbackCategory === 'Promoter' ? 'text-green-700 dark:text-green-300'
                    : feedbackCategory === 'Passive' ? 'text-yellow-700 dark:text-yellow-300'
                    : 'text-red-700 dark:text-red-300'
                  }`}>
                    Category: {feedbackCategory} {feedbackCategory === 'Promoter' ? '🎉' : feedbackCategory === 'Passive' ? '😐' : '😕'}
                  </p>
                </div>
              )}
            </div>

            {/* Star Ratings Section */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Rate Your Experience</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <StarRating
                  value={feedbackMentorSupport}
                  onChange={setFeedbackMentorSupport}
                  label="Mentor Support"
                />
                <StarRating
                  value={feedbackLearningValue}
                  onChange={setFeedbackLearningValue}
                  label="Learning Value"
                />
                <StarRating
                  value={feedbackTeamCollaboration}
                  onChange={setFeedbackTeamCollaboration}
                  label="Team Collaboration"
                />
                <StarRating
                  value={feedbackProjectRelevance}
                  onChange={setFeedbackProjectRelevance}
                  label="Project Relevance"
                />
              </div>
              <StarRating
                value={feedbackOverallSatisfaction}
                onChange={setFeedbackOverallSatisfaction}
                label="Overall Satisfaction"
              />
            </div>

            {/* Would Recommend Toggle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Would you recommend this worklet to your peers?
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFeedbackWouldRecommend(true)}
                  className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                    feedbackWouldRecommend === true
                      ? 'bg-green-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  👍 Yes, Definitely
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackWouldRecommend(false)}
                  className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                    feedbackWouldRecommend === false
                      ? 'bg-red-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  👎 Not Really
                </button>
              </div>
            </div>

            {/* Main Testimonial */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Your Testimonial
                <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                value={feedbackTestimonial}
                onChange={(e) => setFeedbackTestimonial(e.target.value)}
                rows={5}
                placeholder="Share your overall experience working on this worklet. What did you learn? How did it help you grow professionally?"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {feedbackTestimonial.length} characters
              </p>
            </div>

            {/* Why Recommend/Not Recommend */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {feedbackWouldRecommend ? 'Why would you recommend this worklet?' : 'What could be improved?'}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                value={feedbackRecommendation}
                onChange={(e) => setFeedbackRecommendation(e.target.value)}
                rows={4}
                placeholder={feedbackWouldRecommend 
                  ? "What made this worklet valuable? What aspects stood out?"
                  : "What changes would make you more likely to recommend this worklet?"
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Best Feature */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                What was the best aspect of this worklet?
              </label>
              <input
                type="text"
                value={feedbackBestFeature}
                onChange={(e) => setFeedbackBestFeature(e.target.value)}
                placeholder="e.g., Hands-on learning, Real-world application, Team collaboration"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Areas for Improvement */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                What could be improved?
              </label>
              <textarea
                value={feedbackImprovements}
                onChange={(e) => setFeedbackImprovements(e.target.value)}
                rows={3}
                placeholder="Share constructive feedback on areas that need improvement..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Skills Gained */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                What skills did you gain from this worklet?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Technical Skills',
                  'Problem Solving',
                  'Team Collaboration',
                  'Communication',
                  'Project Management',
                  'Time Management',
                  'Research Skills',
                  'Critical Thinking',
                  'Leadership',
                  'Creativity',
                  'Adaptability',
                  'Industry Knowledge'
                ].map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => {
                      setFeedbackSkillsGained(prev =>
                        prev.includes(skill)
                          ? prev.filter(s => s !== skill)
                          : [...prev, skill]
                      );
                    }}
                    className={`py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                      feedbackSkillsGained.includes(skill)
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {feedbackSkillsGained.includes(skill) && '✓ '}{skill}
                  </button>
                ))}
              </div>
              {feedbackSkillsGained.length > 0 && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                  {feedbackSkillsGained.length} skill{feedbackSkillsGained.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 
                          rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={((!feedbackScore && feedbackScore !== 0) || !feedbackTestimonial.trim() || !feedbackRecommendation.trim() || feedbackWouldRecommend === null)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 
                          text-white rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl
                          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
              >
                Submit Feedback
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TestimonialModal;
