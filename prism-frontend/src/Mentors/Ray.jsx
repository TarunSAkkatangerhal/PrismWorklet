import React, { useState, useEffect } from 'react';
import RightSidebar from '../components/Right';
import LeftSidebar from '../components/Left';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  ArrowUp,
  MessageSquare,
  X,
  PlusCircle,
  History
} from 'lucide-react';

export default function Ray() {
  useDocumentTitle('AI Assistant - Ray');
  const [inputText, setInputText] = useState('');
  const [opening, setOpening] = useState(true);
  const [typedText, setTypedText] = useState('');
  const [showChatOptions, setShowChatOptions] = useState(false);
  const welcomeMsg =
    "Hi! I'm your AI assistant. Your conversations are protected with end-to-end encryption. How can I help you today?";

  useEffect(() => {
    const timer = setTimeout(() => {
      setOpening(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!opening) {
      let i = 0;
      const interval = setInterval(() => {
        setTypedText(welcomeMsg.slice(0, i + 1));
        i++;
        if (i === welcomeMsg.length) clearInterval(interval);
      }, 40);
      return () => clearInterval(interval);
    }
  }, [opening, welcomeMsg]);

  if (opening) {
    return (
      // ++ Dark theme styles added
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-100 to-blue-100 dark:from-slate-800 dark:to-slate-900">
        <div className="animate-bounce bg-white rounded-2xl shadow-lg px-8 py-6 text-center transform transition-all duration-500 scale-95 dark:bg-slate-800">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center mb-3">
            <span className="text-white font-bold">RAY</span>
          </div>
          <p className="text-blue-900 font-bold text-lg drop-shadow-sm animate-sine dark:text-blue-300">Opening Assistance Ray</p>
        </div>
      </div>
    );
  }

  return (
    // ++ Dark theme styles added
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-900 dark:to-black animate-zoomIn">
      {/* Left Navigation */}
      <LeftSidebar/>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
        {/* Encryption Notice */}
        <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500 border-b border-gray-100 bg-white dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            {/* ... svg paths */}
          </svg>
          End-to-end encrypted
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold text-sm">
                RAY
              </div>
              {/* ++ Dark theme styles added */}
              <div className="bg-blue-50/50 rounded-xl p-4 max-w-[80%] shadow-sm dark:bg-slate-800">
                <p className="text-blue-900 font-mono dark:text-blue-200">
                  {typedText}
                  {typedText.length < welcomeMsg.length && <span className="animate-pulse">|</span>}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-100 p-4 bg-white dark:bg-slate-900 dark:border-slate-800">
          <div className="relative max-w-4xl mx-auto">
            <input
              type="text"
              placeholder="Type your message here..."
              // ++ Dark theme styles added
              className="w-full px-6 py-4 pr-12 bg-blue-50/30 rounded-xl border border-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200 text-blue-900 placeholder-blue-400 dark:bg-slate-800 dark:border-slate-700 dark:focus:ring-blue-500 dark:text-blue-200 dark:placeholder-slate-400"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            {/* ++ Dark theme styles added */}
            <button className="absolute right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 hover:bg-blue-200 transition-colors dark:bg-blue-500/30 dark:hover:bg-blue-500/50 dark:text-blue-300">
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Conditional rendering */}
      {!showChatOptions ? (
        <RightSidebar />
      ) : (
        <ChatOptionsPanel onClose={() => setShowChatOptions(false)} />
      )}

      {/* Floating Chat Options Button */}
      <button
        onClick={() => setShowChatOptions(!showChatOptions)}
        className="fixed right-6 bottom-6 w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-200 transform hover:scale-110 z-50"
        aria-label="Chat Options"
      >
        {showChatOptions ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageSquare className="w-6 h-6" />
        )}
      </button>
      
    </div>
  );
}

// Chat Options Panel Component
function ChatOptionsPanel({ onClose }) {
  const [chatHistory] = useState([
    { id: 1, title: "Project assistance", date: "2 hours ago", preview: "How can I improve my code structure?" },
    { id: 2, title: "Bug debugging", date: "Yesterday", preview: "Getting error in authentication..." },
    { id: 3, title: "API integration", date: "2 days ago", preview: "Need help with REST API..." },
  ]);

  return (
    <aside className="w-[clamp(12rem,18vw,16rem)] bg-gradient-to-t from-purple-300 via-indigo-50 to-blue-100 dark:from-slate-800 dark:via-slate-900 dark:to-black shadow-lg px-[clamp(0.75rem,1.5vw,1.25rem)] py-[clamp(1rem,2vh,1.5rem)] flex flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[clamp(1.25rem,2vw,1.5rem)] font-bold text-blue-900 dark:text-white">
          Chat Options
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* New Chat Button */}
      <button
        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold rounded-xl py-3 mb-6 flex items-center justify-center gap-2 shadow-md transition-all duration-200 transform hover:scale-105"
        onClick={() => {
          // Handle new chat logic here
          console.log("Starting new chat...");
        }}
      >
        <PlusCircle className="w-5 h-5" />
        <span>New Chat</span>
      </button>

      {/* Recent Chats Section */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-blue-700 dark:text-blue-300" />
          <h3 className="text-lg font-semibold text-blue-900 dark:text-white">
            Recent Chats
          </h3>
        </div>

        {/* Chat History List */}
        <div className="space-y-3">
          {chatHistory.map((chat) => (
            <button
              key={chat.id}
              className="w-full bg-white dark:bg-slate-800 rounded-lg p-3 text-left hover:bg-purple-50 dark:hover:bg-slate-700 transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200 dark:border-slate-700"
              onClick={() => {
                // Handle chat selection logic here
                console.log("Loading chat:", chat.id);
              }}
            >
              <div className="font-semibold text-sm text-gray-800 dark:text-white mb-1 truncate">
                {chat.title}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {chat.date}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300 truncate">
                {chat.preview}
              </div>
            </button>
          ))}
        </div>

        {/* Empty State (when no history) */}
        {chatHistory.length === 0 && (
          <div className="text-center py-8">
            <History className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No chat history yet
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Start a new conversation
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t border-gray-300 dark:border-slate-700">
        <p className="text-xs text-center text-gray-600 dark:text-gray-400">
          💬 {chatHistory.length} conversation{chatHistory.length !== 1 ? 's' : ''} saved
        </p>
      </div>
    </aside>
  );
}