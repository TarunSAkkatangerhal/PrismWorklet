import React, { useState } from "react";
import { useEffect } from "react";
import axios from "axios";
import { Routes, Route, Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import prismLogo from "../assets/logo.jpeg";
export default function Login() {
  const navigate = useNavigate();
  // Auto-login on page load if tokens exist
  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");
    const userEmail = localStorage.getItem("user_email");
    if (window.location.pathname === "/home") {
      // If trying to access /home directly, check tokens
      if (!(accessToken && refreshToken && userEmail)) {
        navigate("/"); // Redirect to login if not authenticated
      }
    }
    // Auto-login on page load if tokens exist and not already on /home
    if (accessToken && refreshToken && userEmail && window.location.pathname !== "/home") {
      navigate("/home");
    }
  }, [navigate]);

  // Axios interceptor for automatic token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const refreshToken = localStorage.getItem("refresh_token");
          if (refreshToken) {
            try {
              const res = await axios.post("http://localhost:8000/auth/refresh", { refresh_token: refreshToken });
              localStorage.setItem("access_token", res.data.access_token);
              localStorage.setItem("refresh_token", res.data.refresh_token);
              originalRequest.headers["Authorization"] = `Bearer ${res.data.access_token}`;
              return axios(originalRequest);
            } catch (refreshError) {
              localStorage.clear();
              navigate("/");
            }
          }
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [navigate]);
  const [page, setPage] = useState("login"); // 'login', 'signup', 'home'
  const [email, setEmail] = useState("");
  const [name, setName] = useState(""); // New state for name
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [role, setRole] = useState("student"); // default role
  const simulatedOtp = "123456";
  // Function to show a temporary message
  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000); // Clear message after 3 seconds
  };

  // Login handler
   const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage("Please fill all fields.");
      return;
    }
    // Mock login for frontend-only development
    if (email === "test@example.com" && password === "test1234") {
      localStorage.setItem("access_token", "mock_access_token");
      localStorage.setItem("refresh_token", "mock_refresh_token");
      localStorage.setItem("user_email", email);
      localStorage.setItem("user_name", "Test User");
      setMessage("Mock login successful!");
      // Allow navigation to any protected route
      navigate("/home");
      // Optionally, you can navigate to other pages for testing:
      // navigate("/statistics");
      // navigate("/profile");
      // navigate("/worklets");
      // etc.
      return;
    }
    // ...existing code for real API login...
    const formData = new URLSearchParams();
    formData.append("username", email); // OAuth2PasswordRequestForm expects 'username'
    formData.append("password", password);
    formData.append("scope", role); // Send role as scope
    // Send login request as form data
    axios.post("http://localhost:8000/auth/login", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }).then((response) => {
      if (response.data && response.data.access_token) {
        localStorage.setItem("access_token", response.data.access_token);
        localStorage.setItem("refresh_token", response.data.refresh_token);
        localStorage.setItem("user_email", email);
        localStorage.setItem("user_name", name);
        setMessage("Login successful!");
        navigate("/home");
      } else {
        setMessage("Login failed. Check credentials.");
      }
    }).catch(() => {
      setMessage("Login failed. Check credentials.");
    });
};
  // Signup handlers
  const sendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      showMessage("Please enter your email.");
      return;
    }
    try {
      const response = await axios.post("http://localhost:8000/auth/request-otp", { email });
      setOtpSent(true);
      setOtpVerified(false);
      setOtpInput("");
      showMessage(response.data.message || "OTP sent to your email.");
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
      const response = await axios.post("http://localhost:8000/auth/verify-otp", {
        email,
        otp_code: otpInput
      });
  setOtpVerified(true);
  showMessage(response.data.message || "OTP verified successfully! Please set your password.");
    } catch (error) {
      showMessage(error.response?.data?.detail || "Invalid OTP. Please try again.");
    }
  };

  // Signup handler after OTP verification
const handleSignup = async (e) => {
  e.preventDefault();
  if (!email || !password || !role) {
    showMessage("Please fill all fields.");
    return;
  }
  try {
    const response = await axios.post("http://localhost:8000/auth/set-password", {
      name,
      email,
      password,
      role
    });
    showMessage(response.data.message || "Signup successful!");
    // Auto-login after signup
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);
    formData.append("scope", role);
    const loginResponse = await axios.post("http://localhost:8000/auth/login", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    if (loginResponse.data && loginResponse.data.access_token) {
      localStorage.setItem("access_token", loginResponse.data.access_token);
      localStorage.setItem("refresh_token", loginResponse.data.refresh_token);
      localStorage.setItem("user_email", email);
      localStorage.setItem("user_name", name);
      setMessage("Login successful!");
      navigate("/home");
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
          <div className="flex min-h-screen bg-gray-100 items-center justify-center p-4"
          style={{
            backgroundImage: "linear-gradient(to right, #e0e7ff, #f3e8ff, #bae6fd)",
          }}
        >
          <div className="bg-white rounded-lg shadow-xl overflow-hidden flex flex-col md:flex-row w-full max-w-3xl">
            {/* Left Form */}
            <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
              <h2 className="text-3xl font-bold mb-6 text-gray-800">
                  Login
                </h2>
                <form className="space-y-4" onSubmit={handleLoginSubmit}>
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email:
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Password:
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Role:
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="student">Student</option>
                      <option value="mentor">Mentor</option>
                      <option value="RND">RND</option>
                    </select>
                  </div>
                  {/* Submit for Login */}
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    Login
                  </button>
                </form>
                {/* Toggle to Signup */}
                <p className="mt-4 text-sm text-gray-600">
                  Don't have an account?{" "}
                  <button
                    onClick={() => {
                      setPage("signup");
                      setOtpSent(false);
                      setOtpInput("");
                      setOtpVerified(false);
                      setMessage("");
                    }}
                    className="text-indigo-600 hover:underline"
                  >
                    Sign Up
                  </button>
                </p>
              </div>
              {/* Right Side Image */}
              <div className="hidden md:block md:w-1/2">
                <img
                  src={prismLogo}
                  alt="Prism Logo"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        );

      case "signup":
        return (
          <div className="flex min-h-screen bg-gray-100 items-center justify-center p-4"
          style={{
            backgroundImage: "linear-gradient(to right, #e0e7ff, #f3e8ff, #bae6fd)",
          }}
        >
            <div className="bg-white rounded-lg shadow-xl overflow-hidden flex flex-col md:flex-row w-full max-w-3xl">
              {/* Left Form */}
              <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
                <h2 className="text-3xl font-bold mb-6 text-gray-800">
                  Sign Up
                </h2>
                <form
                  className="space-y-4"
                  onSubmit={otpSent && !otpVerified ? verifyOtp : otpVerified ? handleSignup : sendOtp}
                >
                  {/* Name and Role Side by Side */} 
                 <div className="flex space-x-4">
                   {/* Name */}
                 <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">
                     Name:
                     </label> 
                   <input
                   type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                   required
                   />
               </div>
  {/* Role */}
  <div className="flex-1">
    <label className="block text-sm font-medium text-gray-700">
      Role:
    </label>
    <select
      value={role}
      onChange={(e) => setRole(e.target.value)}
      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      required
    >
  <option value="Student">Student</option>
  <option value="Mentor">Mentor</option>
  <option value="Professor">Professor</option>
    </select>
  </div>
</div>
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Email:
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  {/* OTP Handling */}
                  {!otpSent && (
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    >
                      Send OTP
                    </button>
                  )}
                  {otpSent && !otpVerified && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Enter OTP:
                        </label>
                        <input
                          type="text"
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value)}
                          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                      >
                        Verify OTP
                      </button>
                    </>
                  )}
                  {otpVerified && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Password:
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      >
                        Sign Up
                      </button>
                    </>
                  )}

                </form>
                {/* Toggle to Login */}
                <p className="mt-4 text-sm text-gray-600">
                  Already have an account?{" "}
                  <button
                    onClick={() => {
                      setPage("login");
                      setOtpSent(false);
                      setOtpInput("");
                      setOtpVerified(false);
                      setMessage("");
                    }}
                    className="text-indigo-600 hover:underline"
                  >
                    Login
                  </button>
                </p>
              </div>
              {/* Right Side Image */}
              <div className="hidden md:block md:w-1/2">
                <img
                  src={prismLogo}
                  alt="Prism Logo"
                  className="h-full w-full object-cover"
                />
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