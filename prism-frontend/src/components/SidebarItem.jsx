export default function SidebarItem({ icon, label, onClick, hasUnread, unreadCount }) {
  return (
    <div 
      className="flex flex-col items-center px-[clamp(0.75rem,1.5vw,1rem)] rounded-2xl cursor-pointer 
                 text-gray-600 transition-all duration-200 transform 
                 hover:scale-105 hover:shadow-md hover:bg-white hover:text-purple-700
                 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-purple-400"
      onClick={onClick}
    >
      <div className="p-[clamp(0.5rem,1vw,0.75rem)] relative">
        {icon}
        {hasUnread && (
          <>
            {/* Blue dot indicator */}
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900 shadow-lg animate-pulse"></span>
            {/* Optional: Show count if provided */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 flex items-center justify-center bg-blue-500 text-white text-[0.65rem] font-bold rounded-full border-2 border-white dark:border-slate-900 shadow-lg px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </>
        )}
      </div>
      <span className="text-[clamp(0.75rem,1vw,0.875rem)] font-semibold mt-[clamp(0.25rem,0.5vh,0.5rem)] text-center">{label}</span>
    </div>
  );
}