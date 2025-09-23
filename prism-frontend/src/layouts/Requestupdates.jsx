import { useState } from "react";

export default function RequestUpdate({ isOpen, onClose }) {
  const [selectedWorklet, setSelectedWorklet] = useState("");
  const workletIds = ["25TST04VIT", "25TST05SRM", "25TST", "11BMS"];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}></div>
      {/* ++ Dark theme styles added to modal container ++ */}
      <div className="bg-white p-6 rounded-2xl shadow-lg w-96 relative z-10 dark:bg-slate-800">
        {/* Close Button */}
        <button
          // ++ Dark theme styles added to close button ++
          className="absolute top-2 right-2 text-3xl text-purple-700 hover:text-purple-900 font-bold z-10 w-10 h-10 flex items-center justify-center rounded-full hover:bg-purple-100 transition-colors dark:text-purple-300 dark:hover:text-purple-200 dark:hover:bg-slate-700"
          onClick={onClose}
        >
          ×
        </button>

        {/* ++ Dark theme styles added to heading ++ */}
        <h2 className="text-lg font-semibold mb-4 dark:text-white">Select Worklet ID</h2>

        {/* Dropdown */}
        <select
          // ++ Dark theme styles added to dropdown ++
          className="w-full border rounded-lg p-2 mb-4 dark:bg-slate-700 dark:text-white dark:border-slate-600"
          value={selectedWorklet}
          onChange={(e) => setSelectedWorklet(e.target.value)}
        >
          <option value="">-- Select --</option>
          {workletIds.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>

        <button
          // ++ Dark theme styles added to main button ++
          className="w-full bg-blue-500 text-white py-2 rounded-lg shadow hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
          onClick={() => {
            alert(`Requested update for ${selectedWorklet}`);
            onClose();
          }}
        >
          Request Update
        </button>
      </div>
    </div>
  );
}