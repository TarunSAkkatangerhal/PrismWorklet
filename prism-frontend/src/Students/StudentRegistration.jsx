import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function StudentRegistration() {
  useDocumentTitle('Student Registration');
  const navigate = useNavigate();

  // Form States
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    collegeId: "",
    collegeName: "",
    collegeRollNo: "",
    qualification: "",
    branch: "",
    batchFrom: "",
    batchTo: ""
  });

  // UI States
  const [colleges, setColleges] = useState([]);
  const [qualifications, setQualifications] = useState([
    "B.Tech", "M.Tech", "B.E.", "M.E.", "BCA", "MCA", "BSc", "MSc", "PhD"
  ]);
  const [branches, setBranches] = useState([
    "Computer Science Engineering",
    "Information Technology",
    "Electronics and Communication Engineering",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Chemical Engineering",
    "Biotechnology",
    "Aerospace Engineering",
    "Other"
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  // Load user data and colleges on mount
  useEffect(() => {
    loadUserData();
    loadColleges();
  }, []);

  const loadUserData = () => {
    const userName = localStorage.getItem("user_name");
    const userEmail = localStorage.getItem("user_email");
    setFormData(prev => ({
      ...prev,
      fullName: userName || "",
      email: userEmail || ""
    }));
  };

  const loadColleges = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.get("http://localhost:8000/colleges/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setColleges(response.data || []);
    } catch (error) {
      console.error("Failed to load colleges:", error);
      setMessage("Failed to load colleges. Please refresh the page.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }

    // Update college name when college is selected
    if (name === "collegeId") {
      const selectedCollege = colleges.find(c => c.college_id === parseInt(value));
      setFormData(prev => ({
        ...prev,
        collegeId: value,
        collegeName: selectedCollege ? selectedCollege.college_name : ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.replace(/[- ]/g, ""))) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }

    if (!formData.collegeId) {
      newErrors.collegeId = "Please select a college";
    }

    if (!formData.collegeRollNo.trim()) {
      newErrors.collegeRollNo = "College roll number is required";
    }

    if (!formData.qualification) {
      newErrors.qualification = "Please select a qualification";
    }

    if (!formData.branch) {
      newErrors.branch = "Please select a branch";
    }

    if (!formData.batchFrom) {
      newErrors.batchFrom = "Batch start date is required";
    }

    if (!formData.batchTo) {
      newErrors.batchTo = "Batch end date is required";
    }

    if (formData.batchFrom && formData.batchTo) {
      const fromDate = new Date(formData.batchFrom);
      const toDate = new Date(formData.batchTo);
      if (toDate <= fromDate) {
        newErrors.batchTo = "Batch end date must be after start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setMessage("Please fix the errors in the form");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("access_token");
      
      // Prepare data for backend
      const profileData = {
        extra: {
          full_name: formData.fullName,
          phone: formData.phone,
          college_roll_no: formData.collegeRollNo,
          qualification: formData.qualification,
          branch: formData.branch,
          batch_from: formData.batchFrom,
          batch_to: formData.batchTo
        },
        college_id: parseInt(formData.collegeId),
        contact_number: formData.phone,
        qualification: formData.qualification
      };

      const response = await axios.put(
        "http://localhost:8000/auth/complete-student-profile",
        profileData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      setMessage("Registration completed successfully!");
      
      // Redirect to student dashboard after 1 second
      setTimeout(() => {
        navigate("/student-dashboard");
      }, 1000);

    } catch (error) {
      console.error("Registration error:", error);
      setMessage(error.response?.data?.detail || "Failed to complete registration. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-slate-100 flex overflow-hidden">
      {/* Left Side - Info Panel */}
      <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/95 via-blue-800/90 to-purple-900/95 flex flex-col justify-center items-center p-12 text-white">
          {/* Animated dots */}
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-4 h-4 bg-white/20 rounded-full animate-pulse"></div>
            <div className="absolute top-40 right-20 w-3 h-3 bg-white/20 rounded-full animate-pulse" style={{animationDelay: '500ms'}}></div>
            <div className="absolute bottom-20 left-20 w-5 h-5 bg-white/20 rounded-full animate-pulse" style={{animationDelay: '1000ms'}}></div>
            <div className="absolute bottom-40 right-10 w-2 h-2 bg-white/20 rounded-full animate-pulse" style={{animationDelay: '700ms'}}></div>
          </div>
          
          <div className="relative z-10 text-center">
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <h2 className="text-4xl font-bold mb-4">Welcome to PRISM</h2>
              <p className="text-blue-100 text-lg mb-8">Complete your profile to get started</p>
            </div>
            
            <div className="space-y-6 text-left max-w-sm mx-auto">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-500/30 rounded-full flex items-center justify-center mt-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Access Learning Resources</h3>
                  <p className="text-blue-200 text-sm">Exclusive projects and materials</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-purple-500/30 rounded-full flex items-center justify-center mt-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Get Mentored</h3>
                  <p className="text-blue-200 text-sm">Connect with industry professionals</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-500/30 rounded-full flex items-center justify-center mt-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Build Your Portfolio</h3>
                  <p className="text-blue-200 text-sm">Impressive career prospects</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="w-full lg:w-3/5 overflow-y-auto p-8">
        <div className="w-full max-w-2xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold">
                  1
                </div>
                <span className="ml-2 text-sm font-medium text-slate-700">Sign Up</span>
              </div>
              <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-purple-600"></div>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg">
                  2
                </div>
                <span className="ml-2 text-sm font-medium text-blue-600">Profile</span>
              </div>
              <div className="w-16 h-1 bg-slate-200"></div>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 font-semibold">
                  3
                </div>
                <span className="ml-2 text-sm font-medium text-slate-400">Dashboard</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mb-16"></div>
              </div>
              <div className="relative">
                <h2 className="text-3xl font-bold text-white text-center flex items-center justify-center">
                  <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Complete Your Profile
                </h2>
                <p className="text-blue-100 text-center mt-2">
                  Help us know you better
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
            {/* Message */}
            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes("success") 
                  ? "bg-green-50 text-green-800 border border-green-200" 
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}>
                {message}
              </div>
            )}

            {/* BASIC INFO Section */}
            <div>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Basic Information
                </h3>
              </div>

              {/* Full Name */}
              <div className="mb-4 group">
                <label htmlFor="fullName" className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  Full Name <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                      errors.fullName ? "border-red-500 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500 group-hover:border-blue-300"
                    }`}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                    </svg>
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div className="mb-4">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-3 bg-gradient-to-r from-slate-100 to-slate-50 border-2 border-slate-200 rounded-xl cursor-not-allowed"
                    placeholder="your.email@example.com"
                  />
                  <div className="absolute right-3 top-3 bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full font-medium">
                    Verified
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-500 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path>
                  </svg>
                  Email cannot be changed
                </p>
              </div>

              {/* Phone */}
              <div className="mb-4 group">
                <label htmlFor="phone" className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                  Phone <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                    errors.phone ? "border-red-500 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500 group-hover:border-blue-300"
                  }`}
                  placeholder="Enter your phone number"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                    </svg>
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* College Name and Roll No in a row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* College Name */}
                <div className="group">
                  <label htmlFor="collegeId" className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14l9-5-9-5-9 5 9 5z"></path>
                      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"></path>
                    </svg>
                    College Name <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    id="collegeId"
                    name="collegeId"
                    value={formData.collegeId}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                      errors.collegeId ? "border-red-500 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500 group-hover:border-blue-300"
                    }`}
                  >
                    <option value="">Select College</option>
                    {colleges.map(college => (
                      <option key={college.college_id} value={college.college_id}>
                        {college.college_name}
                      </option>
                    ))}
                  </select>
                  {errors.collegeId && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                      </svg>
                      {errors.collegeId}
                    </p>
                  )}
                </div>

                {/* College Roll No */}
                <div className="group">
                  <label htmlFor="collegeRollNo" className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                    </svg>
                    College Roll No <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    id="collegeRollNo"
                    name="collegeRollNo"
                    value={formData.collegeRollNo}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                      errors.collegeRollNo ? "border-red-500 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500 group-hover:border-blue-300"
                    }`}
                    placeholder="Enter roll number"
                  />
                  {errors.collegeRollNo && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                      </svg>
                      {errors.collegeRollNo}
                    </p>
                  )}
                </div>
              </div>

              {/* Qualification */}
              <div className="mb-4 group">
                <label htmlFor="qualification" className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                  </svg>
                  Qualification <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  id="qualification"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                    errors.qualification ? "border-red-500 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500 group-hover:border-blue-300"
                  }`}
                >
                  <option value="">Select Qualification</option>
                  {qualifications.map(qual => (
                    <option key={qual} value={qual}>{qual}</option>
                  ))}
                </select>
                {errors.qualification && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                    </svg>
                    {errors.qualification}
                  </p>
                )}
              </div>

              {/* Branch */}
              <div className="mb-4 group">
                <label htmlFor="branch" className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                  </svg>
                  Branch <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  id="branch"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                    errors.branch ? "border-red-500 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500 group-hover:border-blue-300"
                  }`}
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
                {errors.branch && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                    </svg>
                    {errors.branch}
                  </p>
                )}
              </div>

              {/* Batch From and Batch To */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="group">
                  <label htmlFor="batchFrom" className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    Batch From <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="date"
                    id="batchFrom"
                    name="batchFrom"
                    value={formData.batchFrom}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                      errors.batchFrom ? "border-red-500 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500 group-hover:border-blue-300"
                    }`}
                  />
                  {errors.batchFrom && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                      </svg>
                      {errors.batchFrom}
                    </p>
                  )}
                </div>

                <div className="group">
                  <label htmlFor="batchTo" className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    Batch To <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="date"
                    id="batchTo"
                    name="batchTo"
                    value={formData.batchTo}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                      errors.batchTo ? "border-red-500 focus:ring-red-500" : "border-slate-200 focus:ring-purple-500 group-hover:border-purple-300"
                    }`}
                  />
                  {errors.batchTo && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                      </svg>
                      {errors.batchTo}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 pb-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 px-6 rounded-xl font-bold text-white text-lg transition-all duration-300 relative overflow-hidden group ${
                  isLoading
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-2xl transform hover:-translate-y-1"
                }`}
              >
                {!isLoading && (
                  <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
                )}
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center justify-center relative z-10">
                    Complete Registration
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                    </svg>
                  </span>
                )}
              </button>
            </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
