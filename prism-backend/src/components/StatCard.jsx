export default function StatCard({
  value,
  label,
  icon,
  accent = "from-white to-white",
}) {
  return (
    <div
      className={`flex items-center gap-3 bg-gradient-to-b ${accent} rounded-2xl border border-gray-200 shadow-sm px-4 py-3 w-40`}
    >
      <div className="p-2 bg-white rounded-xl border border-gray-200 shadow-sm">
        {icon}
      </div>
      <div>
        <div className="text-xl font-bold leading-none">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  );
}
