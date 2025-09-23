
import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import Dashboard from "./pages/Dashboard";
import UserProfile from "./layouts/UserProfile";
import RequestUpdate from "./layouts/Requestupdates";
import Ray from "./layouts/Ray";
import WorkletsPage from "./components/WorkletsPage";
import WorkletDetailPage from './components/WorkletDetailsPage';
import Login from "./components/login";
import StatisticsDashboard from "./layouts/Statistics";

// ProtectedRoute component
function ProtectedRoute({ children }) {
  const accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");
  const userEmail = localStorage.getItem("user_email");
  if (accessToken && refreshToken && userEmail) {
    return children;
  }
  return <Navigate to="/" replace />;
}

// The single source of truth for user data
const initialUserData = {
  avatarUrl: null,
  name: 'Mary Christian',
  handle: '@mary_prism',
  bio: 'PRISM / Tech Strategy, Software Developer. Turning ideas into impact.',
  qualification: 'Software Developer',
  dob: '1992-11-24',
  location: 'Bengaluru, India',
  website: 'https://mary.dev',
};

export default function App() {
  // The user data state is managed here
  const [userData, setUserData] = useState(initialUserData);

  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <Routes>
                <Route path="/home" element={<Dashboard />} />
                <Route path="/statistics" element={<StatisticsDashboard />} />
                <Route path="/profile" element={<UserProfile userData={userData} onProfileUpdate={setUserData} />} />
                <Route path="/request-update" element={<RequestUpdate />} />
                <Route path="/ray" element={<Ray />} />
                <Route path="/worklets" element={<WorkletsPage />} />
                <Route path="/worklet/:id" element={<WorkletDetailPage />} />
                <Route path="/share-suggestion" element={<Dashboard />} />
                <Route path="/internship-referral" element={<Dashboard />} />
                <Route path="/submit-feedback" element={<Dashboard />} />
              </Routes>
            </ProtectedRoute>
          }
        />
      </Routes>
    </ThemeProvider>
  );
}