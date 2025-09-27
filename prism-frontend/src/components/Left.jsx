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
  const [imgError, setImgError] = useState(false);

  const handleLogout = () => {
    try {
      ['access_token', 'refresh_token', 'user_email', 'user_name'].forEach((k) => localStorage.removeItem(k));
    } finally {
      navigate('/');
    }
  };

  return (
    <aside className="w-[clamp(5rem,8vw,7.5rem)] bg-gradient-to-t from-purple-300 via-indigo-50 to-blue-100 dark:from-slate-800 dark:via-slate-900 dark:to-black flex flex-col py-[1vh] overflow-y-auto relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <nav className="flex flex-col gap-[2vh] items-center">
        <SidebarItem icon={<Home className="w-[clamp(1rem,1.5vw,1.25rem)] h-[clamp(1rem,1.5vw,1.25rem)]" />} label="Home" onClick={() => navigate('/home')} />
        <SidebarItem icon={<BarChart className="w-[clamp(1rem,1.5vw,1.25rem)] h-[clamp(1rem,1.5vw,1.25rem)]" />} label="Statistics" onClick={() => navigate('/statistics')} />
        <SidebarItem icon={<GraduationCap className="w-[clamp(1rem,1.5vw,1.25rem)] h-[clamp(1rem,1.5vw,1.25rem)]" />} label="Colleges" onClick={() => navigate('/colleges')} />
  {/** Removed Chats and Updates per request */}
        <SidebarItem icon={<Calendar className="w-[clamp(1rem,1.5vw,1.25rem)] h-[clamp(1rem,1.5vw,1.25rem)]" />} label="Meetings" onClick={() => navigate('/meetings')} />
        <SidebarItem icon={<Folder className="w-[clamp(1rem,1.5vw,1.25rem)] h-[clamp(1rem,1.5vw,1.25rem)]" />} label="Portfolio" onClick={() => navigate('/portfolio')} />
  {/** Removed Feedbacks per request */}
      </nav>

      {/* Profile button at bottom-left */}
      <div className="mt-auto px-[0.5vw] pt-[1vh] pb-[0.5vh]">
        <button
          onClick={() => navigate('/profile')}
          className="w-full flex items-center justify-center rounded-2xl p-[0.75vw] transition-all duration-200 dark:bg-slate-800/40 backdrop-blur-sm"
          aria-label="Go to profile"
        >
          <div className="relative">
            {!imgError ? (
              <img
                src={profilePic}
                alt="Profile"
                className="w-[clamp(2rem,3vw,2.5rem)] h-[clamp(2rem,3vw,2.5rem)] rounded-full object-cover shadow-md"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-[clamp(2rem,3vw,2.5rem)] h-[clamp(2rem,3vw,2.5rem)] rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-md">
                <UserIcon className="w-[clamp(1rem,1.5vw,1.25rem)] h-[clamp(1rem,1.5vw,1.25rem)] text-white" />
              </div>
            )}

          </div>
        </button>
      </div>
    </aside>
  );
};

export default LeftSidebar;