import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// Remove unused import
import samsungLogo from "../assets/prism_logo.png";
import RequestUpdate from "../layouts/Requestupdates";

import {
  Home,
  BarChart,
  GraduationCap,
  MessageSquare,
  Bell,
  Calendar,
  Folder,
  MessageCircle,
  Zap,
  Rocket,
  Key,
  Crown,
  BookOpen,
  Users as UsersIcon,
  Award,
  RefreshCcw,
  Lightbulb,
  Briefcase,
  PlusCircle,
} from "lucide-react";

import SidebarItem from "../components/SidebarItem";
import LevelBadge from "../components/LevelBadge";
import StatCard from "../components/StatCard";
import ActivityButton from "../components/ActivityButton";

const LEVEL_COUNTS = { spark: 12, lead: 7, core: 5, master: 3 };
const STATS = { worklets: 7, mentees: 35, badges: 2 };

export default function Dashboard() {
  const navigate = useNavigate();
  const [isRequestUpdateOpen, setIsRequestUpdateOpen] = useState(false);

  // Handle navigation with error handling
  const handleNavigation = (path) => {
    if (path === "/request-update") {
      setIsRequestUpdateOpen(true);
    } else {
      try {
        console.log('Navigating to:', path); // Debug log
        navigate(path);
      } catch (error) {
        console.error('Navigation error:', error);
      }
    }
  };

  // Handle sidebar navigation
  const handleSidebarNavigation = (path) => {
    handleNavigation(path);
  };

  return (
    <div className="flex h-screen w-full bg-gradient-to-t from-blue-50 via-indigo-50 to-purple-50 text-gray-800">
      {/* Left Sidebar */}
      <aside className="w-20 lg:w-48 bg-gradient-to-t from-blue-100 via-indigo-100 to-purple-100 shadow-lg flex flex-col py-6">
        <nav className="flex flex-col gap-6 items-center lg:items-start">
          <SidebarItem 
            icon={<Home className="w-5 h-5" />} 
            label="Home" 
            onClick={() => handleSidebarNavigation("/")}
          />
          <SidebarItem
            icon={<BarChart className="w-5 h-5" />}
            label="Statistics"
            onClick={() => handleSidebarNavigation("/statistics")}
          />
          <SidebarItem
            icon={<GraduationCap className="w-5 h-5" />}
            label="Colleges"
            onClick={() => handleSidebarNavigation("/colleges")}
          />
          <SidebarItem
            icon={<MessageSquare className="w-5 h-5" />}
            label="Chats"
            onClick={() => handleSidebarNavigation("/chats")}
          />
          <SidebarItem 
            icon={<Bell className="w-5 h-5" />} 
            label="Updates" 
            onClick={() => handleSidebarNavigation("/updates")}
          />
          <SidebarItem
            icon={<Calendar className="w-5 h-5" />}
            label="Meetings"
            onClick={() => handleSidebarNavigation("/meetings")}
          />
          <SidebarItem
            icon={<Folder className="w-5 h-5" />}
            label="Portfolio"
            onClick={() => handleSidebarNavigation("/portfolio")}
          />
          <SidebarItem
            icon={<MessageCircle className="w-5 h-5" />}
            label="Feedbacks"
            onClick={() => handleSidebarNavigation("/feedbacks")}
          />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 px-8 py-6 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Mary christian
            </h1>
            <p className="text-sm text-gray-500">
              PRISM / Tech Strategy, Software Developer
            </p>
          </div>
          <img
            src={ samsungLogo }
            alt="PRISM"
            className="h-10 opacity-90"
          />
        </div>

        {/* Profile box */}
        <div className="mt-4 bg-white border border-gray-200 rounded-2xl shadow-sm p-4 max-w-xl">
          <div className="flex items-center gap-4">
            <img
              src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=200&auto=format&fit=crop"
              alt="Author"
              className="w-20 h-20 rounded-xl object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    Mary christian
                  </div>
                  <div className="text-xs text-gray-500">
                    Software Developer • PRISM
                  </div>
                </div>
                <div className="hidden sm:block text-xs text-gray-500">
                  Author
                </div>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2">
                <LevelBadge
                  icon={<Zap className="w-4 h-4" />}
                  label="Spark"
                  value={LEVEL_COUNTS.spark}
                  color="text-indigo-600 bg-indigo-50"
                />
                <LevelBadge
                  icon={<Rocket className="w-4 h-4" />}
                  label="Lead"
                  value={LEVEL_COUNTS.lead}
                  color="text-blue-700 bg-blue-50"
                />
                <LevelBadge
                  icon={<Key className="w-4 h-4" />}
                  label="Core"
                  value={LEVEL_COUNTS.core}
                  color="text-purple-700 bg-purple-50"
                />
                <LevelBadge
                  icon={<Crown className="w-4 h-4" />}
                  label="Master"
                  value={LEVEL_COUNTS.master}
                  color="text-purple-700 bg-purple-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Progress Levels */}
        <div className="relative mt-6 w-full max-w-2xl">
          <div className="h-2 w-full bg-gray-200 rounded-full shadow-inner">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full w-1/3"></div>
          </div>
          <div className="flex justify-between text-[13px] mt-2 text-gray-600 font-medium">
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4 stroke-blue-700" /> SPARK
            </span>
            <span className="flex items-center gap-1">
              <Rocket className="w-4 h-4 text-blue-700" /> LEAD
            </span>
            <span className="flex items-center gap-1">
              <Key className="w-4 h-4 text-emerald-700" /> CORE
            </span>
            <span className="flex items-center gap-1">
              <Crown className="w-4 h-4 text-purple-700" /> MASTER
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 flex gap-4 flex-wrap">
          <StatCard
            value={STATS.worklets}
            label="Worklets"
            icon={<BookOpen className="w-5 h-5" />}
            accent="from-purple-50 to-white"
          />
          <StatCard
            value={STATS.mentees}
            label="Mentees"
            icon={<UsersIcon className="w-5 h-5" />}
            accent="from-blue-50 to-white"
          />
          <StatCard
            value={STATS.badges}
            label="Badges"
            icon={<Award className="w-5 h-5" />}
            accent="from-indigo-50 to-white"
          />
        </div>

        {/* Worklets Table */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-4">My Worklets</h2>
          <div className="border rounded-2xl overflow-hidden bg-white shadow-sm">
            <div className="flex border-b bg-gray-50/70">
              {["Ongoing", "Completed", "On Hold", "Dropped", "Terminated"].map(
                (tab) => (
                  <button
                    key={tab}
                    className="px-4 py-2 text-sm font-medium hover:bg-gray-100"
                  >
                    {tab}
                  </button>
                )
              )}
            </div>

            <div className="grid grid-cols-12 text-center text-xs sm:text-sm font-semibold border-b bg-gradient-to-r from-white to-slate-50">
              {[
                "JAN",
                "FEB",
                "MAR",
                "APR",
                "MAY",
                "JUN",
                "JUL",
                "AUG",
                "SEP",
                "OCT",
                "NOV",
                "DEC",
              ].map((m) => (
                <div
                  key={m}
                  className="py-2 border-r last:border-0 text-gray-600"
                >
                  {m}
                </div>
              ))}
            </div>

            <div className="relative h-32 sm:h-36">
              <div className="absolute inset-0 grid grid-cols-12 divide-x divide-gray-200 pointer-events-none opacity-70" />
              <div className="absolute left-[16.6%] top-4 w-[25%]">
                <div className="px-2 py-1 text-[11px] sm:text-xs text-black rounded-lg shadow-md bg-gradient-to-r from-amber-400 to-amber-500 flex items-center gap-1">
                  <ClockDot /> 25TST04WT — GOOD (60%)
                </div>
              </div>
              <div className="absolute left-[33.3%] top-16 w-[33.3%]">
                <div className="px-2 py-1 text-[11px] sm:text-xs text-black rounded-lg shadow-md bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center gap-1">
                  <CheckDot /> 25TST05SRM — VERY GOOD (70%)
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-blue-100 via-indigo-100 to-purple-100 shadow-lg px-4 py-6 flex flex-col justify-between">
        <div>
          <button 
            className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-xl py-2 mb-4 flex items-center justify-center gap-2"
            onClick={() => handleNavigation("/new-worklet")}
          >
            <PlusCircle className="w-5 h-5" /> New Worklet
          </button>
          <h2 className="text-lg font-semibold mb-3">Activities</h2>
          <ActivityButton
            icon={<RefreshCcw className="w-5 h-5 text-blue-600" />}
            label="Request Update"
            onClick={() => handleNavigation("/request-update")}
          />
          <ActivityButton
            icon={<Lightbulb className="w-5 h-5 text-amber-500" />}
            label="Share Suggestion"
            onClick={() => handleNavigation("/share-suggestion")}
          />
          <ActivityButton
            icon={<Calendar className="w-5 h-5 text-emerald-600" />}
            label="Schedule Meeting"
            onClick={() => handleNavigation("/schedule-meeting")}
          />
          <ActivityButton
            icon={<Briefcase className="w-5 h-5 text-purple-600" />}
            label="Internship Referral"
            onClick={() => handleNavigation("/internship-referral")}
          />
          <ActivityButton
            icon={<MessageSquare className="w-5 h-5 text-rose-600" />}
            label="Submit Feedback"
            onClick={() => handleNavigation("/submit-feedback")}
            primary
          />
        </div>
        <div className="text-center mt-6">
          <button 
            onClick={() => handleNavigation("/ray")}
            className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-blue-400 hover:from-purple-500 hover:to-blue-500 flex items-center justify-center text-lg font-bold text-white shadow transition-all duration-200 hover:shadow-lg transform hover:scale-105 cursor-pointer"
          >
            RAY
          </button>
          <p className="text-sm text-gray-600 mt-1">Support</p>
        </div>
      </aside>

      {/* Request Update Modal */}
      <RequestUpdate 
        isOpen={isRequestUpdateOpen} 
        onClose={() => setIsRequestUpdateOpen(false)} 
      />
    </div>
  );
}

function ClockDot() {
  return (
    <span className="inline-block w-2 h-2 rounded-full bg-amber-200 ring-2 ring-white mr-0.5" />
  );
}

function CheckDot() {
  return (
    <span className="inline-block w-2 h-2 rounded-full bg-emerald-200 ring-2 ring-white mr-0.5" />
  );
}