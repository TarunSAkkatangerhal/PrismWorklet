import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import layout from "./layout";
import RequestUpdate from "./layouts/Requestupdates";
import Ray from "./layouts/Ray";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/request-update" element={<RequestUpdate />} />
      <Route path="/ray" element={<Ray />} />
    </Routes>
  );
}
