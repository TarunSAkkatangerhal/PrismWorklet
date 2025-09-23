// src/Layout.jsx
import { Outlet } from "react-router-dom";

export default function layout() {
  return (
    <div className="animate-gradient min-h-screen">
      {/* You could add a shared Navbar or Header here */}
      <main>
        <Outlet /> {/* Your page components will render here */}
      </main>
    </div>
  );
}