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
import LeftSidebar from "./components/Left";
import Portfolio from "./layouts/portfolio";
import Colleges from "./layouts/Colleges";
import Meetings from "./layouts/Meetings";
import NavStat from "./layouts/navStat";
// --- UPDATED & NEW IMPORTS ---
// Replaced ProfileEdit and ProfileView with the new components.
// Make sure these paths are correct for your project structure.


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
                <Route path="/home" element={<Dashboard />} />
                <Route path="/statistics" element={<StatisticsDashboard />} />
                <Route path="/navStat" element={<NavStat />} />
                <Route path="/request-update" element={<RequestUpdate />} />
                <Route path="/ray" element={<Ray />} />
                <Route path="/worklets" element={<WorkletsPage />} />
                <Route path="/worklet/:id" element={<WorkletDetailPage />} />
                <Route path="/share-suggestion" element={<Dashboard />} />
                <Route path="/internship-referral" element={<Dashboard />} />
                <Route path="/submit-feedback" element={<Dashboard />} />
                <Route path="/Left" element={<LeftSidebar/>}/>
                <Route path="/meeting" element={<Meetings />} />
               
                <Route path="portfolio" element={<Portfolio/>}/>
                <Route path="/colleges" element={<Colleges />} />

                
                
              </Routes>
            </ProtectedRoute>
          }
        />
      </Routes>
    </ThemeProvider>
  );
}