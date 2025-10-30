import React, { useState, useEffect } from "react";
import { Loader2, CheckCircle2, Send, Download, FileText, X } from "lucide-react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";

// -----------  }, [formData.studentName, students]);

  // ----------------------------------------------------------------------------------
// 1. API FUNCTIONS 
// ----------------------------------------------------------------------------------

// (Deprecated fetchWorkletsFromAPI removed: now using association endpoint exclusively)

// Association-based fetch for mentor worklets (includes embedded students with email)
const fetchMentorWorklets = async () => {
  try {
    const token = localStorage.getItem("access_token");
    if (!token) throw new Error("Missing auth token");
    const profile = await axios.get('http://localhost:8000/auth/profile', { headers: { 'Authorization': `Bearer ${token}` } });
    const mentorId = profile?.data?.id;
    if (!mentorId) throw new Error('Could not resolve mentor id');
    const resp = await axios.get(`http://localhost:8000/api/associations/mentor/${mentorId}/worklets`, { headers: { 'Authorization': `Bearer ${token}` } });
    return Array.isArray(resp?.data?.all_worklets) ? resp.data.all_worklets : [];
  } catch (e) {
    console.error('Association worklets fetch failed', e?.response?.data || e.message);
    return [];
  }
};

const fetchStudentsFromAPI = async (workletIdentifier) => {
  if (!workletIdentifier) return [];
  const token = localStorage.getItem("access_token");
  if (!token) return [];
  const base = "http://localhost:8000";
  const headers = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' };
  const primaryUrl = `${base}/worklets/${encodeURIComponent(workletIdentifier)}/students`;
  try {
    let response = await axios.get(primaryUrl, { headers });
    let data = Array.isArray(response.data) ? response.data : [];
    if (data.length === 0) {
      // Fallback attempt: try cert-specific endpoint (works even if identifier was numeric but represents cert)
      const fallbackUrl = `${base}/worklets/cert/${encodeURIComponent(workletIdentifier)}/students`;
      try {
        const fallbackResp = await axios.get(fallbackUrl, { headers });
        const fbData = Array.isArray(fallbackResp.data) ? fallbackResp.data : [];
        if (fbData.length > 0) {
          console.info("Fetched students via fallback cert endpoint", fbData);
          data = fbData;
        }
      } catch (innerErr) {
        // swallow fallback error, keep original data
        console.warn("Fallback cert fetch failed", innerErr?.response?.status);
      }
    }
    return data;
  } catch (error) {
    // If primary call 404, still try fallback
    if (error?.response?.status === 404) {
      try {
        const fallbackUrl = `${base}/worklets/cert/${encodeURIComponent(workletIdentifier)}/students`;
        const fallbackResp = await axios.get(fallbackUrl, { headers });
        return Array.isArray(fallbackResp.data) ? fallbackResp.data : [];
      } catch (innerErr) {
        console.error("Both primary & fallback student fetch failed", innerErr?.response?.status);
      }
    } else {
      console.error("Error fetching students:", error?.response?.status, error?.message);
    }
    return [];
  }
};

const getCurrentMentor = () => {
  const mentorName = localStorage.getItem("user_name") || "Unknown Mentor";
  const mentorEmail = localStorage.getItem("user_email") || "";
  return { mentorName, mentorEmail };
};

// ----------------------------------------------------------------------------------
// 2. CUSTOM HOOK
// ----------------------------------------------------------------------------------
const useWorkletStudents = (workletId) => {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (!workletId) {
      setStudents([]);
      return;
    }
    
    const getStudents = async () => {
      setIsLoading(true);
      const fetchedStudents = await fetchStudentsFromAPI(workletId);
      setStudents(fetchedStudents);
      setIsLoading(false);
    };
    
    getStudents();
  }, [workletId]);
  
  return { students, isLoading };
};

// ----------------------------------------------------------------------------------
// 3. MAIN UI COMPONENT (Updated with Real API)
// ----------------------------------------------------------------------------------
const initialFormData = {
  workletId: "",
  studentName: "",
  studentEmail: "",
  studentCollege: "",
  referralCriteria: [],
  reason: "",
};

export default function InternReferralForm({ workletId, preSelectedWorklet }) {
  const [formData, setFormData] = useState(initialFormData);
  const [status, setStatus] = useState("idle");
  const [submittedData, setSubmittedData] = useState(null);
  const [worklets, setWorklets] = useState([]);
  const [isLoadingWorklets, setIsLoadingWorklets] = useState(true);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [selectedWorkletObj, setSelectedWorkletObj] = useState(null);
  // Students actually shown in dropdown (may come from selected worklet object or API fetch)
  const [displayStudents, setDisplayStudents] = useState([]);
  const { students, isLoading: areStudentsLoading } = useWorkletStudents(
    formData.workletId
  );

  const autoMode = !!preSelectedWorklet;

  // Fetch worklets on component mount (skip in auto mode)
  useEffect(() => {
    const loadWorklets = async () => {
      setIsLoadingWorklets(true);
      const fetchedWorklets = await fetchMentorWorklets();
      setWorklets(Array.isArray(fetchedWorklets) ? fetchedWorklets : []);
      setIsLoadingWorklets(false);
    };
    if (!autoMode) {
      loadWorklets();
    }
  }, [autoMode]);

  // Decide which students to display & enrich; prefer embedded list but fetch richer data when only names are present
  useEffect(() => {
    if (selectedWorkletObj && Array.isArray(selectedWorkletObj.students) && selectedWorkletObj.students.length > 0) {
      const normalized = selectedWorkletObj.students.map(st => typeof st === 'string' ? { name: st, email: '', college: '', college_id: null } : ({
        name: st.name || '',
        email: st.email || '',
        college: st.college || st.university || '',
        college_id: st.college_id ?? null
      }));
      setDisplayStudents(normalized);
    } else {
      // fallback to fetched students for the chosen worklet id
      const normalizedFetched = students.map(st => ({
        name: st.name || '',
        email: st.email || '',
        college: st.college || st.university || '',
        college_id: st.college_id ?? null
      }));
      setDisplayStudents(normalizedFetched);
    }
  }, [selectedWorkletObj, students]);

  // Attempt enrichment via cert_id if current list lacks emails
  useEffect(() => {
    const enrich = async () => {
      if (!selectedWorkletObj) return;
      const missingEmails = displayStudents.length > 0 && displayStudents.every(s => !s.email);
      if (!missingEmails) return; // already have emails
      const identifier = selectedWorkletObj.cert_id || selectedWorkletObj.id;
      const enriched = await fetchStudentsFromAPI(identifier);
      if (Array.isArray(enriched) && enriched.length > 0) {
        // Merge by name
        setDisplayStudents(prev => prev.map(st => {
          const found = enriched.find(e => e.name === st.name);
          return found ? {
            name: found.name || st.name,
            email: found.email || st.email,
            college: found.college || found.university || st.college
          } : st;
        }));
      }
    };
    enrich();
  }, [selectedWorkletObj, displayStudents]);

  // Auto-fill student details when student is selected (use displayStudents)
  useEffect(() => {
    if (formData.studentName && displayStudents.length > 0) {
      // Case-insensitive match fallback
      const student = displayStudents.find((s) => s.name === formData.studentName) ||
        displayStudents.find((s) => s.name.toLowerCase() === formData.studentName.toLowerCase());
      if (student) {
        setFormData((prev) => ({
          ...prev,
            studentEmail: student.email || '',
            studentCollege: student.college || ''
        }));
      }
    }
  }, [formData.studentName, displayStudents]);

  // Auto-select worklet if preSelectedWorklet is provided
  useEffect(() => {
    if (!preSelectedWorklet) return;
    const identifier = preSelectedWorklet.id || preSelectedWorklet.cert_id;
    if (identifier) {
      setFormData(prev => ({ ...prev, workletId: identifier }));
      // Also set selectedWorkletObj so students populate if embedded
      const found = worklets.find(w => (w.id === identifier || w.cert_id === identifier));
      if (found) setSelectedWorkletObj(found);
    }
  }, [preSelectedWorklet, worklets]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newState = { ...prev, [name]: value };
      if (name === "workletId") {
        newState.studentName = "";
        newState.studentEmail = "";
        newState.studentCollege = "";
        // Track selected worklet object for potential future enhancements
        const selected = (Array.isArray(worklets) ? worklets : []).find(w => String(w.id ?? w.cert_id) === String(value));
        setSelectedWorkletObj(selected || null);
      }
      return newState;
    });
  };

  const handleCheckboxChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      referralCriteria: prev.referralCriteria.includes(value)
        ? prev.referralCriteria.filter((c) => c !== value)
        : [...prev.referralCriteria, value],
    }));
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setSubmittedData(null);
    setStatus("idle");
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel? All form data will be lost.")) {
      setFormData(initialFormData);
      setStatus("idle");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("submitting");
    
    // Get current mentor info
    const currentMentor = getCurrentMentor();
    
    // Prepare submission data
    const dataToSubmit = {
      ...formData,
      mentorName: currentMentor.mentorName,
      mentorEmail: currentMentor.mentorEmail,
      submittedAt: new Date().toISOString()
    };
    
    // Simulate submission delay for better UX
    setTimeout(() => {
      // Save submitted data for download
      setSubmittedData(dataToSubmit);
      // Show success without any complex logic
      setStatus("success");
      setShowSuccessPopup(true);
      
      // Remove automatic hide - let user close manually
    }, 1000);
  };

  const handleCloseSuccessPopup = () => {
    setShowSuccessPopup(false);
    setStatus("idle");
  };
  
  const criteriaOptions = [
    { value: "exemplary", label: "Exemplary Performance: Consistently exceeds expectations." },
    { value: "teamwork", label: "Teamwork: Works collaboratively and contributes to team success." },
    { value: "leadership", label: "Leadership: Demonstrates leadership and initiative." },
    { value: "innovation", label: "Innovation: Suggests new ideas or methods that help improve the worklet." },
    { value: "problemSolving", label: "Problem-Solving Ability: Approaches challenges with logical thinking." },
    { value: "positiveAttitude", label: "Positive Attitude: Maintains a positive attitude and morale within the team." },
    { value: "communication", label: "Communication: Expresses ideas and concerns clearly." },
    { value: "learningAgility", label: "Learning Agility: Picks up new skills or tools quickly and applies feedback to improve." }
  ];

  if (status === "success") {
    return <SuccessScreen submittedData={submittedData} onReset={handleReset} />;
  }
  
  const currentMentor = getCurrentMentor();
  
  return (
    <>
      {/* Main Form */}
      <div className="w-full">
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-lg border-2 border-blue-300 rounded-xl p-8 w-full max-w-3xl mx-auto dark:bg-slate-800 dark:border-slate-700"
        >
          <h1 className="text-center text-2xl font-extrabold text-blue-700 dark:text-blue-300 mb-4">
            INTERN REFERRAL FORM
          </h1>
          <p className="text-sm text-gray-600 dark:text-slate-400 text-center mb-6">
            This form allows you to refer a PRISM mentee for our internship process.
            Your referral will be reviewed by our team and we'll reach out if the profile aligns with our criteria.
          </p>

          {/* Mentor Info Section */}
          <h2 className="font-bold text-blue-600 dark:text-blue-400 mb-2">Mentor Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input type="text" value={currentMentor.mentorName} readOnly className="border rounded-md p-2 w-full bg-gray-100 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600" />
            <input type="email" value={currentMentor.mentorEmail} readOnly className="border rounded-md p-2 w-full bg-gray-100 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600" />
          </div>

          {/* Student Info Section */}
          <h2 className="font-bold text-blue-600 dark:text-blue-400 mb-2">PRISM Mentee Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {!autoMode && (
              <select 
                name="workletId" 
                value={formData.workletId} 
                onChange={handleChange} 
                required 
                className="border rounded-md p-2 w-full dark:bg-slate-700 dark:text-white dark:border-slate-600"
                disabled={isLoadingWorklets}
              >
                <option value="" disabled>
                  {isLoadingWorklets ? "Loading worklets..." : "Select a Worklet"}
                </option>
                {(Array.isArray(worklets) ? worklets : []).map((worklet) => {
                  const value = worklet.id ?? worklet.cert_id; // fallback to cert_id if id missing
                  return (
                    <option key={value} value={value}>
                      {(worklet.cert_id || value)} - {(worklet.description || worklet.title || 'No description')}
                    </option>
                  );
                })}
              </select>
            )}
            {autoMode && (
              <div className="p-2 rounded-md bg-indigo-50 dark:bg-slate-700/50 border border-indigo-200 dark:border-slate-600 text-sm font-medium text-indigo-700 dark:text-indigo-300">
                {preSelectedWorklet?.cert_id || preSelectedWorklet?.title || preSelectedWorklet?.id}
              </div>
            )}

            <select 
              name="studentName" 
              value={formData.studentName} 
              onChange={handleChange} 
              disabled={!formData.workletId || (areStudentsLoading && displayStudents.length === 0)} 
              required 
              className="border rounded-md p-2 w-full dark:bg-slate-700 dark:text-white dark:border-slate-600"
            >
              <option value="" disabled>
                {!formData.workletId
                  ? "First, select a worklet"
                  : (areStudentsLoading && displayStudents.length === 0)
                    ? "Loading students..."
                    : displayStudents.length === 0
                      ? "No students found"
                      : "Select a Student"}
              </option>
              {displayStudents.map((student) => {
                if (!student || !student.name) return null;
                return (
                  <option key={student.email || student.name} value={student.name}>
                    {student.name}
                  </option>
                );
              })}
            </select>

            <input type="email" value={formData.studentEmail} placeholder="Student Email (auto-filled)" readOnly className="border rounded-md p-2 w-full bg-gray-100 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600" />
            <input type="text" value={formData.studentCollege} placeholder="Student College (auto-filled)" readOnly className="border rounded-md p-2 w-full bg-gray-100 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600" />
          </div>

          {/* Referral Criteria Section */}
          <h2 className="font-bold text-blue-600 dark:text-blue-400 mb-2">Referral Criteria</h2>
          <div className="flex flex-col gap-2 mb-6">
            {criteriaOptions.map((criteria) => (
              <label key={criteria.value} className="flex items-start space-x-2 cursor-pointer">
                <input type="checkbox" checked={formData.referralCriteria.includes(criteria.value)} onChange={() => handleCheckboxChange(criteria.value)} className="mt-1 h-4 w-4" />
                <span className="text-sm text-gray-700 dark:text-slate-300">{criteria.label}</span>
              </label>
            ))}
          </div>

          {/* Reason for Referring Section */}
          <h2 className="font-bold text-blue-600 dark:text-blue-400 mb-2">Reason for Referring</h2>
          <textarea name="reason" value={formData.reason} onChange={handleChange} placeholder="Please provide a detailed explanation..." className="border rounded-md p-3 w-full h-28 mb-6 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-slate-400" required />

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            {/* Cancel Button */}
            <button 
              type="button" 
              onClick={handleCancel}
              disabled={status === "submitting"}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={status === "submitting"} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {status === "submitting" ? (<Loader2 className="animate-spin w-4 h-4" />) : (<Send className="w-4 h-4" />)}
              {status === "submitting" ? "Submitting..." : "Submit Referral"}
            </button>
          </div>
        </form>
      </div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-[100]">
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
          <div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 relative z-10 dark:bg-slate-800 max-w-md w-full">
            <button
              onClick={handleCloseSuccessPopup}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
              aria-label="Close"
            >
              <X size={24} />
            </button>
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center dark:bg-green-900">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">✅ Referral Submitted!</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Your referral has been submitted successfully!</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">The referral will be reviewed by our team.</p>
              <button
                onClick={handleCloseSuccessPopup}
                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ----------------------------------------------------------------------------------
// 4. SUCCESS SCREEN (Updated with Dark Theme)
// ----------------------------------------------------------------------------------
function SuccessScreen({ submittedData, onReset }) {
  const handleDownload = () => {
    const doc = new jsPDF();
    
    // Define colors matching the form
    const primaryBlue = [37, 99, 235]; // blue-600
    const lightBlue = [219, 234, 254]; // blue-100
    const darkGray = [55, 65, 81]; // gray-700
    const lightGray = [243, 244, 246]; // gray-100
    const mediumGray = [156, 163, 175]; // gray-400
    const borderGray = [209, 213, 219]; // gray-300
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 15;
    
    // Add border around the page
    doc.setDrawColor(147, 197, 253); // blue-300
    doc.setLineWidth(1);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    
    // Title Section - Matching form title
    doc.setFillColor(...primaryBlue);
    doc.rect(15, yPos, pageWidth - 30, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('INTERN REFERRAL FORM', pageWidth / 2, yPos + 10, { align: 'center' });
    yPos += 20;
    
    // Subtitle
    doc.setTextColor(...darkGray);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const subtitle = 'This form allows you to refer a PRISM mentee for our internship process.';
    const subtitle2 = "Your referral will be reviewed by our team and we'll reach out if the profile aligns with our criteria.";
    doc.text(subtitle, pageWidth / 2, yPos, { align: 'center', maxWidth: pageWidth - 40 });
    yPos += 5;
    doc.text(subtitle2, pageWidth / 2, yPos, { align: 'center', maxWidth: pageWidth - 40 });
    yPos += 12;
    
    // Section: Mentor Information
    doc.setFillColor(...primaryBlue);
    doc.rect(15, yPos, pageWidth - 30, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Mentor Information', 20, yPos + 5);
    yPos += 10;
    
    // Mentor Details - Form-like layout with borders
    const fieldHeight = 10;
    const colWidth = (pageWidth - 36) / 2;
    
    // Mentor Name Field
    doc.setDrawColor(...borderGray);
    doc.setLineWidth(0.3);
    doc.roundedRect(15, yPos, colWidth, fieldHeight, 1, 1);
    doc.setFillColor(...lightGray);
    doc.roundedRect(15, yPos, colWidth, fieldHeight, 1, 1, 'F');
    doc.setTextColor(...darkGray);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(submittedData.mentorName || '', 17, yPos + 6.5);
    
    // Mentor Email Field
    doc.roundedRect(18 + colWidth, yPos, colWidth, fieldHeight, 1, 1);
    doc.setFillColor(...lightGray);
    doc.roundedRect(18 + colWidth, yPos, colWidth, fieldHeight, 1, 1, 'F');
    doc.text(submittedData.mentorEmail || '', 20 + colWidth, yPos + 6.5);
    
    yPos += fieldHeight + 8;
    
    // Section: PRISM Mentee Information
    doc.setFillColor(...primaryBlue);
    doc.rect(15, yPos, pageWidth - 30, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('PRISM Mentee Information', 20, yPos + 5);
    yPos += 10;
    
    // Row 1: Worklet ID and Student Name
    // Worklet ID
    doc.setDrawColor(...borderGray);
    doc.setLineWidth(0.3);
    doc.roundedRect(15, yPos, colWidth, fieldHeight, 1, 1);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, yPos, colWidth, fieldHeight, 1, 1, 'F');
    doc.setTextColor(...darkGray);
    doc.setFontSize(9);
    doc.text(submittedData.workletId || '', 17, yPos + 6.5);
    
    // Student Name
    doc.roundedRect(18 + colWidth, yPos, colWidth, fieldHeight, 1, 1);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(18 + colWidth, yPos, colWidth, fieldHeight, 1, 1, 'F');
    doc.text(submittedData.studentName || '', 20 + colWidth, yPos + 6.5);
    
    yPos += fieldHeight + 3;
    
    // Row 2: Student Email and Student College
    // Student Email (read-only style)
    doc.roundedRect(15, yPos, colWidth, fieldHeight, 1, 1);
    doc.setFillColor(...lightGray);
    doc.roundedRect(15, yPos, colWidth, fieldHeight, 1, 1, 'F');
    doc.setTextColor(...mediumGray);
    doc.text(submittedData.studentEmail || 'Student Email (auto-filled)', 17, yPos + 6.5);
    
    // Student College (read-only style)
    doc.roundedRect(18 + colWidth, yPos, colWidth, fieldHeight, 1, 1);
    doc.setFillColor(...lightGray);
    doc.roundedRect(18 + colWidth, yPos, colWidth, fieldHeight, 1, 1, 'F');
    doc.text(submittedData.studentCollege || 'Student College (auto-filled)', 20 + colWidth, yPos + 6.5);
    
    yPos += fieldHeight + 8;
    
    // Section: Referral Criteria
    doc.setFillColor(...primaryBlue);
    doc.rect(15, yPos, pageWidth - 30, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Referral Criteria', 20, yPos + 5);
    yPos += 10;
    
    // Criteria mapping for full descriptions (ALL criteria from form)
    const criteriaMap = {
      exemplary: "Exemplary Performance: Consistently exceeds expectations.",
      teamwork: "Teamwork: Works collaboratively and contributes to team success.",
      leadership: "Leadership: Demonstrates leadership and initiative.",
      innovation: "Innovation: Suggests new ideas or methods that help improve the worklet.",
      problemSolving: "Problem-Solving Ability: Approaches challenges with logical thinking.",
      positiveAttitude: "Positive Attitude: Maintains a positive attitude and morale within the team.",
      communication: "Communication: Expresses ideas and concerns clearly.",
      learningAgility: "Learning Agility: Picks up new skills or tools quickly and applies feedback to improve."
    };
    
    // Create ALL criteria checkboxes (showing both checked and unchecked)
    const allCriteria = Object.entries(criteriaMap);
    const selectedCriteria = submittedData.referralCriteria || [];
    
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkGray);
    
    allCriteria.forEach(([key, description]) => {
      const isChecked = selectedCriteria.includes(key);
      
      // Draw checkbox border (always show)
      doc.setDrawColor(...borderGray);
      doc.setLineWidth(0.3);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(18, yPos - 2.5, 3.5, 3.5, 0.3, 0.3, 'FD');
      
      // Draw checkmark if selected
      if (isChecked) {
        doc.setFillColor(...primaryBlue);
        doc.circle(19.75, yPos - 0.75, 1.2, 'F');
      }
      
      // Draw description text
      const splitText = doc.splitTextToSize(description, pageWidth - 45);
      doc.setTextColor(...darkGray);
      doc.text(splitText, 24, yPos);
      yPos += Math.max(5.5, splitText.length * 4.5);
    });
    
    yPos += 3;
    
    // Check if we need a new page for the reason section
    if (yPos > pageHeight - 70) {
      doc.addPage();
      // Redraw border on new page
      doc.setDrawColor(147, 197, 253);
      doc.setLineWidth(1);
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
      yPos = 20;
    }
    
    // Section: Reason for Referring
    doc.setFillColor(...primaryBlue);
    doc.rect(15, yPos, pageWidth - 30, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Reason for Referring', 20, yPos + 5);
    yPos += 10;
    
    // Reason text box - Large textarea style matching the form
    const textAreaHeight = 35;
    doc.setDrawColor(...borderGray);
    doc.setLineWidth(0.3);
    doc.roundedRect(15, yPos, pageWidth - 30, textAreaHeight, 1, 1);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(15, yPos, pageWidth - 30, textAreaHeight, 1, 1, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkGray);
    
    // Handle long text with proper wrapping
    const reasonText = doc.splitTextToSize(
      submittedData.reason || 'Please provide a detailed explanation...', 
      pageWidth - 36
    );
    
    // Only show first lines that fit in the box
    const lineHeight = 4;
    const maxLines = Math.floor((textAreaHeight - 4) / lineHeight);
    const displayText = reasonText.slice(0, maxLines);
    
    doc.text(displayText, 17, yPos + 5);
    
    yPos += textAreaHeight + 5;
    
    // Footer with submission timestamp
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.setFont('helvetica', 'italic');
    const timestamp = submittedData.submittedAt 
      ? new Date(submittedData.submittedAt).toLocaleString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      : new Date().toLocaleString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
    doc.text(`Submitted on: ${timestamp}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
    
    // Save the PDF
    const fileName = `Internship_Referral_${submittedData.studentName?.replace(/\s+/g, '_') || 'Student'}.pdf`;
    doc.save(fileName);
  };

  return (
    // ++ FIX: Changed bg-blue-50 to bg-gray-50 for a more neutral light background
    <div className="w-full">
      <div className="text-center p-10 bg-white rounded-xl shadow-lg border-2 border-blue-300 max-w-3xl mx-auto dark:bg-slate-800 dark:border-slate-700">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Referral Submitted!</h2>
        <p className="text-gray-600 dark:text-slate-400 mb-8">
          Thank you for your feedback. You can download a copy for your records.
        </p>
        <div className="flex justify-center items-center gap-4">
          <button onClick={handleDownload} className="bg-gray-700 text-white font-semibold px-6 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2 dark:bg-slate-600 dark:hover:bg-slate-500">
            <Download className="w-5 h-5" /> Download
          </button>
          <button onClick={onReset} className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 dark:bg-blue-500 dark:hover:bg-blue-600">
            <FileText className="w-5 h-5" /> Submit Another
          </button>
        </div>
      </div>
    </div>
  );
}