export default function LevelBadge({ icon, label, value, color }) {
  return (
    <div
      className={`flex items-center gap-[clamp(0.375rem,1vw,0.5rem)] rounded-lg px-[clamp(0.5rem,1vw,0.75rem)] py-[clamp(0.25rem,0.5vh,0.375rem)] text-[clamp(0.75rem,1vw,0.875rem)] font-medium ${color}`}
    >
      {icon}
      <span>{label}</span>
      <span className="ml-auto font-semibold">{value}</span>
    </div>
  );
}