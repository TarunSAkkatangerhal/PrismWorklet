import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Info, LogOut, ArrowLeft } from 'lucide-react';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check for saved theme in localStorage or system preference
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
             (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Effect to apply the theme class to the <html> element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  const handleLogout = () => {
    // Clear user session data
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    navigate('/'); // Redirect to login/home page
  };

  const handleAboutUs = () => {
    alert('About Us: PRISM\n\nProfessional Resource and Internship Support Management. A platform connecting mentors and students for professional growth and development.');
  };

  // Reusable button component for settings items
  const SettingsItem = ({ icon, title, subtitle, onClick, colorClass = 'text-blue-500' }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center p-4 bg-white dark:bg-slate-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
    >
      <div className={`p-3 rounded-full bg-opacity-10 ${colorClass.replace('text-', 'bg-')} mr-4`}>
        {React.cloneElement(icon, { className: `w-5 h-5 ${colorClass}` })}
      </div>
      <div className="text-left">
        <h3 className="font-semibold text-slate-800 dark:text-white">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <header className="flex items-center mb-8">
          <button
            onClick={() => navigate(-1)} // Go back to the previous page
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors mr-4"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold">Settings</h1>
        </header>

        {/* Settings Menu */}
        <div className="space-y-4">
          <SettingsItem
            icon={<Moon />}
            title="Appearance"
            subtitle={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            onClick={toggleTheme}
            colorClass="text-purple-500"
          />
          <SettingsItem
            icon={<Info />}
            title="About PRISM"
            subtitle="Learn more about our mission"
            onClick={handleAboutUs}
            colorClass="text-amber-500"
          />
          <SettingsItem
            icon={<LogOut />}
            title="Sign Out"
            subtitle="End your current session"
            onClick={handleLogout}
            colorClass="text-red-500"
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;