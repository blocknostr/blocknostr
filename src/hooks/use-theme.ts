
import { useState, useEffect } from "react";

export const useTheme = () => {
  const [darkMode, setDarkMode] = useState(true);
  
  // Toggle dark mode function
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    // Add transition class before changing theme
    document.documentElement.classList.add('color-theme-in-transition');
    
    // Add/remove dark class
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Remove transition class after transition completes to prevent affecting other interactions
    setTimeout(() => {
      document.documentElement.classList.remove('color-theme-in-transition');
    }, 3000); // Match the 3s transition duration
  };

  // Set initial dark mode state based on html class
  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains('dark'));
    
    return () => {
      document.documentElement.classList.remove('color-theme-in-transition');
    };
  }, []);

  return { darkMode, toggleDarkMode };
};
