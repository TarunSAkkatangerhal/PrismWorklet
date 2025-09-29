import React, { createContext, useState, useEffect } from 'react';

// 1. Create the context
export const ThemeContext = createContext();

// 2. Create the provider component
export const ThemeProvider = ({ children }) => {
  // State to hold the current theme ('light' or 'dark')
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  // This effect applies the theme to the root <html> element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  // Function to toggle the theme
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // ## KEY CHANGE ##
  // Create the 'isDarkMode' boolean based on the current 'theme' state.
  // Your components will consume this value.
  const isDarkMode = theme === 'dark';

  // Provide both the boolean and the toggle function
  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};