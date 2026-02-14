import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CalendarDays, FileText, Mic, Tag, Sparkles, Newspaper
} from 'lucide-react';

// Activity button – matches Right.jsx ActivityButton pattern
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

const AdminRightSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-[clamp(12rem,18vw,16rem)] bg-gradient-to-t from-purple-300 via-indigo-50 to-blue-100 dark:from-slate-800 dark:via-slate-900 dark:to-black shadow-lg px-[clamp(0.75rem,1.5vw,1.25rem)] py-[clamp(1rem,2vh,1.5rem)] flex flex-col justify-between overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div>
        <h2 className="text-[clamp(1.25rem,2vw,1.5rem)] font-bold mb-[2vh] text-blue-900 dark:text-white">Manage</h2>
        <div className="space-y-[1.5vh]">
          <ActivityButton
            icon={<CalendarDays className="w-[clamp(1rem,1.5vw,1.25rem)] h-[clamp(1rem,1.5vw,1.25rem)] text-orange-500" />}
            label={<span className="text-[clamp(0.875rem,1.2vw,1rem)] font-semibold">Events</span>}
            onClick={() => navigate('/admin-events')}
            isActive={isActive('/admin-events')}
          />
          <ActivityButton
            icon={<FileText className="w-[clamp(1rem,1.5vw,1.25rem)] h-[clamp(1rem,1.5vw,1.25rem)] text-blue-600" />}
            label={<span className="text-[clamp(0.875rem,1.2vw,1rem)] font-semibold">Blog</span>}
            onClick={() => navigate('/admin-blog')}
            isActive={isActive('/admin-blog')}
          />
          <ActivityButton
            icon={<Mic className="w-[clamp(1rem,1.5vw,1.25rem)] h-[clamp(1rem,1.5vw,1.25rem)] text-purple-600" />}
            label={<span className="text-[clamp(0.875rem,1.2vw,1rem)] font-semibold">Webinar</span>}
            onClick={() => navigate('/admin-webinar')}
            isActive={isActive('/admin-webinar')}
          />
          <ActivityButton
            icon={<Tag className="w-[clamp(1rem,1.5vw,1.25rem)] h-[clamp(1rem,1.5vw,1.25rem)] text-green-600" />}
            label={<span className="text-[clamp(0.875rem,1.2vw,1rem)] font-semibold">Offers</span>}
            onClick={() => navigate('/admin-offers')}
            isActive={isActive('/admin-offers')}
          />
          <ActivityButton
            icon={<Sparkles className="w-[clamp(1rem,1.5vw,1.25rem)] h-[clamp(1rem,1.5vw,1.25rem)] text-amber-500" />}
            label={<span className="text-[clamp(0.875rem,1.2vw,1rem)] font-semibold">PrismGlanz</span>}
            onClick={() => navigate('/admin-prismglanz')}
            isActive={isActive('/admin-prismglanz')}
          />
          <ActivityButton
            icon={<Newspaper className="w-[clamp(1rem,1.5vw,1.25rem)] h-[clamp(1rem,1.5vw,1.25rem)] text-indigo-600" />}
            label={<span className="text-[clamp(0.875rem,1.2vw,1rem)] font-semibold">NewsFeed</span>}
            onClick={() => navigate('/admin-newsfeed')}
            isActive={isActive('/admin-newsfeed')}
          />
        </div>
      </div>
    </aside>
  );
};

export default AdminRightSidebar;
