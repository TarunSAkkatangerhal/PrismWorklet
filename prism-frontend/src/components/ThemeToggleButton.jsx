import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext'; // Import your context
import { Sun, Moon } from 'lucide-react'; // Using icons like in your dashboard

export default function ThemeToggleButton() {
  // Access the current theme and the toggle function from the context
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button
      onClick={toggleTheme}
      className="p-[clamp(0.5rem,1vw,0.75rem)] rounded-full transition-colors duration-300
                 bg-gray-200 hover:bg-gray-300
                 dark:bg-gray-700 dark:hover:bg-gray-600"
    >
      {theme === 'light' ? (
        <Moon className="w-[clamp(1rem,1.5vw,1.25rem)] h-[clamp(1rem,1.5vw,1.25rem)] text-gray-800" />
      ) : (
        <Sun className="w-[clamp(1rem,1.5vw,1.25rem)] h-[clamp(1rem,1.5vw,1.25rem)] text-yellow-400" />
      )}
    </button>
  );
}