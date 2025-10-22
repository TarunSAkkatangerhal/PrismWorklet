import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import RequestUpdate from "../layouts/Requestupdates";
import SuggestionModal from "../layouts/SuggestionModal";
import InternReferralForm from "../layouts/Intern";
import FeedbackForm from "./FeedbackForm";
import EvaluateModal from "../components/EvaluateModal";
import ProvideUpdateModal from "../components/ProvideUpdateModal";
import MeetingUpdatesModal from "../components/MeetingUpdatesModal";
import TestimonialModal from "../components/TestimonialModal";

import {
  RefreshCcw, Lightbulb, Briefcase, MessageSquare, ClipboardCheck, PlusCircle, Bot, Calendar, Star
} from "lucide-react";

const RightSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isRequestUpdateOpen, setIsRequestUpdateOpen] = useState(false);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  const [isInternModalOpen, setIsInternModalOpen] = useState(false);
  const [isFeedbackFormOpen, setIsFeedbackFormOpen] = useState(false);
  const [isEvaluateModalOpen, setISEvaluateModalOpen] = useState(false);
  
  // Student modal states
  const [isProvideUpdateOpen, setIsProvideUpdateOpen] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  
  // Get user data from validated JWT token
  const [userData, setUserData] = useState(null);

  // Get user data on component mount
  useEffect(() => {
    const getCurrentUserFromToken = () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return null;
        
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const decoded = JSON.parse(jsonPayload);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp < currentTime) {
            return null;
        }
        
        return decoded;
      } catch (error) {
        return null;
      }
    };
    
    setUserData(getCurrentUserFromToken());
  }, []);

  const handleNavigation = (path) => {
    if (path === "/request-update") {
      setIsRequestUpdateOpen(true);
    } else if (path === "/share-suggestion") {
      setIsSuggestionModalOpen(true);
    } else if (path === "/internship-referral") {
      setIsInternModalOpen(true);
    } else if (path === "/submit-feedback") {
      setIsFeedbackFormOpen(true);
    }else if (path === "/evaluate") {
      setISEvaluateModalOpen(true);
    } 
    else {
      try {
        navigate(path);
      } catch (error) {
        console.error("Navigation error:", error);
      }
    }
  };

  return (
    <aside className="w-[clamp(12rem,18vw,16rem)] bg-gradient-to-t from-purple-300 via-indigo-50 to-blue-100 dark:from-slate-800 dark:via-slate-900 dark:to-black shadow-lg px-[clamp(0.75rem,1.5vw,1.25rem)] py-[clamp(1rem,2vh,1.5rem)] flex flex-col justify-between overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div>
        {/* Role-based content - Using validated token data */}
        {userData && userData.role && userData.role.toLowerCase() === 'student' ? (
          // Student-specific content
          <>
            <h2 className="text-[clamp(1.25rem,2vw,1.5rem)] font-bold mb-[2vh] text-blue-900 dark:text-white">Activities</h2>
            <div className="space-y-[1.5vh]">
              <ActivityButton
                icon={<RefreshCcw className="w-[clamp(1rem,1.5vw,1.25rem)] h-[clamp(1rem,1.5vw,1.25rem)] text-blue-600" />}
                label={<span className="text-[clamp(0.875rem,1.2vw,1rem)] font-semibold">Provide Update</span>}
                onClick={() => setIsProvideUpdateOpen(true)}
              />
              <ActivityButton
                icon={<Calendar className="w-[clamp(1rem,1.5vw,1.25rem)] h-[clamp(1rem,1.5vw,1.25rem)] text-green-600" />}
                label={<span className="text-[clamp(0.875rem,1.2vw,1rem)] font-semibold">Meeting Updates</span>}
                onClick={() => setIsMeetingModalOpen(true)}
              />
              <ActivityButton
                icon={<MessageSquare className="w-[clamp(1rem,1.5vw,1.25rem)] h-[clamp(1rem,1.5vw,1.25rem)] text-indigo-600" />}
                label={<span className="text-[clamp(0.875rem,1.2vw,1rem)] font-semibold">Submit Feedback</span>}
                onClick={() => setIsFeedbackFormOpen(true)}
              />
              <ActivityButton
                icon={<Star className="w-[clamp(1rem,1.5vw,1.25rem)] h-[clamp(1rem,1.5vw,1.25rem)] text-yellow-600" />}
                label={<span className="text-[clamp(0.875rem,1.2vw,1rem)] font-semibold">Testimonials</span>}
                onClick={() => setIsTestimonialModalOpen(true)}
              />
            </div>
          </>
        ) : (
          // Mentor-specific content (original)
          <>
            <button
              className="w-full bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold rounded-xl py-[clamp(0.5rem,1vh,0.75rem)] mb-[1vh] flex items-center justify-center gap-[clamp(0.5rem,1vw,0.75rem)] text-[clamp(1rem,1.5vw,1.25rem)] dark:bg-blue-900/50 dark:hover:bg-blue-800/60 dark:text-blue-200"
              onClick={() => handleNavigation("/new-worklet")}
            >
              <PlusCircle className="w-[clamp(1rem,1.5vw,1.25rem)] h-[clamp(1rem,1.5vw,1.25rem)]" /> <span className="text-[clamp(1.25rem,2vw,1.5rem)]">New Worklet</span>
            </button>
            <h2 className="text-[clamp(1.25rem,2vw,1.5rem)] font-bold mb-[2vh] text-blue-900 dark:text-white">Activities</h2>
            <div className="space-y-[1.5vh]">
              <ActivityButton
                icon={<RefreshCcw className="w-[clamp(1rem,1.5vw,1.25rem)] h-[clamp(1rem,1.5vw,1.25rem)] text-blue-600" />}
                label={<span className="text-[clamp(0.875rem,1.2vw,1rem)] font-semibold">Request Update</span>}
                onClick={() => handleNavigation("/request-update")}
              />
              <ActivityButton
                icon={<Lightbulb className="w-[clamp(1rem,1.5vw,1.25rem)] h-[clamp(1rem,1.5vw,1.25rem)] text-sky-500" />}
                label={<span className="text-[clamp(0.875rem,1.2vw,1rem)] font-semibold">Share Suggestion</span>}
                onClick={() => handleNavigation("/share-suggestion")}
              />
              <ActivityButton
                icon={<MessageSquare className="w-[clamp(1rem,1.5vw,1.25rem)] h-[clamp(1rem,1.5vw,1.25rem)] text-indigo-600" />}
                label={<span className="text-[clamp(0.875rem,1.2vw,1rem)] font-semibold">Submit Feedback</span>}
                onClick={() => setIsFeedbackFormOpen(true)}
              />
              <ActivityButton
                icon={<Briefcase className="w-[clamp(1rem,1.5vw,1.25rem)] h-[clamp(1rem,1.5vw,1.25rem)] text-purple-600" />}
                label={<span className="text-[clamp(0.875rem,1.2vw,1rem)] font-semibold">Internship Referral</span>}
                onClick={() => handleNavigation("/internship-referral")}
              />
              <ActivityButton
                icon={<ClipboardCheck className="w-[clamp(1rem,1.5vw,1.25rem)] h-[clamp(1rem,1.5vw,1.25rem)] text-green-600" />}
                label={<span className="text-[clamp(0.875rem,1.2vw,1rem)] font-semibold">Evaluate</span>}
                onClick={() => handleNavigation("/evaluate")}
              />
            </div>
          </>
        )}
      </div>
      {/* Only show RAY button if not on the ray page */}
      {location.pathname !== '/ray' && (
        <div className="text-center">
          <button
            onClick={() => handleNavigation("/ray")}
            className="group relative mx-auto w-[clamp(3rem,4vw,3.5rem)] h-[clamp(3rem,4vw,3.5rem)] rounded-2xl bg-gradient-to-br from-purple-400 to-blue-400 
                               hover:from-purple-500 hover:to-blue-500 flex items-center justify-center 
                               text-[clamp(0.875rem,1.2vw,1rem)] font-bold text-white shadow transition-all duration-200 
                               hover:shadow-lg transform hover:scale-105 cursor-pointer overflow-hidden"
            aria-label="RAY Support Bot"
          >
            <span className="absolute transition-opacity duration-200 opacity-100 group-hover:opacity-0">
              <Bot className="w-[clamp(1.5rem,2vw,2rem)] h-[clamp(1.5rem,2vw,2rem)]" />
            </span>
            <span className="absolute transition-opacity duration-500 opacity-0 group-hover:opacity-100">
              RAY
            </span>
          </button>
          <p className="text-[clamp(0.75rem,1vw,0.875rem)] text-gray-600 mt-[0.25vh] dark:text-slate-400">Support</p>
        </div>
      )}

      {/* Modals */}
      <RequestUpdate
        isOpen={isRequestUpdateOpen}
        onClose={() => setIsRequestUpdateOpen(false)}
      />
      <SuggestionModal
        isOpen={isSuggestionModalOpen}
        onClose={() => setIsSuggestionModalOpen(false)}
      />
      <FeedbackForm
        isOpen={isFeedbackFormOpen}
        onClose={() => setIsFeedbackFormOpen(false)}
      />
      {isInternModalOpen && (
        <div className="fixed inset-0 flex items-start justify-center bg-black bg-opacity-40 z-50 p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white rounded-xl mt-10 mb-10 dark:bg-slate-900">
            <div className=" top-0 right-0 flex justify-end bg-white rounded-t-xl p-2 dark:bg-slate-900">
              <button
                onClick={() => setIsInternModalOpen(false)}
                className="text-3xl  hover:text-purple-900 font-bold z-10 w-10 h-10 flex items-center justify-center rounded-full hover:bg-purple-100 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <InternReferralForm />
            </div>
          </div>
        </div>
      )}
      
      <EvaluateModal
        isOpen={isEvaluateModalOpen}
        onClose={() => setISEvaluateModalOpen(false)}
      />

      {/* Student Modals */}
      <ProvideUpdateModal
        isOpen={isProvideUpdateOpen}
        onClose={() => setIsProvideUpdateOpen(false)}
        worklet={null}
      />

      <MeetingUpdatesModal
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
        worklet={null}
      />

      <TestimonialModal
        isOpen={isTestimonialModalOpen}
        onClose={() => setIsTestimonialModalOpen(false)}
        worklet={null}
      />
    </aside>
  );
};

export default RightSidebar;

function ActivityButton({ icon, label, primary, onClick }) {
  return (
    <button
      className={`w-full flex items-center gap-[clamp(0.5rem,1vw,0.75rem)] px-[clamp(0.75rem,1.5vw,1rem)] py-[clamp(0.5rem,1vh,0.75rem)] rounded-xl text-[clamp(0.75rem,1vw,0.875rem)] font-medium shadow-sm transition-all duration-200 transform hover:scale-105 hover:shadow-md ${
        primary
          ? "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
          : "bg-white hover:bg-purple-100 text-gray-700 border border-gray-200 hover:border-purple-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 dark:hover:border-slate-600"
      }`}
      onClick={onClick}
    >
      {icon}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}