import React, { useState } from "react";
import { useEffect } from "react";
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
  const simulatedOtp = "123456"; // placeholder (not used)
  const [showForgotLink, setShowForgotLink] = useState(false); // show only after failed login
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
    
    // Input validation
    if (!email || !password) {
      setMessage("Please fill all fields.");
      return;
    }
    
    if (!role) {
      setMessage("Please select a role.");
      return;
    }

    // Mock login for frontend-only development (keep for testing)
    if (email === "test@example.com" && password === "test1234") {
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
    }
};
  // Signup handlers
  const sendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      showMessage("Please enter your email.");
      return;
    }
    try {
      const response = await apiRequestOtp(email);
      setOtpSent(true);
      setOtpVerified(false);
      setOtpInput("");
      showMessage(response.message || "OTP sent to your email.");
    } catch (error) {
      showMessage(error.response?.data?.detail || "Failed to send OTP.");
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    if (!email || !otpInput) {
      showMessage("Please enter your email and OTP.");
      return;
    }
    try {
      const response = await apiVerifyOtp(email, otpInput);
      setOtpVerified(true);
      showMessage(response.message || "OTP verified successfully! Please set your password.");
    } catch (error) {
      showMessage(error.response?.data?.detail || "Invalid OTP. Please try again.");
    }
  };

  // Signup handler after OTP verification
const handleSignup = async (e) => {
  e.preventDefault();
  if (!email || !password || !role || !name) {
    showMessage("Please fill all fields.");
    return;
  }
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
                    <button className="text-white/80 hover:text-white text-sm transition-colors duration-200">Home</button>
                    <button className="text-white/80 hover:text-white text-sm transition-colors duration-200">About PRISM</button>
                    <button className="text-white/80 hover:text-white text-sm transition-colors duration-200">Blog</button>
                    <button className="text-white/80 hover:text-white text-sm transition-colors duration-200">Publications</button>
                    <button className="text-white/80 hover:text-white text-sm transition-colors duration-200">Spark</button>
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
                    
                    {/* Thought Bubbles */}
                    {isUsernameTyping && (
                      <div className="absolute -top-8 -right-2 bg-white rounded-lg px-3 py-2 text-lg animate-bounce shadow-lg">
                        ☺️
                      </div>
                    )}
                    {isPasswordFocused && (
                      <div className="absolute -top-8 -right-2 bg-white rounded-lg px-3 py-2 text-lg animate-bounce shadow-lg">
                        🫣
                      </div>
                    )}
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
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setIsUsernameTyping(e.target.value.length > 0);
                      }}
                      onFocus={() => setIsUsernameTyping(true)}
                      onBlur={() => setIsUsernameTyping(email.length > 0)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <label 
                      htmlFor="password" 
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your password"
                      required
                    />
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
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                  >
                    Sign In
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

                {/* Message Display */}
                {message && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-blue-800 dark:text-blue-200 text-sm text-center">{message}</p>
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
                    <button className="text-white/80 hover:text-white text-sm transition-colors duration-200">Home</button>
                    <button className="text-white/80 hover:text-white text-sm transition-colors duration-200">About PRISM</button>
                    <button className="text-white/80 hover:text-white text-sm transition-colors duration-200">Blog</button>
                    <button className="text-white/80 hover:text-white text-sm transition-colors duration-200">Publications</button>
                    <button className="text-white/80 hover:text-white text-sm transition-colors duration-200">Spark</button>
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
                  <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Create an account</h2>
                  <p className="text-slate-600 dark:text-slate-400">Sign up to access PRISM features</p>
                </div>

                {/* Character Animation (same as login) */}
                <div className="flex justify-center mb-6">
                  <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-110">
                    <div className="flex space-x-2">
                      <div className={`w-2 h-2 bg-white rounded-full transition-all duration-300 ${isPasswordFocused ? 'opacity-0' : 'opacity-100'}`}></div>
                      <div className={`w-2 h-2 bg-white rounded-full transition-all duration-300 ${isPasswordFocused ? 'opacity-0' : 'opacity-100'}`}></div>
                    </div>
                    <div className="absolute bottom-6 w-3 h-1 bg-white rounded-full opacity-60"></div>
                    {isUsernameTyping && (
                      <div className="absolute -top-8 -right-2 bg-white rounded-lg px-3 py-2 text-lg animate-bounce shadow-lg">👁️</div>
                    )}
                    {isPasswordFocused && (
                      <div className="absolute -top-8 -right-2 bg-white rounded-lg px-3 py-2 text-lg animate-bounce shadow-lg">🤫</div>
                    )}
                  </div>
                </div>

                {/* Signup Form (uses same handlers) */}
                <form className="space-y-6" onSubmit={otpSent && !otpVerified ? verifyOtp : otpVerified ? handleSignup : sendOtp}>
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
                      onChange={(e) => { setEmail(e.target.value); setIsUsernameTyping(e.target.value.length > 0); }}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="Enter your email"
                      required
                    />
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

                  {/* OTP / Password Flow */}
                  {!otpSent && (
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200">Send OTP</button>
                  )}

                  {otpSent && !otpVerified && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Enter OTP</label>
                        <input type="text" value={otpInput} onChange={(e) => setOtpInput(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" required />
                      </div>
                      <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200">Verify OTP</button>
                    </>
                  )}

                  {otpVerified && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Choose Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setIsPasswordFocused(true)} onBlur={() => setIsPasswordFocused(false)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" required />
                      </div>
                      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200">Sign Up</button>
                    </>
                  )}
                </form>

                <div className="mt-6 text-center">
                  <p className="text-slate-600 dark:text-slate-400">Already have an account?{' '}
                    <button onClick={() => { setPage('login'); setOtpSent(false); setOtpInput(''); setOtpVerified(false); setMessage(''); }} className="text-blue-600 hover:text-blue-500 dark:text-blue-400">Login</button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
              <div className="w-full max-w-md">
                <div className="lg:hidden text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">P</span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Samsung PRISM</h1>
                  <p className="text-slate-600 dark:text-slate-400">Create your account</p>
                </div>

                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Create an account</h2>
                  <p className="text-slate-600 dark:text-slate-400">Sign up to access PRISM features</p>
                </div>

                {/* Character Animation (same as login) */}
                <div className="flex justify-center mb-6">
                  <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg transform transition-all duration-300 hover:scale-110">
                    <div className="flex space-x-2">
                      <div className={`w-2 h-2 bg-white rounded-full transition-all duration-300 ${isPasswordFocused ? 'opacity-0' : 'opacity-100'}`}></div>
                      <div className={`w-2 h-2 bg-white rounded-full transition-all duration-300 ${isPasswordFocused ? 'opacity-0' : 'opacity-100'}`}></div>
                    </div>
                    <div className="absolute bottom-6 w-3 h-1 bg-white rounded-full opacity-60"></div>
                    {isUsernameTyping && (
                      <div className="absolute -top-8 -right-2 bg-white rounded-lg px-3 py-2 text-lg animate-bounce shadow-lg">👁️</div>
                    )}
                    {isPasswordFocused && (
                      <div className="absolute -top-8 -right-2 bg-white rounded-lg px-3 py-2 text-lg animate-bounce shadow-lg">🤫</div>
                    )}
                  </div>
                </div>

                {/* Signup Form (uses same handlers) */}
                <form className="space-y-6" onSubmit={otpSent && !otpVerified ? verifyOtp : otpVerified ? handleSignup : sendOtp}>
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
                      onChange={(e) => { setEmail(e.target.value); setIsUsernameTyping(e.target.value.length > 0); }}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    >
                      <option value="student">Student</option>
                      <option value="mentor">Mentor</option>
                      <option value="professor">Professor</option>
                    </select>
                  </div>

                  {/* OTP / Password Flow */}
                  {!otpSent && (
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200">Send OTP</button>
                  )}

                  {otpSent && !otpVerified && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Enter OTP</label>
                        <input type="text" value={otpInput} onChange={(e) => setOtpInput(e.target.value)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" required />
                      </div>
                      <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200">Verify OTP</button>
                    </>
                  )}

                  {otpVerified && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Choose Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setIsPasswordFocused(true)} onBlur={() => setIsPasswordFocused(false)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" required />
                      </div>
                      <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200">Sign Up</button>
                    </>
                  )}
                </form>

                <div className="mt-6 text-center">
                  <p className="text-slate-600 dark:text-slate-400">Already have an account?{' '}
                    <button onClick={() => { setPage('login'); setOtpSent(false); setOtpInput(''); setOtpVerified(false); setMessage(''); }} className="text-blue-600 hover:text-blue-500 dark:text-blue-400">Login</button>
                  </p>
                </div>
              </div>
          
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
