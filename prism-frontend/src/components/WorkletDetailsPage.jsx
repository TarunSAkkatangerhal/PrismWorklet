import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";

// --- Import your actual components from their files ---
import RequestUpdate from "../layouts/Requestupdates";
import SuggestionModal from "../layouts/SuggestionModal";
import InternReferralForm from "../layouts/Intern";
import FeedBack from "../layouts/FeedBack";
import RightSidebar from  "../components/Right";
import LeftSidebar from "../components/Left";

// --- Import all required icons from lucide-react ---
import {
  Calendar,
  Users,
  ArrowLeft,
  PlusCircle,
  RefreshCcw,
  Lightbulb,
  Briefcase,
  MessageSquare,
  Bot, X, ClipboardCheck
} from "lucide-react";

// --- Reusable Sidebar Button Component ---
const ActivityButton = ({ icon, label, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-2.5 my-1 text-left rounded-lg text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-200"
    >
      <div className="flex-shrink-0">{icon}</div>
      <div className="flex-grow">{label}</div>
    </button>
  );
};

export default function WorkletDetailPage() {
  // --- HOOKS ---
  const { id } = useParams();
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [worklet, setWorklet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRequestUpdateOpen, setIsRequestUpdateOpen] = useState(false);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isInternModalOpen, setIsInternModalOpen] = useState(false);

  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchWorklet = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("access_token");
        
        if (!token) {
          throw new Error("Authentication token not found");
        }

        const response = await axios.get(
          `http://localhost:8000/worklets/${id}`,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          }
        );
        
        if (response.data) {
          // Transform backend data to match expected format
          const imageUrls = [
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?q=80&w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=400&auto=format&fit=crop"
          ];
          
          const transformedWorklet = {
            id: response.data.id,
            title: response.data.cert_id,
            status: response.data.status || "Ongoing",
            progress: response.data.percentage_completion || 0,
            description: response.data.description || "No description available",
            imageUrl: imageUrls[0], // Use first image as default
            startDate: response.data.start_date ? new Date(response.data.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A",
            endDate: response.data.end_date ? new Date(response.data.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A",
            students: [], // Will be fetched separately if needed
            college: response.data.college,
            team: response.data.team,
            problem_statement: response.data.problem_statement,
            expectations: response.data.expectations,
            prerequisites: response.data.prerequisites
          };
          
          setWorklet(transformedWorklet);
        }
      } catch (error) {
        console.error("Error fetching worklet:", error);
        setError("Failed to load worklet details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchWorklet();
    }
  }, [id]);

  // --- EVENT HANDLERS ---
  const handleNavigation = (path) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-gray-900">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Loading worklet details...</h2>
      </div>
    );
  }

  if (error || !worklet) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-gray-900">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          {error || "Worklet Not Found"}
        </h2>
        <Link to="/home" className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">
          Go Back Home
        </Link>
      </div>
    );
  }

  // --- RENDER ---
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gray-900">
      <LeftSidebar />
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          {/* Back Button */}
          <div className="p-4">
            <Link to="/worklets" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold">
              <ArrowLeft size={20} />
              Back to All Worklets
            </Link>
          </div>

          <img src={worklet.imageUrl} alt={worklet.title} className="w-full h-64 object-cover" />

          <div className="p-6 md:p-8">
            <span className="text-sm font-semibold text-indigo-600 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-500/20 px-3 py-1 rounded-full">{worklet.status}</span>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mt-3">{worklet.title}</h1>
            <p className="text-md text-gray-600 dark:text-gray-400 mt-2">{worklet.description}</p>
            <div className="mt-6 flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Calendar size={18} />
              <span>{worklet.startDate} to {worklet.endDate}</span>
            </div>
            <div className="mt-6">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{worklet.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${worklet.progress}%` }}></div>
              </div>
            </div>
            <div className="mt-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-800 dark:text-gray-200">
                <Users size={22} />
                Assigned Students
              </h2>
              <ul className="mt-3 list-disc list-inside bg-slate-100 dark:bg-gray-900/50 p-4 rounded-lg space-y-2">
                {worklet.students.map((student) => (
                  <li key={student} className="text-gray-700 dark:text-gray-300">{student}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <RightSidebar />
      {/* --- Modals --- */}
      <RequestUpdate
        isOpen={isRequestUpdateOpen}
        onClose={() => setIsRequestUpdateOpen(false)}
        workletId={worklet.id}
      />
      <SuggestionModal
        isOpen={isSuggestionModalOpen}
        onClose={() => setIsSuggestionModalOpen(false)}
        workletId={worklet.id}
      />
      {isFeedbackOpen && (
        <FeedBack 
          onClose={() => setIsFeedbackOpen(false)} 
          workletId={worklet.id}
        />
      )}

      {isInternModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 dark:bg-opacity-80 z-50 p-4">
          <div className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-end p-2 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <button
                onClick={() => setIsInternModalOpen(false)}
                className="text-gray-500 hover:text-purple-700 dark:text-gray-400 dark:hover:text-white font-bold w-10 h-10 flex items-center justify-center rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
              >
                &times;
              </button>
            </div>
            <div className="p-6 pt-0 overflow-y-auto">
              <InternReferralForm workletId={worklet.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}