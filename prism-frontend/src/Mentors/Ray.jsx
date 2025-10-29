import React, { useState, useEffect } from 'react';
import RightSidebar from '../components/Right';
import LeftSidebar from '../components/Left';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  ArrowUp
} from 'lucide-react';

export default function Ray() {
  useDocumentTitle('AI Assistant - Ray');
  const [inputText, setInputText] = useState('');
  const [opening, setOpening] = useState(true);
  const [typedText, setTypedText] = useState('');
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

      {/* Right Sidebar */}
      <RightSidebar />
      
    </div>
  );
}