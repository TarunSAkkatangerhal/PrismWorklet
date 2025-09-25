import { useState, useEffect } from "react";
import axios from "axios";

export default function SuggestionModal({ isOpen, onClose }) {
  const [selectedWorklet, setSelectedWorklet] = useState("");
  const [suggestionTitle, setSuggestionTitle] = useState("");
  const [suggestionContent, setSuggestionContent] = useState("");
  const [worklets, setWorklets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchWorklets();
    }
  }, [isOpen]);

  const fetchWorklets = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("access_token");
      if (!token) {
        setError("User information not found. Please log in again.");
        setLoading(false);
        return;
      }

      // Get current user id
      const userResp = await axios.get("http://localhost:8000/auth/profile", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      const userId = userResp?.data?.id;
      if (!userId) {
        setError("Unable to determine user ID. Please re-login.");
        setLoading(false);
        return;
      }

      // Fetch mentor's ongoing worklets via associations
      const response = await axios.get(
        `http://localhost:8000/api/associations/mentor/${userId}/ongoing-worklets`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );

      const data = response?.data?.ongoing_worklets || [];
      setWorklets(Array.isArray(data) ? data : []);
      if ((data || []).length === 0) setError("No worklets found for this mentor");
    } catch (error) {
      console.error("Error fetching worklets:", error);
      setError("Failed to load worklets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedWorklet) {
      setShowWarningPopup(true);
      setTimeout(() => setShowWarningPopup(false), 2500);
      return;
    }

    if (!suggestionTitle.trim() || !suggestionContent.trim()) {
      setShowWarningPopup(true);
      setTimeout(() => setShowWarningPopup(false), 2500);
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("access_token");

      const suggestionData = {
        worklet_identifier: selectedWorklet,  // Now using cert_id string instead of integer
        suggestion_title: suggestionTitle.trim(),
        suggestion_content: suggestionContent.trim()
      };

      const response = await axios.post(
        "http://localhost:8000/worklets/submit-suggestion-flexible",
        suggestionData,
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("Suggestion submitted successfully:", response.data);
      
      // Reset form
      setSelectedWorklet("");
      setSuggestionTitle("");
      setSuggestionContent("");
      
      // Show success popup
      setShowSuccessPopup(true);
      setTimeout(() => {
        setShowSuccessPopup(false);
        onClose();
      }, 3000);

    } catch (error) {
      console.error("Error submitting suggestion:", error);
      setShowErrorPopup(true);
      setTimeout(() => setShowErrorPopup(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedWorklet("");
    setSuggestionTitle("");
    setSuggestionContent("");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={handleClose}></div>
      
      <div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 relative z-10 dark:bg-slate-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              � Share Suggestion
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Share valuable suggestions with all students in the selected worklet
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading && !worklets.length ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-300">Loading worklets...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-600 dark:text-red-400 mb-4">⚠️ {error}</div>
            <button
              onClick={fetchWorklets}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Worklet Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Worklet *
              </label>
              <select
                value={selectedWorklet}
                onChange={(e) => setSelectedWorklet(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Choose a worklet...</option>
                {worklets.map((worklet) => (
                  <option key={worklet.id} value={worklet.cert_id}>
                    {worklet.cert_id} - {worklet.description || worklet.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Suggestion Title *
              </label>
              <input
                type="text"
                value={suggestionTitle}
                onChange={(e) => setSuggestionTitle(e.target.value)}
                placeholder="Brief title for your suggestion..."
                maxLength={100}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {suggestionTitle.length}/100 characters
              </div>
            </div>

            {/* Feedback Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Suggestion Details *
              </label>
              <textarea
                value={suggestionContent}
                onChange={(e) => setSuggestionContent(e.target.value)}
                placeholder="Enter your detailed suggestion here..."
                rows={6}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
              />
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {suggestionContent.length} characters
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={handleClose}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-cyan-600 text-white px-6 py-2 rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                {loading ? "Sharing..." : "Share Suggestion"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Beautiful Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-[100]">
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
          <div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 relative z-10 dark:bg-slate-800 max-w-md w-full transform animate-bounce">
            {/* Success Icon */}
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center dark:bg-cyan-900">
                <svg 
                  className="w-8 h-8 text-cyan-600 dark:text-cyan-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              </div>
            </div>
            
            {/* Success Message */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                💡 Suggestion Shared!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Your suggestion has been shared successfully!
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                All students in the worklet will receive an email notification.
              </p>
            </div>
            
            {/* Progress bar animation */}
            <div className="mt-6">
              <div className="w-full bg-gray-200 rounded-full h-1 dark:bg-gray-700">
                <div 
                  className="bg-cyan-600 h-1 rounded-full animate-pulse"
                  style={{
                    width: '100%',
                    animation: 'progress 3s linear forwards'
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Beautiful Warning Popup */}
      {showWarningPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-[100]">
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
          <div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 relative z-10 dark:bg-slate-800 max-w-md w-full transform animate-pulse">
            {/* Warning Icon */}
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center dark:bg-yellow-900">
                <svg 
                  className="w-8 h-8 text-yellow-600 dark:text-yellow-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                  />
                </svg>
              </div>
            </div>
            
            {/* Warning Message */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                ⚠️ Missing Information
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Please fill in all required fields.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Worklet, title, and suggestion content are required.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Beautiful Error Popup */}
      {showErrorPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-[100]">
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
          <div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 relative z-10 dark:bg-slate-800 max-w-md w-full transform animate-pulse">
            {/* Error Icon */}
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center dark:bg-red-900">
                <svg 
                  className="w-8 h-8 text-red-600 dark:text-red-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              </div>
            </div>
            
            {/* Error Message */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                ❌ Submission Failed
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Failed to share suggestion. Please try again.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Check your connection and try again.
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}