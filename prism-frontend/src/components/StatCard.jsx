export default function StatCard({
  value,
  label,
  icon,
  accent = "from-white to-white",
}) {
  return (
    <div
      className={`flex items-center gap-[1vw] bg-gradient-to-b ${accent} rounded-2xl border border-gray-200 px-[1vw] py-[0.75vh] w-full transition-all duration-300 cursor-pointer overflow-hidden hover:shadow-lg group dark:border-slate-700`}
    >
      <div className="p-[0.8vw] bg-white rounded-xl border border-gray-200 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md dark:bg-slate-700 dark:border-slate-600">
        {icon}
      </div>
      <div className="transition-all duration-300 group-hover:scale-105">
        <div className="text-[clamp(1.125rem,2vw,1.5rem)] font-bold leading-none dark:text-white">{value}</div>
        <div className="text-[clamp(0.6rem,0.8vw,0.75rem)] text-gray-500 dark:text-slate-400">{label}</div>
      </div>
    </div>
  );
}