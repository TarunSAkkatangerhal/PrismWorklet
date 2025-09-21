// src/components/ProtectedRoute.jsx

import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("access_token"); // check if user is logged in
  if (!token) {
    // if not logged in, redirect to login
    return <Navigate to="/" replace />;
  }
  return children;
};

export default ProtectedRoute;
