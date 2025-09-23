import React, { useState, useEffect } from "react";
import axios from "axios";
import { STATUS_OPTIONS, statusIcons } from "../components/data";

const Feedback = ({ onClose }) => {
  const [workletId, setWorkletId] = useState("");
  const [month, setMonth] = useState("2");
  const [feedback, setFeedback] = useState("");
  const [connectType, setConnectType] = useState("");
  const [worklets, setWorklets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch worklets from backend
  useEffect(() => {
    const fetchWorklets = async () => {
      try {
        setLoading(true);
        const userEmail = localStorage.getItem("user_email");
        const token = localStorage.getItem("access_token");
        
        if (!userEmail || !token) {
          throw new Error("User information not found");
        }

        const response = await axios.get(
          `http://localhost:8000/worklets/mentor/${encodeURIComponent(userEmail)}/worklets`,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          }
        );
        
        const ongoingWorklets = (response.data || []).filter(worklet => 
          worklet.status === 'Ongoing'
        );
        
        setWorklets(ongoingWorklets);
        
        // Set first worklet as default if available
        if (ongoingWorklets.length > 0) {
          setWorkletId(ongoingWorklets[0].id.toString());
        }
      } catch (error) {
        console.error("Error fetching worklets:", error);
        setWorklets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWorklets();
  }, []);

  const handleSubmit = () => {
    const data = {
      workletId,
      month,
      feedback,
      connectType,
    };
    console.log("Feedback Submitted:", data);
    onClose(); // close popup after submission
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      {/* ++ Dark theme styles added to modal container ++ */}
      <div className="bg-white rounded-2xl shadow-lg w-[400px] p-5 relative dark:bg-slate-800">
        <button
          onClick={onClose}
          // ++ Dark theme styles added to close button ++
          className="absolute top-2 right-2 text-3xl text-purple-700 hover:text-purple-900 font-bold z-10 w-10 h-10 flex items-center justify-center rounded-full hover:bg-purple-100 transition-colors dark:text-purple-300 dark:hover:text-purple-200 dark:hover:bg-slate-700"
        >
          ×
        </button>

        {/* Title */}
        {/* ++ Dark theme styles added to title ++ */}
        <h2 className="text-lg font-semibold mb-4 text-center dark:text-white">
          Submit Feedback
        </h2>

        {/* Worklet ID */}
        <div className="mb-3">
          {/* ++ Dark theme styles added to label ++ */}
          <label className="text-sm font-medium dark:text-slate-300">Select Worklet ID</label>
          <select
          // ++ Dark theme styles added to dropdown ++
          className="w-full border rounded-lg p-2 mb-4 dark:bg-slate-700 dark:text-white dark:border-slate-600"
          value={workletId}
          onChange={(e) => setWorkletId(e.target.value)}
          disabled={loading}
        >
          <option value="">-- Select --</option>
          {worklets.map((worklet) => (
            <option key={worklet.id} value={worklet.id}>
              {worklet.cert_id}
            </option>
          ))}
        </select>
        </div>

        {/* Month */}
        <div className="mb-3">
          <label className="text-sm font-medium dark:text-slate-300">Select Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:focus:ring-blue-500"
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
          </select>
        </div>

        {/* Feedback */}
        <div className="mb-3">
          <textarea
            placeholder="Type your Meeting Feedback here"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:placeholder-slate-400 dark:focus:ring-blue-500"
          />
        </div>

        {/* Connect Type */}
        <div className="flex items-center gap-4 mb-4 dark:text-slate-300">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="connect"
              value="monthly"
              checked={connectType === "monthly"}
              onChange={() => setConnectType("monthly")}
            />
            <span>Monthly Connect</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="connect"
              value="biweekly"
              checked={connectType === "biweekly"}
              onChange={() => setConnectType("biweekly")}
            />
            <span>Bi-weekly Connect</span>
          </label>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          // ++ Dark theme styles added to submit button ++
          className="w-full bg-blue-700 text-white rounded-lg py-2 hover:bg-blue-800 transition dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          Send Feedback
        </button>
      </div>
    </div>
  );
};

export default Feedback;