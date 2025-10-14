export default function ActivityButton({ icon, label, primary, onClick }) {
  return (
    <button
      className={`w-full flex items-center gap-[clamp(0.5rem,1vw,0.75rem)] px-[clamp(0.75rem,1.5vw,1rem)] py-[clamp(0.5rem,1vh,0.75rem)] mb-[clamp(0.5rem,1vh,0.75rem)] rounded-xl text-[clamp(0.75rem,1vw,0.875rem)] font-medium shadow-sm transition-all duration-200 transform hover:scale-105 hover:shadow-md ${
        primary
          ? 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600'
          : 'bg-white hover:bg-purple-100 text-gray-700 border border-gray-200 hover:border-purple-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 dark:hover:border-slate-600'
      }`}
      onClick={onClick}>
      {icon}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  )
}
