
import { useState, useEffect } from "react";

export const useTheme = () => {
  const [darkMode, setDarkMode] = useState(true);
  
  // Toggle dark mode function
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    // Add/remove dark class with transition
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Set initial dark mode state based on html class
  useEffect(() => {
    // Add transition class on mount to enable smooth transitions
    document.documentElement.classList.add('color-theme-transition');
    setDarkMode(document.documentElement.classList.contains('dark'));
    
    // Prevent transition on page load
    setTimeout(() => {
      document.documentElement.classList.add('color-theme-in-transition');
    }, 0);
    
    return () => {
      document.documentElement.classList.remove('color-theme-transition');
      document.documentElement.classList.remove('color-theme-in-transition');
    };
  }, []);

  return { darkMode, toggleDarkMode };
};
