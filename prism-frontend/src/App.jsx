import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import Dashboard from "./pages/Dashboard";
import RequestUpdate from "./layouts/Requestupdates";
import Ray from "./layouts/Ray";
import WorkletsPage from "./components/WorkletsPage";
import WorkletDetailPage from './components/WorkletDetailsPage';
import Login from "./components/login";
import ForgotPassword from "./components/ForgotPassword";
import StatisticsDashboard from "./layouts/Statistics";
import MentorWorkletView from "./pages/MentorWorkletView"; 
import StudentWorkletView from "./pages/StudentWorkletView";
import LeftSidebar from "./components/Left";
import Portfolio from "./layouts/portfolio";
import Colleges from "./layouts/Colleges";
import Meetings from "./layouts/Meetings";
// --- UPDATED & NEW IMPORTS ---
// Replaced ProfileEdit and ProfileView with the new components.
// Make sure these paths are correct for your project structure.

import SettingsPage from "./layouts/SettingsPage";

// --- ProtectedRoute component (no changes needed) ---
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
  // The userData state is no longer needed here, as the new UserProfile 
  // component fetches its own data. This simplifies the App component.

  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <Routes>
                {/* --- Your Existing Routes --- */}
                <Route path="/home" element={<Dashboard />} />
                <Route path="/statistics" element={<StatisticsDashboard />} />
                <Route path="/request-update" element={<RequestUpdate />} />
                <Route path="/ray" element={<Ray />} />
                <Route path="/worklets" element={<WorkletsPage />} />
                <Route path="/worklet/:id" element={<WorkletDetailPage />} />
                <Route path="/share-suggestion" element={<Dashboard />} />
                <Route path="/internship-referral" element={<Dashboard />} />
                <Route path="/submit-feedback" element={<Dashboard />} />
                <Route path="/Left" element={<LeftSidebar/>}/>
                {/* --- Meeting Platform Routes --- */}
                <Route path="/meeting" element={<Meetings />} />
                <Route path="/mentor/worklet/:workletId" element={<MentorWorkletView />} />
                <Route path="/student/worklet/:workletId" element={<StudentWorkletView />} />
                <Route path="portfolio" element={<Portfolio/>}/>
                <Route path="/colleges" element={<Colleges />} />

                {/* --- UPDATED PROFILE & SETTINGS ROUTES --- */}

                
                {/* Added the new dedicated settings route. */}
                <Route path="/settings" element={<SettingsPage />} />
                
                {/* Removed redundant /profile/view and /profile/edit routes for clarity. */}

              </Routes>
            </ProtectedRoute>
          }
        />
      </Routes>
    </ThemeProvider>
  );
}