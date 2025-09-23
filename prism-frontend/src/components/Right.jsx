import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import RequestUpdate from "../layouts/Requestupdates";
import SuggestionModal from "../layouts/SuggestionModal";
import InternReferralForm from "../layouts/Intern";
import FeedbackForm from "./FeedbackForm";
import EvaluateModal from "../components/EvaluateModal";
import ActivityButton from "./ActivityButton";
import {
  RefreshCcw, Lightbulb, Briefcase, MessageSquare, ClipboardCheck, PlusCircle, Bot
} from "lucide-react";

const RightSidebar = () => {
  const navigate = useNavigate();
  const [isRequestUpdateOpen, setIsRequestUpdateOpen] = useState(false);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  const [isInternModalOpen, setIsInternModalOpen] = useState(false);
  const [isFeedbackFormOpen, setIsFeedbackFormOpen] = useState(false);
  const [isEvaluateModalOpen, setISEvaluateModalOpen] = useState(false);

  const handleNavigation = (path) => {
    if (path === "/request-update") {
      setIsRequestUpdateOpen(true);
    } else if (path === "/share-suggestion") {
      setIsSuggestionModalOpen(true);
    } else if (path === "/internship-referral") {
      setIsInternModalOpen(true);
    } else if (path === "/evaluate") {
      setISEvaluateModalOpen(true);
    } else {
      try {
        console.log("Navigating to:", path);
        navigate(path);
      } catch (error) {
        console.error("Navigation error:", error);
      }
    }
  };

  return (
    <aside className="w-64 bg-gradient-to-t from-purple-300 via-indigo-50 to-blue-100 dark:from-slate-800 dark:via-slate-900 dark:to-black shadow-lg px-4 py-6 flex flex-col justify-between overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div>
        <button
          className="w-full bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold rounded-xl py-2 mb-4 flex items-center justify-center gap-2 text-xl dark:bg-blue-900/50 dark:hover:bg-blue-800/60 dark:text-blue-200"
          onClick={() => handleNavigation("/new-worklet")}
        >
          <PlusCircle className="w-5 h-10" /> <span className="text-2xl">New Worklet</span>
        </button>
        <h2 className="text-2xl font-bold mb-4 text-blue-900 dark:text-white">Activities</h2>
        <ActivityButton
          icon={<RefreshCcw className="w-5 h-10 text-blue-600" />}
          label={<span className="text-lg font-semibold">Request Update</span>}
          onClick={() => handleNavigation("/request-update")}
        />
        <ActivityButton
          icon={<Lightbulb className="w-5 h-10 text-sky-500" />}
          label={<span className="text-lg font-semibold">Share Suggestion</span>}
          onClick={() => handleNavigation("/share-suggestion")}
        />
        <ActivityButton
          icon={<Briefcase className="w-5 h-10 text-purple-600" />}
          label={<span className="text-lg font-semibold">Internship Referral</span>}
          onClick={() => handleNavigation("/internship-referral")}
        />
        <ActivityButton
          icon={<MessageSquare className="w-5 h-10 text-indigo-600" />}
          label={<span className="text-lg font-semibold">Submit Feedback</span>}
          onClick={() => setIsFeedbackFormOpen(true)}
        />
        <ActivityButton
          icon={<ClipboardCheck className="w-5 h-10 text-green-600" />}
          label={<span className="text-lg font-semibold">Evaluate</span>}
          onClick={() => handleNavigation("/evaluate")}
        />
      </div>
      <div className="text-center">
        <button
          onClick={() => handleNavigation("/ray")}
          className="group relative mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-blue-400 
                             hover:from-purple-500 hover:to-blue-500 flex items-center justify-center 
                             text-lg font-bold text-white shadow transition-all duration-200 
                             hover:shadow-lg transform hover:scale-105 cursor-pointer overflow-hidden"
          aria-label="RAY Support Bot"
        >
          <span className="absolute transition-opacity duration-200 opacity-100 group-hover:opacity-0">
            <Bot className="w-8 h-8" />
          </span>
          <span className="absolute transition-opacity duration-500 opacity-0 group-hover:opacity-100">
            RAY
          </span>
        </button>
        <p className="text-sm text-gray-600 mt-1 dark:text-slate-400">Support</p>
      </div>

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
                className="text-3xl text-purple-700 hover:text-purple-900 font-bold z-10 w-10 h-10 flex items-center justify-center rounded-full hover:bg-purple-100 transition-colors"
              >
                X
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
    </aside>
  );
};

export default RightSidebar;