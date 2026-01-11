export default function SidebarItem({ icon, label, onClick, hasUnread }) {
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
          <span className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900 shadow-lg"></span>
        )}
      </div>
      <span className="text-[clamp(0.75rem,1vw,0.875rem)] font-semibold mt-[clamp(0.25rem,0.5vh,0.5rem)] text-center">{label}</span>
    </div>
  );
}