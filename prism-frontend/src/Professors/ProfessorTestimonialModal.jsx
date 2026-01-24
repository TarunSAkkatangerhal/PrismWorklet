import React, { useState, useEffect } from 'react';
import { X, Send, Star, Award, Users, TrendingUp, GraduationCap } from 'lucide-react';
import axios from 'axios';
import ProfessionalSelect from '../components/ProfessionalSelect';

const ProfessorTestimonialModal = ({ isOpen, onClose, worklet }) => {
  // Mentor Feedback (1-10 stars)
  const [mentorSupport, setMentorSupport] = useState(0);
  const [mentorGuidanceKnowledge, setMentorGuidanceKnowledge] = useState(0);
  const [willingnessToWorkWithMentor, setWillingnessToWorkWithMentor] = useState(0);
  const [mentorLikes, setMentorLikes] = useState('');
  const [mentorImprovements, setMentorImprovements] = useState('');

  // Student Feedback (1-10 stars)
  const [studentProactiveness, setStudentProactiveness] = useState(0);
  const [studentExecution, setStudentExecution] = useState(0);
  
  // Student recommendations (checkboxes)
  const [workletStudents, setWorkletStudents] = useState([]);
  const [recommendedStudents, setRecommendedStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Prism Team Feedback (1-10 stars)
  const [prismCommunication, setPrismCommunication] = useState(0);
  const [prismSupportSatisfaction, setPrismSupportSatisfaction] = useState(0);
  const [prismTechResources, setPrismTechResources] = useState(0);

  // Program Feedback (1-10 stars) - includes final recommendations
  const [careerAdvancement, setCareerAdvancement] = useState(0);
  const [projectRelevanceToDomain, setProjectRelevanceToDomain] = useState(0);
  const [recommendationToPeers, setRecommendationToPeers] = useState(0);
  const [willingnessToWorkInProgram, setWillingnessToWorkInProgram] = useState(0);

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

  // Fetch professor's worklets when modal opens without a pre-selected worklet
  useEffect(() => {
    if (isOpen && !worklet) {
      fetchProfessorWorklets();
    }
  }, [isOpen, worklet]);

  const fetchProfessorWorklets = async () => {
    setLoadingWorklets(true);
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.error('No token found');
        setLoadingWorklets(false);
        return;
      }

      const response = await axios.get('http://localhost:8000/worklets/professor/me', {
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
      fetchWorkletStudents(workletId);
    }
  };

  // Fetch students when worklet is selected
  useEffect(() => {
    const targetWorklet = worklet || selectedWorklet;
    if (targetWorklet && targetWorklet.id) {
      fetchWorkletStudents(targetWorklet.id);
    }
  }, [worklet, selectedWorklet]);

  const fetchWorkletStudents = async (workletId) => {
    setLoadingStudents(true);
    try {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.error('No token found');
        setLoadingStudents(false);
        return;
      }

      const response = await axios.get(`http://localhost:8000/worklets/${workletId}/students`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const students = response.data || [];
      setWorkletStudents(students);
    } catch (error) {
      console.error('Error fetching worklet students:', error);
      setWorkletStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleStudentRecommendationToggle = (studentId) => {
    setRecommendedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const targetWorklet = worklet || selectedWorklet;
    
    if (!targetWorklet) {
      alert('Please select a worklet for your testimonial.');
      return;
    }

    // Validate all required fields
    if (mentorSupport === 0 || mentorGuidanceKnowledge === 0 || willingnessToWorkWithMentor === 0) {
      alert('Please provide all mentor feedback ratings.');
      return;
    }

    if (!mentorLikes.trim() || !mentorImprovements.trim()) {
      alert('Please provide feedback about the mentor.');
      return;
    }

    if (studentProactiveness === 0 || studentExecution === 0) {
      alert('Please provide all student feedback ratings.');
      return;
    }

    if (recommendedStudents.length === 0) {
      alert('Please select at least one student to recommend for this worklet.');
      return;
    }

    if (prismCommunication === 0 || prismSupportSatisfaction === 0 || prismTechResources === 0) {
      alert('Please provide all Prism team feedback ratings.');
      return;
    }

    if (careerAdvancement === 0 || projectRelevanceToDomain === 0 || recommendationToPeers === 0 || willingnessToWorkInProgram === 0) {
      alert('Please provide all program feedback ratings.');
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
      willingness_to_work_with_mentor: willingnessToWorkWithMentor,
      mentor_likes: mentorLikes,
      mentor_improvements: mentorImprovements,
      
      // Student Feedback
      student_proactiveness: studentProactiveness,
      student_execution: studentExecution,
      recommended_students: recommendedStudents,
      
      // Prism Team Feedback
      prism_communication: prismCommunication,
      prism_support_satisfaction: prismSupportSatisfaction,
      prism_tech_resources: prismTechResources,
      
      // Program Feedback
      career_advancement: careerAdvancement,
      project_relevance_to_domain: projectRelevanceToDomain,
      
      // Final Recommendations
      recommendation_to_peers: recommendationToPeers,
      willingness_to_work_in_program: willingnessToWorkInProgram,
      
      // Text Fields
      testimonial: testimonial,
      improvements: improvements,
      best_aspect: bestAspect,
      skills_gained: skillsGained
    };

    try {
      // TODO: Replace with actual API endpoint when ready
      console.log('Submitting professor testimonial:', feedbackData);
      
      // Simulated API call
      // const token = localStorage.getItem('access_token');
      // const response = await axios.post('http://localhost:8000/testimonials/professor', feedbackData, {
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
    setWillingnessToWorkWithMentor(0);
    setMentorLikes('');
    setMentorImprovements('');
    setStudentProactiveness(0);
    setStudentExecution(0);
    setRecommendedStudents([]);
    setPrismCommunication(0);
    setPrismSupportSatisfaction(0);
    setPrismTechResources(0);
    setCareerAdvancement(0);
    setProjectRelevanceToDomain(0);
    setRecommendationToPeers(0);
    setWillingnessToWorkInProgram(0);
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
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Award className="text-purple-600" size={28} />
              Professor Testimonial & Feedback
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Share your experience with the mentor, students, Prism team, and the overall program
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
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Select Worklet <span className="text-red-500">*</span>
                </label>
                {loadingWorklets ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
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
                      <div className="mt-3 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded-lg p-3">
                        <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">SELECTED WORKLET</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{selectedWorklet.cert_id}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{selectedWorklet.title}</div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      No worklets found. Please contact your administrator.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Show worklet info if passed as prop */}
            {worklet && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">WORKLET</div>
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
                <div className="md:col-span-2">
                  <StarRating
                    value={willingnessToWorkWithMentor}
                    onChange={setWillingnessToWorkWithMentor}
                    label="Willingness to Work with the Mentor"
                    required
                  />
                </div>
              </div>
              
              {/* Mentor Text Fields */}
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    What did you like about the mentor?
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    value={mentorLikes}
                    onChange={(e) => setMentorLikes(e.target.value)}
                    rows={3}
                    placeholder="Describe what you appreciated about working with the mentor..."
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                              focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Areas of improvement for the mentor
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <textarea
                    value={mentorImprovements}
                    onChange={(e) => setMentorImprovements(e.target.value)}
                    rows={3}
                    placeholder="Suggest areas where the mentor could improve..."
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                              focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Student Feedback */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-700 dark:to-gray-700 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="text-blue-600 dark:text-blue-400" size={24} />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Student Feedback</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StarRating
                  value={studentProactiveness}
                  onChange={setStudentProactiveness}
                  label="Student Proactiveness"
                  required
                />
                <StarRating
                  value={studentExecution}
                  onChange={setStudentExecution}
                  label="Student Execution"
                  required
                />
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Would you recommend any student for further  worklets? <span className="text-red-500">*</span>
                  </label>
                  {loadingStudents ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Loading students...</p>
                  ) : workletStudents.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No students found in this worklet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2">
                      {workletStudents.map((student) => (
                        <label
                          key={student.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={recommendedStudents.includes(student.id)}
                            onChange={() => handleStudentRecommendationToggle(student.id)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 flex-shrink-0"
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                            {student.name || student.email || `Student ${student.id}`}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
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
                  value={careerAdvancement}
                  onChange={setCareerAdvancement}
                  label="Will this program contribute to your career advancement?"
                  required
                />
                <StarRating
                  value={projectRelevanceToDomain}
                  onChange={setProjectRelevanceToDomain}
                  label="Project Relevance to Your Domain"
                  required
                />
                <StarRating
                  value={recommendationToPeers}
                  onChange={setRecommendationToPeers}
                  label="How likely are you to recommend this program to your peers?"
                  required
                />
                <StarRating
                  value={willingnessToWorkInProgram}
                  onChange={setWillingnessToWorkInProgram}
                  label="Willingness to participate in the program moving forward"
                  required
                />
              </div>
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
                  placeholder="Share your overall experience participating in this worklet program. How did it benefit you professionally?"
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
                  Best aspect of the worklet and program
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={bestAspect}
                  onChange={(e) => setBestAspect(e.target.value)}
                  placeholder="e.g., Industry collaboration, Student engagement, Professional growth"
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
                  placeholder="What changes would enhance the program experience?"
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                            bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                            focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Skills Gained */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Skills/Experience gained from this worklet program
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    'Mentoring Skills',
                    'Industry Collaboration',
                    'Student Engagement',
                    'Project Management',
                    'Research Guidance',
                    'Communication',
                    'Leadership',
                    'Innovation',
                    'Networking',
                    'Professional Development',
                    'Academic-Industry Bridge',
                    'Technical Knowledge'
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
                          ? 'bg-purple-500 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {skillsGained.includes(skill) && '✓ '}{skill}
                    </button>
                  ))}
                </div>
                {skillsGained.length > 0 && (
                  <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
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
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg 
                         hover:from-purple-700 hover:to-indigo-700 transition-all duration-200
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

export default ProfessorTestimonialModal;
