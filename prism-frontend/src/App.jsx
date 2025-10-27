import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import Dashboard from "./pages/Home";
import StudentDashboard from "./pages/StudentDashboard";
import RequestUpdate from "./layouts/Requestupdates";
import Ray from "./layouts/Ray";
import WorkletsPage from "./components/WorkletsPage";
import WorkletDetailPage from './components/WorkletDetailsPage';
import Login from "./components/login";
import ForgotPassword from "./components/ForgotPassword";
import StatisticsDashboard from "./layouts/dashboard";
import LeftSidebar from "./components/Left";
import Portfolio from "./layouts/portfolio";
import Colleges from "./layouts/academia";
import Meetings from "./layouts/Meetings";
import NavColl from "./layouts/academia_details";
import NavStat from "./layouts/dashboard_details";
import { MentorRoute, StudentRoute, ProtectedRoute } from "./components/RoleBasedRoute";
import RoleRedirect from "./components/RoleRedirect";

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected Routes */}
        <Route path="/home" element={<ProtectedRoute><MentorRoute><Dashboard /></MentorRoute></ProtectedRoute>} />
        <Route path="/student-dashboard" element={<ProtectedRoute><StudentRoute><StudentDashboard /></StudentRoute></ProtectedRoute>} />
        <Route path="/Dashboard" element={<ProtectedRoute><StatisticsDashboard /></ProtectedRoute>} />
        <Route path="/dashboard_details" element={<ProtectedRoute><NavStat /></ProtectedRoute>} />
        <Route path="/academia_details" element={<ProtectedRoute><NavColl /></ProtectedRoute>} />
        <Route path="/request-update" element={<ProtectedRoute><RequestUpdate /></ProtectedRoute>} />
        <Route path="/ray" element={<ProtectedRoute><Ray /></ProtectedRoute>} />
        <Route path="/worklets" element={<ProtectedRoute><WorkletsPage /></ProtectedRoute>} />
        <Route path="/worklet/:id" element={<ProtectedRoute><WorkletDetailPage /></ProtectedRoute>} />
        <Route path="/share-suggestion" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/internship-referral" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/submit-feedback" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/Left" element={<ProtectedRoute><LeftSidebar/></ProtectedRoute>}/>
        <Route path="/meeting" element={<ProtectedRoute><Meetings /></ProtectedRoute>} />
        <Route path="/portfolio" element={<ProtectedRoute><Portfolio/></ProtectedRoute>}/>
        <Route path="/academia" element={<ProtectedRoute><Colleges /></ProtectedRoute>} />
        
        {/* Default redirect based on role */}
        <Route path="*" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
      </Routes>
    </ThemeProvider>
  );
}