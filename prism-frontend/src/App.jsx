import { Routes, Route} from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { useDocumentTitle } from "./hooks/useDocumentTitle";
import { MentorRoute, StudentRoute, ProtectedRoute } from "./components/RoleBasedRoute";
import RoleRedirect from "./components/RoleRedirect";
import Login from "./Shared Components/login";
import ForgotPassword from "./Shared Components/ForgotPassword";
import StudentChatPage from "./Students/StudentChatPage";
import MentorChatPage from "./Mentors/MentorChatPage";
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



export default function App() {
  // Set default app title
  useDocumentTitle();
  
  return (
    <ThemeProvider>
      <Routes>

        {/*--------------------------------  Common Routing Start-------------------------------- */}
        <Route path="*" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} /> 
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/*--------------------------------  Common Routing End-------------------------------- */}
        

        {/*--------------------------------  Mentor Routing Start-------------------------------- */}
        <Route path="/home" element={<ProtectedRoute><MentorRoute><Home /></MentorRoute></ProtectedRoute>} />
        <Route path="/Dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard_details" element={<ProtectedRoute><NavStat /></ProtectedRoute>} />
        <Route path="/academia_details" element={<ProtectedRoute><NavColl /></ProtectedRoute>} />
        <Route path="/ray" element={<ProtectedRoute><Ray /></ProtectedRoute>} />
        <Route path="/worklets" element={<ProtectedRoute><WorkletsPage /></ProtectedRoute>} />
        <Route path="/worklet/:id" element={<ProtectedRoute><WorkletDetailPage /></ProtectedRoute>} />
        <Route path="/meeting" element={<ProtectedRoute><Meetings /></ProtectedRoute>} />
        <Route path="/portfolio" element={<ProtectedRoute><Portfolio/></ProtectedRoute>}/>
        <Route path="/academia" element={<ProtectedRoute><Colleges /></ProtectedRoute>} />
        <Route path="/mentor-chat" element={<ProtectedRoute><MentorRoute><MentorChatPage /></MentorRoute></ProtectedRoute>} />
        {/*-------------------------------- Mentor Routing End-------------------------------- */}



        {/* -------------------------------- Student Routing Start -------------------------------- */}
          <Route path="/student-dashboard" element={<ProtectedRoute><StudentRoute><StudentDashboard /></StudentRoute></ProtectedRoute>} />
          <Route path="/student-chat" element={<ProtectedRoute><StudentRoute><StudentChatPage /></StudentRoute></ProtectedRoute>} />
        {/* -------------------------------- Student Routing End -------------------------------- */}


        {/*--------------------------------  Professor Routing Start-------------------------------- */}


        {/*--------------------------------  Professor Routing End-------------------------------- */}






      </Routes>
    </ThemeProvider>
  );
}