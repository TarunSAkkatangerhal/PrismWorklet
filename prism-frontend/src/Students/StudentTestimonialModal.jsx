import React, { useState, useEffect } from 'react';
import { X, Send, Star, Award, Users, Briefcase, TrendingUp } from 'lucide-react';
import axios from 'axios';
import ProfessionalSelect from '../components/ProfessionalSelect';

const TestimonialModal = ({ isOpen, onClose, worklet }) => {
  // Mentor Feedback (1-10 stars)
  const [mentorSupport, setMentorSupport] = useState(0);
  const [mentorGuidanceKnowledge, setMentorGuidanceKnowledge] = useState(0);

  // Professor Feedback (1-10 stars)
  const [professorSupport, setProfessorSupport] = useState(0);
  const [professorGuidance, setProfessorGuidance] = useState(0);
  const [professorRecommendation, setProfessorRecommendation] = useState(0);
  const [professorRelevance, setProfessorRelevance] = useState(0);

  // Prism Team Feedback (1-10 stars)
  const [prismCommunication, setPrismCommunication] = useState(0);
  const [prismSupportSatisfaction, setPrismSupportSatisfaction] = useState(0);
  const [prismTechResources, setPrismTechResources] = useState(0);

  // Program Feedback (1-10 stars)
  const [programLearningValue, setProgramLearningValue] = useState(0);
  const [programProjectRelevance, setProgramProjectRelevance] = useState(0);
  const [programCareerSupport, setProgramCareerSupport] = useState(0);

  // Final Recommendation (1-10)
  const [recommendationToPeers, setRecommendationToPeers] = useState(0);

  // Text Fields
  const [testimonial, setTestimonial] = useState('');
  const [improvements, setImprovements] = useState('');
  const [bestAspect, setBestAspect] = useState('');
  const [skillsGained, setSkillsGained] = useState([]);

  // Worklet selection state
  const [availableWorklets, setAvailableWorklets] = useState([]);
  const [selectedWorklet, setSelectedWorklet] = useState(null);
  const [loadingWorklets, setLoadingWorklets] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      
      if (!token) {
        console.error('No token found');
        setLoadingWorklets(false);
        return;
      }

      const response = await axios.get('http://localhost:8000/worklets/student/me', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const workletData = Array.isArray(response.data) ? response.data : response.data.worklets;
      
      if (workletData && workletData.length > 0) {
        setAvailableWorklets(workletData);
        setSelectedWorklet(workletData[0]);
      }
    } catch (error) {
      console.error('Error fetching worklets:', error);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const targetWorklet = worklet || selectedWorklet;
    
    if (!targetWorklet) {
      alert('Please select a worklet for your testimonial.');
      return;
    }

    // Validate all required fields
    if (mentorSupport === 0 || mentorGuidanceKnowledge === 0) {
      alert('Please provide all mentor feedback ratings.');
      return;
    }

    if (professorSupport === 0 || professorGuidance === 0 || professorRecommendation === 0 || professorRelevance === 0) {
      alert('Please provide all professor feedback ratings.');
      return;
    }

    if (prismCommunication === 0 || prismSupportSatisfaction === 0 || prismTechResources === 0) {
      alert('Please provide all Prism team feedback ratings.');
      return;
    }

    if (programLearningValue === 0 || programProjectRelevance === 0 || programCareerSupport === 0) {
      alert('Please provide all program feedback ratings.');
      return;
    }

    if (recommendationToPeers === 0) {
      alert('Please provide your recommendation rating to peers.');
      return;
    }

    if (!testimonial.trim()) {
      alert('Please provide your testimonial.');
      return;
    }

    if (!bestAspect.trim()) {
      alert('Please describe the best aspect of the worklet.');
      return;
    }

    if (!improvements.trim()) {
      alert('Please provide suggestions for improvements.');
      return;
    }

    if (skillsGained.length === 0) {
      alert('Please select at least one skill gained from this worklet.');
      return;
    }

    setIsSubmitting(true);

    const feedbackData = {
      worklet_id: targetWorklet.id,
      worklet_cert_id: targetWorklet.cert_id,
      
      // Mentor Feedback
      mentor_support: mentorSupport,
      mentor_guidance_knowledge: mentorGuidanceKnowledge,
      
      // Professor Feedback
      professor_support: professorSupport,
      professor_guidance: professorGuidance,
      professor_recommendation: professorRecommendation,
      professor_relevance: professorRelevance,
      
      // Prism Team Feedback
      prism_communication: prismCommunication,
      prism_support_satisfaction: prismSupportSatisfaction,
      prism_tech_resources: prismTechResources,
      
      // Program Feedback
      program_learning_value: programLearningValue,
      program_project_relevance: programProjectRelevance,
      program_career_support: programCareerSupport,
      
      // Final Recommendation
      recommendation_to_peers: recommendationToPeers,
      
      // Text Fields
      testimonial: testimonial,
      improvements: improvements,
      best_aspect: bestAspect,
      skills_gained: skillsGained
    };

    try {
      // TODO: Replace with actual API endpoint when ready
      console.log('Submitting testimonial:', feedbackData);
      
      // Simulated API call
      // const token = localStorage.getItem('access_token');
      // const response = await axios.post('http://localhost:8000/testimonials/student', feedbackData, {
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //     'Content-Type': 'application/json',
      //   },
      // });
      
      alert('Thank you! Your testimonial has been submitted successfully.');
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      alert('Failed to submit testimonial. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setMentorSupport(0);
    setMentorGuidanceKnowledge(0);
    setProfessorSupport(0);
    setProfessorGuidance(0);
    setProfessorRecommendation(0);
    setProfessorRelevance(0);
    setPrismCommunication(0);
    setPrismSupportSatisfaction(0);
    setPrismTechResources(0);
    setProgramLearningValue(0);
    setProgramProjectRelevance(0);
    setProgramCareerSupport(0);
    setRecommendationToPeers(0);
    setTestimonial('');
    setImprovements('');
    setBestAspect('');
    setSkillsGained([]);
  };

  if (!isOpen) return null;

  const StarRating = ({ value, onChange, label, required = false }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`text-xl transition-all duration-200 transform hover:scale-110 ${
              star <= value
                ? 'text-yellow-400'
                : 'text-gray-300 dark:text-gray-600 hover:text-yellow-200'
            }`}
          >
            ★
          </button>
        ))}
        <span className="ml-2 text-sm font-semibold text-gray-600 dark:text-gray-400 min-w-[30px]">
          {value > 0 ? `${value}/10` : '-'}
        </span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
      <div className="relative w-full max-w-5xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Award className="text-blue-600" size={28} />
              Student Testimonial & Feedback
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Share your experience with your mentor, professor, Prism team, and the overall program
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 
                      rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all duration-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Worklet Selection */}
            {!worklet && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Select Worklet <span className="text-red-500">*</span>
                </label>
                {loadingWorklets ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading worklets...</span>
                  </div>
                ) : availableWorklets.length > 0 ? (
                  <>
                    <ProfessionalSelect
                      value={selectedWorklet?.id || ''}
                      onChange={handleWorkletChange}
                      required
                      options={availableWorklets.map((w) => ({
                        value: w.id,
                        label: `${w.cert_id} - ${w.title}`
                      }))}
                      placeholder="Select a worklet"
                    />
                    {selectedWorklet && (
                      <div className="mt-3 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded-lg p-3">
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
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">WORKLET</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{worklet.cert_id}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{worklet.title}</div>
              </div>
            )}

            {/* Section 1: Mentor Feedback */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-700 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-4">
                <Users className="text-purple-600 dark:text-purple-400" size={24} />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Mentor Feedback</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StarRating
                  value={mentorSupport}
                  onChange={setMentorSupport}
                  label="Mentor Support"
                  required
                />
                <StarRating
                  value={mentorGuidanceKnowledge}
                  onChange={setMentorGuidanceKnowledge}
                  label="Mentor Guidance and Knowledge"
                  required
                />
              </div>
            </div>

            {/* Section 2: Professor Feedback */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-700 dark:to-gray-700 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="text-blue-600 dark:text-blue-400" size={24} />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Professor Feedback</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StarRating
                  value={professorSupport}
                  onChange={setProfessorSupport}
                  label="Professor Support"
                  required
                />
                <StarRating
                  value={professorGuidance}
                  onChange={setProfessorGuidance}
                  label="Professor Guidance"
                  required
                />
                <StarRating
                  value={professorRecommendation}
                  onChange={setProfessorRecommendation}
                  label="Professor Recommendation"
                  required
                />
                <StarRating
                  value={professorRelevance}
                  onChange={setProfessorRelevance}
                  label="Professor Relevance"
                  required
                />
              </div>
            </div>

            {/* Section 3: Prism Team Feedback */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-700 rounded-xl p-6 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-4">
                <Star className="text-green-600 dark:text-green-400" size={24} />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Prism Team Feedback</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StarRating
                  value={prismCommunication}
                  onChange={setPrismCommunication}
                  label="Communication"
                  required
                />
                <StarRating
                  value={prismSupportSatisfaction}
                  onChange={setPrismSupportSatisfaction}
                  label="Support Satisfaction"
                  required
                />
                <StarRating
                  value={prismTechResources}
                  onChange={setPrismTechResources}
                  label="Tech/Resources Provided"
                  required
                />
              </div>
            </div>

            {/* Section 4: Program Feedback */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-700 dark:to-gray-700 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="text-orange-600 dark:text-orange-400" size={24} />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Program Feedback</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StarRating
                  value={programLearningValue}
                  onChange={setProgramLearningValue}
                  label="Learning Value"
                  required
                />
                <StarRating
                  value={programProjectRelevance}
                  onChange={setProgramProjectRelevance}
                  label="Project Relevance"
                  required
                />
                <StarRating
                  value={programCareerSupport}
                  onChange={setProgramCareerSupport}
                  label="Career Support"
                  required
                />
              </div>
            </div>

            {/* Final Recommendation */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-700 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
              <StarRating
                value={recommendationToPeers}
                onChange={setRecommendationToPeers}
                label="How likely are you to recommend this program to your peers?"
                required
              />
            </div>

            {/* Text Fields Section */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600 space-y-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Written Feedback</h3>
              
              {/* Main Testimonial */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Your Testimonial
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  value={testimonial}
                  onChange={(e) => setTestimonial(e.target.value)}
                  rows={5}
                  placeholder="Share your overall experience working on this worklet. What did you learn? How did it help you grow professionally?"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {testimonial.length} characters
                </p>
              </div>

              {/* Best Feature */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  What was the best aspect of this worklet?
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={bestAspect}
                  onChange={(e) => setBestAspect(e.target.value)}
                  placeholder="e.g., Hands-on learning, Real-world application, Team collaboration"
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Improvements */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  What could be improved?
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  rows={4}
                  placeholder="What changes would make you more likely to recommend this worklet?"
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Skills Gained */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  What skills did you gain from this worklet?
                  <span className="text-red-500 ml-1">*</span>
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
                        setSkillsGained(prev =>
                          prev.includes(skill)
                            ? prev.filter(s => s !== skill)
                            : [...prev, skill]
                        );
                      }}
                      className={`py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                        skillsGained.includes(skill)
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {skillsGained.includes(skill) && '✓ '}{skill}
                    </button>
                  ))}
                </div>
                {skillsGained.length > 0 && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                    {skillsGained.length} skill{skillsGained.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 
                         rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200
                         font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg 
                         hover:from-blue-700 hover:to-indigo-700 transition-all duration-200
                         font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
                         shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Submit Testimonial
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TestimonialModal;
