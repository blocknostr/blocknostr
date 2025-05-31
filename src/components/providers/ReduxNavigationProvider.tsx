import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useNavigation } from "../../hooks/useUiState";

interface ReduxNavigationProviderProps {
  children: React.ReactNode;
}

/**
 * Redux-based Navigation Provider
 * Replaces the context-based NavigationProvider with one that uses the Redux store
 */
export const ReduxNavigationProvider: React.FC<ReduxNavigationProviderProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { history, addToHistory, goBack: reduxGoBack } = useNavigation();
  
  // Update history in Redux when location changes
  useEffect(() => {
    // addToHistory handles duplicate prevention internally in the reducer
    addToHistory(location.pathname);
  }, [location.pathname, addToHistory]);
  
  // Add navigation functionality to goBack
  useEffect(() => {
    // We need to patch the redux goBack function to actually navigate
    const originalGoBack = reduxGoBack;
    const enhancedGoBack = () => {
      if (history.length > 1) {
        // The history state is managed by Redux, the actual navigation is done here
        const previousPage = history[history.length - 2]; // Get the previous page
        navigate(previousPage);
        originalGoBack(); // This will update the Redux state
      } else {
        // If no previous page in history, go to home
        navigate("/");
      }
    };
    
    // Monkey patch the window history back button
    const originalPushState = window.history.pushState;
    window.history.pushState = function() {
      originalPushState.apply(this, arguments as any);
      addToHistory(location.pathname);
    };
    
    // Cleanup
    return () => {
      window.history.pushState = originalPushState;
    };
  }, [history, navigate, reduxGoBack, addToHistory, location.pathname]);
  
  return <>{children}</>;
};

export default ReduxNavigationProvider; 
