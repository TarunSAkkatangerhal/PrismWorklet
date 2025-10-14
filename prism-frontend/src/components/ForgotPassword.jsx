import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import prismLogo from "../assets/logo.jpeg";
import prismLogoPng from "../assets/prism_logo.png";
import { forgotPassword as apiForgotPassword, resetPassword as apiResetPassword, verifyResetPasswordOtp as apiVerifyResetPasswordOtp } from "../services/auth";
import Footer from "./Footer";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // States for interactive character
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // OTP Timer states
  const [otpTimer, setOtpTimer] = useState(0);
  const [isOtpDisabled, setIsOtpDisabled] = useState(false);

  // Form validation and loading states
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: "", color: "" });

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  // Password strength checker
  const checkPasswordStrength = (password) => {
    if (!password) return { score: 0, text: "", color: "" };
    
    let score = 0;
    let feedback = [];
    
    // Length check
    if (password.length >= 8) score++;
    else feedback.push("8+ characters");
    
    // Uppercase check
    if (/[A-Z]/.test(password)) score++;
    else feedback.push("uppercase letter");
    
    // Lowercase check
    if (/[a-z]/.test(password)) score++;
    else feedback.push("lowercase letter");
    
    // Number check
    if (/\d/.test(password)) score++;
    else feedback.push("number");
    
    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    else feedback.push("special character");
    
    const strengthLevels = [
      { text: "", color: "" },
      { text: "Very Weak", color: "text-red-500" },
      { text: "Weak", color: "text-red-400" },
      { text: "Fair", color: "text-yellow-500" },
      { text: "Good", color: "text-blue-500" },
      { text: "Strong", color: "text-green-500" }
    ];
    
    return {
      score,
      text: score > 0 ? strengthLevels[score].text : "",
      color: score > 0 ? strengthLevels[score].color : "",
      feedback: feedback.length > 0 ? `Missing: ${feedback.join(", ")}` : ""
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

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  // Call backend to verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      showMessage("Please enter the OTP sent to your email.");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await apiVerifyResetPasswordOtp(email, otp);
      setOtpVerified(true);
      showMessage(response.message || "OTP verified. Please enter your new password.");
    } catch (error) {
      let msg = "Failed to verify OTP.";
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          msg = error.response.data.detail.map(e => e.msg).join("; ");
        } else if (typeof error.response.data.detail === 'string') {
          msg = error.response.data.detail;
        }
      }
      showMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    
    // Validate email first
    const emailValidationError = validateEmail(email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      showMessage("Please enter a valid email address.");
      return;
    }
    
    setIsLoading(true);
    // Start timer and disable button
    setIsOtpDisabled(true);
    setOtpTimer(45);
    
    try {
      const response = await apiForgotPassword(email);
      setOtpSent(true);
      showMessage(response.message || "OTP sent to your email.");
    } catch (error) {
      let msg = error.response?.data?.detail || "Failed to send OTP.";
      showMessage(msg);
      // Reset timer on error
      setIsOtpDisabled(false);
      setOtpTimer(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!otp) {
      showMessage("Please enter the OTP sent to your email.");
      return;
    }
    if (!password || !confirmPassword) {
      showMessage("Please enter and confirm your new password.");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      showMessage("Passwords do not match.");
      return;
    }
    if (passwordStrength.score < 3) {
      showMessage("Please choose a stronger password.");
      return;
    }
    
    setIsLoading(true);
    try {
      const payload = {
        email: email,
        otp_code: otp,
        new_password: password
      };
      const response = await apiResetPassword(payload);
      showMessage(response.message || "Password reset successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      let msg = "Failed to reset password.";
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          msg = error.response.data.detail.map(e => e.msg).join("; ");
        } else if (typeof error.response.data.detail === 'string') {
          msg = error.response.data.detail;
        }
      }
      showMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
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
              <h1 className="text-5xl font-bold mb-4 animate-fade-in-up">Account Recovery</h1>
              <p className="text-xl text-orange-100 mb-8 animate-fade-in-up delay-200">We'll help you get back to your account</p>
              
              <div className="space-y-4 animate-fade-in-up delay-400">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <p className="text-lg">Secure password reset process</p>
                </div>
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-100"></div>
                  <p className="text-lg">Email verification for security</p>
                </div>
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce delay-200"></div>
                  <p className="text-lg">Quick and easy recovery steps</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Reset Form */}
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
              <p className="text-slate-600 dark:text-slate-400">Password Recovery</p>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
                {!otpSent ? "Forgot Password?" : otpVerified ? "Set New Password" : "Verify Your Email"}
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                {!otpSent 
                  ? "Enter your email to receive a password reset code" 
                  : otpVerified 
                  ? "Create a new secure password for your account"
                  : "Enter the verification code sent to your email"
                }
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
                {isTyping && (
                  <div className="absolute -top-8 -right-2 bg-white rounded-lg px-2 py-1 text-xs text-gray-700 animate-bounce shadow-lg">
                    Helping you! 🔐
                  </div>
                )}
                {isPasswordFocused && (
                  <div className="absolute -top-8 -right-2 bg-white rounded-lg px-2 py-1 text-xs text-gray-700 animate-bounce shadow-lg">
                    Secure it! 🔒
                  </div>
                )}
              </div>
            </div>

            <form 
              onSubmit={!otpSent ? handleSendOtp : !otpVerified ? handleVerifyOtp : handleResetPassword} 
              className="space-y-6"
            >
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setIsTyping(e.target.value.length > 0);
                    setEmailError(validateEmail(e.target.value));
                  }}
                  onFocus={() => setIsTyping(true)}
                  onBlur={(e) => {
                    setIsTyping(email.length > 0);
                    setEmailError(validateEmail(e.target.value));
                  }}
                  disabled={otpSent}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    emailError 
                      ? 'border-red-500 focus:ring-red-500' 
                      : email && !emailError
                        ? 'border-green-500 focus:ring-green-500' 
                        : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500'
                  }`}
                  placeholder="Enter your email address"
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

              {/* OTP Field */}
              {otpSent && !otpVerified && (
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Verification Code
                  </label>
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center text-2xl tracking-widest"
                    placeholder="123456"
                    maxLength="6"
                    required
                  />
                </div>
              )}

              {/* Password Fields */}
              {otpVerified && (
                <>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      New Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPasswordStrength(checkPasswordStrength(e.target.value));
                        setPasswordError("");
                      }}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                      className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        passwordError 
                          ? 'border-red-500 focus:ring-red-500' 
                          : password && passwordStrength.score >= 3
                            ? 'border-green-500 focus:ring-green-500' 
                            : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500'
                      }`}
                      placeholder="Enter new password"
                      required
                    />
                    
                    {/* Password Strength Indicator */}
                    {password && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Password Strength:</span>
                          <span className={`text-sm font-medium ${passwordStrength.color}`}>
                            {passwordStrength.text}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              passwordStrength.score === 1 ? 'bg-red-500 w-1/5' :
                              passwordStrength.score === 2 ? 'bg-red-400 w-2/5' :
                              passwordStrength.score === 3 ? 'bg-yellow-500 w-3/5' :
                              passwordStrength.score === 4 ? 'bg-blue-500 w-4/5' :
                              passwordStrength.score === 5 ? 'bg-green-500 w-full' :
                              'bg-gray-300 w-0'
                            }`}
                          ></div>
                        </div>
                        {passwordStrength.feedback && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {passwordStrength.feedback}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (password && e.target.value && e.target.value !== password) {
                          setPasswordError("Passwords do not match");
                        } else {
                          setPasswordError("");
                        }
                      }}
                      className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 ${
                        passwordError 
                          ? 'border-red-500 focus:ring-red-500' 
                          : confirmPassword && password === confirmPassword
                            ? 'border-green-500 focus:ring-green-500' 
                            : 'border-slate-200 dark:border-slate-600 focus:ring-blue-500'
                      }`}
                      placeholder="Confirm new password"
                      required
                    />
                    {passwordError && (
                      <p className="text-red-500 text-sm mt-1 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {passwordError}
                      </p>
                    )}
                    {!passwordError && confirmPassword && password === confirmPassword && (
                      <p className="text-green-500 text-sm mt-1 flex items-center">
                        <span className="mr-1">✓</span>
                        Passwords match
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={(!otpSent && isOtpDisabled) || isLoading}
                className={`w-full font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center ${
                  (!otpSent && isOtpDisabled) || isLoading
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : !otpSent ? (
                  isOtpDisabled 
                    ? `Resend in ${otpTimer}s` 
                    : "Send Reset Code"
                ) : !otpVerified ? (
                  "Verify Code"
                ) : (
                  "Reset Password"
                )}
              </button>

              {/* Resend OTP Button - only show after OTP is sent */}
              {otpSent && !otpVerified && (
                <button
                  type="button"
                  onClick={handleSendOtp}
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
              )}
            </form>

            {/* Back to Login */}
            <div className="mt-8 text-center">
              <p className="text-slate-600 dark:text-slate-400">
                Remember your password?{' '}
                <button
                  onClick={() => navigate("/login")}
                  className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors duration-200"
                >
                  Sign in here
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
    <Footer />
    </div>
  );
}

// Add custom CSS animations (same as login page)
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
  
  .delay-500 {
    animation-delay: 0.5s;
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