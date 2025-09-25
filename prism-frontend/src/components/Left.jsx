import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home,
  BarChart,
  GraduationCap,
  MessageSquare,
  Bell,
  Calendar,
  Folder,
  MessageCircle,
  User as UserIcon,
  LogOut,
} from 'lucide-react';
import SidebarItem from './SidebarItem';
import profilePic from '../assets/profilePic.jpg';

const LeftSidebar = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleLogout = () => {
    try {
      ['access_token', 'refresh_token', 'user_email', 'user_name'].forEach((k) => localStorage.removeItem(k));
    } finally {
      navigate('/');
    }
  };

  return (
    <aside className="w-30 lg:w-30 bg-gradient-to-t from-purple-300 via-indigo-50 to-blue-100 dark:from-slate-800 dark:via-slate-900 dark:to-black flex flex-col py-2 overflow-y-auto relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <nav className="flex flex-col gap-6 items-center lg:items-center">
        <SidebarItem icon={<Home className="w-5 h-5" />} label="Home" onClick={() => navigate('/home')} />
        <SidebarItem icon={<BarChart className="w-5 h-5" />} label="Statistics" onClick={() => navigate('/statistics')} />
        <SidebarItem icon={<GraduationCap className="w-5 h-5" />} label="Colleges" onClick={() => navigate('/colleges')} />
  {/** Removed Chats and Updates per request */}
        <SidebarItem icon={<Calendar className="w-5 h-5" />} label="Meetings" onClick={() => navigate('/meetings')} />
        <SidebarItem icon={<Folder className="w-5 h-5" />} label="Portfolio" onClick={() => navigate('/portfolio')} />
  {/** Removed Feedbacks per request */}
      </nav>

      {/* Account menu at bottom-left */}
      <div className="mt-auto px-2 pt-2 pb-2" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="w-full flex items-center justify-center rounded-2xl p-3 transition-all duration-200 hover:shadow-lg hover:bg-white/80 hover:scale-105 dark:hover:bg-slate-700/80 bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm"
          aria-label="Account menu"
        >
          <div className="relative">
            {!imgError ? (
              <img
                src={profilePic}
                alt="Account"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-400/60 dark:ring-purple-400/60 shadow-md"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center ring-2 ring-blue-400/60 dark:ring-purple-400/60 shadow-md">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
            )}
            {/* Small indicator dot */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white dark:border-slate-800 rounded-full"></div>
          </div>
        </button>
        {menuOpen && (
          <div className="absolute left-3 bottom-20 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-xl py-2 z-30 backdrop-blur-md">
            <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Account</p>
            </div>
            <button
              onClick={() => { setMenuOpen(false); navigate('/profile'); }}
              className="w-full px-3 py-2.5 flex items-center gap-3 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors duration-150"
            >
              <UserIcon className="w-4 h-4" /> 
              <span className="font-medium">My Profile</span>
            </button>
            <div className="my-1 border-t border-slate-200 dark:border-slate-700" />
            <button
              onClick={handleLogout}
              className="w-full px-3 py-2.5 flex items-center gap-3 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors duration-150"
            >
              <LogOut className="w-4 h-4" /> 
              <span className="font-medium">Logout</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default LeftSidebar;