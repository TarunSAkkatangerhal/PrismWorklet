import React from 'react';
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
} from 'lucide-react';
import SidebarItem from './SidebarItem';

const LeftSidebar = () => {
  const navigate = useNavigate();

  return (
    <aside className="w-30 lg:w-30 bg-gradient-to-t from-purple-300 via-indigo-50 to-blue-100 dark:from-slate-800 dark:via-slate-900 dark:to-black flex flex-col py-2 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <nav className="flex flex-col gap-6 items-center lg:items-center">
        <SidebarItem icon={<Home className="w-5 h-5" />} label="Home" onClick={() => navigate('/home')} />
        <SidebarItem icon={<BarChart className="w-5 h-5" />} label="Statistics" onClick={() => navigate('/statistics')} />
        <SidebarItem icon={<GraduationCap className="w-5 h-5" />} label="Colleges" onClick={() => navigate('/colleges')} />
        <SidebarItem icon={<MessageSquare className="w-5 h-5" />} label="Chats" onClick={() => navigate('/chats')} />
        <SidebarItem icon={<Bell className="w-5 h-5" />} label="Updates" onClick={() => navigate('/updates')} />
        <SidebarItem icon={<Calendar className="w-5 h-5" />} label="Meetings" onClick={() => navigate('/meetings')} />
        <SidebarItem icon={<Folder className="w-5 h-5" />} label="Portfolio" onClick={() => navigate('/portfolio')} />
        <SidebarItem icon={<MessageCircle className="w-5 h-5" />} label="Feedbacks" onClick={() => navigate('/feedbacks')} />
      </nav>
    </aside>
  );
};

export default LeftSidebar;