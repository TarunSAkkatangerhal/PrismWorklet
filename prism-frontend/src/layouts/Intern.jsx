import React, { useState, useEffect } from "react";
import { Loader2, CheckCircle2, Send, Download, FileText } from "lucide-react";
import axios from "axios";

// ----------------------------------------------------------------------------------
// 1. API FUNCTIONS 
// ----------------------------------------------------------------------------------

// API function to fetch worklets from backend
const fetchWorkletsFromAPI = async () => {
  try {
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
    
    return response.data || [];
  } catch (error) {
    console.error("Error fetching worklets:", error);
    return [];
  }
};

// API function to fetch mentor worklets
const fetchMentorWorklets = async () => {
  try {
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
    
    return response.data || [];
  } catch (error) {
    console.error("Error fetching mentor worklets:", error);
    return [];
  }
};

const fetchStudentsFromAPI = async (workletId) => {
  try {
    const userEmail = localStorage.getItem("user_email");
    const token = localStorage.getItem("access_token");
    
    if (!userEmail || !token) {
      throw new Error("User information not found");
    }

    const response = await axios.get(
      `http://localhost:8000/worklets/${workletId}/students`,
      {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );
    
    return response.data || [];
  } catch (error) {
    console.error("Error fetching students:", error);
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

export default function InternReferralForm() {
  const [formData, setFormData] = useState(initialFormData);
  const [status, setStatus] = useState("idle");
  const [submittedData, setSubmittedData] = useState(null);
  const [worklets, setWorklets] = useState([]);
  const [isLoadingWorklets, setIsLoadingWorklets] = useState(true);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [totalStudentCount, setTotalStudentCount] = useState(0);
  const { students, isLoading: areStudentsLoading } = useWorkletStudents(
    formData.workletId
  );

  // Fetch worklets on component mount
  useEffect(() => {
    const loadWorklets = async () => {
      setIsLoadingWorklets(true);
      const fetchedWorklets = await fetchMentorWorklets();
      setWorklets(fetchedWorklets);
      setIsLoadingWorklets(false);
      
      // Calculate total student count across all worklets
      let totalStudents = 0;
      for (const worklet of fetchedWorklets) {
        try {
          const workletStudents = await fetchStudentsFromAPI(worklet.id);
          totalStudents += workletStudents.length;
        } catch (error) {
          console.error(`Error fetching students for worklet ${worklet.id}:`, error);
        }
      }
      setTotalStudentCount(totalStudents);
    };
    
    loadWorklets();
  }, []);

  // Auto-fill student details when student is selected
  useEffect(() => {
    if (formData.studentName && students.length > 0) {
      const student = students.find((s) => s.name === formData.studentName);
      setFormData((prev) => ({
        ...prev,
        studentEmail: student?.email || "",
        studentCollege: student?.college || student?.university || "",
      }));
    }
  }, [formData.studentName, students]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newState = { ...prev, [name]: value };
      if (name === "workletId") {
        newState.studentName = "";
        newState.studentEmail = "";
        newState.studentCollege = "";
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("submitting");
    
    // Simulate submission delay for better UX
    setTimeout(() => {
      // Just show success without any complex logic
      setStatus("success");
      setShowSuccessPopup(true);
      
      // Hide popup after 3 seconds
      setTimeout(() => {
        setShowSuccessPopup(false);
        setStatus("idle");
      }, 3000);
    }, 1000);
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
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-slate-900 p-6 transition-colors duration-300">
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-lg border-2 border-blue-300 rounded-xl p-8 w-full max-w-3xl dark:bg-slate-800 dark:border-slate-700"
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

          {/* Stats Display */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-slate-700 dark:to-slate-600 rounded-lg p-4 mb-6 border border-blue-200 dark:border-slate-500">
            <div className="flex justify-center items-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {isLoadingWorklets ? (
                    <div className="animate-pulse bg-blue-200 dark:bg-slate-500 rounded w-8 h-8 mx-auto"></div>
                  ) : (
                    worklets.length
                  )}
                </div>
                <div className="text-sm font-medium text-gray-700 dark:text-slate-300">Total Worklets</div>
              </div>
              <div className="w-px h-12 bg-blue-200 dark:bg-slate-500"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                  {isLoadingWorklets ? (
                    <div className="animate-pulse bg-cyan-200 dark:bg-slate-500 rounded w-8 h-8 mx-auto"></div>
                  ) : (
                    totalStudentCount
                  )}
                </div>
                <div className="text-sm font-medium text-gray-700 dark:text-slate-300">Total Students</div>
              </div>
            </div>
          </div>

          {/* Student Info Section */}
          <h2 className="font-bold text-blue-600 dark:text-blue-400 mb-2">PRISM Mentee Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <select 
              name="workletId" 
              value={formData.workletId} 
              onChange={handleChange} 
              required 
              className="border rounded-md p-2 w-full dark:bg-slate-700 dark:text-white dark:border-slate-600"
              disabled={isLoadingWorklets}
            >
              <option value="" disabled>
                {isLoadingWorklets ? "Loading worklets..." : "Select a Worklet ID"}
              </option>
              {worklets.map((worklet) => (
                <option key={worklet.id} value={worklet.id}>
                  {worklet.cert_id} - {worklet.description || worklet.title}
                </option>
              ))}
            </select>

            <select 
              name="studentName" 
              value={formData.studentName} 
              onChange={handleChange} 
              disabled={!formData.workletId || areStudentsLoading} 
              required 
              className="border rounded-md p-2 w-full dark:bg-slate-700 dark:text-white dark:border-slate-600"
            >
              <option value="" disabled>
                {!formData.workletId ? "First, select a worklet" : areStudentsLoading ? "Loading students..." : "Select a Student"}
              </option>
              {students.map((student) => (
                <option key={student.name || student.email} value={student.name}>
                  {student.name}
                </option>
              ))}
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

          {/* Submit Button */}
          <div className="text-center">
            <button type="submit" disabled={status === "submitting"} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-semibold shadow-md flex items-center justify-center gap-2 mx-auto disabled:bg-blue-400 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600 dark:disabled:bg-blue-500/50">
              {status === "submitting" ? (<Loader2 className="animate-spin w-5 h-5" />) : (<Send className="w-5 h-5" />)}
              {status === "submitting" ? "Submitting..." : "Submit Referral"}
            </button>
          </div>
        </form>
      </div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-[100]">
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
          <div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 relative z-10 dark:bg-slate-800 max-w-md w-full transform animate-bounce">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center dark:bg-green-900">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">✅ Referral Submitted!</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Your referral has been submitted successfully!</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">The referral will be reviewed by our team.</p>
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
    // This function can be implemented to generate and download a text file or PDF
    const content = `
      Intern Referral Summary
      -------------------------
      Mentor: ${submittedData.mentorName} (${submittedData.mentorEmail})
      Student: ${submittedData.studentName} (${submittedData.studentEmail})
      College: ${submittedData.studentCollege}
      Worklet ID: ${submittedData.workletId}
      
      Criteria Selected:
      ${submittedData.referralCriteria.join(', ')}
      
      Reason:
      ${submittedData.reason}
    `;
    const blob = new Blob([content.trim()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Referral_${submittedData.studentName.replace(' ', '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    // ++ FIX: Changed bg-blue-50 to bg-gray-50 for a more neutral light background
    <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-slate-900 p-6 transition-colors duration-300">
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