
import { useState, useEffect, useRef } from "react";

export const useTheme = () => {
  const [darkMode, setDarkMode] = useState(true);
  const buttonRef = useRef<HTMLElement | null>(null);
  
  // Toggle dark mode function
  const toggleDarkMode = (event?: React.MouseEvent) => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    // Add transition class before changing theme
    document.documentElement.classList.add('color-theme-in-transition');
    
    // If we have the event, create the radial effect
    if (event && event.currentTarget) {
      // Store the button reference for potential use
      buttonRef.current = event.currentTarget as HTMLElement;
      
      // Get button position for the radial effect
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      
      // Set the custom property for the radial effect
      document.documentElement.style.setProperty('--theme-change-x', `${x}px`);
      document.documentElement.style.setProperty('--theme-change-y', `${y}px`);
    }
    
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

  return { darkMode, toggleDarkMode, buttonRef };
};
