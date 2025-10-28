import React, { useState, useEffect } from "react";
import axios from "axios";
// Removed unused Routes/Route/Navigate imports
import { useNavigate } from "react-router-dom";
import prismLogo from "../assets/logo.jpeg";
import prismLogoPng from "../assets/prism_logo.png";
import { requestOtp as apiRequestOtp, verifyOtp as apiVerifyOtp, setPassword as apiSetPassword, login as secureLogin, getCurrentUserFromToken } from "../services/auth";
import Footer from "./Footer";
export default function Login() {
  const navigate = useNavigate();
  
  // States for interactive character
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isUsernameTyping, setIsUsernameTyping] = useState(false);
  
  // Auto-login on page load if tokens exist - Secure version
  useEffect(() => {
    const currentUser = getCurrentUserFromToken();
    const currentPath = window.location.pathname;
    
    if (currentPath === "/home" || currentPath === "/student-dashboard") {
      // If trying to access protected routes directly, validate authentication
      if (!currentUser) {
        navigate("/"); // Redirect to login if not authenticated
        return;
      }
    }
    
    // Auto-login on page load if valid token exists and not already on dashboard
    if (currentUser && currentPath !== "/home" && currentPath !== "/student-dashboard") {
      // Route based on validated user role from token
      if (currentUser.role && currentUser.role.toLowerCase() === "student") {
        navigate("/student-dashboard");
      } else {
        navigate("/home"); // Default to mentor/admin dashboard
      }
    }
  }, [navigate]);

  // Global axios refresh logic is configured in src/index.tsx; no local interceptor here
  const [page, setPage] = useState("login"); // 'login', 'signup', 'home'
  const [email, setEmail] = useState("");
  const [name, setName] = useState(""); // New state for name
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [role, setRole] = useState("student"); // default role
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [showForgotLink, setShowForgotLink] = useState(false); // show only after failed login
  
  // OTP Timer states
  const [otpTimer, setOtpTimer] = useState(0);
  const [isOtpDisabled, setIsOtpDisabled] = useState(false);
  const [isVerifyOtpDisabled, setIsVerifyOtpDisabled] = useState(false);

  // Form validation and loading states
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordValidation, setPasswordValidation] = useState({ isValid: false, text: "", color: "", feedback: "" });

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  // Password validation checker (no scoring)
  const validatePasswordRequirements = (password) => {
    if (!password) return { isValid: false, text: "", color: "", feedback: "" };
    
    let missingReqs = [];
    
    // Length check (8-12 characters)
    if (password.length < 8) {
      missingReqs.push("at least 8 characters");
    } else if (password.length > 12) {
      missingReqs.push("maximum 12 characters");
    }
    
    // Uppercase check
    if (!/[A-Z]/.test(password)) {
      missingReqs.push("one uppercase letter");
    }
    
    // Lowercase check
    if (!/[a-z]/.test(password)) {
      missingReqs.push("one lowercase letter");
    }
    
    // Number check
    if (!/\d/.test(password)) {
      missingReqs.push("one number");
    }
    
    // Special character check
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      missingReqs.push("one special character");
    }
    
    // Password is valid only if it meets ALL requirements
    const isValid = missingReqs.length === 0;
    
    let feedback = "";
    let text = "";
    let color = "";
    
    if (isValid) {
      feedback = "✓ Password meets all requirements";
      text = "Valid";
      color = "text-green-500";
    } else {
      feedback = `Missing: ${missingReqs.join(", ")}`;
      text = "Invalid";
      color = "text-red-500";
    }
    
    // Temporary debug log
    ;
    
    return {
      isValid,
      text,
      color,
      feedback
    };
  };

  // OTP Timer effect
  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(timer => timer - 1);
      }, 1000);
    } else if (otpTimer === 0 && isOtpDisabled) {
      setIsOtpDisabled(false);
    }
    return () => clearInterval(interval);
  }, [otpTimer, isOtpDisabled]);
  // Function to show a temporary message
  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000); // Clear message after 3 seconds
  };

  // Secure Login handler
   const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setShowForgotLink(false);
    setMessage("");
    setIsLoading(true);
    
    // Clear previous errors
    setEmailError("");
    setPasswordError("");
    
    // Input validation
    const emailErr = validateEmail(email);
    if (emailErr) {
      setEmailError(emailErr);
      setIsLoading(false);
      return;
    }
    
    if (!password) {
      setPasswordError("Password is required");
      setIsLoading(false);
      return;
    }
    
    if (!role) {
      setMessage("Please select a role.");
      setIsLoading(false);
      return;
    }

    // Optional mock login for local development (disabled by default)
    if (process.env.REACT_APP_ENABLE_MOCK_LOGIN === 'true' && email === "test@example.com" && password === "test1234") {
      // Generate mock JWT-like token for testing
      const mockToken = btoa(JSON.stringify({
        sub: "test-user-id",
        email: email,
        name: "Test User",
        role: role,
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      }));
      
      localStorage.setItem("access_token", `mock.${mockToken}.signature`);
      localStorage.setItem("refresh_token", "mock_refresh_token");
      localStorage.setItem("user_email", email);
      localStorage.setItem("user_name", "Test User");
      localStorage.setItem("user_role", role);
      setMessage("Mock login successful!");
      
      // Route based on selected role for mock login
      if (role.toLowerCase() === "student") {
        navigate("/student-dashboard");
      } else {
        navigate("/home");
      }
      setIsLoading(false);
      return;
    }

    // Real API login with secure implementation
    try {
      const loginData = await secureLogin(email, password, role);
      setMessage("Login successful!");
      
      // Route based on validated user role from token
      const userRole = loginData.user.role || "";
      if (userRole.toLowerCase() === "student") {
        navigate("/student-dashboard");
      } else {
        navigate("/home");
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage(error.message || "Login failed. Please check your credentials.");
      setShowForgotLink(true);
      
      // Clear any partial data on error
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user_email");
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_role");
    } finally {
      setIsLoading(false);
    }
};
  // Signup handlers
  const sendOtp = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setEmailError("");
    setMessage("");
    
    // Validate email
    const emailErr = validateEmail(email);
    if (emailErr) {
      setEmailError(emailErr);
      return;
    }
    
    // Start timer and disable button
    setIsOtpDisabled(true);
    setOtpTimer(45);
    setIsLoading(true);
    
    // Clear old OTP and enable verify button for resend
    setOtpInput("");
    setOtp(['', '', '', '', '', '']);
    setIsVerifyOtpDisabled(false);
    
    try {
      const response = await apiRequestOtp(email);
      setOtpSent(true);
      setOtpVerified(false);
      showMessage(response.message || "OTP sent to your email.");
    } catch (error) {
      showMessage(error.response?.data?.detail || "Failed to send OTP.");
      // Reset timer on error
      setIsOtpDisabled(false);
      setOtpTimer(0);
    } finally {
      setIsLoading(false);
    }
  };
  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus next input
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`)?.focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
    
    // Allow arrow key navigation
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text');
    const digits = paste.replace(/\D/g, '').slice(0, 6).split('');
    
    if (digits.length > 0) {
      const newOtp = [...otp];
      digits.forEach((digit, index) => {
        if (index < 6) {
          newOtp[index] = digit;
        }
      });
      setOtp(newOtp);
      
      // Focus the next empty field or the last filled field
      const nextEmptyIndex = newOtp.findIndex(digit => digit === '');
      const focusIndex = nextEmptyIndex === -1 ? 5 : Math.min(nextEmptyIndex, 5);
      document.getElementById(`otp-${focusIndex}`)?.focus();
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setMessage('Please enter all 6 digits');
      return;
    }
    
    // Disable verify OTP button
    setIsVerifyOtpDisabled(true);
    setIsLoading(true);

    
    try {
      const response = await apiVerifyOtp(email, otpString);
      setOtpVerified(true);
      showMessage(response.message || "OTP verified successfully! Please set your password.");
    } catch (error) {
      showMessage(error.response?.data?.detail || "Invalid OTP. Please try again.");
      // Re-enable button on error
      setIsVerifyOtpDisabled(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Signup handler after OTP verification
const handleSignup = async (e) => {
  e.preventDefault();
  if (!email || !password || !role || !name) {
    showMessage("Please fill all fields.");
    return;
  }
  
  // Check password requirements - must meet ALL criteria
  if (!password) {
    showMessage("Please enter a password.");
    return;
  }
  
  if (!passwordValidation.isValid) {
    // Get missing requirements
    let missingReqs = [];
    if (password.length < 8) missingReqs.push("at least 8 characters");
    if (password.length > 12) missingReqs.push("maximum 12 characters");
    if (!/[A-Z]/.test(password)) missingReqs.push("one uppercase letter");
    if (!/[a-z]/.test(password)) missingReqs.push("one lowercase letter");
    if (!/\d/.test(password)) missingReqs.push("one number");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) missingReqs.push("one special character (!@#$%^&*)");
    
    showMessage(`🔒 Password requirements not met!\n\nYour password must have:\n${missingReqs.map(req => `• ${req}`).join('\n')}\n\nExample: MyPass123! (8-12 chars)`);
    return;
  }
  
  setIsLoading(true);
  
  // Backend expects capitalized role values (Student, Mentor, Professor)
  const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  try {
    const response = await apiSetPassword(email, name, normalizedRole, password);
    showMessage(response.message || "Signup successful!");
    // Auto-login after signup
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);
    // Login scope expects lowercase to match earlier login form usage
    formData.append("scope", normalizedRole.toLowerCase());
    const loginResponse = await axios.post("http://localhost:8000/auth/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    if (loginResponse.data && loginResponse.data.access_token) {
      localStorage.setItem("access_token", loginResponse.data.access_token);
      localStorage.setItem("refresh_token", loginResponse.data.refresh_token);
      localStorage.setItem("user_email", email);
      const serverUser = loginResponse.data.user || {};
      localStorage.setItem("user_name", serverUser.name || name || "");
      localStorage.setItem("user_role", serverUser.role || normalizedRole);
      setMessage("Registration and login successful!");
      
      // Route based on user role
      const userRole = serverUser.role || normalizedRole;
      if (userRole.toLowerCase() === "student") {
        navigate("/student-dashboard");
      } else {
        navigate("/home"); // Default to mentor/admin dashboard
      }
    } else {
      setMessage("Auto-login failed. Please login manually.");
    }
  } catch (error) {
    showMessage(error.response?.data?.detail || "Signup or auto-login failed.");
  } finally {
    setIsLoading(false);
  }
};

  const renderContent = () => {
    switch (page) {
      case "login":
        return (
          <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex">
            {/* Left Side - Logo with Content Overlay */}
            <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden">
              {/* Background Image */}
              <img
                src={prismLogo}
                alt="Samsung PRISM"
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Overlay with Content */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-blue-800/70 to-purple-900/80 flex flex-col justify-center items-center p-12 text-white">
                {/* Simple Navigation Bar */}
                <div className="absolute top-6 left-0 right-0 z-20">
                  <nav className="flex justify-center space-x-6">
                    <button 
                      onClick={() => window.location.href = '/'}
                      className="text-white/80 hover:text-white text-sm transition-colors duration-200 hover:underline"
                    >
                      Home
                    </button>
                    <button 
                      onClick={() => alert('Samsung PRISM is an innovative platform for connecting students with mentors and internship opportunities.')}
                      className="text-white/80 hover:text-white text-sm transition-colors duration-200 hover:underline"
                    >
                      About PRISM
                    </button>
                  </nav>
                </div>

                {/* Animated dots */}
                <div className="absolute inset-0">
                  <div className="absolute top-10 left-10 w-4 h-4 bg-white/20 rounded-full animate-pulse"></div>
                  <div className="absolute top-40 right-20 w-3 h-3 bg-white/20 rounded-full animate-pulse delay-500"></div>
                  <div className="absolute bottom-20 left-20 w-5 h-5 bg-white/20 rounded-full animate-pulse delay-1000"></div>
                  <div className="absolute bottom-40 right-10 w-2 h-2 bg-white/20 rounded-full animate-pulse delay-700"></div>
                </div>
                
                <div className="relative z-10 text-center">
                  <h1 className="text-5xl font-bold mb-4 animate-fade-in-up">Samsung PRISM</h1>
                  <p className="text-xl text-blue-100 mb-8 animate-fade-in-up delay-200">Professional Resource for Industry Skills & Management</p>
                  
                  <div className="space-y-4 animate-fade-in-up delay-400">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                      <p className="text-lg">Enhance your technical skills through hands-on projects</p>
                    </div>
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100"></div>
                      <p className="text-lg">Connect with industry mentors and professionals</p>
                    </div>
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200"></div>
                      <p className="text-lg">Build portfolio projects for real-world experience</p>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="mt-12 grid grid-cols-3 gap-8 animate-fade-in-up delay-600">
                    <div className="text-center">
                      <div className="text-3xl font-bold">1000+</div>
                      <div className="text-blue-200">Students</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">500+</div>
                      <div className="text-blue-200">Projects</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold">50+</div>
                      <div className="text-blue-200">Mentors</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-2/5 flex items-center justify-center p-6 bg-white dark:bg-slate-800 relative">
              {/* Top Right Logo */}
              <div className="absolute top-4 right-4 z-10">
                <img
                  src={prismLogoPng}
                  alt="PRISM Logo"
                  className="w-12 h-12 object-contain"
                />
              </div>
              
              <div className="w-full max-w-md">
                {/* Mobile Logo */}
                <div className="lg:hidden text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">P</span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Samsung PRISM</h1>
                  <p className="text-slate-600 dark:text-slate-400">Welcome back!</p>
                </div>

                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Welcome Back</h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    Sign in to your Samsung PRISM account
                  </p>
                </div>

                {/* Character Animation */}
                <div className="flex justify-center mb-6">
                  <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-110">
                    {/* Eyes */}
                    <div className="flex space-x-2">
                      <div className={`w-2 h-2 bg-white rounded-full transition-all duration-300 ${isPasswordFocused ? 'opacity-0' : 'opacity-100'}`}></div>
                      <div className={`w-2 h-2 bg-white rounded-full transition-all duration-300 ${isPasswordFocused ? 'opacity-0' : 'opacity-100'}`}></div>
                    </div>
                    {/* Mouth */}
                    <div className="absolute bottom-6 w-3 h-1 bg-white rounded-full opacity-60"></div>
                    
                   
                    
                    
                  </div>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-6">
                  {/* Email Field */}
                  <div>
                    <label 
                      htmlFor="email" 
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        type="email"
                        value={email}
                        disabled={isLoading}
                        onChange={(e) => {
                          const newEmail = e.target.value.trim();
                          setEmail(newEmail);
                          setIsUsernameTyping(newEmail.length > 0);
                          // Clear error when user starts typing
                          if (emailError) setEmailError("");
                        }}
                        onFocus={() => setIsUsernameTyping(true)}
                        onBlur={() => {
                          setIsUsernameTyping(email.length > 0);
                          // Validate on blur
                          const error = validateEmail(email);
                          setEmailError(error);
                        }}
                        className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                          isLoading ? 'opacity-50 cursor-not-allowed' : ''
                        } ${
                          emailError 
                            ? 'border-red-500 focus:ring-red-500' 
                            : email && !emailError 
                              ? 'border-green-500 focus:ring-green-500' 
                              : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500'
                        }`}
                        placeholder="Enter your email"
                        required
                      />
                      {email && !emailError && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                    {emailError && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {emailError}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div>
                    <label 
                      htmlFor="password" 
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type="password"
                        value={password}
                        disabled={isLoading}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          // Clear error when user starts typing
                          if (passwordError) setPasswordError("");
                        }}
                        onFocus={() => setIsPasswordFocused(true)}
                        onBlur={() => setIsPasswordFocused(false)}
                        className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                          isLoading ? 'opacity-50 cursor-not-allowed' : ''
                        } ${
                          passwordError 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500'
                        }`}
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                    {passwordError && (
                      <p className="mt-1 text-sm text-red-500 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {passwordError}
                      </p>
                    )}
                  </div>

                  {/* Role Selection */}
                  <div>
                    <label 
                      htmlFor="role" 
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                    >
                      Role
                    </label>
                    <select
                      id="role"
                      value={role}
                      disabled={isLoading}
                      onChange={(e) => setRole(e.target.value)}
                      className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        isLoading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {/* Values are lowercase for API scope; labels are capitalized */}
                      <option value="admin">Admin</option>
                      <option value="mentor">Mentor</option>
                      <option value="professor">Professor</option>
                      <option value="student">Student</option>
                      
                    </select>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform shadow-lg flex items-center justify-center ${
                      isLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl text-white'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>

                {/* Forgot Password Link */}
                {showForgotLink && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => navigate("/forgot-password")}
                      className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors duration-200"
                    >
                      Forgot your password?
                    </button>
                  </div>
                )}

                <div className="mt-8 text-center">
                  <p className="text-slate-600 dark:text-slate-400">
                    Don't have an account?{' '}
                    <button
                      onClick={() => setPage("signup")}
                      className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors duration-200"
                    >
                      Sign up here
                    </button>
                  </p>
                </div>

                {/* Message Display with better styling */}
                {message && (
                  <div className={`mt-4 p-4 rounded-xl border-l-4 ${
                    message.includes('successful') || message.includes('verified') || message.includes('✓')
                      ? 'bg-green-50 border-green-400 text-green-800'
                      : message.includes('error') || message.includes('failed') || message.includes('Invalid')
                        ? 'bg-red-50 border-red-400 text-red-800'
                        : 'bg-blue-50 border-blue-400 text-blue-800'
                  }`}>
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {message.includes('successful') || message.includes('verified') || message.includes('✓') ? (
                          <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                        ) : message.includes('error') || message.includes('failed') || message.includes('Invalid') ? (
                          <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium whitespace-pre-line">{message}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "signup":
        return (
          <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex">
            {/* Left Side - Logo with Content Overlay */}
            <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden">
              {/* Background Image */}
              <img
                src={prismLogo}
                alt="Samsung PRISM"
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Overlay with Content */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-900/80 via-blue-800/70 to-purple-900/80 flex flex-col justify-center items-center p-12 text-white">
                {/* Simple Navigation Bar */}
                <div className="absolute top-6 left-0 right-0 z-20">
                  <nav className="flex justify-center space-x-6">
                    <button 
                      onClick={() => window.location.href = '/'}
                      className="text-white/80 hover:text-white text-sm transition-colors duration-200 hover:underline"
                    >
                      Home
                    </button>
                    <button 
                      onClick={() => alert('Samsung PRISM is an innovative platform for connecting students with mentors and internship opportunities.')}
                      className="text-white/80 hover:text-white text-sm transition-colors duration-200 hover:underline"
                    >
                      About PRISM
                    </button>
                  </nav>
                </div>

                {/* Animated dots */}
                <div className="absolute inset-0">
                  <div className="absolute top-10 left-10 w-4 h-4 bg-white/20 rounded-full animate-pulse"></div>
                  <div className="absolute top-40 right-20 w-3 h-3 bg-white/20 rounded-full animate-pulse delay-500"></div>
                  <div className="absolute bottom-20 left-20 w-5 h-5 bg-white/20 rounded-full animate-pulse delay-1000"></div>
                  <div className="absolute bottom-40 right-10 w-2 h-2 bg-white/20 rounded-full animate-pulse delay-700"></div>
                </div>
                
                <div className="relative z-10 text-center">
                  <h1 className="text-5xl font-bold mb-4 animate-fade-in-up">Join PRISM</h1>
                  <p className="text-xl text-green-100 mb-8 animate-fade-in-up delay-200">Start Your Professional Journey Today</p>
                  
                  <div className="space-y-4 animate-fade-in-up delay-400">
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                      <p className="text-lg">Access exclusive learning resources and projects</p>
                    </div>
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100"></div>
                      <p className="text-lg">Get mentored by industry professionals</p>
                    </div>
                    <div className="flex items-center justify-center space-x-3">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200"></div>
                      <p className="text-lg">Build impressive portfolio and career prospects</p>
                    </div>
                  </div>
                  
                  {/* Join Stats */}
                  <div className="mt-12 animate-fade-in-up delay-600">
                    <div className="text-center mb-4">
                      <div className="text-4xl font-bold">Ready to Begin?</div>
                      <div className="text-green-200">Join thousands of learners today</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Signup Form */}
            <div className="w-full lg:w-2/5 flex items-center justify-center p-6 bg-white dark:bg-slate-800 relative">
              {/* Top Right Logo */}
              <div className="absolute top-4 right-4 z-10">
                <img
                  src={prismLogoPng}
                  alt="PRISM Logo"
                  className="w-12 h-12 object-contain"
                />
              </div>
              
              <div className="w-full max-w-md">
                <div className="lg:hidden text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">P</span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Samsung PRISM</h1>
                  <p className="text-slate-600 dark:text-slate-400">Create your account</p>
                </div>

                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl mb-4 shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Create Account</h2>
                  <p className="text-slate-600 dark:text-slate-400">Join Samsung PRISM to start your journey</p>
                  
                  {/* Progress Steps */}
                  <div className="flex justify-center mt-6 mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                        !otpSent ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'
                      }`}>
                        {!otpSent ? '1' : '✓'}
                      </div>
                      <div className={`w-12 h-1 rounded transition-colors ${
                        otpSent ? 'bg-green-500' : 'bg-gray-200'
                      }`}></div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                        otpSent && !otpVerified ? 'bg-blue-600 text-white' : otpVerified ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                      }`}>
                        {!otpSent ? '2' : !otpVerified ? '2' : '✓'}
                      </div>
                      <div className={`w-12 h-1 rounded transition-colors ${
                        otpVerified ? 'bg-green-500' : 'bg-gray-200'
                      }`}></div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                        otpVerified ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                      }`}>
                        3
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center text-xs text-gray-500 space-x-8">
                    <span className={!otpSent ? 'text-blue-600 font-medium' : 'text-green-600'}>Details</span>
                    <span className={otpSent && !otpVerified ? 'text-blue-600 font-medium' : otpVerified ? 'text-green-600' : ''}>Verify</span>
                    <span className={otpVerified ? 'text-blue-600 font-medium' : ''}>Password</span>
                  </div>
                </div>

                {/* Character Animation (same as login) */}
                <div className="flex justify-center mb-6">
                  <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-110">
                    <div className="flex space-x-2">
                      <div className={`w-2 h-2 bg-white rounded-full transition-all duration-300 ${isPasswordFocused ? 'opacity-0' : 'opacity-100'}`}></div>
                      <div className={`w-2 h-2 bg-white rounded-full transition-all duration-300 ${isPasswordFocused ? 'opacity-0' : 'opacity-100'}`}></div>
                    </div>
                    <div className="absolute bottom-6 w-3 h-1 bg-white rounded-full opacity-60"></div>
                    
                  </div>
                </div>

                {/* Signup Form (uses same handlers) */}
                <form className="space-y-6" onSubmit={otpSent && !otpVerified ? verifyOtp : otpVerified ? handleSignup : sendOtp}>
                  {/* Initial signup fields - only show if OTP not sent */}
                  {!otpSent && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          placeholder="Your full name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => { 
                            setEmail(e.target.value); 
                            setIsUsernameTyping(e.target.value.length > 0);
                            setEmailError(validateEmail(e.target.value));
                          }}
                          onBlur={(e) => setEmailError(validateEmail(e.target.value))}
                          className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                            emailError 
                              ? 'border-red-500 focus:ring-red-500' 
                              : email && !emailError
                                ? 'border-green-500 focus:ring-green-500' 
                                : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500'
                          }`}
                          placeholder="Enter your email"
                          required
                        />
                        {emailError && (
                          <p className="text-red-500 text-sm mt-1 flex items-center">
                            <span className="mr-1">⚠️</span>
                            {emailError}
                          </p>
                        )}
                        {!emailError && email && (
                          <p className="text-green-500 text-sm mt-1 flex items-center">
                            <span className="mr-1">✓</span>
                            Valid email address
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Role</label>
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        >
                          {/* Values are lowercase for API scope; labels are capitalized */}
                          <option value="admin">Admin</option>
                          <option value="mentor">Mentor</option>
                          <option value="professor">Professor</option>
                          <option value="student">Student</option>
                        </select>
                      </div>

                      <button 
                        type="submit" 
                        disabled={isOtpDisabled || isLoading}
                        className={`w-full font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center ${
                          isOtpDisabled || isLoading
                            ? 'bg-gray-400 cursor-not-allowed text-white' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending OTP...
                          </>
                        ) : isOtpDisabled ? (
                          `Resend in ${otpTimer}s`
                        ) : (
                          'Send OTP'
                        )}
                      </button>
                    </>
                  )}

                  {/* OTP Verification - only show after OTP is sent */}
                  {otpSent && !otpVerified && (
                    <>
                      <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Check Your Email</h3>
                        <p className="text-slate-600 dark:text-slate-400">
                          We sent a 6-digit code to<br />
                          <span className="font-medium text-blue-600">{email}</span>
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                          Enter the code below or paste it from your email
                        </p>
                      </div>
                      
                      <div className="flex justify-center gap-3 mb-6">
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            inputMode="numeric"
                            maxLength="1"
                            value={digit}
                            disabled={isLoading}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            onPaste={handleOtpPaste}
                            aria-label={`OTP digit ${index + 1}`}
                            className={`w-14 h-14 text-center text-xl font-bold border-2 rounded-xl transition-all duration-200 focus:outline-none ${
                              isLoading 
                                ? 'opacity-50 cursor-not-allowed border-gray-300' 
                                : digit 
                                  ? 'border-blue-500 bg-blue-50 text-blue-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-200' 
                                  : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 hover:border-gray-400'
                            }`}
                            placeholder="•"
                          />
                        ))}
                      </div>
                      
                      <button 
                        type="submit" 
                        disabled={isVerifyOtpDisabled || isLoading}
                        className={`w-full font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center ${
                          isVerifyOtpDisabled || isLoading
                            ? 'bg-gray-400 cursor-not-allowed text-white' 
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Verifying...
                          </>
                        ) : isVerifyOtpDisabled ? (
                          'Verified ✓'
                        ) : (
                          'Verify OTP'
                        )}
                      </button>
                      
                      {/* Resend OTP Button */}
                      <button
                        type="button"
                        onClick={sendOtp}
                        disabled={isOtpDisabled || isLoading}
                        className={`w-full font-semibold py-2 px-4 rounded-lg border transition-all duration-200 flex items-center justify-center ${
                          isOtpDisabled || isLoading
                            ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                            : 'bg-white border-blue-600 text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        {isLoading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending...
                          </>
                        ) : isOtpDisabled ? (
                          `Resend OTP in ${otpTimer}s`
                        ) : (
                          'Resend OTP'
                        )}
                      </button>
                    </>
                  )}
                  {otpVerified && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Choose Password</label>
                        <input 
                          type="password" 
                          value={password} 
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setPasswordValidation(validatePasswordRequirements(e.target.value));
                            setPasswordError("");
                          }}
                          onFocus={() => setIsPasswordFocused(true)} 
                          onBlur={() => setIsPasswordFocused(false)} 
                          className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                            passwordError 
                              ? 'border-red-500 focus:ring-red-500' 
                              : password && passwordValidation.isValid
                                ? 'border-green-500 focus:ring-green-500' 
                                : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500'
                          }`}
                          placeholder="Create your password (8-12 chars)" 
                          required 
                        />
                        
                        {/* Password Requirements Display */}
                        {password && (
                          <div className="mt-2">
                            <p className={`text-sm ${passwordValidation.color}`}>
                              {passwordValidation.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                      <button 
                        type="submit" 
                        disabled={isLoading || (password && !passwordValidation.isValid)}
                        className={`w-full font-semibold py-3 px-4 rounded-lg transition-all duration-200 ${
                          isLoading || (password && !passwordValidation.isValid)
                            ? 'bg-gray-400 cursor-not-allowed text-white' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isLoading ? 'Creating Account...' : 'Complete Signup'}
                      </button>
                    </>
                  )}
                </form>

                <div className="mt-6 text-center">
                  <p className="text-slate-600 dark:text-slate-400">Already have an account?{' '}
                    <button onClick={() => { setPage('login'); setOtpSent(false); setOtpInput(''); setOtp(['', '', '', '', '', '']); setOtpVerified(false); setMessage(''); }} className="text-blue-600 hover:text-blue-500 dark:text-blue-400">Login</button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

          
      default:
        return null;
    }
  };

  return (
    <div className="relative">
      {/* Global Message Box */}
      {message && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-lg shadow-xl z-50 animate-slide-in-down">
          <p className="text-sm font-medium text-center text-gray-800">
            {message}
          </p>
        </div>
      )}
      {renderContent()}
      <Footer />
    </div>
  );
}

// Helper to get access token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Example: Use in protected API call
// axios.get("http://localhost:8000/protected-endpoint", { headers: getAuthHeaders() })
//   .then(response => { /* handle data */ })
//   .catch(error => { /* handle error */ });

// Add custom CSS animations
const styles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes fade-in-up {
    0% { transform: translateY(20px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
    50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.8); }
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
  
  .animate-fade-in-up {
    animation: fade-in-up 0.8s ease-out forwards;
  }
  
  .animate-pulse-glow {
    animation: pulse-glow 2s ease-in-out infinite;
  }
  
  .delay-200 {
    animation-delay: 0.2s;
  }
  
  .delay-400 {
    animation-delay: 0.4s;
  }
  
  .delay-600 {
    animation-delay: 0.6s;
  }
  
  .delay-1000 {
    animation-delay: 1s;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}
