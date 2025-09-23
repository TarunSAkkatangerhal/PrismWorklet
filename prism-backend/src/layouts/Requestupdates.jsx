import { useState } from "react";

export default function RequestUpdate({ isOpen, onClose }) {
  const [selectedWorklet, setSelectedWorklet] = useState("");
  const workletIds = ["25TST04VIT", "25TST05SRM", "25TST", "11BMS"];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white p-6 rounded-2xl shadow-lg w-96 relative z-10">
        {/* Close Button */}
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-black"
          onClick={onClose}
        >
          ✖
        </button>

        <h2 className="text-lg font-semibold mb-4">Select Worklet ID</h2>

        {/* Dropdown */}
        <select
          className="w-full border rounded-lg p-2 mb-4"
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
          className="w-full bg-blue-500 text-white py-2 rounded-lg shadow hover:bg-blue-600"
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
