import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import prismLogo from "../assets/logo.jpeg";
import API from "../api"; // make sure this is your axios instance
import { login, requestOtp, verifyOtp, setPassword, setAuthToken } from "../services/auth";
 // make sure this is your axios instance


export default function Login() {
  const navigate = useNavigate();
  const [name, setName] = useState(""); 
  const [email, setEmail] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLogin, setIsLogin] = useState(true); 
  const [role, setRole] = useState("student");
  const [otpRequested, setOtpRequested] = useState(false);



  
  // Login handler remains unchanged
  const handleLoginSubmit = async (e) => {
  e.preventDefault();
  if (!email || !password || !role) {
    setMessage("Please fill all fields.");
    return;
  }

  try {
    const data = await login(email, password, role);  // use auth.js login
    setMessage(`Login successful as ${role}!`);
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    setAuthToken(data.access_token);
    navigate("/home");
  } catch (error) {
    console.error(error);
    setMessage(error.response?.data?.detail || "Login failed. Try again.");
  }
};


  // Sign Up: Request OTP
  const handleRequestOtp = async () => {
    if (!name || !email || !role) {
      setMessage("Please fill all fields for Sign Up.");
      return;
    }
    try {
      await API.post("/auth/request-otp", { name, email, role });
      setOtpRequested(true);
      setOtpVerified(false);
      setOtpInput("");
      setMessage(`OTP sent to ${email}.`);
      alert(`OTP sent to ${email}.`);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.detail || "OTP request failed.");
    }
  };

  // Sign Up: Verify OTP
  const handleVerifyOtp = async () => {
    if (!otpInput) {
      setMessage("Enter OTP.");
      return;
    }
    try {
      await API.post("/auth/verify-otp", { email, otp_code: otpInput });
      setOtpVerified(true);
      setMessage("OTP verified! You can set your password now.");
      alert("OTP verified!");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.detail || "OTP verification failed.");
    }
  };

  // Sign Up: Set Password
  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (!otpVerified || !password) {
      setMessage("Verify OTP and enter password.");
      return;
    }
    try {
      await API.post("/auth/set-password", { email, password });
      setMessage("Sign Up successful! You can now login.");
      alert("Sign Up successful!");
      toggleMode();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.detail || "Setting password failed.");
    }
  };

  const toggleMode = () => {
    setIsLogin((prev) => !prev);
    setName("");
    setEmail("");
    setOtpRequested(false);
    setOtpVerified(false);
    setOtpInput("");
    setPassword("");
    setMessage("");
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gray-50 px-2"
      style={{
        backgroundImage: "linear-gradient(to right, #e0e7ff, #f3e8ff, #bae6fd)",
      }}
    >
      <div className="flex w-full max-w-3xl rounded-xl bg-white shadow-md overflow-hidden" style={{ maxHeight: "600px" }}>
        {/* Login/Signup Card */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
            {isLogin ? "Login" : "Sign Up"}
          </h2>

          {message && (
            <p className="mb-4 text-center text-sm text-red-500">
              {typeof message === "string" ? message : JSON.stringify(message)}
            </p>
          )}

          <form
            onSubmit={isLogin ? handleLoginSubmit : handleSetPassword}
            className="space-y-4"
          >
            {/* Name - only in Sign Up */}
            {!isLogin && (
              <div>
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
            )}

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

            {/* OTP - only in Sign Up */}
            {!isLogin && (
              <>
                {!otpVerified && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                    >
                      {otpRequested ? "Resend OTP" : "Send OTP"}
                    </button>

                    {otpRequested && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Enter OTP:
                        </label>
                        <input
                          type="text"
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value)}
                          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          className="mt-2 w-full rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
                        >
                          Verify OTP
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

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
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
            >
              {isLogin ? "Login" : otpVerified ? "Sign Up" : "Set Password"}
            </button>
          </form>

          <p className="mt-10 text-center text-sm text-gray-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={toggleMode}
              className="text-indigo-600 hover:underline"
            >
              {isLogin ? "Sign up" : "Login"}
            </button>
          </p>
        </div>

        {/* Image Section */}
        <div className="hidden md:flex md:w-1/2 h-screen items-center justify-center bg-indigo-50">
          <img
            src={prismLogo}
            alt="Prism Logo"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
