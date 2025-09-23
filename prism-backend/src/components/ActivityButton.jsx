export default function ActivityButton({ icon, label, primary, onClick }) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-2 mb-3 rounded-xl text-sm font-medium shadow-sm transition ${
        primary
          ? "bg-blue-600 hover:bg-blue-700 text-white"
          : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200"
      }`}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}