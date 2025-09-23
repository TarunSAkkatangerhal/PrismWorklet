import React, { useState } from 'react';
import {
  RefreshCcw,
  Lightbulb,
  Calendar,
  Briefcase,
  MessageSquare,
  Home,
  BarChart,
  GraduationCap,
  MessageCircle,
  Bell,
  Folder,
  PlusCircle,
  ArrowUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Ray() {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');

  const activities = [
    {
      icon: <RefreshCcw className="w-5 h-5" />,
      label: 'Request Update',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
      path: '/request-update'
    },
    {
      icon: <Lightbulb className="w-5 h-5" />,
      label: 'Share Suggestion',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
      path: '/share-suggestion'
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      label: 'Schedule Meeting',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
      path: '/schedule-meeting'
    },
    {
      icon: <Briefcase className="w-5 h-5" />,
      label: 'Internship Referral',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
      path: '/internship-referral'
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      label: 'Submit Feedback',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
      path: '/submit-feedback'
    }
  ];

  const navItems = [
    { icon: <Home className="w-5 h-5" />, label: 'Home', path: '/' },
    { icon: <BarChart className="w-5 h-5" />, label: 'Statistics', path: '/statistics' },
    { icon: <GraduationCap className="w-5 h-5" />, label: 'Colleges', path: '/colleges' },
    { icon: <MessageSquare className="w-5 h-5" />, label: 'Chats', path: '/chats' },
    { icon: <Bell className="w-5 h-5" />, label: 'Updates', path: '/updates' },
    { icon: <Calendar className="w-5 h-5" />, label: 'Meetings', path: '/meetings' },
    { icon: <Folder className="w-5 h-5" />, label: 'Portfolio', path: '/portfolio' },
    { icon: <MessageCircle className="w-5 h-5" />, label: 'Feedbacks', path: '/feedbacks' },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Left Navigation */}
      <aside className="w-20 bg-white/80 backdrop-blur-sm py-6">
        <div className="flex flex-col items-center space-y-8">
          {navItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center text-gray-500 hover:text-blue-600 transition-colors"
            >
              {item.icon}
              <span className="text-[10px] mt-1">{item.label}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Chat Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 bg-white/80 backdrop-blur-sm border-b border-blue-100">
          <div className="flex-1" /> {/* Spacer */}
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-blue-600 border border-blue-100 hover:bg-blue-50">
              <PlusCircle className="w-5 h-5" />
              <span>New Worklet</span>
            </button>
            <button className="px-4 py-2 bg-white rounded-lg text-blue-600 border border-blue-100 hover:bg-blue-50">
              FAQ
            </button>
            <div className="w-10 h-10 rounded-full bg-white border-2 border-purple-200 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
                <span className="text-white text-sm font-bold">RAY</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Encryption Notice */}
          <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500 border-b border-gray-100 bg-white">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" fill="currentColor" opacity="0.2"/>
              <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 11.99H19C18.47 16.11 15.72 19.78 12 20.93V12H5V6.3L12 3.19V11.99Z" fill="currentColor"/>
            </svg>
            End-to-end encrypted
          </div>

          {/* Messages Area - Takes full available height */}
          <div className="flex-1 overflow-y-auto">
            <div className="min-h-full p-6">
              {/* Chat messages */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold text-sm">
                  RAY
                </div>
                <div className="bg-blue-50/50 rounded-xl p-4 max-w-[80%] shadow-sm">
                  <p className="text-blue-900">
                    Hi! I'm your AI assistant. Your conversations are protected with end-to-end encryption. How can I help you today?
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Input Area - Fixed at Bottom */}
          <div className="border-t border-gray-100 p-4 bg-white">
            <div className="relative max-w-4xl mx-auto">
              <input
                type="text"
                placeholder="Type your message here..."
                className="w-full px-6 py-4 pr-12 bg-blue-50/30 rounded-xl border border-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 placeholder-blue-400"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button 
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-200 transition-colors"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Activities Sidebar */}
      <aside className="w-80 bg-white/80 backdrop-blur-sm p-6 border-l border-blue-100">
        <h1 className="text-2xl font-bold text-blue-900 mb-6">Activities</h1>

        {/* Activities List */}
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <button
              key={index}
              onClick={() => navigate(activity.path)}
              className="w-full flex items-center gap-3 p-4 bg-white rounded-xl hover:bg-blue-50 transition-colors"
            >
              <div className={`p-2 ${activity.bgColor} rounded-lg ${activity.textColor}`}>
                {activity.icon}
              </div>
              <span className="font-medium text-blue-900">{activity.label}</span>
            </button>
          ))}
        </div>

        {/* Support Section */}
        <div className="mt-6 flex items-center gap-2 text-blue-900">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
            <span className="text-white text-xs font-bold">R</span>
          </div>
          <span className="text-sm font-medium">Support</span>
        </div>
      </aside>
    </div>
  );
}