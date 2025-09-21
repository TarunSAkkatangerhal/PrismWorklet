import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import Dashboard from "./pages/Dashboard";
import RequestUpdate from "./layouts/Requestupdates";
import Ray from "./layouts/Ray";
import WorkletsPage from "./components/WorkletsPage";
import WorkletDetailPage from './components/WorkletDetailsPage';
import Login from "./components/login";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <ThemeProvider>
      {/* No <Router> here! */}
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/request-update"
          element={
            <ProtectedRoute>
              <RequestUpdate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ray"
          element={
            <ProtectedRoute>
              <Ray />
            </ProtectedRoute>
          }
        />
        <Route
          path="/share-suggestion"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/internship-referral"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/submit-feedback"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/worklets"
          element={
            <ProtectedRoute>
              <WorkletsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/worklet/:id"
          element={
            <ProtectedRoute>
              <WorkletDetailPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </ThemeProvider>
  );
}
