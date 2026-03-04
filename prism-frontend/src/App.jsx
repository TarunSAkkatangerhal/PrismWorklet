import { Routes, Route} from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { useDocumentTitle } from "./hooks/useDocumentTitle";
import { MentorRoute, StudentRoute, ProfessorRoute, AdminRoute, ProtectedRoute } from "./components/RoleBasedRoute";
import RequireRegistration from "./components/RequireRegistration";
import RoleRedirect from "./components/RoleRedirect";
import Login from "./Shared Components/login";
import ForgotPassword from "./Shared Components/ForgotPassword";
import RoleBasedChatPage from "./Shared Components/RoleBasedChatPage";
import Home from "./Mentors/Home";
import Dashboard from "./Mentors/dashboard";
import Portfolio from "./Mentors/portfolio";
import Colleges from "./Mentors/academia";
import Meetings from "./Mentors/Meetings";
import NavColl from "./Mentors/academia_details";
import NavStat from "./Mentors/dashboard_details";
import Ray from "./Mentors/Ray";
import WorkletsPage from "./Mentors/components/WorkletsPage";
import WorkletDetailPage from './Mentors/components/WorkletDetailsPage';


import StudentDashboard from "./Students/StudentDashboard";
import StudentProfile from "./Students/StudentProfile";
import StudentRegistrationForm from "./Students/StudentRegistrationForm";
import ProfessorDashboard from "./Professors/ProfessorDashboard";
import ProfessorProfile from "./Professors/ProfessorProfile";

import AdminDashboard from "./Admin/AdminDashboard";
import AdminWorklets from "./Admin/AdminWorklets";
import AdminWorkletDetail from "./Admin/AdminWorkletDetail";
import AdminUsers from "./Admin/AdminUsers";
import AdminMentors from "./Admin/AdminMentors";
import UserProfileView from "./Admin/UserProfileView";
import Excellent from "./Admin/Excellent";
import AddCollege from "./Admin/college";
import AllColleges from "./Admin/AllColleges";
import MOUDetails from "./Admin/MOUDetails";



export default function App() {
  // Set default app title
  useDocumentTitle();
  
  return (
    <ThemeProvider>
      <WebSocketProvider>
        <Routes>
          {/* Common Routing Start */}
          <Route path="*" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} /> 
          <Route path="/" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          {/* Common Routing End */}

          {/* Mentor Routing Start */}
          <Route path="/home" element={<ProtectedRoute><MentorRoute><Home /></MentorRoute></ProtectedRoute>} />
          <Route path="/Dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard_details" element={<ProtectedRoute><NavStat /></ProtectedRoute>} />
          <Route path="/academia_details" element={<ProtectedRoute><NavColl /></ProtectedRoute>} />
          <Route path="/ray" element={<ProtectedRoute><Ray /></ProtectedRoute>} />
          <Route path="/worklets" element={<ProtectedRoute><WorkletsPage /></ProtectedRoute>} />
          <Route path="/worklet/:id" element={<ProtectedRoute><WorkletDetailPage /></ProtectedRoute>} />
          <Route path="/meeting" element={<ProtectedRoute><Meetings /></ProtectedRoute>} />
          <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
          <Route path="/academia" element={<ProtectedRoute><Colleges /></ProtectedRoute>} />
          <Route path="/mentor-chat" element={<ProtectedRoute><MentorRoute><RoleBasedChatPage userRole="mentor" /></MentorRoute></ProtectedRoute>} />
          {/* Mentor Routing End */}

          {/* Student Routing Start */}
          <Route path="/student-registration" element={<ProtectedRoute><StudentRoute><StudentRegistrationForm /></StudentRoute></ProtectedRoute>} />
          <Route path="/student-dashboard" element={<ProtectedRoute><StudentRoute><RequireRegistration><StudentDashboard /></RequireRegistration></StudentRoute></ProtectedRoute>} />
          <Route path="/student-chat" element={<ProtectedRoute><StudentRoute><RequireRegistration><RoleBasedChatPage userRole="student" /></RequireRegistration></StudentRoute></ProtectedRoute>} />
          <Route path="/student-profile" element={<ProtectedRoute><StudentRoute><RequireRegistration><StudentProfile /></RequireRegistration></StudentRoute></ProtectedRoute>} />
          {/* Student Routing End */}


        {/*--------------------------------  Professor Routing Start-------------------------------- */}
        <Route path="/professor-dashboard" element={<ProtectedRoute><ProfessorRoute><ProfessorDashboard /></ProfessorRoute></ProtectedRoute>} />
        <Route path="/professor-chat" element={<ProtectedRoute><ProfessorRoute><RoleBasedChatPage userRole="professor" /></ProfessorRoute></ProtectedRoute>} />
        <Route path="/professor-profile" element={<ProtectedRoute><ProfessorRoute><ProfessorProfile /></ProfessorRoute></ProtectedRoute>} />
        {/*--------------------------------  Professor Routing End-------------------------------- */}


        {/*--------------------------------  Admin Routing Start-------------------------------- */}
        <Route path="/admin-dashboard" element={<ProtectedRoute><AdminRoute><AdminDashboard /></AdminRoute></ProtectedRoute>} />
        <Route path="/admin-worklets" element={<ProtectedRoute><AdminRoute><AdminWorklets /></AdminRoute></ProtectedRoute>} />
        <Route path="/admin-worklet/:id" element={<ProtectedRoute><AdminRoute><AdminWorkletDetail /></AdminRoute></ProtectedRoute>} />
        <Route path="/admin-users" element={<ProtectedRoute><AdminRoute><AdminUsers /></AdminRoute></ProtectedRoute>} />
        <Route path="/admin-excellent" element={<ProtectedRoute><AdminRoute><Excellent /></AdminRoute></ProtectedRoute>} />
        <Route path="/admin-mentors" element={<ProtectedRoute><AdminRoute><AdminMentors /></AdminRoute></ProtectedRoute>} />
        <Route path="/admin-add-college" element={<ProtectedRoute><AdminRoute><AddCollege /></AdminRoute></ProtectedRoute>} />
        <Route path="/admin-colleges" element={<ProtectedRoute><AdminRoute><AllColleges /></AdminRoute></ProtectedRoute>} />
        <Route path="/admin-mou-details" element={<ProtectedRoute><AdminRoute><MOUDetails /></AdminRoute></ProtectedRoute>} />
        <Route path="/student-profile/:userId" element={<ProtectedRoute><AdminRoute><UserProfileView /></AdminRoute></ProtectedRoute>} />
        {/*--------------------------------  Admin Routing End-------------------------------- */}


        </Routes>
      </WebSocketProvider>
    </ThemeProvider>
  );
}