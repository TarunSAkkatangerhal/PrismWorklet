// Temporary simplified App.jsx for debugging
import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Login from "./components/login";
import ForgotPassword from "./components/ForgotPassword";

// Simple ProtectedRoute without role checking
function ProtectedRoute({ children }) {
  const accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");
  const userEmail = localStorage.getItem("user_email");
  
  if (accessToken && refreshToken && userEmail) {
    return children;
  }
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/home" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </ThemeProvider>
  );
}