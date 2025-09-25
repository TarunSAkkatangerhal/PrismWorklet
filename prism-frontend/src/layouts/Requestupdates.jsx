import { useState, useEffect } from "react";
import axios from "axios";

export default function RequestUpdate({ isOpen, onClose }) {
  const [selectedWorklet, setSelectedWorklet] = useState("");
  const [worklets, setWorklets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showWarningPopup, setShowWarningPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);

  useEffect(() => {
    const fetchWorklets = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("access_token");
        const userEmail = localStorage.getItem("user_email");

        if (!token) {
          console.error("Missing user email or token");
          setError("User information not found. Please log in again.");
          setLoading(false);
          return;
        }

        // Get current user's ID via profile endpoint
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

        // Use association-based endpoint for mentor's ongoing worklets
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
        if ((data || []).length === 0) {
          setError("No worklets found for this mentor");
        }
      } catch (err) {
        console.error("Detailed error:", {
          message: err.message,
          response: err.response,
          status: err.response?.status,
          data: err.response?.data
        });
        setError(err.response?.data?.detail || "Failed to load worklets. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchWorklets();
    }
  }, [isOpen]);

  const handleRequestUpdate = async () => {
    if (!selectedWorklet) {
      setShowWarningPopup(true);
      setTimeout(() => setShowWarningPopup(false), 2000);
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      await axios.post(
        `http://localhost:8000/worklets/${selectedWorklet}/request-update`,
        {
          message: "Requesting update on worklet progress",
          priority: "medium"
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setShowSuccessPopup(true);
      setTimeout(() => {
        setShowSuccessPopup(false);
        onClose();
      }, 2500);
    } catch (err) {
      console.error("Error requesting update:", err);
      setShowErrorPopup(true);
      setTimeout(() => setShowErrorPopup(false), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white p-6 rounded-2xl shadow-lg w-96 relative z-10 dark:bg-slate-800">
        <button
          className="absolute top-2 right-2 text-3xl text-purple-700 hover:text-purple-900 font-bold z-10 w-10 h-10 flex items-center justify-center rounded-full hover:bg-purple-100 transition-colors dark:text-purple-300 dark:hover:text-purple-200 dark:hover:bg-slate-700"
          onClick={onClose}
        >
          ×
        </button>

        <h2 className="text-lg font-semibold mb-4 dark:text-white">Select Worklet</h2>

        {loading ? (
          <div className="text-center py-4 dark:text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            Loading worklets...
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-4">
            <div className="font-bold mb-2">Error:</div>
            <div>{error}</div>
            <button 
              onClick={() => {
                setError(null);
                setLoading(true);
                const token = localStorage.getItem("access_token");
                axios.get("http://localhost:8000/auth/profile", {
                  headers: { Authorization: `Bearer ${token}` }
                }).then(userResp => {
                  const userId = userResp?.data?.id;
                  if (!userId) throw new Error("User ID not found");
                  return axios.get(`http://localhost:8000/api/associations/mentor/${userId}/ongoing-worklets`, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                }).then(response => {
                  const data = response?.data?.ongoing_worklets || [];
                  setWorklets(Array.isArray(data) ? data : []);
                  setLoading(false);
                }).catch(err => {
                  console.error("Retry error:", err);
                  setError(err.response?.data?.detail || "Failed to load worklets");
                  setLoading(false);
                });
              }}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <select
              className="w-full border rounded-lg p-2 mb-4 dark:bg-slate-700 dark:text-white dark:border-slate-600"
              value={selectedWorklet}
              onChange={(e) => setSelectedWorklet(e.target.value)}
            >
              <option value="">-- Select a Worklet --</option>
              {worklets.length > 0 ? (
                worklets.map((worklet) => (
                  <option key={worklet.id} value={worklet.cert_id}>
                    {worklet.cert_id} - {worklet.description?.substring(0, 50) || ''}
                  </option>
                ))
              ) : (
                <option value="" disabled>No worklets available</option>
              )}
            </select>

            <button
              className="w-full bg-blue-500 text-white py-2 rounded-lg shadow hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleRequestUpdate}
              disabled={!selectedWorklet || loading}
            >
              {loading ? "Sending..." : "Request Update"}
            </button>
          </>
        )}
      </div>

      {/* Beautiful Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-[100]">
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
          <div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 relative z-10 dark:bg-slate-800 max-w-md w-full transform animate-bounce">
            {/* Success Icon */}
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center dark:bg-green-900">
                <svg 
                  className="w-8 h-8 text-green-600 dark:text-green-400" 
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
                🎉 Success!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Update request sent successfully!
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Students will be notified via email.
              </p>
            </div>
            
            {/* Progress bar animation */}
            <div className="mt-6">
              <div className="w-full bg-gray-200 rounded-full h-1 dark:bg-gray-700">
                <div 
                  className="bg-green-600 h-1 rounded-full animate-pulse"
                  style={{
                    width: '100%',
                    animation: 'progress 2.5s linear forwards'
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
                ⚠️ Hold On!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Please select a worklet first
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choose a worklet from the dropdown menu above.
              </p>
            </div>
            
            {/* Progress bar animation */}
            <div className="mt-6">
              <div className="w-full bg-gray-200 rounded-full h-1 dark:bg-gray-700">
                <div 
                  className="bg-yellow-600 h-1 rounded-full"
                  style={{
                    width: '100%',
                    animation: 'progress 2s linear forwards'
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Beautiful Error Popup */}
      {showErrorPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-[100]">
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"></div>
          <div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 relative z-10 dark:bg-slate-800 max-w-md w-full transform animate-shake">
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
                ❌ Oops!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Failed to send update request
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Please try again in a moment.
              </p>
            </div>
            
            {/* Progress bar animation */}
            <div className="mt-6">
              <div className="w-full bg-gray-200 rounded-full h-1 dark:bg-gray-700">
                <div 
                  className="bg-red-600 h-1 rounded-full"
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

      {/* CSS Animation for progress bar */}
      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        .animate-bounce {
          animation: bounce 0.6s ease-in-out;
        }
        
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0, 0, 0);
          }
          40%, 43% {
            transform: translate3d(0, -10px, 0);
          }
          70% {
            transform: translate3d(0, -5px, 0);
          }
          90% {
            transform: translate3d(0, -2px, 0);
          }
        }
      `}</style>
    </div>
  );
}