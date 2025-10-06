import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import prismLogo from "../assets/logo.jpeg";
import { forgotPassword as apiForgotPassword, resetPassword as apiResetPassword, verifyResetPasswordOtp as apiVerifyResetPasswordOtp } from "../services/auth";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  // Call backend to verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      showMessage("Please enter the OTP sent to your email.");
      return;
    }
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
    }
  };
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };



  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      showMessage("Please enter your email.");
      return;
    }
    try {
      const response = await apiForgotPassword(email);
      setOtpSent(true);
      showMessage(response.message || "OTP sent to your email.");
    } catch (error) {
      let msg = error.response?.data?.detail || "Failed to send OTP.";
      showMessage(msg);
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
      showMessage("Passwords do not match.");
      return;
    }
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
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 items-center justify-center p-4"
      style={{ backgroundImage: "linear-gradient(to right, #e0e7ff, #f3e8ff, #bae6fd)" }}
    >
      <div className="flex flex-col md:flex-row bg-white rounded-lg shadow-lg overflow-hidden w-full max-w-3xl">
        <div className="w-full md:w-1/2 p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Forgot Password</h2>
          <form className="space-y-4" onSubmit={
            !otpSent ? handleSendOtp : !otpVerified ? handleVerifyOtp : handleResetPassword
          }>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
                disabled={otpSent}
              />
            </div>
            {otpSent && !otpVerified && (
              <div>
                <label className="block text-sm font-medium text-gray-700">OTP:</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
            )}
            {otpVerified && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password:</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm Password:</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </>
            )}
            {!otpSent && (
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                Send OTP
              </button>
            )}
            {otpSent && !otpVerified && (
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              >
                Verify OTP
              </button>
            )}
            {otpVerified && (
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                Reset Password
              </button>
            )}
          </form>
          {/* Message Box */}
          {message && (
            <div className="mt-4 text-center text-red-600 font-medium">{message}</div>
          )}
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
}
