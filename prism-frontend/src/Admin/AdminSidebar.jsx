import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Clock, Briefcase, Users, Award, Database,
  GraduationCap, UserCheck, CalendarDays, FileText, Mic,
  Tag, Sparkles, Newspaper, Moon, Sun, Info,
  LogOut, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react';
import { ThemeContext } from '../context/ThemeContext';
import profilePic from '../assets/profilePic.jpg';

// --- PORTAL ---
const Portal = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    let portalRoot = document.getElementById('portal-root');
    if (!portalRoot) {
      portalRoot = document.createElement('div');
      portalRoot.id = 'portal-root';
      document.body.appendChild(portalRoot);
    }
    return () => setMounted(false);
  }, []);
  const portalRoot = typeof document !== 'undefined' ? document.getElementById('portal-root') : null;
  return mounted && portalRoot ? createPortal(children, portalRoot) : null;
};

// Settings menu item
const SettingsMenuItem = ({ icon, title, subtitle, onClick, colorClass = 'text-blue-500' }) => (
  <button onClick={onClick} className="w-full flex items-center p-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200">
    <div className={`p-2 rounded-full bg-opacity-10 ${colorClass.replace('text-', 'bg-')} mr-3`}>
      {React.cloneElement(icon, { className: `w-5 h-5 ${colorClass}` })}
    </div>
    <div>
      <h3 className="font-semibold text-sm text-slate-800 dark:text-white">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </div>
  </button>
);

// Left sidebar icon item
function SidebarItem({ icon, label, onClick, isActive }) {
  return (
    <div
      className={`flex flex-col items-center px-[clamp(0.75rem,1.5vw,1rem)] rounded-2xl cursor-pointer
                 transition-all duration-200 transform relative
                 ${isActive
                   ? 'bg-white text-purple-700 shadow-md dark:bg-slate-700 dark:text-purple-400'
                   : 'text-gray-600 hover:scale-105 hover:shadow-md hover:bg-white hover:text-purple-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-purple-400'
                 }`}
      onClick={onClick}
    >
      <div className="p-[clamp(0.5rem,1vw,0.75rem)]">{icon}</div>
      <span className="text-[clamp(0.65rem,0.85vw,0.75rem)] font-semibold mt-[clamp(0.15rem,0.3vh,0.25rem)] text-center leading-tight">{label}</span>
    </div>
  );
}

// Right sidebar activity button
function ActivityButton({ icon, label, onClick, isActive }) {
  return (
    <button
      className={`w-full flex items-center gap-[clamp(0.5rem,1vw,0.75rem)] px-[clamp(0.75rem,1.5vw,1rem)] py-[clamp(0.5rem,1vh,0.75rem)] rounded-xl text-[clamp(0.75rem,1vw,0.875rem)] font-medium shadow-sm transition-all duration-200 transform hover:scale-105 hover:shadow-md
        ${isActive
          ? 'bg-purple-100 text-purple-700 border border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700'
          : 'bg-white hover:bg-purple-100 text-gray-700 border border-gray-200 hover:border-purple-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 dark:hover:border-slate-600'
        }`}
      onClick={onClick}
    >
      {icon}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

// ─── LEFT SIDEBAR ───────────────────────────────────────────────────────────────
export const AdminLeftSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  const [userData, setUserData] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSettingsIconRotating, setIsSettingsIconRotating] = useState(false);
  const [imgError, setImgError] = useState(false);

  const { x, y, refs, strategy } = useFloating({
    whileElementsMounted: autoUpdate,
    placement: 'right-end',
    middleware: [offset(16), flip(), shift()],
  });

  useEffect(() => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const base64Url = token.split('.')[1];
      if (!base64Url) return;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      const decoded = JSON.parse(jsonPayload);
      if (decoded.exp > Date.now() / 1000) setUserData(decoded);
    } catch { /* ignore */ }
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (refs.domReference.current && !refs.domReference.current.contains(event.target) &&
          refs.floating.current && !refs.floating.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };
    if (isSettingsOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSettingsOpen, refs]);

  const isActivePath = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_role');
    navigate('/');
  };

  const handleAboutUs = () => {
    alert('About PRISM: Professional Resource and Internship Support Management.');
    setIsSettingsOpen(false);
  };

  return (
    <aside className="w-[clamp(5rem,8vw,7.5rem)] h-screen sticky top-0 bg-gradient-to-t from-purple-300 via-indigo-50 to-blue-100 dark:from-slate-800 dark:via-slate-900 dark:to-black flex flex-col py-[1vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <nav className="flex flex-col gap-[2vh] items-center">
        <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => navigate('/admin-dashboard')} isActive={isActivePath('/admin-dashboard')} />
        <SidebarItem icon={<Clock size={20} />} label="Pendings" onClick={() => navigate('/admin-pendings')} isActive={isActivePath('/admin-pendings')} />
        <SidebarItem icon={<Briefcase size={20} />} label="Worklet" onClick={() => navigate('/admin-worklets')} isActive={isActivePath('/admin-worklets')} />
        <SidebarItem icon={<Users size={20} />} label="Users" onClick={() => navigate('/admin-users')} isActive={isActivePath('/admin-users')} />
        <SidebarItem icon={<Award size={20} />} label="Excellent" onClick={() => navigate('/admin-excellent')} isActive={isActivePath('/admin-excellent')} />
        <SidebarItem icon={<Database size={20} />} label="Data" onClick={() => navigate('/admin-data-collection')} isActive={isActivePath('/admin-data-collection')} />

        {/* Separator */}
        <div className="w-[75%] mx-auto my-[1.2vh]">
          <hr className="h-1 rounded-full border-0 bg-gradient-to-r from-indigo-500 via-purple-400 to-blue-400 dark:from-indigo-700 dark:via-purple-800 dark:to-blue-700 shadow-md opacity-95" />
        </div>
        <div className="flex flex-col gap-[1vh] items-center bg-white/60 dark:bg-slate-800/60 rounded-xl py-[0.7vh] shadow-sm border border-slate-200 dark:border-slate-700 w-[90%] mx-auto">
          <SidebarItem icon={<GraduationCap size={20} />} label="College" onClick={() => navigate('/admin-colleges')} isActive={isActivePath('/admin-colleges')} />
          <SidebarItem icon={<UserCheck size={20} />} label="Mentors" onClick={() => navigate('/admin-mentors')} isActive={isActivePath('/admin-mentors')} />
        </div>
        </nav>

      {/* Bottom: Settings button */}
      <div className="mt-auto px-[0.5vw] pt-[1vh] pb-[0.5vh]">
        <button
          ref={refs.setReference}
          onClick={() => {
            setIsSettingsIconRotating(true);
            setIsSettingsOpen(prev => !prev);
            setTimeout(() => setIsSettingsIconRotating(false), 300);
          }}
          className="w-full flex items-center justify-center rounded-2xl p-[0.75vw] transition-all duration-200 hover:bg-black/10 dark:hover:bg-white/10"
          aria-label="Open Settings"
        >
          <div className="relative">
            {!imgError ? (
              <img src={profilePic} alt="Profile" className="w-[clamp(2rem,3vw,2.5rem)] h-[clamp(2rem,3vw,2.5rem)] rounded-full object-cover shadow-md" onError={() => setImgError(true)} />
            ) : (
              <div className="w-[clamp(2rem,3vw,2.5rem)] h-[clamp(2rem,3vw,2.5rem)] rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-md">
                <Settings className={`w-[clamp(1rem,1.5vw,1.25rem)] h-[clamp(1rem,1.5vw,1.25rem)] text-white transition-transform duration-300 ${isSettingsIconRotating ? 'rotate-180' : ''}`} />
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Floating Settings Menu */}
      <AnimatePresence>
        {isSettingsOpen && (
          <Portal>
            <motion.div
              ref={refs.setFloating}
              style={{ position: strategy, top: y ?? 0, left: x ?? 0 }}
              className="w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 z-50"
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <div className="space-y-1">
                <SettingsMenuItem icon={isDarkMode ? <Sun /> : <Moon />} title="Appearance" subtitle={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'} onClick={toggleTheme} colorClass="text-purple-500" />
                <SettingsMenuItem icon={<Info />} title="About PRISM" subtitle="Learn more about our mission" onClick={handleAboutUs} colorClass="text-amber-500" />
                <div className="px-1 pt-1"><hr className="border-slate-200 dark:border-slate-700" /></div>
                <SettingsMenuItem icon={<LogOut />} title="Sign Out" onClick={handleLogout} colorClass="text-red-500" />
              </div>
            </motion.div>
          </Portal>
        )}
      </AnimatePresence>
    </aside>
  );
};


