export default function SidebarItem({ icon, label, onClick }) {
  return (
    <div 
      className="flex flex-col items-center lg:flex-row lg:gap-3 px-4 cursor-pointer text-gray-600 hover:text-blue-600"
      onClick={onClick}
    >
      <div className="p-2">{icon}</div>
      <span className="hidden lg:inline text-sm">{label}</span>
    </div>
  );
}